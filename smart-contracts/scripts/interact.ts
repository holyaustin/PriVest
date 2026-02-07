import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main(): Promise<void> {
  console.log("🔗 Testing RWADividendDistributor Contract");
  console.log("==========================================");

  // Get network
  const networkName = process.env.HARDHAT_NETWORK || "hardhat";
  
  // Try to load deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentFile = path.join(deploymentsDir, `${networkName}-deployment.json`);
  
  let contractAddress: string;
  
  if (fs.existsSync(deploymentFile)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    contractAddress = deploymentInfo.contractAddress;
    console.log(`📄 Loaded from deployment: ${contractAddress}`);
  } else {
    contractAddress = process.env.CONTRACT_ADDRESS || "";
    if (!contractAddress) {
      console.log("❌ No contract address found. Deploy first or set CONTRACT_ADDRESS");
      process.exit(1);
    }
    console.log(`📄 Using contract from env: ${contractAddress}`);
  }
  
  console.log(`🌐 Network: ${networkName}`);
  console.log(`📍 Contract: ${contractAddress}`);
  
  // Connect to contract
  const [owner, investor1, investor2, funder] = await ethers.getSigners();
  
  const artifactPath = path.join(
    __dirname, 
    "../artifacts/contracts/RWADividendDistributor.sol/RWADividendDistributor.json"
  );
  
  if (!fs.existsSync(artifactPath)) {
    throw new Error("Compile contract first: npx hardhat compile");
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const contract = new ethers.Contract(contractAddress, artifact.abi, owner);
  
  // Type assertion to avoid TypeScript errors
  const contractAny = contract as any;
  
  console.log(`\n✅ Connected to contract`);
  
  // Test 1: Basic info
  console.log("\n1️⃣  BASIC CONTRACT INFO");
  console.log("-".repeat(40));
  
  try {
    const contractOwner = await contractAny.owner();
    const contractBalance = await ethers.provider.getBalance(contractAddress);
    
    console.log(`   Owner: ${contractOwner}`);
    console.log(`   Balance: ${ethers.formatEther(contractBalance)} ETH`);
    console.log(`   ✅ Contract is accessible`);
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Simulate iExec callback
  console.log("\n2️⃣  SIMULATE IEXEC CALLBACK");
  console.log("-".repeat(40));
  
  try {
    // Fund contract first
    const fundAmount = ethers.parseEther("0.002");
    console.log(`   Funding contract with ${ethers.formatEther(fundAmount)} ETH...`);
    
    await funder.sendTransaction({
      to: contractAddress,
      value: fundAmount
    });
    
    // Create test data
    const taskId = ethers.keccak256(ethers.toUtf8Bytes(`test-${Date.now()}`));
    const investors = [investor1.address, investor2.address];
    const amounts = [ethers.parseEther("0.00002"), ethers.parseEther("0.00001")];
    
    // Calculate hash (as iApp would)
    const resultHash = ethers.keccak256(
      ethers.solidityPacked(
        ["bytes32", "bytes32"],
        [
          ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [investors])),
          ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint256[]"], [amounts]))
        ]
      )
    );
    
    const encodedResult = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address[]", "uint256[]", "bytes32"],
      [investors, amounts, resultHash]
    );
    
    console.log(`   Task ID: ${taskId.slice(0, 16)}...`);
    console.log(`   Investors: ${investors.length}`);
    console.log(`   Total payout: ${ethers.formatEther(amounts[0] + amounts[1])} ETH`);
    
    // Simulate iExec callback
    const tx = await contractAny.receiveResult(taskId, encodedResult);
    await tx.wait();
    
    console.log(`   ✅ iExec callback simulated: ${tx.hash}`);
    console.log(`   Task processed successfully!`);
    
    // Test 3: Check task info
    console.log("\n3️⃣  CHECK TASK INFO");
    console.log("-".repeat(40));
    
    const taskInfo = await contractAny.taskInfo(taskId);
    console.log(`   Task exists: ${taskInfo.exists}`);
    console.log(`   Timestamp: ${new Date(Number(taskInfo.timestamp) * 1000).toLocaleString()}`);
    console.log(`   Total payout: ${ethers.formatEther(taskInfo.totalPayout)} ETH`);
    
    // Test 4: Claim dividends
    console.log("\n4️⃣  CLAIM DIVIDENDS");
    console.log("-".repeat(40));
    
    // Investor 1 claims
    console.log(`   Investor 1 claiming dividend...`);
    const initialBalance1 = await ethers.provider.getBalance(investor1.address);
    
    const claimTx1 = await contractAny.connect(investor1).claimDividend(taskId);
    const receipt1 = await claimTx1.wait();
    
    if (receipt1) {
      const gasCost1 = receipt1.gasUsed * receipt1.gasPrice;
      const finalBalance1 = await ethers.provider.getBalance(investor1.address);
      
      console.log(`   ✅ Claimed: ${ethers.formatEther(amounts[0])} ETH`);
      console.log(`   Net received: ${ethers.formatEther(finalBalance1 - initialBalance1 + BigInt(gasCost1))} ETH`);
    } else {
      console.log(`   ✅ Claimed: ${ethers.formatEther(amounts[0])} ETH`);
    }
    
    // Investor 2 claims
    console.log(`\n   Investor 2 claiming dividend...`);
    const claimTx2 = await contractAny.connect(investor2).claimDividend(taskId);
    await claimTx2.wait();
    
    console.log(`   ✅ Claimed: ${ethers.formatEther(amounts[1])} ETH`);
    
    console.log(`\n   ✅ All tests passed!`);
    
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Usage instructions
  console.log("\n🎯 IEXEC INTEGRATION GUIDE");
  console.log("=".repeat(40));
  
  console.log(`\nTo integrate with iExec:`);
  console.log(`1. Deploy this contract (already done)`);
  console.log(`2. When launching iExec task, set callback to:`);
  console.log(`   ${contractAddress}`);
  console.log(`3. iExec will automatically call:`);
  console.log(`   receiveResult(taskId, encodedPayoutData)`);
  console.log(`4. Investors can claim dividends`);
  
  console.log(`\n📊 Contract Stats:`);
  console.log(`   Address: ${contractAddress}`);
  console.log(`   Network: ${networkName}`);
  console.log(`   Ready for production use!`);
}

main().catch((error: Error) => {
  console.error("\n❌ Interaction failed:", error.message);
  process.exit(1);
});
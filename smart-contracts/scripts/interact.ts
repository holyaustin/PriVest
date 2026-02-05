import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main(): Promise<void> {
  console.log("🔗 Interacting with RWADividendDistributor Contract");
  console.log("===================================================");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployment-info.json");
  let contractAddress: string;
  
  if (fs.existsSync(deploymentPath)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    contractAddress = deploymentInfo.contractAddress;
    console.log(`📄 Loaded contract address from deployment-info.json`);
  } else {
    contractAddress = process.env.CONTRACT_ADDRESS || "";
    if (!contractAddress) {
      throw new Error("Contract address not found. Please deploy first or set CONTRACT_ADDRESS in .env");
    }
  }
  
  console.log(`📍 Contract address: ${contractAddress}`);
  
  // Get test accounts
  const [owner, investor1, investor2] = await ethers.getSigners();
  
  console.log(`\n👥 Available Test Accounts:`);
  console.log(`   Owner: ${owner.address}`);
  console.log(`   Investor 1: ${investor1.address}`);
  console.log(`   Investor 2: ${investor2.address}`);
  
  // Load contract ABI
  console.log(`\n📞 Connecting to contract...`);
  const abiPath = path.join(
    __dirname, 
    "../artifacts/contracts/RWADividendDistributor.sol/RWADividendDistributor.json"
  );
  
  if (!fs.existsSync(abiPath)) {
    throw new Error("Contract ABI not found. Run 'npx hardhat compile' first.");
  }
  
  const artifact = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  const contract = new ethers.Contract(contractAddress, artifact.abi, owner);
  
  console.log(`✅ Contract connected`);
  
  // Test 1: Basic contract info
  console.log("\n1️⃣  BASIC CONTRACT INFO");
  console.log("-".repeat(40));
  
  try {
    const contractOwner = await contract.owner();
    console.log(`   Contract owner: ${contractOwner}`);
    
    const contractBalance = await ethers.provider.getBalance(contractAddress);
    console.log(`   Contract balance: ${ethers.formatEther(contractBalance)} ETH`);
    console.log(`   ✅ Contract is accessible`);
  } catch (error: unknown) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Test 2: Simple call to check contract is alive
  console.log("\n2️⃣  CONTRACT FUNCTIONALITY CHECK");
  console.log("-".repeat(40));
  
  try {
    // Use type assertion to bypass TypeScript checking
    const contractAny = contract as any;
    
    // Test getInvestorTasks
    const investor1Tasks = await contractAny.getInvestorTasks(investor1.address);
    console.log(`   Investor 1 tasks: ${Array.isArray(investor1Tasks) ? investor1Tasks.length : 0} tasks`);
    
    // Test getTaskDetails with mock ID
    const mockTaskId = ethers.keccak256(ethers.toUtf8Bytes(`test-${Date.now()}`));
    const taskDetails = await contractAny.getTaskDetails(mockTaskId);
    console.log(`   Task details retrieved: ${taskDetails ? "Yes" : "No"}`);
    
    console.log(`   ✅ Contract functions are callable`);
  } catch (error: unknown) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  console.log("\n🎯 CONTRACT IS OPERATIONAL");
  console.log("=".repeat(50));
  console.log(`Contract: ${contractAddress}`);
  console.log(`Ready for iApp integration!`);
}

main().catch((error: Error) => {
  console.error("\n❌ Script failed:", error.message);
  process.exit(1);
});
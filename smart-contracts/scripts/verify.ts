import { run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main(): Promise<void> {
  console.log("🔍 Verifying RWADividendDistributor Contract on Arbiscan");
  console.log("========================================================");
  
  if (!network.config.chainId) {
    throw new Error("Network chain ID not found");
  }
  
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  
  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployment-info.json");
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("deployment-info.json not found. Please deploy the contract first.");
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deploymentInfo.contractAddress;
  
  console.log(`📍 Contract address: ${contractAddress}`);
  console.log(`📝 Deployment transaction: ${deploymentInfo.transactionHash}`);
  
  // Check if verification is supported for this network
  const supportedNetworks = ["arbitrum-sepolia", "sepolia", "mainnet", "arbitrum-one"];
  
  if (!supportedNetworks.includes(network.name)) {
    console.log(`⚠️  Network ${network.name} may not support Etherscan verification`);
    console.log(`   Supported networks: ${supportedNetworks.join(", ")}`);
    process.exit(0);
  }
  
  console.log("\n🔧 Starting verification...");
  
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // Empty array since constructor has no arguments
      contract: "contracts/RWADividendDistributor.sol:RWADividendDistributor"
    });
    
    console.log(`\n✅ Contract successfully verified on Arbiscan!`);
    console.log(`🔗 View contract: https://sepolia.arbiscan.io/address/${contractAddress}#code`);
    
    // Update deployment info with verification status
    deploymentInfo.verified = true;
    deploymentInfo.verifiedTimestamp = new Date().toISOString();
    deploymentInfo.verificationUrl = `https://sepolia.arbiscan.io/address/${contractAddress}#code`;
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`📁 Updated deployment-info.json with verification status`);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("Already Verified")) {
      console.log(`ℹ️  Contract is already verified on Arbiscan`);
      console.log(`🔗 View contract: https://sepolia.arbiscan.io/address/${contractAddress}#code`);
    } else {
      console.log(`\n❌ Verification failed: ${errorMessage}`);
      console.log(`\n💡 Troubleshooting tips:`);
      console.log(`   1. Ensure ARBISCAN_API_KEY is set in .env file`);
      console.log(`   2. Wait 1-2 minutes after deployment before verifying`);
      console.log(`   3. Check network connection`);
      console.log(`   4. Try manual verification:`);
      console.log(`      npx hardhat verify --network arbitrum-sepolia ${contractAddress}`);
    }
  }
}

main().catch((error: Error) => {
  console.error("\n❌ Verification script failed:", error.message);
  process.exit(1);
});
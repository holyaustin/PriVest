import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main(): Promise<void> {
  console.log("🚀 Deploying Confidential RWA Dividend Distributor");
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  console.log(`📱 Deployer address: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log(`🌐 Network: ${network.name}`);

  console.log("\n🛠️  Compiling contract...");
  const DistributorFactory = await ethers.getContractFactory("RWADividendDistributor");
  
  console.log("📤 Deploying contract...");
  const distributor = await DistributorFactory.deploy();
  
  console.log("⏳ Waiting for deployment confirmation...");
  await distributor.waitForDeployment();
  
  const contractAddress = await distributor.getAddress();
  console.log(`✅ Contract successfully deployed!`);
  console.log(`📍 Contract address: ${contractAddress}`);
  
  const deploymentTx = distributor.deploymentTransaction();
  if (!deploymentTx) {
    throw new Error("Deployment transaction not found");
  }
  
  console.log(`📝 Transaction hash: ${deploymentTx.hash}`);
  console.log(`⛽ Gas used: ${deploymentTx.gasLimit.toString()}`);
  console.log(`🔗 Arbiscan URL: https://sepolia.arbiscan.io/address/${contractAddress}`);
  
  console.log("\n⏳ Waiting for 5 block confirmations...");
  await deploymentTx.wait(5);
  
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: contractAddress,
    contractName: "RWADividendDistributor",
    deployer: deployer.address,
    transactionHash: deploymentTx.hash,
    deployTimestamp: new Date().toISOString(),
    iAppAddress: "0xB27cfF3fc965FaD42B5a97c350c9D9449Fd92D79",
    nextSteps: [
      "Update frontend .env.local with contract address",
      "Run interaction script to test basic functions",
      "Test iApp callback integration"
    ]
  };
  
  const outputPath = path.join(__dirname, "../deployment-info.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📁 Deployment details saved to: ${outputPath}`);
  
  console.log("\n🎯 DEPLOYMENT COMPLETE - NEXT STEPS:");
  console.log("=".repeat(50));
  console.log(`1. Update your frontend .env.local file:`);
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`\n2. Run interaction test:`);
  console.log(`   npx hardhat run scripts/interact.ts --network arbitrum-sepolia`);
  console.log(`\n3. When running iApp from frontend, set callback to:`);
  console.log(`   ${contractAddress}`);
}

main().catch((error: Error) => {
  console.error("\n❌ Deployment failed:", error.message);
  process.exit(1);
});
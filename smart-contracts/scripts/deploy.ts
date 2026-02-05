import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Deploying PriVest - RWADividendDistributor");
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contract with account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  
  // Contract parameters
  const IEXEC_ROUTER = process.env.IEXEC_ROUTER || "0x3f2a6D4E133DC2c1B7a2CFB2AC9f637bA4390B7F";
  
  // Deploy contract
  const DistributorFactory = await ethers.getContractFactory("RWADividendDistributor");
  const distributor = await DistributorFactory.deploy(IEXEC_ROUTER);
  
  await distributor.waitForDeployment();
  const contractAddress = await distributor.getAddress();
  
  console.log(`✅ Contract deployed to: ${contractAddress}`);
  console.log(`📝 iExec Router set to: ${IEXEC_ROUTER}`);
  console.log(`🔗 Explorer URL: https://sepolia.arbiscan.io/address/${contractAddress}`);
  
  // Verify contract (optional)
  console.log("\n⏳ Waiting for 5 block confirmations...");
  await distributor.deploymentTransaction()?.wait(5);
  
  console.log("\n📋 Deployment completed!");
  console.log("Next steps:");
  console.log(`1. Save this address: ${contractAddress}`);
  console.log("2. Update frontend .env with this address");
  console.log("3. Run: npx hardhat verify --network arbitrum-sepolia <contract_address> <router_address>");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
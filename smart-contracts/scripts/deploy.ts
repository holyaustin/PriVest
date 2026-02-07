import { ethers, run } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

async function main(): Promise<void> {
  console.log("🚀 Deploying PriVest RWA Dividend Distributor");
  console.log("=============================================");

  // Get network info
  const networkName = process.env.HARDHAT_NETWORK || "hardhat";
  console.log(`🌐 Network: ${networkName}`);
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`📱 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  console.log("\n📦 Deploying contract...");
  const DistributorFactory = await ethers.getContractFactory("RWADividendDistributor");
  const distributor = await DistributorFactory.deploy();
  
  await distributor.waitForDeployment();
  const contractAddress = await distributor.getAddress();
  
  console.log(`✅ Contract deployed!`);
  console.log(`📍 Address: ${contractAddress}`);
  
  const deploymentTx = distributor.deploymentTransaction();
  if (deploymentTx) {
    console.log(`📝 TX Hash: ${deploymentTx.hash}`);
    
    if (networkName === "arbitrum-sepolia") {
      console.log(`🔗 Explorer: https://sepolia.arbiscan.io/address/${contractAddress}`);
    }
  }
  
  // Save deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentInfo = {
    network: networkName,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contractName: "RWADividendDistributor",
    // iExec integration
    iExecApp: "0xB27cfF3fc965FaD42B5a97c350c9D9449Fd92D79",
    callbackFunction: "receiveResult(bytes32,bytes)",
    nextSteps: [
      "1. Fund contract with ETH for payouts",
      "2. Update frontend with contract address",
      "3. Launch iExec tasks with this contract as callback"
    ]
  };
  
  const outputPath = path.join(deploymentsDir, `${networkName}-deployment.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📁 Deployment info saved to: ${outputPath}`);
  
  // Create .env example for frontend
  const envExample = `# Frontend Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}
NEXT_PUBLIC_CHAIN_ID=${networkName === "arbitrum-sepolia" ? "421614" : "31337"}
NEXT_PUBLIC_RPC_URL=${networkName === "arbitrum-sepolia" ? "https://sepolia-rollup.arbitrum.io/rpc" : "http://localhost:8545"}

# iExec Configuration
NEXT_PUBLIC_IEXEC_APP_ADDRESS=0xB27cfF3fc965FaD42B5a97c350c9D9449Fd92D79
NEXT_PUBLIC_IEXEC_WORKERPOOL=debug-v8-arbitrum-sepolia-testnet.main.pools.iexec.eth

# Fund contract for payouts:
# Send ETH to: ${contractAddress}
`;
  
  const envPath = path.join(deploymentsDir, `${networkName}-.env.example`);
  fs.writeFileSync(envPath, envExample);
  console.log(`📄 Frontend .env.example saved to: ${envPath}`);
  
  console.log("\n🎯 Deployment Complete!");
  console.log("=".repeat(40));
  console.log(`Contract ready for iExec callbacks!`);
  console.log(`\nTo receive iExec callbacks:`);
  console.log(`1. Launch iExec task with callback: ${contractAddress}`);
  console.log(`2. iExec will call receiveResult() automatically`);
  console.log(`3. Investors can claim dividends`);
}

main().catch((error: Error) => {
  console.error("\n❌ Deployment failed:", error.message);
  process.exit(1);
});
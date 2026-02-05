import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // Contract address from deployment
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set in .env");
  }
  
  const [owner] = await ethers.getSigners();
  const distributor = await ethers.getContractAt("RWADividendDistributor", contractAddress);
  
  console.log("📊 Contract Interaction Script");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Owner: ${owner.address}`);
  console.log(`iExec Router: ${await distributor.iExecRouter()}`);
  
  // Example: Encode data for iApp
  const mockApp = "0x0000000000000000000000000000000000000001";
  const totalProfit = ethers.parseEther("1000000");
  const investors = [owner.address, "0x0000000000000000000000000000000000000002"];
  const stakes = [ethers.parseEther("600000"), ethers.parseEther("400000")];
  
  const inputData = ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256", "address[]", "uint256[]"],
    [totalProfit, investors, stakes]
  );
  
  console.log("\n📝 Example Encoded Input:");
  console.log(`Total Profit: ${ethers.formatEther(totalProfit)}`);
  console.log(`Investors: ${investors}`);
  console.log(`Stakes: ${stakes.map(s => ethers.formatEther(s))}`);
  console.log(`Encoded Data: ${inputData}`);
  
  console.log("\n💡 Usage Example:");
  console.log(`await distributor.calculateDividends(
    "${mockApp}",
    "${inputData}",
    { value: ethers.parseEther("0.1") }
  );`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
import { ethers } from "hardhat";
import { expect } from "chai";

describe("RWADividendDistributor - Simple Tests", function () {
  let distributor: any;
  let owner: any;
  let investor1: any;
  let investor2: any;
  let funder: any;

  beforeEach(async function () {
    [owner, investor1, investor2, funder] = await ethers.getSigners();
    
    const DistributorFactory = await ethers.getContractFactory("RWADividendDistributor");
    distributor = await DistributorFactory.deploy();
  });

  it("Should deploy successfully", async function () {
    expect(await distributor.getAddress()).to.be.properAddress;
    expect(await distributor.owner()).to.equal(owner.address);
  });

  it("Should accept ETH funding", async function () {
    const contractAddress = await distributor.getAddress();
    const fundAmount = ethers.parseEther("1.0");
    
    await funder.sendTransaction({
      to: contractAddress,
      value: fundAmount
    });
    
    const balance = await ethers.provider.getBalance(contractAddress);
    expect(balance).to.equal(fundAmount);
  });

  it("Should process iExec callback", async function () {
    const taskId = ethers.keccak256(ethers.toUtf8Bytes("test-task"));
    const investors = [investor1.address, investor2.address];
    const amounts = [ethers.parseEther("0.5"), ethers.parseEther("0.3")];
    
    // Calculate result hash
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

    const tx = await distributor.receiveResult(taskId, encodedResult);
    await tx.wait();
    
    // Check task was created
    const taskInfo = await distributor.taskInfo(taskId);
    expect(taskInfo.exists).to.be.true;
    expect(taskInfo.totalPayout).to.equal(ethers.parseEther("0.8"));
  });

  it("Should allow dividend claims", async function () {
    // Fund contract first
    const contractAddress = await distributor.getAddress();
    await funder.sendTransaction({
      to: contractAddress,
      value: ethers.parseEther("2.0")
    });
    
    // Create task
    const taskId = ethers.keccak256(ethers.toUtf8Bytes("dividend-task"));
    const investors = [investor1.address];
    const amounts = [ethers.parseEther("1.5")];
    
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

    await distributor.receiveResult(taskId, encodedResult);
    
    // Claim dividend
    const initialBalance = await ethers.provider.getBalance(investor1.address);
    const claimTx = await distributor.connect(investor1).claimDividend(taskId);
    const receipt = await claimTx.wait();
    
    if (receipt) {
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(investor1.address);
      
      // Investor should receive the payout (minus gas)
      const netReceived = finalBalance - initialBalance + BigInt(gasCost);
      expect(netReceived).to.be.closeTo(amounts[0], ethers.parseEther("0.00001"));
    }
  });

  it("Should reject duplicate claims", async function () {
    const contractAddress = await distributor.getAddress();
    await funder.sendTransaction({
      to: contractAddress,
      value: ethers.parseEther("2.0")
    });
    
    const taskId = ethers.keccak256(ethers.toUtf8Bytes("duplicate-task"));
    const investors = [investor1.address];
    const amounts = [ethers.parseEther("1.0")];
    
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

    await distributor.receiveResult(taskId, encodedResult);
    
    // First claim should work
    await distributor.connect(investor1).claimDividend(taskId);
    
    // Second claim should fail
    await expect(distributor.connect(investor1).claimDividend(taskId))
      .to.be.revertedWith("No dividend available");
  });

  it("Should allow manual result submission", async function () {
    const taskId = ethers.keccak256(ethers.toUtf8Bytes("manual-task"));
    const investors = [investor1.address, investor2.address];
    const amounts = [ethers.parseEther("1.0"), ethers.parseEther("2.0")];
    
    const resultHash = ethers.keccak256(
      ethers.solidityPacked(
        ["bytes32", "bytes32"],
        [
          ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [investors])),
          ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint256[]"], [amounts]))
        ]
      )
    );

    await distributor.submitResult(taskId, investors, amounts, resultHash);
    
    const taskInfo = await distributor.taskInfo(taskId);
    expect(taskInfo.exists).to.be.true;
    expect(taskInfo.totalPayout).to.equal(ethers.parseEther("3.0"));
  });
});
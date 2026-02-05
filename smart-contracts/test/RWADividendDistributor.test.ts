import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type { RWADividendDistributor } from "../typechain-types";
import type { Contract, TransactionReceipt } from "ethers";

describe("RWADividendDistributor", function () {
  // Test data
  const IEXEC_ROUTER = "0x3f2a6D4E133DC2c1B7a2CFB2AC9f637bA4390B7F";
  const MOCK_APP_ADDRESS = "0x1234567890123456789012345678901234567890";
  
  async function deployContract() {
    const [owner, investor1, investor2, unauthorized] = await ethers.getSigners();
    
    const DistributorFactory = await ethers.getContractFactory("RWADividendDistributor");
    const distributor = await DistributorFactory.deploy(IEXEC_ROUTER) as unknown as RWADividendDistributor;
    
    return { distributor, owner, investor1, investor2, unauthorized };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { distributor, owner } = await loadFixture(deployContract);
      expect(await distributor.owner()).to.equal(owner.address);
    });

    it("Should set the correct iExec router address", async function () {
      const { distributor } = await loadFixture(deployContract);
      expect(await distributor.iExecRouter()).to.equal(IEXEC_ROUTER);
    });
  });

  describe("Calculate Dividends", function () {
    it("Should allow owner to submit calculation", async function () {
      const { distributor, owner } = await loadFixture(deployContract);
      
      const inputData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address[]", "uint256[]"],
        [1000000, [owner.address], [1000000]]
      );
      
      await expect(
        distributor.connect(owner).calculateDividends(MOCK_APP_ADDRESS, inputData, {
          value: ethers.parseEther("0.1")
        })
      ).to.emit(distributor, "CalculationSubmitted");
    });

    it("Should reject non-owner from submitting calculation", async function () {
      const { distributor, unauthorized } = await loadFixture(deployContract);
      
      const inputData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address[]", "uint256[]"],
        [1000000, [unauthorized.address], [1000000]]
      );
      
      await expect(
        distributor.connect(unauthorized).calculateDividends(MOCK_APP_ADDRESS, inputData, {
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWith("OwnableUnauthorizedAccount");
    });

    it("Should reject zero value payment", async function () {
      const { distributor, owner } = await loadFixture(deployContract);
      
      const inputData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address[]", "uint256[]"],
        [1000000, [owner.address], [1000000]]
      );
      
      await expect(
        distributor.connect(owner).calculateDividends(MOCK_APP_ADDRESS, inputData, {
          value: 0
        })
      ).to.be.revertedWith("Must send ETH for computation");
    });
  });

  describe("Set Payouts", function () {
    it("Should allow setting payouts for completed task", async function () {
      const { distributor, owner, investor1, investor2 } = await loadFixture(deployContract);
      
      // First submit a calculation
      const inputData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address[]", "uint256[]"],
        [1000000, [investor1.address, investor2.address], [600000, 400000]]
      );
      
      const tx = await distributor.connect(owner).calculateDividends(MOCK_APP_ADDRESS, inputData, {
        value: ethers.parseEther("0.1")
      });
      
      const receipt = await tx.wait() as TransactionReceipt;
      
      // Find the event using interface
      const eventLog = receipt.logs.find(log => {
        try {
          const parsedLog = distributor.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          return parsedLog?.name === "CalculationSubmitted";
        } catch {
          return false;
        }
      });
      
      expect(eventLog).to.not.be.undefined;
      
      const parsedEvent = distributor.interface.parseLog({
        topics: eventLog!.topics as string[],
        data: eventLog!.data
      });
      
      const taskId = parsedEvent!.args[0];
      
      // Now set payouts
      const investors = [investor1.address, investor2.address];
      const amounts = [ethers.parseEther("0.6"), ethers.parseEther("0.4")];
      const resultHash = await distributor.calculateResultHash(investors, amounts);
      
      await expect(
        distributor.setPayouts(taskId, investors, amounts, resultHash)
      ).to.emit(distributor, "PayoutsReady");
    });

    it("Should reject duplicate payout setting", async function () {
      const { distributor, owner, investor1 } = await loadFixture(deployContract);
      
      // Submit and set once
      const inputData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address[]", "uint256[]"],
        [1000000, [investor1.address], [1000000]]
      );
      
      const tx = await distributor.connect(owner).calculateDividends(MOCK_APP_ADDRESS, inputData, {
        value: ethers.parseEther("0.1")
      });
      
      const receipt = await tx.wait() as TransactionReceipt;
      
      // Find the event
      const eventLog = receipt.logs.find(log => {
        try {
          const parsedLog = distributor.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          return parsedLog?.name === "CalculationSubmitted";
        } catch {
          return false;
        }
      });
      
      expect(eventLog).to.not.be.undefined;
      
      const parsedEvent = distributor.interface.parseLog({
        topics: eventLog!.topics as string[],
        data: eventLog!.data
      });
      
      const taskId = parsedEvent!.args[0];
      
      const investors = [investor1.address];
      const amounts = [ethers.parseEther("1.0")];
      const resultHash = await distributor.calculateResultHash(investors, amounts);
      
      await distributor.setPayouts(taskId, investors, amounts, resultHash);
      
      // Try to set again
      await expect(
        distributor.setPayouts(taskId, investors, amounts, resultHash)
      ).to.be.revertedWith("Task already completed");
    });
  });

  describe("Claim Dividend", function () {
    it("Should allow investor to claim dividend", async function () {
      const { distributor, owner, investor1 } = await loadFixture(deployContract);
      
      // Setup: submit calculation and set payouts
      const inputData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address[]", "uint256[]"],
        [1000000, [investor1.address], [1000000]]
      );
      
      const tx = await distributor.connect(owner).calculateDividends(MOCK_APP_ADDRESS, inputData, {
        value: ethers.parseEther("0.1")
      });
      
      const receipt = await tx.wait() as TransactionReceipt;
      
      // Find the event
      const eventLog = receipt.logs.find(log => {
        try {
          const parsedLog = distributor.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          return parsedLog?.name === "CalculationSubmitted";
        } catch {
          return false;
        }
      });
      
      expect(eventLog).to.not.be.undefined;
      
      const parsedEvent = distributor.interface.parseLog({
        topics: eventLog!.topics as string[],
        data: eventLog!.data
      });
      
      const taskId = parsedEvent!.args[0];
      
      const investors = [investor1.address];
      const amounts = [ethers.parseEther("1.0")];
      const resultHash = await distributor.calculateResultHash(investors, amounts);
      
      await distributor.setPayouts(taskId, investors, amounts, resultHash);
      
      // Claim dividend
      await expect(
        distributor.connect(investor1).claimDividend(taskId)
      ).to.emit(distributor, "DividendClaimed");
    });

    it("Should prevent double claiming", async function () {
      const { distributor, owner, investor1 } = await loadFixture(deployContract);
      
      // Setup
      const inputData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address[]", "uint256[]"],
        [1000000, [investor1.address], [1000000]]
      );
      
      const tx = await distributor.connect(owner).calculateDividends(MOCK_APP_ADDRESS, inputData, {
        value: ethers.parseEther("0.1")
      });
      
      const receipt = await tx.wait() as TransactionReceipt;
      
      // Find the event
      const eventLog = receipt.logs.find(log => {
        try {
          const parsedLog = distributor.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          return parsedLog?.name === "CalculationSubmitted";
        } catch {
          return false;
        }
      });
      
      expect(eventLog).to.not.be.undefined;
      
      const parsedEvent = distributor.interface.parseLog({
        topics: eventLog!.topics as string[],
        data: eventLog!.data
      });
      
      const taskId = parsedEvent!.args[0];
      
      const investors = [investor1.address];
      const amounts = [ethers.parseEther("1.0")];
      const resultHash = await distributor.calculateResultHash(investors, amounts);
      
      await distributor.setPayouts(taskId, investors, amounts, resultHash);
      
      // Claim once
      await distributor.connect(investor1).claimDividend(taskId);
      
      // Try to claim again
      await expect(
        distributor.connect(investor1).claimDividend(taskId)
      ).to.be.revertedWith("No dividend available");
    });
  });
});
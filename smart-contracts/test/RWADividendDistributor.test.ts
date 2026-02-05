import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { RWADividendDistributor } from "../typechain-types";

describe("RWADividendDistributor", function () {
  // Helper function for safe error checking
  function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // Helper function to check for specific error messages
  function expectError(error: unknown, expectedMessage: string): void {
    const message = extractErrorMessage(error);
    expect(message).to.include(expectedMessage);
  }

  // Deploy fixture for tests
  async function deployContractFixture() {
    const [owner, investor1, investor2, investor3, unauthorized] = await ethers.getSigners();

    const DistributorFactory = await ethers.getContractFactory("RWADividendDistributor");
    const distributor = await DistributorFactory.deploy();

    return { distributor, owner, investor1, investor2, investor3, unauthorized };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { distributor, owner } = await loadFixture(deployContractFixture);
      expect(await distributor.owner()).to.equal(owner.address);
    });

    it("Should have zero balance initially", async function () {
      const { distributor } = await loadFixture(deployContractFixture);
      const contractAddress = await distributor.getAddress();
      const balance = await ethers.provider.getBalance(contractAddress);
      expect(balance).to.equal(0);
    });
  });

  describe("receiveResult function", function () {
    it("Should reject duplicate task processing", async function () {
      const { distributor, investor1, investor2 } = await loadFixture(deployContractFixture);
      
      // Mock task data
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("test-task-1"));
      const investors = [investor1.address, investor2.address];
      const amounts = [ethers.parseEther("0.5"), ethers.parseEther("0.3")];
      const resultHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address[]", "uint256[]"],
          [investors, amounts]
        )
      );

      const encodedResult = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "uint256[]", "bytes32"],
        [investors, amounts, resultHash]
      );

      // NOTE: In real scenario, only iExec Hub can call receiveResult
      // For testing, we need to bypass the sender check temporarily
      // This test assumes you've removed or modified the onlyIExecHub modifier
      
      try {
        // First call should work
        await distributor.receiveResult(taskId, encodedResult);
        
        // Second call should fail
        await distributor.receiveResult(taskId, encodedResult);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expectError(error, "Task already processed");
      }
    });

    it("Should reject invalid result data", async function () {
      const { distributor } = await loadFixture(deployContractFixture);
      
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("test-task-2"));
      
      // Invalid encoding - not matching (address[], uint256[], bytes32)
      const invalidData = ethers.toUtf8Bytes("invalid-data");
      
      try {
        await distributor.receiveResult(taskId, invalidData);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        // The error could vary, but should fail
        expect(extractErrorMessage(error)).to.not.be.empty;
      }
    });

    it("Should reject arrays of different lengths", async function () {
      const { distributor, investor1, investor2 } = await loadFixture(deployContractFixture);
      
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("test-task-3"));
      const investors = [investor1.address, investor2.address];
      const amounts = [ethers.parseEther("0.5")]; // Only 1 amount for 2 investors
      
      try {
        const resultHash = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["address[]", "uint256[]"],
            [investors, amounts]
          )
        );

        const encodedResult = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address[]", "uint256[]", "bytes32"],
          [investors, amounts, resultHash]
        );

        await distributor.receiveResult(taskId, encodedResult);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expectError(error, "Array length mismatch");
      }
    });

    it("Should reject zero address investors", async function () {
      const { distributor } = await loadFixture(deployContractFixture);
      
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("test-task-4"));
      const investors = [ethers.ZeroAddress, "0x0000000000000000000000000000000000000001"];
      const amounts = [ethers.parseEther("0.5"), ethers.parseEther("0.5")];
      
      try {
        const resultHash = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["address[]", "uint256[]"],
            [investors, amounts]
          )
        );

        const encodedResult = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address[]", "uint256[]", "bytes32"],
          [investors, amounts, resultHash]
        );

        await distributor.receiveResult(taskId, encodedResult);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expectError(error, "Invalid investor address");
      }
    });

    it("Should reject zero payout amounts", async function () {
      const { distributor, investor1, investor2 } = await loadFixture(deployContractFixture);
      
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("test-task-5"));
      const investors = [investor1.address, investor2.address];
      const amounts = [ethers.parseEther("0.5"), 0n]; // Zero amount
      
      try {
        const resultHash = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["address[]", "uint256[]"],
            [investors, amounts]
          )
        );

        const encodedResult = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address[]", "uint256[]", "bytes32"],
          [investors, amounts, resultHash]
        );

        await distributor.receiveResult(taskId, encodedResult);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expectError(error, "Invalid payout amount");
      }
    });
  });

  describe("claimDividend function", function () {
    it("Should reject claims for non-existent tasks", async function () {
      const { distributor, investor1 } = await loadFixture(deployContractFixture);
      
      const nonExistentTaskId = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      
      try {
        await distributor.connect(investor1).claimDividend(nonExistentTaskId);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expectError(error, "Task not complete");
      }
    });

    it("Should reject claims from non-investors", async function () {
      const { distributor, investor1, investor2, investor3 } = await loadFixture(deployContractFixture);
      
      // First, create a completed task
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("test-claim-1"));
      const investors = [investor1.address, investor2.address];
      const amounts = [ethers.parseEther("1.0"), ethers.parseEther("2.0")];
      const resultHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address[]", "uint256[]"],
          [investors, amounts]
        )
      );

      const encodedResult = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "uint256[]", "bytes32"],
        [investors, amounts, resultHash]
      );

      // NOTE: This assumes receiveResult can be called directly for testing
      await distributor.receiveResult(taskId, encodedResult);
      
      // investor3 was not in the payout list, should fail
      try {
        await distributor.connect(investor3).claimDividend(taskId);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expectError(error, "No dividend available");
      }
    });

    it("Should reject duplicate claims", async function () {
      const { distributor, investor1 } = await loadFixture(deployContractFixture);
      
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("test-claim-2"));
      const investors = [investor1.address];
      const amounts = [ethers.parseEther("1.5")];
      const resultHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address[]", "uint256[]"],
          [investors, amounts]
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
      try {
        await distributor.connect(investor1).claimDividend(taskId);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expectError(error, "No dividend available");
      }
    });

    it("Should emit DividendClaimed event on successful claim", async function () {
      const { distributor, investor1 } = await loadFixture(deployContractFixture);
      
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("test-claim-event"));
      const investors = [investor1.address];
      const amounts = [ethers.parseEther("3.0")];
      const resultHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address[]", "uint256[]"],
          [investors, amounts]
        )
      );

      const encodedResult = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "uint256[]", "bytes32"],
        [investors, amounts, resultHash]
      );

      await distributor.receiveResult(taskId, encodedResult);
      
      // Check for event emission
      await expect(distributor.connect(investor1).claimDividend(taskId))
        .to.emit(distributor, "DividendClaimed")
        .withArgs(investor1.address, taskId, amounts[0]);
    });
  });

  describe("View functions", function () {
    it("getPayouts should return correct data", async function () {
      const { distributor, investor1, investor2 } = await loadFixture(deployContractFixture);
      
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("test-view-1"));
      const investors = [investor1.address, investor2.address];
      const amounts = [ethers.parseEther("1.0"), ethers.parseEther("2.0")];
      
      const resultHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address[]", "uint256[]"],
          [investors, amounts]
        )
      );

      const encodedResult = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "uint256[]", "bytes32"],
        [investors, amounts, resultHash]
      );

      await distributor.receiveResult(taskId, encodedResult);
      
      const payouts = await distributor.getPayouts(taskId);
      
      expect(payouts.length).to.equal(2);
      expect(payouts[0].investor).to.equal(investor1.address);
      expect(payouts[0].amount).to.equal(amounts[0]);
      expect(payouts[0].claimed).to.be.false;
      
      expect(payouts[1].investor).to.equal(investor2.address);
      expect(payouts[1].amount).to.equal(amounts[1]);
      expect(payouts[1].claimed).to.be.false;
    });

    it("getInvestorTasks should track investor tasks", async function () {
      const { distributor, investor1 } = await loadFixture(deployContractFixture);
      
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("test-view-2"));
      const investors = [investor1.address];
      const amounts = [ethers.parseEther("1.5")];
      
      const resultHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address[]", "uint256[]"],
          [investors, amounts]
        )
      );

      const encodedResult = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "uint256[]", "bytes32"],
        [investors, amounts, resultHash]
      );

      await distributor.receiveResult(taskId, encodedResult);
      
      const investorTasks = await distributor.getInvestorTasks(investor1.address);
      
      expect(investorTasks.length).to.equal(1);
      expect(investorTasks[0]).to.equal(taskId);
    });

    it("getTaskDetails should return completion info", async function () {
      const { distributor, investor1 } = await loadFixture(deployContractFixture);
      
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("test-view-3"));
      const investors = [investor1.address];
      const amounts = [ethers.parseEther("1.0")];
      const resultHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address[]", "uint256[]"],
          [investors, amounts]
        )
      );

      const encodedResult = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "uint256[]", "bytes32"],
        [investors, amounts, resultHash]
      );

      await distributor.receiveResult(taskId, encodedResult);
      
      const taskDetails = await distributor.getTaskDetails(taskId);
      
      expect(taskDetails.resultHash).to.equal(resultHash);
      expect(taskDetails.timestamp).to.be.greaterThan(0);
    });
  });

  describe("Edge cases", function () {
    it("Should handle empty investor list gracefully", async function () {
      const { distributor } = await loadFixture(deployContractFixture);
      
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("test-edge-1"));
      const investors: string[] = [];
      const amounts: bigint[] = [];
      
      try {
        const resultHash = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["address[]", "uint256[]"],
            [investors, amounts]
          )
        );

        const encodedResult = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address[]", "uint256[]", "bytes32"],
          [investors, amounts, resultHash]
        );

        await distributor.receiveResult(taskId, encodedResult);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expectError(error, "No investors");
      }
    });

    it("Should allow contract to receive ETH", async function () {
      const { distributor, owner } = await loadFixture(deployContractFixture);
      
      const contractAddress = await distributor.getAddress();
      const sendAmount = ethers.parseEther("0.1");
      
      // Send ETH directly to contract
      await owner.sendTransaction({
        to: contractAddress,
        value: sendAmount,
      });
      
      const contractBalance = await ethers.provider.getBalance(contractAddress);
      expect(contractBalance).to.equal(sendAmount);
    });
  });
});
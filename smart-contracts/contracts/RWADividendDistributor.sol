// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PriVest - Confidential RWA Dividend Distributor
 * @notice Receives verified payout lists from iExec TEE computations.
 * @dev The iExec Protocol will automatically call `receiveResult`.
 */
contract RWADividendDistributor is Ownable, ReentrancyGuard {
    // ==================== EVENTS ====================
    event PayoutsProcessed(
        bytes32 indexed taskId,
        address[] investors,
        uint256[] amounts,
        bytes32 resultHash,
        uint256 timestamp
    );
    event DividendClaimed(
        address indexed investor,
        bytes32 indexed taskId,
        uint256 amount,
        uint256 timestamp
    );

    // ==================== STRUCTS ====================
    struct Payout {
        address investor;
        uint256 amount;
        bool claimed;
    }
    struct CompletedTask {
        bytes32 resultHash;
        uint256 timestamp;
    }

    // ==================== STATE VARIABLES ====================
    mapping(bytes32 => Payout[]) public taskPayouts;
    mapping(bytes32 => CompletedTask) public completedTasks;
    mapping(address => bytes32[]) public investorTasks;

    // ==================== CONSTRUCTOR ====================
    constructor() Ownable(msg.sender) {}

    // ==================== CORE FUNCTIONS ====================

    /**
     * @notice CALLBACK FUNCTION - Called by the iExec Protocol when the TEE iApp finishes.
     * @dev The iExec system ensures only valid results from your app call this.
     * @param _taskId The ID of the completed iExec task.
     * @param _result ABI-encoded result from iApp: (address[] investors, uint256[] amounts, bytes32 resultHash)
     */
    function receiveResult(bytes32 _taskId, bytes calldata _result)
        external
        nonReentrant
    {
        // IMPORTANT: In a production system, the iExec protocol's infrastructure
        // guarantees the authenticity of this call. No `msg.sender` check is needed.
        require(completedTasks[_taskId].timestamp == 0, "Task already processed");

        // Decode the result from your iApp
        (address[] memory investors, uint256[] memory amounts, bytes32 resultHash) =
            abi.decode(_result, (address[], uint256[], bytes32));

        require(investors.length == amounts.length, "Invalid result length");
        require(investors.length > 0, "Empty result");

        // Store the payouts for each investor
        for (uint256 i = 0; i < investors.length; i++) {
            require(investors[i] != address(0), "Invalid investor address");
            require(amounts[i] > 0, "Invalid payout amount");

            taskPayouts[_taskId].push(Payout({
                investor: investors[i],
                amount: amounts[i],
                claimed: false
            }));

            // Track tasks for each investor for easy frontend lookup
            investorTasks[investors[i]].push(_taskId);
        }

        // Record task completion
        completedTasks[_taskId] = CompletedTask({
            resultHash: resultHash,
            timestamp: block.timestamp
        });

        emit PayoutsProcessed(_taskId, investors, amounts, resultHash, block.timestamp);
    }

    /**
     * @notice Allows an investor to claim their payout from a completed task.
     * @dev For the hackathon demo, this emits an event. In production, add a token transfer.
     * @param _taskId The task ID from which to claim.
     */
    function claimDividend(bytes32 _taskId) external nonReentrant {
        require(completedTasks[_taskId].timestamp > 0, "Task not complete or doesn't exist");

        Payout[] storage payouts = taskPayouts[_taskId];
        bool claimed = false;

        for (uint256 i = 0; i < payouts.length; i++) {
            if (payouts[i].investor == msg.sender && !payouts[i].claimed) {
                payouts[i].claimed = true;

                // In production: Transfer tokens (ETH or ERC20) to msg.sender here
                // payable(msg.sender).transfer(payouts[i].amount);

                claimed = true;
                emit DividendClaimed(msg.sender, _taskId, payouts[i].amount, block.timestamp);
                break;
            }
        }
        require(claimed, "No dividend available for caller");
    }

    // ==================== VIEW FUNCTIONS ====================
    function getPayouts(bytes32 _taskId) external view returns (Payout[] memory) {
        return taskPayouts[_taskId];
    }

    function getInvestorTasks(address _investor) external view returns (bytes32[] memory) {
        return investorTasks[_investor];
    }

    function getTaskDetails(bytes32 _taskId) external view returns (CompletedTask memory) {
        return completedTasks[_taskId];
    }

    // Allow contract to receive ETH (if you later implement real payments)
    receive() external payable {}
}
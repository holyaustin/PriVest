// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PriVest - Confidential RWA Dividend Distributor
 * @notice Receives verified payout lists from iExec TEE computations.
 * @dev iExec Protocol automatically calls receiveResult() when TEE task completes.
 */
contract RWADividendDistributor is Ownable, ReentrancyGuard {
    // ==================== EVENTS ====================
    event PayoutsProcessed(
        bytes32 indexed taskId,
        address[] investors,
        uint256[] amounts,
        bytes32 resultHash,
        uint256 timestamp,
        address launcher
    );
    
    event DividendClaimed(
        address indexed investor,
        bytes32 indexed taskId,
        uint256 amount,
        uint256 timestamp
    );
    
    event ContractFunded(
        address indexed funder,
        uint256 amount,
        uint256 timestamp
    );

    // ==================== STRUCTS ====================
    struct Payout {
        address investor;
        uint256 amount;
        bool claimed;
    }
    
    struct TaskInfo {
        bytes32 resultHash;
        uint256 timestamp;
        address launcher;
        uint256 totalPayout;
        bool exists;
    }

    // ==================== STATE VARIABLES ====================
    mapping(bytes32 => Payout[]) public taskPayouts;          // taskId => payouts
    mapping(bytes32 => TaskInfo) public taskInfo;            // taskId => task info
    mapping(address => bytes32[]) public investorTasks;      // investor => taskIds
    
    uint256 public totalPayoutsProcessed;
    uint256 public totalDividendsClaimed;

    // ==================== CONSTRUCTOR ====================
    constructor() Ownable(msg.sender) {}

    // ==================== CORE FUNCTIONS ====================

    /**
     * @notice CALLBACK FUNCTION - Called by iExec Protocol when TEE computation completes
     * @dev iExec automatically calls this. Result format: abi.encode(address[], uint256[], bytes32)
     * @param _taskId The iExec task ID
     * @param _result ABI-encoded: (address[] investors, uint256[] amounts, bytes32 resultHash)
     */
    function receiveResult(bytes32 _taskId, bytes calldata _result) 
        external 
        nonReentrant 
    {
        require(!taskInfo[_taskId].exists, "Task already processed");
        
        // Decode the result from iExec TEE
        (address[] memory investors, uint256[] memory amounts, bytes32 resultHash) = 
            abi.decode(_result, (address[], uint256[], bytes32));

        _processPayouts(_taskId, investors, amounts, resultHash, msg.sender);
    }

    /**
     * @notice Alternative: Manual result submission (for testing)
     * @dev Frontend can call this directly for demo/testing
     */
    function submitResult(
        bytes32 _taskId,
        address[] calldata _investors,
        uint256[] calldata _amounts,
        bytes32 _resultHash
    ) external nonReentrant {
        require(!taskInfo[_taskId].exists, "Task already processed");
        
        _processPayouts(_taskId, _investors, _amounts, _resultHash, msg.sender);
    }

    /**
     * @notice Internal function to process payouts
     */
    function _processPayouts(
        bytes32 _taskId,
        address[] memory _investors,
        uint256[] memory _amounts,
        bytes32 _resultHash,
        address _launcher
    ) internal {
        require(_investors.length == _amounts.length, "Arrays length mismatch");
        require(_investors.length > 0, "No investors");
        require(_investors.length <= 100, "Too many investors"); // Gas limit protection

        uint256 totalPayout = 0;
        
        // Verify result hash matches the data
        bytes32 calculatedHash = keccak256(
            abi.encodePacked(
                keccak256(abi.encodePacked(_investors)),
                keccak256(abi.encodePacked(_amounts))
            )
        );
        
        require(calculatedHash == _resultHash, "Result hash mismatch");

        // Store payouts
        for (uint256 i = 0; i < _investors.length; i++) {
            require(_investors[i] != address(0), "Invalid investor address");
            require(_amounts[i] > 0, "Invalid payout amount");
            
            totalPayout += _amounts[i];

            taskPayouts[_taskId].push(Payout({
                investor: _investors[i],
                amount: _amounts[i],
                claimed: false
            }));

            investorTasks[_investors[i]].push(_taskId);
        }

        // Store task info
        taskInfo[_taskId] = TaskInfo({
            resultHash: _resultHash,
            timestamp: block.timestamp,
            launcher: _launcher,
            totalPayout: totalPayout,
            exists: true
        });

        totalPayoutsProcessed += totalPayout;

        emit PayoutsProcessed(
            _taskId,
            _investors,
            _amounts,
            _resultHash,
            block.timestamp,
            _launcher
        );
    }

    /**
     * @notice Claim dividend for a specific task
     */
    function claimDividend(bytes32 _taskId) external nonReentrant {
        require(taskInfo[_taskId].exists, "Task not found");
        
        Payout[] storage payouts = taskPayouts[_taskId];
        bool claimed = false;
        uint256 payoutAmount = 0;

        for (uint256 i = 0; i < payouts.length; i++) {
            if (payouts[i].investor == msg.sender && !payouts[i].claimed) {
                payouts[i].claimed = true;
                payoutAmount = payouts[i].amount;
                claimed = true;
                
                // Transfer ETH if contract has balance
                if (address(this).balance >= payoutAmount) {
                    (bool success, ) = payable(msg.sender).call{value: payoutAmount}("");
                    require(success, "ETH transfer failed");
                    totalDividendsClaimed += payoutAmount;
                }
                
                emit DividendClaimed(msg.sender, _taskId, payoutAmount, block.timestamp);
                break;
            }
        }
        
        require(claimed, "No dividend available");
    }

    /**
     * @notice Batch claim dividends from multiple tasks
     */
    function batchClaimDividends(bytes32[] calldata _taskIds) external nonReentrant {
        uint256 totalClaimed = 0;
        bool anyClaimed = false;
        
        for (uint256 j = 0; j < _taskIds.length; j++) {
            bytes32 taskId = _taskIds[j];
            require(taskInfo[taskId].exists, "Task not found");
            
            Payout[] storage payouts = taskPayouts[taskId];
            
            for (uint256 i = 0; i < payouts.length; i++) {
                if (payouts[i].investor == msg.sender && !payouts[i].claimed) {
                    payouts[i].claimed = true;
                    totalClaimed += payouts[i].amount;
                    anyClaimed = true;
                    
                    emit DividendClaimed(msg.sender, taskId, payouts[i].amount, block.timestamp);
                    break; // Only claim one dividend per task
                }
            }
        }
        
        require(anyClaimed, "No dividends available");
        
        // Transfer total amount
        if (address(this).balance >= totalClaimed && totalClaimed > 0) {
            (bool success, ) = payable(msg.sender).call{value: totalClaimed}("");
            require(success, "ETH transfer failed");
            totalDividendsClaimed += totalClaimed;
        }
    }

    /**
     * @notice Fund the contract with ETH
     */
    function fundContract() external payable {
        require(msg.value > 0, "Must send ETH");
        emit ContractFunded(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Withdraw excess ETH (owner only)
     */
    function withdrawExcess(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    // ==================== VIEW FUNCTIONS ====================
    
    function getTaskPayouts(bytes32 _taskId) external view returns (Payout[] memory) {
        return taskPayouts[_taskId];
    }

    function getInvestorTaskIds(address _investor) external view returns (bytes32[] memory) {
        return investorTasks[_investor];
    }

    function getTaskInfo(bytes32 _taskId) external view returns (TaskInfo memory) {
        return taskInfo[_taskId];
    }

    function getAvailableDividend(address _investor, bytes32 _taskId) external view returns (uint256) {
        if (!taskInfo[_taskId].exists) return 0;
        
        Payout[] memory payouts = taskPayouts[_taskId];
        for (uint256 i = 0; i < payouts.length; i++) {
            if (payouts[i].investor == _investor && !payouts[i].claimed) {
                return payouts[i].amount;
            }
        }
        return 0;
    }

    function getTotalAvailableDividends(address _investor) external view returns (uint256) {
        bytes32[] memory taskIds = investorTasks[_investor];
        uint256 total = 0;
        
        for (uint256 j = 0; j < taskIds.length; j++) {
            bytes32 taskId = taskIds[j];
            Payout[] memory payouts = taskPayouts[taskId];
            
            for (uint256 i = 0; i < payouts.length; i++) {
                if (payouts[i].investor == _investor && !payouts[i].claimed) {
                    total += payouts[i].amount;
                    break;
                }
            }
        }
        
        return total;
    }

    function isTaskCompleted(bytes32 _taskId) external view returns (bool) {
        return taskInfo[_taskId].exists;
    }

    function getContractStats() external view returns (
        uint256 totalTasks,
        uint256 totalPayoutsValue,
        uint256 totalClaimsValue,
        uint256 contractBalance
    ) {
        // Note: Getting total tasks would require storing all task IDs
        // For simplicity, we'll return 0 and calculate in frontend
        return (
            0, // totalTasks - would need separate tracking
            totalPayoutsProcessed,
            totalDividendsClaimed,
            address(this).balance
        );
    }

    // ==================== FALLBACK FUNCTIONS ====================
    receive() external payable {
        // Accept ETH transfers
    }
    
    fallback() external payable {
        // Accept ETH transfers via fallback
    }
}
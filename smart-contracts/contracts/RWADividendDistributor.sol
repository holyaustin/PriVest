// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PriVest - Confidential RWA Dividend Distributor
 * @notice Manages confidential dividend calculations via iExec TEEs
 * @dev This contract interacts with iExec Protocol for TEE computations
 */
contract RWADividendDistributor is Ownable, ReentrancyGuard {
    // Events
    event CalculationSubmitted(
        bytes32 indexed taskId,
        address indexed appAddress,
        uint256 timestamp
    );
    
    event PayoutsReady(
        bytes32 indexed taskId,
        address[] investors,
        uint256[] amounts,
        uint256 timestamp
    );
    
    event DividendClaimed(
        address indexed investor,
        bytes32 indexed taskId,
        uint256 amount,
        uint256 timestamp
    );
    
    event TaskCompleted(
        bytes32 indexed taskId,
        bytes32 resultHash,
        uint256 timestamp
    );

    // Structures
    struct Payout {
        address investor;
        uint256 amount;
        bool claimed;
        uint256 claimTime;
    }
    
    struct CalculationTask {
        bytes32 taskId;
        address appAddress;
        address creator;
        uint256 timestamp;
        bool completed;
        bytes32 resultHash;
    }

    // State variables
    address public immutable iExecRouter;
    
    // Mappings
    mapping(bytes32 => Payout[]) public taskPayouts;
    mapping(bytes32 => CalculationTask) public calculationTasks;
    mapping(address => bytes32[]) public investorTasks;
    mapping(bytes32 => bool) public isTaskCompleted;
    
    // Constants for iExec interaction
    bytes4 private constant RUN_APP_SELECTOR = bytes4(keccak256("runApp(address,bytes)"));
    
    /**
     * @notice Constructor sets the iExec Router address
     * @param _iExecRouter Address of iExec Protocol Router
     */
    constructor(address _iExecRouter) Ownable(msg.sender) {
        require(_iExecRouter != address(0), "Invalid router address");
        iExecRouter = _iExecRouter;
    }
    
    /**
     * @notice Submit data for confidential dividend calculation
     * @dev Calls iExec Router to execute the confidential app
     * @param _appAddress Address of the deployed iExec application
     * @param _inputDataEncoded Encoded input parameters for the iApp
     * @return taskId The unique identifier for the computation task
     */
    function calculateDividends(
        address _appAddress,
        bytes calldata _inputDataEncoded
    ) external payable onlyOwner nonReentrant returns (bytes32 taskId) {
        require(_appAddress != address(0), "Invalid app address");
        require(msg.value > 0, "Must send ETH for computation");
        
        // Prepare call data for iExec Router
        bytes memory callData = abi.encodeWithSelector(
            RUN_APP_SELECTOR,
            _appAddress,
            _inputDataEncoded
        );
        
        // Call iExec Router
        (bool success, bytes memory result) = iExecRouter.call{value: msg.value}(callData);
        require(success, "iExec router call failed");
        
        // Decode the taskId from iExec response
        taskId = abi.decode(result, (bytes32));
        
        // Store task information
        calculationTasks[taskId] = CalculationTask({
            taskId: taskId,
            appAddress: _appAddress,
            creator: msg.sender,
            timestamp: block.timestamp,
            completed: false,
            resultHash: bytes32(0)
        });
        
        emit CalculationSubmitted(taskId, _appAddress, block.timestamp);
    }
    
    /**
     * @notice Callback function to receive computation results from iExec
     * @dev This should be called by iExec worker or authorized oracle
     * @param _taskId The task identifier from iExec
     * @param _investors Array of investor addresses
     * @param _amounts Array of payout amounts (wei)
     * @param _resultHash Hash of the complete result for verification
     */
    function setPayouts(
        bytes32 _taskId,
        address[] calldata _investors,
        uint256[] calldata _amounts,
        bytes32 _resultHash
    ) external nonReentrant {
        require(_investors.length == _amounts.length, "Array length mismatch");
        require(_investors.length > 0, "No investors provided");
        require(!isTaskCompleted[_taskId], "Task already completed");
        
        CalculationTask storage task = calculationTasks[_taskId];
        require(task.creator != address(0), "Task does not exist");
        
        // In production: add signature verification from iExec worker
        // For hackathon: simplified version
        
        Payout[] storage payouts = taskPayouts[_taskId];
        uint256 totalAmount = 0;
        
        // Store payouts
        for (uint256 i = 0; i < _investors.length; i++) {
            require(_investors[i] != address(0), "Invalid investor address");
            require(_amounts[i] > 0, "Zero amount");
            
            payouts.push(Payout({
                investor: _investors[i],
                amount: _amounts[i],
                claimed: false,
                claimTime: 0
            }));
            
            investorTasks[_investors[i]].push(_taskId);
            totalAmount += _amounts[i];
        }
        
        // Update task status
        task.completed = true;
        task.resultHash = _resultHash;
        isTaskCompleted[_taskId] = true;
        
        emit PayoutsReady(_taskId, _investors, _amounts, block.timestamp);
        emit TaskCompleted(_taskId, _resultHash, block.timestamp);
    }
    
    /**
     * @notice Allows an investor to claim their dividend
     * @param _taskId The task identifier
     */
    function claimDividend(bytes32 _taskId) external nonReentrant {
        require(isTaskCompleted[_taskId], "Task not completed");
        
        Payout[] storage payouts = taskPayouts[_taskId];
        bool found = false;
        
        for (uint256 i = 0; i < payouts.length; i++) {
            if (payouts[i].investor == msg.sender && !payouts[i].claimed) {
                payouts[i].claimed = true;
                payouts[i].claimTime = block.timestamp;
                
                // Transfer the dividend (simulated for hackathon)
                // In production: payable(msg.sender).transfer(payouts[i].amount);
                
                found = true;
                emit DividendClaimed(msg.sender, _taskId, payouts[i].amount, block.timestamp);
                break;
            }
        }
        
        require(found, "No dividend available");
    }
    
    /**
     * @notice Get payout details for a specific task
     * @param _taskId The task identifier
     * @return payouts Array of payout structures
     */
    function getPayouts(bytes32 _taskId) 
        external 
        view 
        returns (Payout[] memory) 
    {
        return taskPayouts[_taskId];
    }
    
    /**
     * @notice Get all tasks for a specific investor
     * @param _investor Investor address
     * @return Array of task identifiers
     */
    function getInvestorTasks(address _investor) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return investorTasks[_investor];
    }
    
    /**
     * @notice Get task information
     * @param _taskId The task identifier
     * @return Complete task information
     */
    function getTaskInfo(bytes32 _taskId)
        external
        view
        returns (CalculationTask memory)
    {
        return calculationTasks[_taskId];
    }
    
    /**
     * @notice Calculate hash of result data for verification
     * @param _investors Array of investor addresses
     * @param _amounts Array of payout amounts
     * @return keccak256 hash of the encoded data
     */
    function calculateResultHash(
        address[] calldata _investors,
        uint256[] calldata _amounts
    ) external pure returns (bytes32) {
        return keccak256(abi.encode(_investors, _amounts));
    }
    
    /**
     * @notice Withdraw contract balance (emergency only)
     */
    function withdrawBalance() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @notice Receive function to accept ETH
     */
    receive() external payable {}
}
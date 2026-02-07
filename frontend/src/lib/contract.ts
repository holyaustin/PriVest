import { ethers } from 'ethers';

// Contract Configuration
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

// Smart Contract ABI (full version)
export const DISTRIBUTOR_ABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "taskId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "address[]",
        "name": "investors",
        "type": "address[]"
      },
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "resultHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "PayoutsProcessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "investor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "taskId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "DividendClaimed",
    "type": "event"
  },
  // Functions
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_taskId",
        "type": "bytes32"
      }
    ],
    "name": "claimDividend",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_investor",
        "type": "address"
      }
    ],
    "name": "getInvestorTasks",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_taskId",
        "type": "bytes32"
      }
    ],
    "name": "getPayouts",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "investor",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "claimed",
            "type": "bool"
          }
        ],
        "internalType": "struct RWADividendDistributor.Payout[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_taskId",
        "type": "bytes32"
      }
    ],
    "name": "getTaskDetails",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "resultHash",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct RWADividendDistributor.CompletedTask",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_taskId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "_result",
        "type": "bytes"
      }
    ],
    "name": "receiveResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Types
interface PayoutEvent {
  taskId: string;
  investors: string[];
  amounts: bigint[];
  resultHash: string;
  timestamp: number;
  transactionHash: string;
  blockNumber: number;
}

interface ClaimEvent {
  investor: string;
  taskId: string;
  amount: bigint;
  timestamp: number;
  transactionHash: string;
  blockNumber: number;
}

interface InvestorPayout {
  taskId: string;
  amount: bigint;
  claimed: boolean;
  timestamp: number;
  resultHash?: string;
}

interface TaskDetails {
  resultHash: string;
  timestamp: number;
}

interface ContractStats {
  totalTasks: number;
  totalPayouts: number;
  totalClaims: number;
  totalPayoutAmount: bigint;
  totalClaimedAmount: bigint;
  pendingAmount: bigint;
  uniqueInvestors: number;
}

// Get contract instance
export const getContract = (provider: ethers.Provider): ethers.Contract => {
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("Contract address not configured");
  }
  
  return new ethers.Contract(CONTRACT_ADDRESS, DISTRIBUTOR_ABI, provider);
};

// Get contract instance with signer
export const getContractWithSigner = async (provider: ethers.Provider): Promise<ethers.Contract> => {
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("Contract address not configured");
  }
  
  const ethersProvider = provider as ethers.BrowserProvider;
  const signer = await ethersProvider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, DISTRIBUTOR_ABI, signer);
};

// Type guard for EventLog
function isEventLog(log: ethers.Log | ethers.EventLog): log is ethers.EventLog {
  return (log as ethers.EventLog).args !== undefined;
}

// Fetch all PayoutsProcessed events from smart contract
export const fetchAllPayoutEvents = async (provider: ethers.Provider, fromBlock?: number, toBlock?: number): Promise<PayoutEvent[]> => {
  try {
    const contract = getContract(provider);
    
    // If no block range specified, use reasonable defaults
    const currentBlock = await provider.getBlockNumber();
    const defaultFromBlock = fromBlock || Math.max(0, currentBlock - 10000); // Last 10k blocks
    const defaultToBlock = toBlock || currentBlock;
    
    const filter = contract.filters.PayoutsProcessed();
    const events = await contract.queryFilter(filter, defaultFromBlock, defaultToBlock);
    
    return events.map(event => {
      if (!isEventLog(event)) {
        throw new Error('Event log does not contain args');
      }
      
      return {
        taskId: event.args.taskId as string,
        investors: event.args.investors as string[],
        amounts: event.args.amounts as bigint[],
        resultHash: event.args.resultHash as string,
        timestamp: Number(event.args.timestamp) * 1000, // Convert to milliseconds
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
      };
    });
  } catch (error) {
    console.error("Failed to fetch payout events:", error);
    throw error;
  }
};

// Fetch all DividendClaimed events from smart contract
export const fetchAllClaimEvents = async (provider: ethers.Provider, fromBlock?: number, toBlock?: number): Promise<ClaimEvent[]> => {
  try {
    const contract = getContract(provider);
    
    const currentBlock = await provider.getBlockNumber();
    const defaultFromBlock = fromBlock || Math.max(0, currentBlock - 10000);
    const defaultToBlock = toBlock || currentBlock;
    
    const filter = contract.filters.DividendClaimed();
    const events = await contract.queryFilter(filter, defaultFromBlock, defaultToBlock);
    
    return events.map(event => {
      if (!isEventLog(event)) {
        throw new Error('Event log does not contain args');
      }
      
      return {
        investor: event.args.investor as string,
        taskId: event.args.taskId as string,
        amount: event.args.amount as bigint,
        timestamp: Number(event.args.timestamp) * 1000,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
      };
    });
  } catch (error) {
    console.error("Failed to fetch claim events:", error);
    throw error;
  }
};

// Fetch investor's payouts from smart contract
export const fetchInvestorPayouts = async (provider: ethers.Provider, investorAddress: string): Promise<InvestorPayout[]> => {
  try {
    const contract = getContract(provider);
    
    // Get all task IDs for this investor
    const taskIds = await contract.getInvestorTasks(investorAddress) as string[];
    
    const payouts: InvestorPayout[] = [];
    
    // For each task, get payout details
    for (const taskId of taskIds) {
      try {
        const taskPayouts = await contract.getPayouts(taskId) as Array<{ investor: string; amount: bigint; claimed: boolean }>;
        const taskDetails = await contract.getTaskDetails(taskId) as TaskDetails;
        
        // Find this investor's payout
        const investorPayout = taskPayouts.find((p: { investor: string; amount: bigint; claimed: boolean }) => 
          p.investor.toLowerCase() === investorAddress.toLowerCase()
        );
        
        if (investorPayout) {
          payouts.push({
            taskId,
            amount: investorPayout.amount,
            claimed: investorPayout.claimed,
            timestamp: Number(taskDetails.timestamp) * 1000,
            resultHash: taskDetails.resultHash,
          });
        }
      } catch (error) {
        console.error(`Error fetching payout for task ${taskId}:`, error);
      }
    }
    
    return payouts;
  } catch (error) {
    console.error("Failed to fetch investor payouts:", error);
    throw error;
  }
};

// Fetch all completed tasks from contract
export const fetchAllCompletedTasks = async (provider: ethers.Provider): Promise<Array<{
  taskId: string;
  timestamp: number;
  resultHash: string;
  investorCount: number;
  totalAmount: bigint;
  transactionHash: string;
  blockNumber: number;
}>> => {
  try {
    // First get all payout events
    const payoutEvents = await fetchAllPayoutEvents(provider);
    
    const tasks = [];
    
    // For each payout event, get additional details
    for (const event of payoutEvents) {
      try {
        const contract = getContract(provider);
        const taskDetails = await contract.getTaskDetails(event.taskId) as TaskDetails;
        
        const totalAmount = event.amounts.reduce((sum: bigint, amount: bigint) => sum + amount, 0n);
        
        tasks.push({
          taskId: event.taskId,
          timestamp: event.timestamp,
          resultHash: event.resultHash,
          investorCount: event.investors.length,
          totalAmount,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
        });
      } catch (error) {
        console.error(`Error fetching details for task ${event.taskId}:`, error);
      }
    }
    
    return tasks;
  } catch (error) {
    console.error("Failed to fetch completed tasks:", error);
    throw error;
  }
};

// Fetch task details with combined smart contract and iExec data
export const fetchTaskDetailsCombined = async (provider: ethers.Provider, taskId: string, fetchIExecDetails?: (taskId: string) => Promise<any>) => {
  try {
    const contract = getContract(provider);
    
    // Get smart contract data
    const [taskDetails, payouts] = await Promise.all([
      contract.getTaskDetails(taskId) as Promise<TaskDetails>,
      contract.getPayouts(taskId) as Promise<Array<{ investor: string; amount: bigint; claimed: boolean }>>,
    ]);
    
    let iexecData = null;
    
    // Get iExec data if available
    if (fetchIExecDetails) {
      try {
        const iexecDetails = await fetchIExecDetails(taskId);
        iexecData = iexecDetails;
      } catch (error) {
        console.warn(`Could not fetch iExec data for task ${taskId}:`, error);
      }
    }
    
    return {
      contractData: {
        resultHash: taskDetails.resultHash,
        timestamp: Number(taskDetails.timestamp) * 1000,
        payouts,
        payoutCount: payouts.length,
      },
      iexecData,
      combined: {
        taskId,
        status: iexecData?.status || 'UNKNOWN',
        completed: !!taskDetails.timestamp,
        totalPayouts: payouts.length,
        iExecAvailable: !!iexecData,
      }
    };
  } catch (error) {
    console.error("Failed to fetch combined task details:", error);
    throw error;
  }
};

// Calculate statistics from contract events
export const calculateContractStats = async (provider: ethers.Provider): Promise<ContractStats> => {
  try {
    const [payoutEvents, claimEvents] = await Promise.all([
      fetchAllPayoutEvents(provider),
      fetchAllClaimEvents(provider),
    ]);
    
    const totalPayoutAmount = payoutEvents.reduce((sum: bigint, event: PayoutEvent) => {
      const eventSum = event.amounts.reduce((eventSum: bigint, amount: bigint) => eventSum + amount, 0n);
      return sum + eventSum;
    }, 0n);
    
    const totalClaimedAmount = claimEvents.reduce((sum: bigint, event: ClaimEvent) => sum + event.amount, 0n);
    
    // Get unique investors
    const allInvestors = new Set<string>();
    payoutEvents.forEach(event => {
      event.investors.forEach(investor => allInvestors.add(investor.toLowerCase()));
    });
    claimEvents.forEach(event => {
      allInvestors.add(event.investor.toLowerCase());
    });
    
    return {
      totalTasks: payoutEvents.length,
      totalPayouts: payoutEvents.reduce((sum: number, event: PayoutEvent) => sum + event.investors.length, 0),
      totalClaims: claimEvents.length,
      totalPayoutAmount,
      totalClaimedAmount,
      pendingAmount: totalPayoutAmount - totalClaimedAmount,
      uniqueInvestors: allInvestors.size,
    };
  } catch (error) {
    console.error("Failed to calculate contract stats:", error);
    throw error;
  }
};

// Format ETH values
export const formatETH = (wei: bigint): string => {
  return `${ethers.formatEther(wei)} ETH`;
};

// Shorten hash/address for display
export const shortenHash = (hash: string, start: number = 6, end: number = 4): string => {
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

// Get block timestamp
export const getBlockTimestamp = async (provider: ethers.Provider, blockNumber: number): Promise<number> => {
  try {
    const block = await provider.getBlock(blockNumber);
    if (!block) throw new Error('Block not found');
    return block.timestamp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error("Failed to get block timestamp:", error);
    return Date.now();
  }
};

// Convert wei to ETH with formatting
export const weiToEth = (wei: bigint): number => {
  return Number(ethers.formatEther(wei));
};

// Convert ETH to wei
export const ethToWei = (eth: number): bigint => {
  return ethers.parseEther(eth.toString());
};

// Check if address is valid
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Get transaction URL for explorer
export const getTransactionUrl = (txHash: string): string => {
  return `https://sepolia.arbiscan.io/tx/${txHash}`;
};

// Get address URL for explorer
export const getAddressUrl = (address: string): string => {
  return `https://sepolia.arbiscan.io/address/${address}`;
};

// Get contract creation block (approximate)
export const getContractCreationBlock = async (provider: ethers.Provider): Promise<number> => {
  try {
    // Try to get the first transaction to the contract
    const response = await fetch(`https://api-sepolia.arbiscan.io/api?module=account&action=txlist&address=${CONTRACT_ADDRESS}&startblock=0&endblock=99999999&sort=asc&apikey=YourApiKeyToken`);
    const data = await response.json();
    if (data.status === '1' && data.result.length > 0) {
      return parseInt(data.result[0].blockNumber);
    }
    return 0;
  } catch (error) {
    console.error("Failed to get contract creation block:", error);
    return 0;
  }
};
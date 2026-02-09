/* eslint-disable */
import { IExec } from 'iexec';
import { ethers } from 'ethers';

// Configuration - Arbitrum Sepolia
const IAPP_ADDRESS = process.env.NEXT_PUBLIC_IAPP_ADDRESS || "0xE6a92eBC3EF8f9Fcc4d069EBE2E9adcCf0693f15";
const WORKERPOOL = process.env.NEXT_PUBLIC_IEXEC_WORKERPOOL || "prod-v8-arbitrum-sepolia.main.pools.iexec.eth";
const TEE_TAG = process.env.NEXT_PUBLIC_IEXEC_TEE_TAG || "tee-scone";
const IEXEC_EXPLORER_URL = process.env.NEXT_PUBLIC_IEXEC_EXPLORER_URL || "https://explorer.iex.ec/arbitrum-sepolia-testnet";

// Interface for iExec task response
interface IExecTask {
  taskId: string;
  status: string;
  dealId?: string;
  results?: any;
  logs?: string;
}

// Interface for explorer task
interface ExplorerTask {
  taskid: string;
  status: string;
  dealid: string;
  timestamp: number;
  txHash: string;
  app: string;
  workerpool: string;
}

// Initialize iExec SDK for Arbitrum Sepolia
export const initializeIExec = async (ethProvider: any) => {
  try {
    // Initialize iExec with proper configuration
    const iexec = new IExec({ 
      ethProvider,
    });
    
    console.log("✅ iExec SDK initialized");
    return iexec;
  } catch (error) {
    console.error("❌ iExec initialization failed:", error);
    throw error;
  }
};

// Fetch all tasks for a specific app from iExec Explorer
export const fetchAppTasks = async (appAddress: string, limit: number = 50): Promise<ExplorerTask[]> => {
  try {
    const response = await fetch(`${IEXEC_EXPLORER_URL}/task?app=${appAddress}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    const data = await response.json();
    return data.tasks || [];
  } catch (error) {
    console.error("❌ Failed to fetch app tasks:", error);
    return [];
  }
};

// Fetch specific task details from iExec Explorer
export const fetchTaskDetailsFromExplorer = async (taskId: string): Promise<ExplorerTask | null> => {
  try {
    const response = await fetch(`${IEXEC_EXPLORER_URL}/task/${taskId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch task details: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Failed to fetch task details from explorer:", error);
    return null;
  }
};

// Fetch app details from iExec Explorer
export const fetchAppDetails = async (appAddress: string): Promise<any> => {
  try {
    const response = await fetch(`${IEXEC_EXPLORER_URL}/app/${appAddress}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch app details: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("❌ Failed to fetch app details:", error);
    return null;
  }
};

// Create task order for Arbitrum Sepolia TEE - REAL IMPLEMENTATION
export const createTaskOrder = async (iexec: any, inputData: any): Promise<any> => {
  try {
    // Get the current requester (connected wallet)
    const requester = await iexec.wallet.getAddress();
    
    // Prepare task parameters
    const taskParams = {
      iexec_input_files: [],
      iexec_secrets: {},
      iexec_result_storage_provider: "ipfs",
      iexec_result_storage_proxy: "https://result.v8-arbitrum-sepolia.iex.ec",
    };
    
    // Create a requester order (this is the modern iExec SDK approach)
    const requesterOrder = {
      app: IAPP_ADDRESS,
      appmaxprice: 0,
      dataset: "0x0000000000000000000000000000000000000000",
      datasetmaxprice: 0,
      workerpool: WORKERPOOL,
      workerpoolmaxprice: 0,
      requester: requester,
      volume: 1,
      tag: TEE_TAG,
      category: 0,
      trust: 0,
      beneficiary: requester,
      callback: inputData.metadata?.callbackAddress || "0x0000000000000000000000000000000000000000",
      params: JSON.stringify(taskParams),
      salt: ethers.hexlify(ethers.randomBytes(32)),
    };
    
    console.log("Created requester order:", requesterOrder);
    return requesterOrder;
  } catch (error) {
    console.error("❌ Task order creation failed:", error);
    throw error;
  }
};

// Publish task order to orderbook - REAL IMPLEMENTATION
export const publishTaskOrder = async (iexec: any, taskOrder: any): Promise<string> => {
  try {
    // Sign the order
    const signedOrder = await iexec.order.signTaskOrder(taskOrder);
    
    // Publish to orderbook
    const publishedOrder = await iexec.orderbook.publishTaskOrder(signedOrder);
    
    // Get the task ID from the published order
    const taskId = publishedOrder.orderHash || publishedOrder.taskid;
    
    if (!taskId) {
      throw new Error("No task ID returned from orderbook");
    }
    
    console.log("✅ Task published with ID:", taskId);
    return taskId;
  } catch (error) {
    console.error("❌ Task publishing failed:", error);
    throw error;
  }
};

// Monitor task status
export const monitorTask = async (iexec: any, taskId: string): Promise<IExecTask> => {
  try {
    const task = await iexec.task.show(taskId);
    
    return {
      taskId: task.taskid || taskId,
      status: task.status || 'UNKNOWN',
      dealId: task.dealid,
      results: task.results,
      logs: task.logs,
    };
  } catch (error) {
    console.error("❌ Task monitoring failed:", error);
    throw error;
  }
};

// Fetch task logs from iExec
export const fetchTaskLogs = async (iexec: any, taskId: string): Promise<string> => {
  try {
    const logs = await iexec.task.fetchLogs(taskId);
    return logs || "No logs available";
  } catch (error) {
    console.error("❌ Logs fetch failed:", error);
    return "Logs unavailable";
  }
};

// Fetch task results
export const fetchTaskResults = async (iexec: any, taskId: string): Promise<any> => {
  try {
    const results = await iexec.task.fetchResults(taskId);
    return results;
  } catch (error) {
    console.error("❌ Results fetch failed:", error);
    return null;
  }
};

// ✅ FIXED: Get wallet balance
export const getWalletBalance = async (iexec: any, address: string): Promise<string> => {
  try {
    console.log("Getting balance for address:", address);
    
    // METHOD 1: Try account.balance()
    try {
      const accountInfo = await iexec.account.balance(address);
      console.log("Account balance response:", accountInfo);
      
      if (accountInfo && typeof accountInfo === 'object') {
        // Look for balance in various possible property names
        if (accountInfo.balance !== undefined) {
          return accountInfo.balance.toString() + " nRLC";
        }
        if (accountInfo.nRLC !== undefined) {
          return accountInfo.nRLC.toString() + " nRLC";
        }
        if (accountInfo.value !== undefined) {
          return accountInfo.value.toString() + " nRLC";
        }
      }
    } catch (accountError) {
      console.log("account.balance() failed:", accountError);
    }
    
    // METHOD 2: Try direct provider balance (ETH balance)
    try {
      if (iexec.config?.ethProvider) {
        const provider = new ethers.BrowserProvider(iexec.config.ethProvider);
        const balance = await provider.getBalance(address);
        const formatted = ethers.formatEther(balance);
        return formatted + " ETH";
      }
    } catch (providerError) {
      console.log("Provider balance failed:", providerError);
    }
    
    return "Balance unavailable";
    
  } catch (error) {
    console.error("❌ All balance checks failed:", error);
    return "Error fetching balance";
  }
};

// Get iExec account information
export const getAccountInfo = async (iexec: any, address: string): Promise<any> => {
  try {
    const account = await iexec.account.show(address);
    return account;
  } catch (error) {
    console.error("❌ Account info fetch failed:", error);
    return null;
  }
};

// ✅ FIXED: Get network information
export const getNetworkInfo = async (iexec: any): Promise<any> => {
  try {
    // Get chain ID from the provider
    if (iexec.config && iexec.config.ethProvider) {
      const provider = new ethers.BrowserProvider(iexec.config.ethProvider);
      const network = await provider.getNetwork();
      
      return {
        chainId: network.chainId.toString(),
        name: network.name || "Unknown",
        isNative: network.chainId === 421614n // Arbitrum Sepolia
      };
    }
    
    return {
      chainId: "unknown",
      name: "Unknown",
      isNative: false
    };
  } catch (error) {
    console.error("❌ Network info fetch failed:", error);
    return {
      chainId: "error",
      name: "Error fetching network",
      isNative: false
    };
  }
};

// Get wallet address
export const getWalletAddress = async (iexec: any): Promise<string> => {
  try {
    const address = await iexec.wallet.getAddress();
    return address;
  } catch (error) {
    console.error("❌ Failed to get wallet address:", error);
    return "";
  }
};

// Get iExec explorer URL for a task
export const getIExecExplorerTaskUrl = (taskId: string): string => {
  return `${IEXEC_EXPLORER_URL}/task/${taskId}`;
};

// Get iExec explorer URL for an app
export const getIExecExplorerAppUrl = (appAddress: string): string => {
  return `${IEXEC_EXPLORER_URL}/app/${appAddress}`;
};
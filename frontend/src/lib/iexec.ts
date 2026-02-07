/* eslint-disable */
import { IExec } from 'iexec';

// Configuration - Arbitrum Sepolia
const IAPP_ADDRESS = process.env.NEXT_PUBLIC_IAPP_ADDRESS || "0xE6a92eBC3EF8f9Fcc4d069EBE2E9adcCf0693f15";
const WORKERPOOL = process.env.NEXT_PUBLIC_IEXEC_WORKERPOOL || "prod-v8-arbitrum-sepolia.main.pools.iexec.eth";
const TEE_TAG = process.env.NEXT_PUBLIC_IEXEC_TEE_TAG || "tee-scone";
const IEXEC_EXPLORER_URL = process.env.NEXT_PUBLIC_IEXEC_EXPLORER_URL || "https://explorer.iex.ec/arbitrum-sepolia-testnet";

// Network configuration for Arbitrum Sepolia
const ARBITRUM_SEPOLIA_CONFIG = {
  chainId: 421614,
  name: 'arbitrum-sepolia',
  rpcURL: 'https://sepolia-rollup.arbitrum.io/rpc',
  explorerURL: 'https://sepolia.arbiscan.io',
  iexecExplorerURL: 'https://explorer.iex.ec/arbitrum-sepolia-testnet'
};

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
    
    // Get network info to verify connection
    try {
      const network = await iexec.network.getNetwork();
      console.log("✅ iExec SDK initialized on network:", network);
    } catch (error) {
      console.log("⚠️ Could not fetch network info, but iExec initialized");
    }
    
    return iexec;
  } catch (error) {
    console.error("❌ iExec initialization failed:", error);
    throw error;
  }
};

// Fetch all tasks for a specific app from iExec Explorer
export const fetchAppTasks = async (appAddress: string, limit: number = 50): Promise<ExplorerTask[]> => {
  try {
    // Using the iExec Explorer API
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

// Fetch deal details from iExec Explorer
export const fetchDealDetails = async (dealId: string): Promise<any> => {
  try {
    const response = await fetch(`${IEXEC_EXPLORER_URL}/deal/${dealId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch deal details: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("❌ Failed to fetch deal details:", error);
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

// Create task order for Arbitrum Sepolia TEE
export const createTaskOrder = async (iexec: any, inputData: any): Promise<any> => {
  try {
    const taskOrder = await iexec.order.createTaskorder({
      app: IAPP_ADDRESS,
      dataset: "0x0000000000000000000000000000000000000000",
      workerpool: WORKERPOOL,
      category: 0,
      tag: TEE_TAG,
      trust: 0,
      volume: 1,
      params: {
        iexec_input_files: [],
        iexec_secrets: {},
        iexec_result_storage_provider: "ipfs",
        iexec_result_storage_proxy: "https://result.v8-arbitrum-sepolia.iex.ec",
      },
    });

    return taskOrder;
  } catch (error) {
    console.error("❌ Task order creation failed:", error);
    throw error;
  }
};

// Publish task order to orderbook
export const publishTaskOrder = async (iexec: any, taskOrder: any): Promise<string> => {
  try {
    const result = await iexec.orderbook.publishTaskorder(taskOrder);
    console.log("✅ Task published:", result);
    return result.taskid || result.taskId || '';
  } catch (error) {
    console.error("❌ Task publishing failed:", error);
    throw error;
  }
};

// Monitor task status with real iExec API
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

// Claim task results
export const claimTaskResults = async (iexec: any, taskId: string): Promise<any> => {
  try {
    const claim = await iexec.task.claim(taskId);
    return claim;
  } catch (error) {
    console.error("❌ Results claim failed:", error);
    throw error;
  }
};

// Get wallet balance on Arbitrum Sepolia
export const getWalletBalance = async (iexec: any, address: string): Promise<string> => {
  try {
    const balance = await iexec.wallet.getBalance(address);
    return balance?.toString() || "0";
  } catch (error) {
    console.error("❌ Balance check failed:", error);
    return "0";
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

// Get network information
export const getNetworkInfo = async (iexec: any): Promise<any> => {
  try {
    const network = await iexec.network.getNetwork();
    return network;
  } catch (error) {
    console.error("❌ Network info fetch failed:", error);
    return null;
  }
};

// Get workerpool information
export const getWorkerpoolInfo = async (iexec: any, workerpoolAddress: string): Promise<any> => {
  try {
    const workerpool = await iexec.workerpool.show(workerpoolAddress);
    return workerpool;
  } catch (error) {
    console.error("❌ Workerpool info fetch failed:", error);
    return null;
  }
};

// Check if iExec is available on current network
export const checkIExecAvailability = async (iexec: any): Promise<boolean> => {
  try {
    await iexec.network.getNetwork();
    return true;
  } catch (error) {
    console.error("iExec not available on current network:", error);
    return false;
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
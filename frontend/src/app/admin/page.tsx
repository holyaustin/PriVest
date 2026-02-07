/* eslint-disable */

"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { 
  Shield, Calculator, Users, DollarSign, Clock, CheckCircle, 
  AlertCircle, Loader2, ExternalLink, Copy, Check, Database, 
  FileText, Activity, RefreshCw, BarChart, Plus, Trash2
} from "lucide-react";
import { 
  initializeIExec, 
  createTaskOrder, 
  publishTaskOrder, 
  monitorTask,
  fetchTaskLogs,
  fetchTaskResults,
  getWalletBalance,
  fetchAppTasks,
  fetchTaskDetailsFromExplorer,
  fetchAppDetails
} from "@/lib/iexec";
import {
  fetchAllPayoutEvents,
  fetchAllCompletedTasks,
  calculateContractStats,
  fetchTaskDetailsCombined,
  formatETH,
  shortenHash
} from "@/lib/contract";

// Configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;
const IAPP_ADDRESS = process.env.NEXT_PUBLIC_IAPP_ADDRESS as string;

interface Investor {
  address: string;
  stake: string;
  name: string;
  metadata?: {
    performanceScore: number;
    investmentDate: string;
    [key: string]: any;
  };
}

// Updated TaskData interface to match actual data structure
interface TaskData {
  taskId: string;
  status: string;
  dealId?: string;
  timestamp: number;
  resultHash?: string;
  investorCount: number;
  totalAmount: bigint;
  transactionHash: string;
  blockNumber: number;
  iExecStatus?: string;
  iExecDetails?: any;
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

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Get Ethereum provider safely
const getEthereumProvider = () => {
  if (typeof window === 'undefined') return null;
  
  // Check for various wallet providers
  if (window.ethereum) {
    return window.ethereum;
  }
  
  // Check for injected web3
  if ((window as any).web3?.currentProvider) {
    return (window as any).web3.currentProvider;
  }
  
  return null;
};

export default function AdminPortal() {
  const { address, isConnected } = useAccount();
  const [profit, setProfit] = useState<string>("1000000");
  const [investors, setInvestors] = useState<Investor[]>([
    { address: "", stake: "400000", name: "Investor A", metadata: { performanceScore: 85, investmentDate: new Date().toISOString() } },
    { address: "", stake: "350000", name: "Investor B", metadata: { performanceScore: 90, investmentDate: new Date().toISOString() } },
    { address: "", stake: "250000", name: "Investor C", metadata: { performanceScore: 78, investmentDate: new Date().toISOString() } },
  ]);
  
  const [loading, setLoading] = useState({
    tasks: true,
    stats: true,
    iExec: true
  });
  
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [contractStats, setContractStats] = useState<ContractStats | null>(null);
  const [iExecStats, setIExecStats] = useState<any>(null);
  const [iexecInstance, setIexecInstance] = useState<any>(null);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [taskLogs, setTaskLogs] = useState<string>("");
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string>("0");

  // Get ethers JSON-RPC provider for reading data
  const getEthersProvider = useCallback((): ethers.Provider | null => {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
      return new ethers.JsonRpcProvider(rpcUrl, 421614); // Arbitrum Sepolia chain ID
    } catch (error) {
      console.error("Failed to create provider:", error);
      return null;
    }
  }, []);

  // Toast utilities
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Helper function to normalize task data
  const normalizeTaskData = (data: any): TaskData => {
    return {
      taskId: data.taskId || data.id || '',
      status: data.status || 'UNKNOWN',
      dealId: data.dealId || data.dealid || undefined,
      timestamp: data.timestamp || Date.now(),
      resultHash: data.resultHash || data.hash || undefined,
      investorCount: data.investorCount || data.investors?.length || data.payoutCount || 0,
      totalAmount: data.totalAmount || data.amount || data.totalPayout || 0n,
      transactionHash: data.transactionHash || data.txHash || '',
      blockNumber: data.blockNumber || 0,
      iExecStatus: data.iExecStatus || data.iexecStatus,
      iExecDetails: data.iExecDetails || data.iexecDetails
    };
  };

  // Initialize iExec and fetch all data
  useEffect(() => {
    if (isConnected) {
      initializeData();
    }
  }, [isConnected]);

  const initializeData = async () => {
    try {
      setLoading({ tasks: true, stats: true, iExec: true });
      
      // Initialize iExec
      const ethereumProvider = getEthereumProvider();
      if (ethereumProvider) {
        try {
          const iexec = await initializeIExec(ethereumProvider);
          setIexecInstance(iexec);
          
          // Get wallet balance
          if (address) {
            const balance = await getWalletBalance(iexec, address);
            setWalletBalance(balance);
          }
          
          // Fetch iExec stats
          try {
            const appDetails = await fetchAppDetails(IAPP_ADDRESS);
            const appTasks = await fetchAppTasks(IAPP_ADDRESS, 20);
            
            setIExecStats({
              appDetails,
              recentTasks: appTasks,
              totalTasks: appTasks.length,
            });
          } catch (error) {
            console.warn("Failed to fetch iExec stats:", error);
            showToast("Could not fetch iExec stats, using contract data only", "warning");
          }
          
        } catch (error) {
          console.error("iExec initialization failed:", error);
          showToast("iExec initialization failed, using contract data only", "warning");
        }
      } else {
        showToast("No wallet detected, iExec features disabled", "warning");
      }
      
      setLoading(prev => ({ ...prev, iExec: false }));
      
      // Fetch contract data
      await fetchContractData();
      
    } catch (error) {
      console.error("Initialization failed:", error);
      showToast("Failed to initialize data", 'error');
    }
  };

  const fetchContractData = async () => {
    const provider = getEthersProvider();
    if (!provider) {
      showToast("No provider available", 'error');
      setLoading(prev => ({ ...prev, tasks: false, stats: false }));
      return;
    }
    
    try {
      // Fetch all tasks from contract
      const contractTasksData = await fetchAllCompletedTasks(provider);
      
      // Normalize and enhance with iExec data if available
      const enhancedTasks = await Promise.all(
        contractTasksData.map(async (task: any) => {
          const normalizedTask = normalizeTaskData(task);
          
          try {
            // Try to get iExec details
            const iExecDetails = await fetchTaskDetailsFromExplorer(normalizedTask.taskId);
            return {
              ...normalizedTask,
              iExecStatus: iExecDetails?.status || 'UNKNOWN',
              iExecDetails
            };
          } catch {
            return normalizedTask;
          }
        })
      );
      
      setTasks(enhancedTasks);
      setLoading(prev => ({ ...prev, tasks: false }));
      
      // Fetch contract stats
      const stats = await calculateContractStats(provider);
      setContractStats(stats);
      setLoading(prev => ({ ...prev, stats: false }));
      
    } catch (error) {
      console.error("Failed to fetch contract data:", error);
      showToast("Failed to fetch contract data", 'error');
      setLoading(prev => ({ ...prev, tasks: false, stats: false }));
    }
  };

  const loadTaskDetails = async (taskId: string) => {
    const provider = getEthersProvider();
    if (!provider) {
      showToast("No provider available", 'error');
      return;
    }
    
    setActiveTask(taskId);
    try {
      const details = await fetchTaskDetailsCombined(
        provider, 
        taskId, 
        fetchTaskDetailsFromExplorer
      );
      setTaskDetails(details);
      
      // Load logs if iExec instance available
      if (iexecInstance) {
        try {
          const logs = await fetchTaskLogs(iexecInstance, taskId);
          setTaskLogs(logs);
        } catch (error) {
          console.warn("Could not load task logs:", error);
          setTaskLogs("Logs unavailable");
        }
      }
      
    } catch (error) {
      console.error("Failed to load task details:", error);
      showToast("Failed to load task details", 'error');
    }
  };

  const prepareIAppInput = useCallback((): any => {
    return {
      totalProfit: parseInt(profit) || 0,
      investors: investors.map((inv, idx) => ({
        address: inv.address || `0xInvestorPlaceholder${idx + 1}`,
        stake: parseInt(inv.stake) || 0,
        name: inv.name,
        metadata: inv.metadata || { 
          performanceScore: 85 + idx * 5,
          investmentDate: new Date().toISOString()
        }
      })),
      config: {
        enablePerformanceBonus: true,
        currency: "USD",
        timestamp: new Date().toISOString(),
        calculationId: `calc_${Date.now()}`
      }
    };
  }, [profit, investors]);

  const launchConfidentialCalculation = async () => {
    const ethereumProvider = getEthereumProvider();
    if (!ethereumProvider || !address) {
      showToast("Please connect wallet to launch calculations", 'warning');
      return;
    }

    if (!iexecInstance) {
      showToast("iExec not initialized. Please refresh the page.", 'error');
      return;
    }

    setIsLaunching(true);
    showToast("Launching confidential calculation...", 'info');

    try {
      // Prepare input data
      const inputData = prepareIAppInput();
      
      // Create and publish task
      const taskOrder = await createTaskOrder(iexecInstance, inputData);
      const taskId = await publishTaskOrder(iexecInstance, taskOrder);
      
      showToast(`Task launched successfully! Task ID: ${shortenHash(taskId, 8, 8)}`, 'success');
      
      // Monitor task (in background)
      monitorTaskProgress(taskId);
      
      // Refresh data after a delay
      setTimeout(() => {
        fetchContractData();
      }, 5000);
      
    } catch (error: any) {
      console.error("Calculation failed:", error);
      showToast(`Error: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsLaunching(false);
    }
  };

  const monitorTaskProgress = async (taskId: string) => {
    if (!iexecInstance) return;
    
    try {
      // Initial check
      const taskInfo = await monitorTask(iexecInstance, taskId);
      showToast(`Task ${shortenHash(taskId, 8, 8)} status: ${taskInfo.status}`, 'info');
      
      // If completed, fetch results
      if (taskInfo.status === 'COMPLETED') {
        try {
          const results = await fetchTaskResults(iexecInstance, taskId);
          console.log("Task results:", results);
          showToast("Task completed successfully!", 'success');
        } catch (error) {
          console.warn("Could not fetch task results:", error);
        }
      }
      
    } catch (error) {
      console.error("Task monitoring failed:", error);
    }
  };

  const addInvestor = () => {
    setInvestors([...investors, { 
      address: "", 
      stake: "100000", 
      name: `Investor ${investors.length + 1}`,
      metadata: {
        performanceScore: Math.floor(Math.random() * 30) + 70,
        investmentDate: new Date().toISOString()
      }
    }]);
  };

  const removeInvestor = (index: number) => {
    if (investors.length > 1) {
      const newInvestors = [...investors];
      newInvestors.splice(index, 1);
      setInvestors(newInvestors);
    }
  };

  const refreshData = async () => {
    showToast("Refreshing data...", 'info');
    await initializeData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "success");
  };

  // Get explorer URLs
  const getArbiscanUrl = (hash: string) => {
    return `https://sepolia.arbiscan.io/tx/${hash}`;
  };

  const getIExecExplorerUrl = (taskId: string) => {
    return `https://explorer.iex.ec/arbitrum-sepolia-testnet/task/${taskId}`;
  };

  const getContractAddressUrl = () => {
    return `https://sepolia.arbiscan.io/address/${CONTRACT_ADDRESS}`;
  };

  const getIAppAddressUrl = () => {
    return `https://explorer.iex.ec/arbitrum-sepolia-testnet/app/${IAPP_ADDRESS}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen  flex items-center justify-center bg-gradient-to-br from-gray-50 to-white px-4">
        <div className="text-center p-6 max-w-md w-full">
          <Shield className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Admin Access Required</h2>
          <p className="text-gray-600 mb-8 text-sm md:text-base">
            Connect your wallet to access confidential RWA management features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Container */}
      <div className="fixed bg-blue-500 top-4 right-4 z-50 w-full max-w-sm space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg border ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              toast.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />}
              {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />}
              <div className="flex-1">
                <p className="font-medium text-sm">{toast.message}</p>
              </div>
              <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="min-h-screen bg-gradient-to-br from-sky-100 to-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Portal</h1>
                <p className="text-gray-600 text-sm sm:text-base mt-1">
                  Confidential RWA Management - Arbitrum Sepolia
                </p>
                {address && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500">Connected as:</span>
                    <button
                      onClick={() => copyToClipboard(address)}
                      className="font-mono text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      title="Copy address"
                    >
                      {shortenHash(address, 6, 4)}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <div className="text-xs text-gray-500">iExec Status</div>
                  <div className={`text-sm font-medium ${
                    iexecInstance ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {iexecInstance ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
                <button
                  onClick={refreshData}
                  disabled={loading.tasks || loading.stats || loading.iExec}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading.tasks ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contract Statistics</h2>
            {loading.stats || !contractStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-gray-100 animate-pulse h-24 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="text-2xl font-bold text-blue-900">{contractStats.totalTasks}</div>
                  <div className="text-sm text-blue-700">Total Tasks</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="text-2xl font-bold text-green-900">{contractStats.totalPayouts}</div>
                  <div className="text-sm text-green-700">Total Payouts</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <div className="text-2xl font-bold text-purple-900">{formatETH(contractStats.totalPayoutAmount)}</div>
                  <div className="text-sm text-purple-700">Total Distributed</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <div className="text-2xl font-bold text-orange-900">{contractStats.uniqueInvestors}</div>
                  <div className="text-sm text-orange-700">Unique Investors</div>
                </div>
              </div>
            )}
          </div>

          {/* Tasks and Launch Form in Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Launch Form */}
            <div className="lg:col-span-2">
              {/* Launch Calculation Form */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Launch New Calculation</h2>
                    <p className="text-gray-600 text-sm">Run confidential profit distribution in iExec TEE</p>
                  </div>
                </div>

                {/* Total Profit */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Profit (USD)
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</div>
                    <input
                      type="number"
                      value={profit}
                      onChange={(e) => setProfit(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 1000000"
                    />
                  </div>
                </div>

                {/* Investors */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">Investors</label>
                    <button
                      onClick={addInvestor}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Investor
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {investors.map((investor, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">{index + 1}</span>
                            </div>
                            <span className="font-medium text-gray-900">Investor {index + 1}</span>
                          </div>
                          {investors.length > 1 && (
                            <button
                              onClick={() => removeInvestor(index)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Address</label>
                            <input
                              type="text"
                              value={investor.address}
                              onChange={(e) => {
                                const newInvestors = [...investors];
                                newInvestors[index].address = e.target.value;
                                setInvestors(newInvestors);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                              placeholder="0x..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Stake (USD)</label>
                            <input
                              type="number"
                              value={investor.stake}
                              onChange={(e) => {
                                const newInvestors = [...investors];
                                newInvestors[index].stake = e.target.value;
                                setInvestors(newInvestors);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              placeholder="e.g., 400000"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <label className="block text-xs text-gray-500 mb-1">Name (Optional)</label>
                          <input
                            type="text"
                            value={investor.name}
                            onChange={(e) => {
                              const newInvestors = [...investors];
                              newInvestors[index].name = e.target.value;
                              setInvestors(newInvestors);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="Investor name"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  onClick={launchConfidentialCalculation}
                  disabled={!iexecInstance || !address || isLaunching}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isLaunching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Launch Confidential Calculation
                    </>
                  )}
                </button>
              </div>

              {/* Recent Tasks */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Tasks</h2>
                  <span className="text-sm text-gray-600">
                    {loading.tasks ? "Loading..." : `${tasks.length} tasks`}
                  </span>
                </div>
                
                {loading.tasks ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg"></div>
                    ))}
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                    <p className="text-gray-600">Launch your first confidential calculation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.slice(0, 5).map((task, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-mono text-sm text-gray-900">
                              {shortenHash(task.taskId, 8, 8)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(task.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              task.iExecStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              task.iExecStatus === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.iExecStatus || 'CONTRACT'}
                            </span>
                            <button
                              onClick={() => loadTaskDetails(task.taskId)}
                              className="p-1 text-gray-500 hover:text-blue-600"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <span className="text-gray-600">Investors: </span>
                            <span className="font-semibold">{task.investorCount}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Amount: </span>
                            <span className="font-semibold">{formatETH(task.totalAmount)}</span>
                          </div>
                          <a
                            href={getArbiscanUrl(task.transactionHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Info & Status */}
            <div>
              {/* iExec Status */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  iExec Status
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Connection</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      iexecInstance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {iexecInstance ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  
                  {iexecInstance && address && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Wallet Balance</span>
                        <span className="font-mono text-sm">{walletBalance} nRLC</span>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-700 mb-2">iApp Details</div>
                        <div className="flex items-start gap-2">
                          <div className="font-mono text-xs bg-gray-50 p-2 rounded flex-1 break-all">
                            {IAPP_ADDRESS}
                          </div>
                          <button
                            onClick={() => copyToClipboard(IAPP_ADDRESS)}
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="Copy address"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <a
                          href={getIAppAddressUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-2"
                        >
                          View on iExec Explorer
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Contract Info */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Contract Address</div>
                    <div className="flex items-start gap-2">
                      <div className="font-mono text-sm bg-gray-50 p-2 rounded flex-1 break-all">
                        {CONTRACT_ADDRESS}
                      </div>
                      <button
                        onClick={() => copyToClipboard(CONTRACT_ADDRESS)}
                        className="p-1 text-gray-500 hover:text-blue-600"
                        title="Copy address"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <a
                      href={getContractAddressUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-1"
                    >
                      View on Arbiscan
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Network</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Arbitrum Sepolia</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Details Modal */}
        {activeTask && taskDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Task Details</h3>
                  <button 
                    onClick={() => setActiveTask(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Task ID</label>
                        <div className="font-mono text-sm bg-gray-50 p-2 rounded mt-1">
                          {activeTask}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Status</label>
                        <div className={`text-lg font-semibold mt-1 ${
                          taskDetails.combined?.iExecAvailable ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {taskDetails.combined?.iExecAvailable ? taskDetails.combined.status : 'CONTRACT ONLY'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contract Data */}
                  {taskDetails.contractData && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Smart Contract Data</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="text-sm text-gray-600">Timestamp</label>
                            <div className="font-medium">
                              {new Date(taskDetails.contractData.timestamp || Date.now()).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">Payouts</label>
                            <div className="font-medium">{taskDetails.contractData.payoutCount || 0}</div>
                          </div>
                        </div>
                        {taskDetails.contractData.resultHash && (
                          <div>
                            <label className="text-sm text-gray-600">Result Hash</label>
                            <div className="font-mono text-xs break-all mt-1">
                              {taskDetails.contractData.resultHash}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* iExec Data */}
                  {taskDetails.iexecData && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">iExec Data</h4>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <pre className="text-sm overflow-auto max-h-60">
                          {JSON.stringify(taskDetails.iexecData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Logs */}
                  {taskLogs && taskLogs !== "Logs unavailable" && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Execution Logs</h4>
                      <div className="bg-gray-900 text-gray-100 rounded-lg p-4">
                        <pre className="text-xs overflow-auto max-h-60">
                          {taskLogs}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    {taskDetails.contractData?.resultHash && (
                      <a
                        href={getArbiscanUrl(taskDetails.contractData.resultHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Transaction
                      </a>
                    )}
                    <a
                      href={getIExecExplorerUrl(activeTask)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Activity className="w-4 h-4" />
                      iExec Explorer
                    </a>
                    <button
                      onClick={() => setActiveTask(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
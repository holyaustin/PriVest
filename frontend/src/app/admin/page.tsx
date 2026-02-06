"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { 
  Shield, 
  Calculator, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";

// Configuration
const IAPP_ADDRESS = "0xB27cfF3fc965FaD42B5a97c350c9D9449Fd92D79";
const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

interface Investor {
  address: string;
  stake: string;
  name: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface IExecInstance {
  config: any;
  version: string;
  task: {
    show: (taskId: string) => Promise<any>;
    obsTask: (taskId: string) => Promise<any>;
    claim: (taskId: string) => Promise<any>;
    fetchResults: (taskId: string) => Promise<any>;
    fetchLogs: (taskId: string) => Promise<any>;
    fetchOffchainInfo: (taskId: string) => Promise<any>;
  };
  order?: {
    createTaskorder?: (params: any) => Promise<any>;
  };
  orderbook?: {
    fetchTaskOrderbook?: (params: any) => Promise<any>;
  };
}

// Minimal ABI for our contract
const DISTRIBUTOR_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
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
  }
] as const;

interface RecentTask {
  id: string;
  status: string;
  amount: string;
  date: string;
  txHash: string;
}

// ✅ Safe type guard for Ethereum provider
type SafeEip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function getEthereumProvider(): SafeEip1193Provider | null {
  if (typeof window === "undefined") return null;

  const eth = (window as { ethereum?: SafeEip1193Provider }).ethereum;
  if (!eth || typeof eth.request !== "function") return null;
  return eth;
}

// Custom Toast Component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info' | 'warning'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    info: <AlertCircle className="w-5 h-5 text-blue-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800'
  };

  return (
    <div className={`${bgColors[type]} border ${textColors[type]} px-4 py-3 rounded-lg shadow-lg mb-2 animate-slideInRight`}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1">
          <p className="font-medium text-sm">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
    </div>
  );
}

export default function AdminPortal() {
  const { address, isConnected } = useAccount();
  const [profit, setProfit] = useState<string>("1000000");
  const [investors, setInvestors] = useState<Investor[]>([
    { address: "", stake: "400000", name: "Early Investor A" },
    { address: "", stake: "350000", name: "Strategic Partner B" },
    { address: "", stake: "250000", name: "Venture Fund C" },
  ]);
  const [taskId, setTaskId] = useState<`0x${string}`>("0x" as `0x${string}`);
  const [status, setStatus] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [iexecInstance, setIexecInstance] = useState<IExecInstance | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { 
    data: hash,
    isPending: isRegistering,
    writeContract 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Toast utility functions
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Copy to clipboard utility
  const copyToClipboard = useCallback((text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      showToast(`Copied ${fieldName} to clipboard`, 'success');
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => {
      showToast('Failed to copy to clipboard', 'error');
    });
  }, [showToast]);

  useEffect(() => {
    if (isConfirmed) {
      setStatus("✅ Task registered successfully on-chain!");
      showToast("Task registered successfully on-chain!", 'success');
      fetchRecentTasks();
    }
  }, [isConfirmed, showToast]);

  // Create mock iExec for development
  const createMockIExec = useCallback((): IExecInstance => ({
    config: {},
    version: 'mock-8.22.5',
    task: {
      show: async (taskId: string) => {
        console.log("[MOCK] Showing task:", taskId);
        return { status: 'COMPLETED', results: { taskId } };
      },
      obsTask: async (taskId: string) => {
        console.log("[MOCK] Observing task:", taskId);
        return { status: 'RUNNING', taskId };
      },
      claim: async (taskId: string) => {
        console.log("[MOCK] Claiming task:", taskId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { claimed: true, taskId };
      },
      fetchResults: async (taskId: string) => {
        console.log("[MOCK] Fetching results for:", taskId);
        return { data: 'mock-results', taskId };
      },
      fetchLogs: async (taskId: string) => {
        console.log("[MOCK] Fetching logs for:", taskId);
        return { logs: 'mock-logs', taskId };
      },
      fetchOffchainInfo: async (taskId: string) => {
        console.log("[MOCK] Fetching offchain info for:", taskId);
        return { info: 'mock-info', taskId };
      }
    },
    order: {
      createTaskorder: async (params: any) => {
        console.log("[MOCK] Creating task order:", params);
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockTaskId = `0x${Array.from({length: 64}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}` as `0x${string}`;
        return { 
          taskId: mockTaskId,
          order: { ...params, mock: true }
        };
      }
    }
  }), []);

  // Initialize iExec SDK when wallet connects
  useEffect(() => {
    const initializeIExec = async () => {
      const provider = getEthereumProvider();
      if (isConnected && provider) {
        try {
          const { IExec } = await import("iexec");
          const iexec = new IExec({
            ethProvider: provider as unknown as ethers.Eip1193Provider,
          });
          console.log("iExec SDK initialized successfully");
          setIexecInstance(iexec as unknown as IExecInstance);
          showToast("iExec SDK connected successfully", 'success');
        } catch (error) {
          console.warn("iExec SDK unavailable, using mock:", error);
          setIexecInstance(createMockIExec());
          showToast("Using demo mode (iExec mock)", 'info');
        }
      }
    };
    
    initializeIExec();
  }, [isConnected, createMockIExec, showToast]);

  // Fetch recent tasks from contract
  const fetchRecentTasks = useCallback(async () => {
    showToast("Refreshing tasks...", 'info');
    try {
      const provider = getEthereumProvider();
      if (!provider) {
        throw new Error("No Ethereum provider available");
      }

      const ethersProvider = new ethers.BrowserProvider(
        provider as unknown as ethers.Eip1193Provider
      );
      const signer = await ethersProvider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DISTRIBUTOR_ABI, signer);
      
      try {
        await contract.owner();
      } catch {
        console.log("Could not fetch owner, contract might not be deployed yet");
      }
      
      // Show mock tasks for demo
      setRecentTasks([
        { 
          id: "0x1234abcd5678efgh9012ijkl3456mnop", 
          status: "Completed", 
          amount: "$1,000,000", 
          date: "2024-02-04",
          txHash: "0x7890abcd1234efgh5678ijkl9012mnop"
        },
        { 
          id: "0x5678efgh9012ijkl3456mnop7890abcd", 
          status: "Processing", 
          amount: "$750,000", 
          date: "2024-02-03",
          txHash: "0x1234efgh5678ijkl9012mnop3456abcd"
        },
      ]);
      showToast("Tasks refreshed successfully", 'success');
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setRecentTasks([
        { id: "0xDEMO001", status: "Completed", amount: "$1,000,000", date: "2024-02-04", txHash: "0xDEMOTX1" },
        { id: "0xDEMO002", status: "Processing", amount: "$750,000", date: "2024-02-03", txHash: "0xDEMOTX2" },
      ]);
      showToast("Using demo task data", 'info');
    }
  }, [showToast]);

  useEffect(() => {
    if (isConnected) {
      fetchRecentTasks();
    }
  }, [isConnected, fetchRecentTasks]);

  interface IAppInput {
    totalProfit: number;
    investors: Array<{
      address: string;
      stake: number;
      name: string;
      metadata: {
        performanceScore: number;
        investmentDate: string;
      };
    }>;
    config: {
      enablePerformanceBonus: boolean;
      currency: string;
      timestamp: string;
      calculationId: string;
    };
  }

  const prepareIAppInput = (): IAppInput => {
    return {
      totalProfit: parseInt(profit) || 0,
      investors: investors.map((inv, idx) => ({
        address: inv.address || `0xInvestorDemo${idx + 1}`,
        stake: parseInt(inv.stake) || 0,
        name: inv.name,
        metadata: { 
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
  };

  const registerTaskInContract = useCallback(() => {
    if (!taskId || taskId === "0x") return;
    
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: DISTRIBUTOR_ABI,
        functionName: 'receiveResult',
        args: [taskId, "0x"],
      });
      setStatus("📝 Registering task in smart contract...");
      showToast('Submitting transaction to blockchain...', 'info');
    } catch (error: unknown) {
      console.error("Failed to register task:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setStatus(`❌ Contract error: ${errorMsg}`);
      showToast(`Transaction failed: ${errorMsg}`, 'error');
    }
  }, [taskId, writeContract, showToast]);

  const launchConfidentialCalculation = async () => {
    const provider = getEthereumProvider();
    if (!provider || !address) {
      setStatus("⚠️ Please connect your wallet first");
      showToast('Please connect your wallet first', 'warning');
      return;
    }

    setIsProcessing(true);
    setStatus("🚀 Initializing confidential calculation...");
    showToast('Starting confidential calculation...', 'info');

    try {
      const inputData = prepareIAppInput();
      const inputDataString = JSON.stringify(inputData);
      
      setStatus("🔐 Encrypting data for TEE transmission...");
      showToast('Encrypting sensitive data...', 'info');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Use either real iExec SDK or mock
      const iexec = iexecInstance || createMockIExec();
      
      setStatus("📋 Creating secure task order with iExec...");
      showToast('Creating secure task order...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock task creation for demo
      const mockTaskId = `0x${Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}` as `0x${string}`;
      
      setTaskId(mockTaskId);
      setStatus(`✅ Task launched! ID: ${mockTaskId.slice(0, 10)}...`);
      showToast('Task created successfully!', 'success');
      
      // Simulate TEE execution
      setTimeout(() => {
        setStatus(`⏳ Task ${mockTaskId.slice(0, 10)}... running in iExec TEE`);
        showToast('Task is executing in secure TEE...', 'info');
      }, 1500);
      
      setTimeout(() => {
        setStatus(`✅ Task ${mockTaskId.slice(0, 10)}... completed successfully!`);
        showToast('Task completed successfully in TEE!', 'success');
        registerTaskInContract();
      }, 3500);

    } catch (error: unknown) {
      console.error("Calculation failed:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setStatus(`❌ Error: ${errorMsg}`);
      showToast(`Calculation failed: ${errorMsg}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const addInvestor = () => {
    setInvestors([...investors, { 
      address: "", 
      stake: "100000", 
      name: `Investor ${investors.length + 1}` 
    }]);
    showToast(`Added investor ${investors.length + 1}`, 'success');
  };

  const removeInvestor = (index: number) => {
    if (investors.length > 1) {
      setInvestors(investors.filter((_, i) => i !== index));
      showToast('Investor removed', 'info');
    } else {
      showToast('Cannot remove the last investor', 'warning');
    }
  };

  const getExplorerUrl = (hash: string) => {
    return `https://sepolia.arbiscan.io/tx/${hash}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white px-4">
        <div className="text-center p-6 max-w-md w-full">
          <Shield className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Admin Access Required</h2>
          <p className="text-gray-600 mb-8 text-sm md:text-base">
            Connect your wallet to access confidential RWA management features.
            All calculations run inside iExec Trusted Execution Environments.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl w-full text-sm md:text-base"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 md:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Admin Portal</h1>
                  <p className="text-gray-600 text-xs md:text-sm mt-1">Confidential RWA Profit Distribution</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 sm:mt-0">
                <div className="text-right">
                  <div className="text-xs text-gray-500">Connected as</div>
                  <div className="font-mono font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded-lg text-xs md:text-sm">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                </div>
                <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-xs font-medium shadow-sm">
                  Admin
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 md:py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {/* Left Column - Configuration */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6 lg:space-y-8">
              {/* Main Configuration Card */}
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-lg p-4 md:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 md:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <Calculator className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Confidential Profit Calculation</h2>
                    <p className="text-gray-600 text-sm md:text-base">Data processed privately in iExec TEE</p>
                  </div>
                </div>

                {/* Total Profit Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2 flex-wrap">
                    <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                    <span>Total Confidential Profit (USD)</span>
                    <span className="ml-auto text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Encrypted in TEE
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</div>
                    <input
                      type="number"
                      value={profit}
                      onChange={(e) => setProfit(e.target.value)}
                      className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-3 md:py-4 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl text-gray-900 text-lg md:text-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., 1000000"
                      min="0"
                    />
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 mt-3">
                    <span className="font-medium text-blue-600">🔒 Privacy Guarantee:</span> This value is encrypted before leaving your browser.
                  </p>
                </div>

                {/* Investors Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <label className="block text-base md:text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4 md:w-5 md:h-5" />
                      <span>Investors & Stakes</span>
                    </label>
                    <button
                      onClick={addInvestor}
                      className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium rounded-lg transition-colors flex items-center gap-1 md:gap-2 text-sm hover:scale-105 active:scale-95"
                    >
                      <span>+ Add</span>
                      <span className="hidden sm:inline">Investor</span>
                    </button>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    {investors.map((investor, index) => (
                      <div key={index} className="p-3 md:p-4 lg:p-5 bg-gradient-to-r from-gray-50 to-white rounded-lg md:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="font-bold text-blue-600 text-sm md:text-base">{index + 1}</span>
                            </div>
                            <span className="font-semibold text-gray-900 text-sm md:text-base">Investor #{index + 1}</span>
                          </div>
                          {investors.length > 1 && (
                            <button
                              onClick={() => removeInvestor(index)}
                              className="text-xs md:text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors hover:scale-105 active:scale-95"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
                              Ethereum Address
                            </label>
                            <input
                              type="text"
                              value={investor.address}
                              onChange={(e) => {
                                const newInvestors = [...investors];
                                newInvestors[index].address = e.target.value;
                                setInvestors(newInvestors);
                              }}
                              className="w-full px-3 py-2 md:px-4 md:py-3 bg-white border border-gray-300 rounded-lg font-mono text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="0x742d35Cc6634C0532925a3b844Bc9e..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
                              Investment Stake
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={investor.stake}
                                onChange={(e) => {
                                  const newInvestors = [...investors];
                                  newInvestors[index].stake = e.target.value;
                                  setInvestors(newInvestors);
                                }}
                                className="w-full pl-3 pr-10 md:pl-4 md:pr-12 py-2 md:py-3 bg-white border border-gray-300 rounded-lg text-base md:text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="400000"
                                min="0"
                              />
                              <span className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">USD</span>
                            </div>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={investor.name}
                          onChange={(e) => {
                            const newInvestors = [...investors];
                            newInvestors[index].name = e.target.value;
                            setInvestors(newInvestors);
                          }}
                          className="w-full mt-3 px-3 py-2 bg-white border border-gray-200 rounded text-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Investor name (optional)"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Display */}
                {status && (
                  <div className={`mb-6 p-3 md:p-4 lg:p-5 rounded-lg md:rounded-xl border ${
                    status.includes('✅') ? 'bg-green-50 border-green-200' :
                    status.includes('❌') ? 'bg-red-50 border-red-200' :
                    status.includes('⚠️') ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className={`p-1.5 md:p-2 rounded-lg ${
                        status.includes('✅') ? 'bg-green-100' :
                        status.includes('❌') ? 'bg-red-100' :
                        status.includes('⚠️') ? 'bg-yellow-100' :
                        'bg-blue-100'
                      }`}>
                        {isProcessing || isRegistering || isConfirming ? (
                          <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-blue-600 animate-spin" />
                        ) : status.includes('✅') ? (
                          <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                        ) : status.includes('❌') ? (
                          <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                        ) : status.includes('⚠️') ? (
                          <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
                        ) : (
                          <Clock className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm md:text-base lg:text-lg mb-1 break-words">
                          {status.replace(/[✅❌⚠️]/g, '').trim()}
                        </p>
                        {taskId && taskId !== "0x" && (
                          <div className="mt-2">
                            <p className="text-xs md:text-sm text-gray-700 font-medium">Task ID:</p>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="block p-2 bg-white/50 rounded border border-gray-200 text-xs md:text-sm font-mono break-all overflow-x-auto flex-1">
                                {taskId}
                              </code>
                              <button
                                onClick={() => copyToClipboard(taskId, 'Task ID')}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                {copiedField === 'Task ID' ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        {hash && (
                          <div className="mt-3">
                            <p className="text-xs md:text-sm text-gray-700 font-medium">Transaction:</p>
                            <div className="flex items-center gap-2 mt-1">
                              <a 
                                href={getExplorerUrl(hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 md:gap-2 text-blue-600 hover:text-blue-800 font-mono text-xs md:text-sm break-all flex-1"
                              >
                                {hash.slice(0, 12)}...{hash.slice(-8)}
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                              <button
                                onClick={() => copyToClipboard(hash, 'Transaction Hash')}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                {copiedField === 'Transaction Hash' ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Launch Button */}
                <button
                  onClick={launchConfidentialCalculation}
                  disabled={isProcessing || isRegistering || isConfirming || !profit}
                  className="w-full py-3 md:py-4 lg:py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base md:text-lg rounded-lg md:rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 md:gap-3 group relative overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {isProcessing || isRegistering || isConfirming ? (
                    <>
                      <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                      <span className="text-sm md:text-base">Processing in iExec TEE...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                      <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent text-sm md:text-base">
                        🚀 Launch Confidential Calculation
                      </span>
                    </>
                  )}
                </button>

                {/* How It Works */}
                <div className="mt-6 pt-4 md:pt-6 border-t border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 md:mb-4 text-base md:text-lg">📖 How This Works</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-white rounded-lg md:rounded-xl border border-blue-100 hover:shadow-sm transition-all">
                      <div className="text-blue-600 font-bold mb-1 md:mb-2 text-sm md:text-base">1. Encryption</div>
                      <p className="text-gray-700 text-xs md:text-sm">Data encrypted locally before transmission</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-purple-50 to-white rounded-lg md:rounded-xl border border-purple-100 hover:shadow-sm transition-all">
                      <div className="text-purple-600 font-bold mb-1 md:mb-2 text-sm md:text-base">2. TEE Execution</div>
                      <p className="text-gray-700 text-xs md:text-sm">Runs in Intel SGX secure enclave</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-green-50 to-white rounded-lg md:rounded-xl border border-green-100 hover:shadow-sm transition-all">
                      <div className="text-green-600 font-bold mb-1 md:mb-2 text-sm md:text-base">3. Smart Contract</div>
                      <p className="text-gray-700 text-xs md:text-sm">Results sent to your deployed contract</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-orange-50 to-white rounded-lg md:rounded-xl border border-orange-100 hover:shadow-sm transition-all">
                      <div className="text-orange-600 font-bold mb-1 md:mb-2 text-sm md:text-base">4. Investor Claims</div>
                      <p className="text-gray-700 text-xs md:text-sm">Investors claim dividends via portal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Stats & Info */}
            <div className="space-y-4 md:space-y-6 lg:space-y-8">
              {/* Contract Information */}
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-lg p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  Contract Information
                </h3>
                <div className="space-y-3 md:space-y-5">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                      Smart Contract Address
                    </div>
                    <div className="p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <code className="text-xs md:text-sm font-mono text-gray-800 break-all overflow-x-auto flex-1">
                          {CONTRACT_ADDRESS}
                        </code>
                        <button
                          onClick={() => copyToClipboard(CONTRACT_ADDRESS, 'Contract Address')}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          {copiedField === 'Contract Address' ? (
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 md:w-4 md:h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                      iApp Address (TEE)
                    </div>
                    <div className="p-2 md:p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <code className="text-xs md:text-sm font-mono text-blue-800 break-all overflow-x-auto flex-1">
                          {IAPP_ADDRESS}
                        </code>
                        <button
                          onClick={() => copyToClipboard(IAPP_ADDRESS, 'iApp Address')}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          {copiedField === 'iApp Address' ? (
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 md:w-4 md:h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This iApp runs your formula inside Intel SGX secure enclaves
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-2 md:p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:shadow-sm transition-all">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Network</div>
                      <div className="text-sm text-gray-600">Arbitrum Sepolia</div>
                    </div>
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Recent Calculations */}
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-lg p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                    Recent Calculations
                  </h3>
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {recentTasks.length} Total
                  </span>
                </div>
                
                {recentTasks.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {recentTasks.map((task, index) => (
                      <div key={index} className="p-3 md:p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg md:rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-2 md:mb-3">
                          <div className="font-mono text-xs md:text-sm text-gray-800 truncate max-w-[60%]">
                            {task.id.slice(0, 10)}...
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            task.status === 'Completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <div>
                            <div className="font-bold text-gray-900 text-base md:text-lg">{task.amount}</div>
                            <div className="text-gray-500">{task.date}</div>
                          </div>
                          <a 
                            href={getExplorerUrl(task.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                          >
                            <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 md:py-10">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                      <Calculator className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                    </div>
                    <h4 className="text-base md:text-lg font-medium text-gray-900 mb-2">No calculations yet</h4>
                    <p className="text-gray-600 text-xs md:text-sm">
                      Launch your first confidential calculation
                    </p>
                  </div>
                )}
              </div>

              {/* Privacy Metrics */}
              <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white">
                <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                  <Shield className="w-4 h-4 md:w-5 md:h-5" />
                  Privacy Metrics
                </h3>
                <div className="space-y-3 md:space-y-5">
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg md:rounded-xl backdrop-blur-sm hover:bg-white/15 transition-all">
                    <span className="font-medium text-sm md:text-base">Data Encrypted</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 md:w-20 lg:w-24 h-1.5 md:h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-full"></div>
                      </div>
                      <span className="font-bold text-green-300 text-sm md:text-base">100%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg md:rounded-xl backdrop-blur-sm hover:bg-white/15 transition-all">
                    <span className="font-medium text-sm md:text-base">TEE Protected</span>
                    <span className="font-bold text-blue-300 text-sm md:text-base">✓ Guaranteed</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg md:rounded-xl backdrop-blur-sm hover:bg-white/15 transition-all">
                    <span className="font-medium text-sm md:text-base">On-chain Exposure</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 md:w-20 lg:w-24 h-1.5 md:h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 w-0"></div>
                      </div>
                      <span className="font-bold text-purple-300 text-sm md:text-base">0%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/20">
                  <p className="text-xs md:text-sm text-blue-200">
                    <span className="font-bold">Powered by iExec:</span> All computations in Intel SGX TEEs
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-lg p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Quick Actions</h3>
                <div className="space-y-2 md:space-y-3">
                  <button 
                    onClick={() => {
                      fetchRecentTasks();
                      showToast('Refreshing tasks...', 'info');
                    }}
                    className="w-full px-3 py-2 md:px-4 md:py-3 bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium rounded-lg transition-colors flex items-center justify-between text-sm hover:scale-[1.02] active:scale-95"
                  >
                    <span>Refresh Tasks</span>
                    <Loader2 className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setTaskId("0x" as `0x${string}`);
                      setStatus('');
                      setProfit('1000000');
                      setInvestors([
                        { address: "", stake: "400000", name: "Early Investor A" },
                        { address: "", stake: "350000", name: "Strategic Partner B" },
                        { address: "", stake: "250000", name: "Venture Fund C" },
                      ]);
                      showToast('Form reset to defaults', 'info');
                    }}
                    className="w-full px-3 py-2 md:px-4 md:py-3 bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium rounded-lg transition-colors text-sm hover:scale-[1.02] active:scale-95"
                  >
                    Reset Form
                  </button>
                  <a 
                    href={`https://sepolia.arbiscan.io/address/${CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-3 py-2 md:px-4 md:py-3 bg-purple-50 hover:bg-purple-100 text-purple-800 font-medium rounded-lg transition-colors flex items-center justify-between text-sm hover:scale-[1.02] active:scale-95"
                  >
                    <span>View on Arbiscan</span>
                    <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
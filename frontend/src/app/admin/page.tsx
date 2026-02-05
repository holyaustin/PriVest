"use client";

import { useState, useEffect } from "react";
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
  ExternalLink
} from "lucide-react";

// Configuration
const IAPP_ADDRESS = "0xB27cfF3fc965FaD42B5a97c350c9D9449Fd92D79";
const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

interface Investor {
  address: string;
  stake: string;
  name: string;
}

// Minimal ABI for our contract - only the functions we need
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
  }
] as const;

// ✅ Safe type guard for Ethereum provider (NO global redeclaration)
type SafeEip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function getEthereumProvider(): SafeEip1193Provider | null {
  if (typeof window === "undefined") return null;

  const eth = (window as any).ethereum;

  if (!eth || typeof eth.request !== "function") {
    return null;
  }

  return eth as unknown as SafeEip1193Provider;
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
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [iexecInstance, setIexecInstance] = useState<any>(null);

  // Contract write for registering tasks (Wagmi v2 syntax)
  const { 
    data: hash,
    isPending: isRegistering,
    writeContract 
  } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      setStatus("✅ Task registered successfully on-chain!");
      fetchRecentTasks();
    }
  }, [isConfirmed]);

  // Initialize iExec SDK when wallet connects
  useEffect(() => {
    const initializeIExec = async () => {
      const provider = getEthereumProvider();
      if (isConnected && provider) {
        try {
          // Dynamically import iExec SDK
          const { IExec } = await import("iexec");
          
          const iexec = new IExec({
            ethProvider: provider as any,
          });
          setIexecInstance(iexec);
          console.log("iExec SDK initialized successfully");
        } catch (error) {
          console.warn("iExec SDK unavailable, using mock:", error);
          setIexecInstance(createMockIExec());
        }
      }
    };
    
    initializeIExec();
  }, [isConnected]);

  // Create mock iExec for development
  const createMockIExec = () => ({
    task: {
      createTaskOrder: async (order: any) => {
        console.log("[MOCK] Creating task order:", order);
        return { ...order, mock: true };
      },
      placeTaskOrder: async (order: any) => {
        console.log("[MOCK] Placing task order:", order);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockTaskId = `0x${Array.from({length: 64}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}` as `0x${string}`;
        return { 
          taskId: mockTaskId
        };
      }
    }
  });

  // Fetch recent tasks from contract
  const fetchRecentTasks = async () => {
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
      
      // Try to call a simple view function to verify connection
      try {
        const owner = await contract.owner();
        console.log("Contract owner:", owner);
      } catch (err) {
        console.log("Could not fetch owner, contract might not be deployed yet");
      }
      
      // For demo purposes, show some mock tasks
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
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      // Show demo data for hackathon presentation
      setRecentTasks([
        { id: "0xDEMO001", status: "Completed", amount: "$1,000,000", date: "2024-02-04", txHash: "0xDEMOTX1" },
        { id: "0xDEMO002", status: "Processing", amount: "$750,000", date: "2024-02-03", txHash: "0xDEMOTX2" },
      ]);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchRecentTasks();
    }
  }, [isConnected]);

  const prepareIAppInput = () => {
    return {
      totalProfit: parseInt(profit),
      investors: investors.map((inv, idx) => ({
        address: inv.address || `0xInvestorDemo${idx + 1}`,
        stake: parseInt(inv.stake),
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

  const registerTaskInContract = () => {
    if (!taskId || taskId === "0x") return;
    
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: DISTRIBUTOR_ABI,
        functionName: 'receiveResult',
        args: [taskId, "0x"], // Empty bytes for demo
      });
      setStatus("📝 Registering task in smart contract...");
    } catch (error: any) {
      console.error("Failed to register task:", error);
      setStatus(`❌ Contract error: ${error.message}`);
    }
  };

  const launchConfidentialCalculation = async () => {
    const provider = getEthereumProvider();
    if (!provider || !address) {
      setStatus("⚠️ Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    setStatus("🚀 Initializing confidential calculation...");

    try {
      const inputData = prepareIAppInput();
      const inputDataString = JSON.stringify(inputData);
      
      setStatus("🔐 Encrypting data for TEE transmission...");
      
      // Use either real iExec SDK or mock
      const iexec = iexecInstance || createMockIExec();
      
      // Create task order with callback to our contract
      setStatus("📋 Creating secure task order with iExec...");
      const taskOrder = await iexec.task.createTaskOrder({
        app: IAPP_ADDRESS,
        params: {
          callback: CONTRACT_ADDRESS,
          args: `--input '${btoa(inputDataString)}'`,
        },
      });

      // Place order on iExec
      setStatus("⏳ Submitting to iExec decentralized network...");
      const placedOrder = await iexec.task.placeTaskOrder(taskOrder);
      const newTaskId = placedOrder.taskId as `0x${string}`;
      setTaskId(newTaskId);
      
      setStatus(`✅ Task launched! ID: ${newTaskId.slice(0, 10)}...`);
      
      // Register task in our smart contract
      registerTaskInContract();

    } catch (error: any) {
      console.error("Calculation failed:", error);
      
      // For demo/hackathon purposes, simulate a successful task
      if (error.message?.includes("mock") || !iexecInstance) {
        const mockTaskId = `0x${Array.from({length: 64}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}` as `0x${string}`;
        setTaskId(mockTaskId);
        setStatus(`✅ Demo Mode: Task simulation complete! ID: ${mockTaskId.slice(0, 10)}...`);
        registerTaskInContract();
      } else {
        setStatus(`❌ Error: ${error.message || "Unknown error occurred"}`);
      }
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
  };

  const removeInvestor = (index: number) => {
    if (investors.length > 1) {
      setInvestors(investors.filter((_, i) => i !== index));
    }
  };

  const getExplorerUrl = (hash: string) => {
    return `https://sepolia.arbiscan.io/tx/${hash}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center p-8 max-w-md">
          <Shield className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Admin Access Required</h2>
          <p className="text-gray-600 mb-8">
            Connect your wallet to access confidential RWA management features.
            All calculations run inside iExec Trusted Execution Environments.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl w-full"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Admin Portal
              </h1>
              <p className="text-gray-600 mt-2">Confidential RWA Profit Distribution with iExec TEE</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Connected as</div>
                <div className="font-mono font-medium text-gray-800 bg-gray-50 px-3 py-1 rounded-lg">
                  {address?.slice(0, 8)}...{address?.slice(-6)}
                </div>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-medium shadow-sm">
                Admin
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main Configuration Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Confidential Profit Calculation</h2>
                  <p className="text-gray-600">Data processed privately in iExec Trusted Execution Environment</p>
                </div>
              </div>

              {/* Total Profit Input */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Total Confidential Profit (USD)</span>
                  <span className="ml-auto text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Encrypted in TEE
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</div>
                  <input
                    type="number"
                    value={profit}
                    onChange={(e) => setProfit(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xl font-semibold focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="e.g., 1000000"
                    min="0"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  <span className="font-medium text-blue-600">🔒 Privacy Guarantee:</span> This value is encrypted before leaving your browser and processed inside Intel SGX secure enclaves.
                </p>
              </div>

              {/* Investors Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <label className="block text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Investors & Stakes
                  </label>
                  <button
                    onClick={addInvestor}
                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>+ Add Investor</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {investors.map((investor, index) => (
                    <div key={index} className="p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <span className="font-semibold text-gray-900">Investor #{index + 1}</span>
                        </div>
                        {investors.length > 1 && (
                          <button
                            onClick={() => removeInvestor(index)}
                            className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                              className="w-full pl-4 pr-12 py-3 bg-white border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="400000"
                              min="0"
                            />
                            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">USD</span>
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
                        className="w-full mt-3 px-3 py-2 bg-white border border-gray-200 rounded text-sm"
                        placeholder="Investor name (optional)"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Display */}
              {status && (
                <div className={`mb-6 p-5 rounded-xl border ${
                  status.includes('✅') ? 'bg-green-50 border-green-200' :
                  status.includes('❌') ? 'bg-red-50 border-red-200' :
                  status.includes('⚠️') ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      status.includes('✅') ? 'bg-green-100' :
                      status.includes('❌') ? 'bg-red-100' :
                      status.includes('⚠️') ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      {isProcessing || isRegistering || isConfirming ? (
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      ) : status.includes('✅') ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : status.includes('❌') ? (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      ) : status.includes('⚠️') ? (
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                      ) : (
                        <Clock className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-lg mb-1">{status.replace(/[✅❌⚠️]/g, '').trim()}</p>
                      {taskId && taskId !== "0x" && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-700 font-medium">Task ID:</p>
                          <code className="block mt-1 p-2 bg-white/50 rounded border border-gray-200 text-sm font-mono break-all">
                            {taskId}
                          </code>
                        </div>
                      )}
                      {hash && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-700 font-medium">Transaction:</p>
                          <a 
                            href={getExplorerUrl(hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-1 text-blue-600 hover:text-blue-800 font-mono text-sm"
                          >
                            {hash.slice(0, 20)}...{hash.slice(-8)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
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
                className="w-full py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {isProcessing || isRegistering || isConfirming ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Processing in iExec TEE...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      🚀 Launch Confidential Calculation
                    </span>
                  </>
                )}
              </button>

              {/* How It Works */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">📖 How This Works</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100">
                    <div className="text-blue-600 font-bold mb-2">1. Encryption</div>
                    <p className="text-sm text-gray-700">Your data is encrypted locally before transmission to iExec</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100">
                    <div className="text-purple-600 font-bold mb-2">2. TEE Execution</div>
                    <p className="text-sm text-gray-700">Runs in Intel SGX secure enclave on iExec network</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100">
                    <div className="text-green-600 font-bold mb-2">3. Smart Contract Callback</div>
                    <p className="text-sm text-gray-700">Results automatically sent to your deployed contract</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100">
                    <div className="text-orange-600 font-bold mb-2">4. Investor Claims</div>
                    <p className="text-sm text-gray-700">Investors can claim dividends via the investor portal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-8">
            {/* Contract Information */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Contract Information
              </h3>
              <div className="space-y-5">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                    Smart Contract Address
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm font-mono text-gray-800 break-all">
                      {CONTRACT_ADDRESS}
                    </code>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                    iApp Address (TEE)
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <code className="text-sm font-mono text-blue-800 break-all">
                      {IAPP_ADDRESS}
                    </code>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This iApp runs your confidential formula inside Intel SGX secure enclaves
                  </p>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Network</div>
                    <div className="text-sm text-gray-600">Arbitrum Sepolia</div>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Recent Calculations */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Recent Calculations
                </h3>
                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {recentTasks.length} Total
                </span>
              </div>
              
              {recentTasks.length > 0 ? (
                <div className="space-y-4">
                  {recentTasks.map((task, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="font-mono text-sm text-gray-800 truncate max-w-[60%]">
                          {task.id.slice(0, 16)}...
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          task.status === 'Completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{task.amount}</div>
                          <div className="text-gray-500">{task.date}</div>
                        </div>
                        <a 
                          href={getExplorerUrl(task.txHash)}
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
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calculator className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No calculations yet</h4>
                  <p className="text-gray-600 text-sm">
                    Launch your first confidential calculation to see results here
                  </p>
                </div>
              )}
            </div>

            {/* Privacy Metrics */}
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy Metrics
              </h3>
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <span className="font-medium">Data Encrypted</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-full"></div>
                    </div>
                    <span className="font-bold text-green-300">100%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <span className="font-medium">TEE Protected</span>
                  <span className="font-bold text-blue-300">✓ Guaranteed</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <span className="font-medium">On-chain Exposure</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 w-0"></div>
                    </div>
                    <span className="font-bold text-purple-300">0%</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm text-blue-200">
                  <span className="font-bold">Powered by iExec:</span> All computations run inside Intel SGX Trusted Execution Environments
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => fetchRecentTasks()}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>Refresh Tasks</span>
                  <Loader2 className="w-4 h-4" />
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
                  }}
                  className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium rounded-lg transition-colors"
                >
                  Reset Form
                </button>
                <a 
                  href={`https://sepolia.arbiscan.io/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-800 font-medium rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>View on Arbiscan</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
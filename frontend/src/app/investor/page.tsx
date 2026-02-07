"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { 
  Wallet, DollarSign, History, Shield, CheckCircle, Clock,
  AlertCircle, ExternalLink, FileText, Download, RefreshCw,
  ArrowRight
} from "lucide-react";
import { fetchTaskDetailsFromExplorer } from "@/lib/iexec";
import {
  fetchInvestorPayouts,
  fetchAllClaimEvents,
  formatETH,
  shortenHash,
  CONTRACT_ADDRESS,
  DISTRIBUTOR_ABI
} from "@/lib/contract";

interface Dividend {
  taskId: string;
  amount: bigint;
  claimed: boolean;
  timestamp: number;
  resultHash?: string;
  claimTransaction?: string;
}

interface TaskDetails {
  status: string;
  dealid?: string;
  timestamp: number;
  [key: string]: any;
}

// Toast hook
const useToast = () => {
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`);
    // You can replace this with a proper toast library like react-hot-toast
    if (typeof window !== 'undefined') {
      if (type === 'error') {
        alert(`Error: ${message}`);
      } else if (type === 'success') {
        alert(`Success: ${message}`);
      }
    }
  }, []);
  
  return { showToast };
};

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

export default function InvestorPortal() {
  const { isConnected, address } = useAccount();
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimHistory, setClaimHistory] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingTask, setClaimingTask] = useState<string | null>(null);
  const { showToast } = useToast();

  // Get ethers JSON-RPC provider for reading data
  const getEthersProvider = useCallback((): ethers.Provider | null => {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
      return new ethers.JsonRpcProvider(rpcUrl, 421614); // Arbitrum Sepolia chain ID
    } catch (error) {
      console.error("Failed to create provider:", error);
      return null;
    }
  }, []);

  // Fetch investor data
  useEffect(() => {
    if (isConnected && address) {
      fetchInvestorData();
    }
  }, [isConnected, address]);

  const fetchInvestorData = async () => {
    if (!address) return;
    
    setLoading(true);
    const provider = getEthersProvider();
    if (!provider) {
      setLoading(false);
      showToast("Failed to connect to blockchain", "error");
      return;
    }
    
    try {
      // Fetch investor's payouts from contract
      const payouts = await fetchInvestorPayouts(provider, address);
      setDividends(payouts);
      
      // Fetch claim history
      const claims = await fetchAllClaimEvents(provider);
      const investorClaims = claims.filter(claim => 
        claim.investor.toLowerCase() === address.toLowerCase()
      );
      setClaimHistory(investorClaims);
      
    } catch (error) {
      console.error("Failed to fetch investor data:", error);
      showToast("Failed to fetch investor data", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Direct ethers.js claim function - SAFE APPROACH
  const handleClaim = async (taskId: string) => {
    if (!address) {
      showToast("Please connect your wallet", "warning");
      return;
    }
    
    const ethereumProvider = getEthereumProvider();
    if (!ethereumProvider) {
      showToast("No wallet found. Please install MetaMask or another Web3 wallet.", "error");
      return;
    }
    
    setClaimingTask(taskId);
    
    try {
      // Create a browser provider with the ethereum object
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();
      
      // Check network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 421614) {
        showToast("Please switch to Arbitrum Sepolia network", "warning");
        setClaimingTask(null);
        return;
      }
      
      // Create contract instance with signer
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        DISTRIBUTOR_ABI,
        signer
      );
      
      showToast(`Claiming dividend for task ${shortenHash(taskId, 8, 8)}...`, "info");
      
      // Estimate gas first
      try {
        const estimatedGas = await contract.claimDividend.estimateGas(taskId);
        console.log("Estimated gas:", estimatedGas.toString());
      } catch (estimateError: any) {
        console.warn("Gas estimation failed:", estimateError);
        showToast("Note: Gas estimation failed, transaction may still succeed", "info");
      }
      
      // Call claim function
      const tx = await contract.claimDividend(taskId);
      showToast("Transaction submitted! Waiting for confirmation...", "info");
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        showToast("Claim successful! Updating your dividends...", "success");
        
        // Update local state
        setDividends(prev => prev.map(d => 
          d.taskId === taskId ? { ...d, claimed: true } : d
        ));
        
        // Refresh data after a delay
        setTimeout(() => {
          fetchInvestorData();
        }, 2000);
      } else {
        showToast("Transaction failed", "error");
      }
      
    } catch (error: any) {
      console.error("Claim failed:", error);
      
      // Handle specific errors
      if (error.code === 'ACTION_REJECTED') {
        showToast("Transaction was rejected by user", "warning");
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        showToast("Insufficient funds for gas fee", "error");
      } else if (error.message?.includes('already claimed')) {
        showToast("This dividend has already been claimed", "warning");
      } else {
        showToast(`Claim failed: ${error.message || 'Unknown error'}`, "error");
      }
    } finally {
      setClaimingTask(null);
    }
  };

  const loadTaskDetails = async (taskId: string) => {
    try {
      const details = await fetchTaskDetailsFromExplorer(taskId);
      setTaskDetails(details);
      setSelectedTask(taskId);
    } catch (error) {
      console.error("Failed to load task details:", error);
      showToast("Failed to load task details", "error");
      setTaskDetails(null);
    }
  };

  const refreshData = () => {
    setRefreshing(true);
    fetchInvestorData();
  };

  const exportDividends = () => {
    if (!address) return;
    
    const csvContent = [
      ["Task ID", "Amount", "Date", "Status", "Result Hash"],
      ...dividends.map(d => [
        d.taskId,
        formatETH(d.amount),
        new Date(d.timestamp).toISOString(),
        d.claimed ? "Claimed" : "Available",
        d.resultHash || ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dividends_${address.slice(2, 10)}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const totalAvailable = dividends
    .filter(d => !d.claimed)
    .reduce((sum, d) => sum + d.amount, 0n);

  const totalClaimed = dividends
    .filter(d => d.claimed)
    .reduce((sum, d) => sum + d.amount, 0n);

  // Get explorer URLs
  const getArbiscanUrl = (hash: string) => `https://sepolia.arbiscan.io/tx/${hash}`;
  const getIExecExplorerUrl = (taskId: string) => `https://explorer.iex.ec/arbitrum-sepolia-testnet/task/${taskId}`;

  // Helper to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "success");
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center p-8 max-w-md w-full">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-8">Connect to view your dividends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Investor Portal</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">
              Your confidential dividends on Arbitrum Sepolia
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
          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={exportDividends}
              disabled={dividends.length === 0}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatETH(totalAvailable)}</div>
                <div className="text-sm text-gray-600">Available to Claim</div>
                <div className="text-xs text-gray-500 mt-1">
                  {dividends.filter(d => !d.claimed).length} dividends
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <History className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatETH(totalClaimed)}</div>
                <div className="text-sm text-gray-600">Total Claimed</div>
                <div className="text-xs text-gray-500 mt-1">
                  {dividends.filter(d => d.claimed).length} dividends
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{dividends.length}</div>
                <div className="text-sm text-gray-600">Total Dividends</div>
                <div className="text-xs text-gray-500 mt-1">
                  All calculations in TEE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dividends Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Dividends</h2>
            <p className="text-gray-600 text-sm mt-1">
              {loading ? "Loading..." : `Showing ${dividends.length} dividends`}
            </p>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading dividends from blockchain...</p>
            </div>
          ) : dividends.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No dividends found</h3>
              <p className="text-gray-600">You don't have any dividends yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dividends.map((dividend, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(dividend.taskId)}
                            title="Copy Task ID"
                            className="font-mono text-sm text-gray-900 hover:text-blue-600"
                          >
                            {shortenHash(dividend.taskId, 8, 8)}
                          </button>
                          <button
                            onClick={() => loadTaskDetails(dividend.taskId)}
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="View Details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{formatETH(dividend.amount)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600">
                          {new Date(dividend.timestamp).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          dividend.claimed 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {dividend.claimed ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Claimed
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Available
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={getIExecExplorerUrl(dividend.taskId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-500 hover:text-purple-600"
                            title="View on iExec Explorer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          {!dividend.claimed && (
                            <button
                              onClick={() => handleClaim(dividend.taskId)}
                              disabled={claimingTask === dividend.taskId}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              {claimingTask === dividend.taskId ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  Claiming...
                                </>
                              ) : (
                                <>
                                  Claim
                                  <ArrowRight className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Claim History */}
        {claimHistory.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Claim History</h2>
              <p className="text-gray-600 text-sm mt-1">
                {claimHistory.length} claims made
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {claimHistory.map((claim, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-900">
                          {shortenHash(claim.taskId, 8, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{formatETH(claim.amount)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600">
                          {new Date(claim.timestamp).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={getArbiscanUrl(claim.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          {shortenHash(claim.transactionHash, 6, 4)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Task Details Modal */}
        {selectedTask && taskDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Task Details</h3>
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      setTaskDetails(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Task ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="font-mono text-sm bg-gray-50 p-2 rounded flex-1">
                        {selectedTask}
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedTask)}
                        className="p-2 text-gray-500 hover:text-blue-600"
                        title="Copy Task ID"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className={`text-lg font-semibold mt-1 ${
                        taskDetails.status === 'COMPLETED' ? 'text-green-600' :
                        taskDetails.status === 'RUNNING' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {taskDetails.status || 'UNKNOWN'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Deal ID</label>
                      <div className="font-mono text-sm truncate mt-1">
                        {taskDetails.dealid || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Details</label>
                    <pre className="bg-gray-50 border border-gray-200 p-4 rounded mt-1 text-sm overflow-auto max-h-60">
                      {JSON.stringify(taskDetails, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <a
                      href={getIExecExplorerUrl(selectedTask)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on iExec Explorer
                    </a>
                    <button
                      onClick={() => {
                        setSelectedTask(null);
                        setTaskDetails(null);
                      }}
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
    </div>
  );
}
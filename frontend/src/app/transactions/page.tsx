"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { 
  Search, ExternalLink, Download, RefreshCw, Database, Activity
} from "lucide-react";
import {
  fetchAllPayoutEvents,
  fetchAllClaimEvents,
  formatETH,
  shortenHash,
  calculateContractStats
} from "@/lib/contract";

interface Transaction {
  type: "Calculation" | "Claim";
  taskId: string;
  amount: bigint;
  timestamp: number;
  transactionHash: string;
  blockNumber: number;
  details?: any;
}

// Create an ethers.js provider
const getEthersProvider = () => {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
  return new ethers.JsonRpcProvider(rpcUrl, 421614); // 421614 is Arbitrum Sepolia chain ID
};

export default function TransactionsPage() {
  const { isConnected } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<any>(null);

  // Fetch all transactions
  useEffect(() => {
    if (isConnected) {
      fetchTransactions();
    }
  }, [isConnected]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Create ethers provider
      const provider = getEthersProvider();
      
      // Fetch all events from contract
      const [payoutEvents, claimEvents] = await Promise.all([
        fetchAllPayoutEvents(provider),
        fetchAllClaimEvents(provider),
      ]);
      
      // Combine and sort all events
      const allTransactions: Transaction[] = [
        ...payoutEvents.map(event => ({
          type: "Calculation" as const,
          taskId: event.taskId,
          amount: event.amounts.reduce((sum, amount) => sum + amount, 0n),
          timestamp: event.timestamp,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          details: {
            investorCount: event.investors.length,
            resultHash: event.resultHash
          }
        })),
        ...claimEvents.map(event => ({
          type: "Claim" as const,
          taskId: event.taskId,
          amount: event.amount,
          timestamp: event.timestamp,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          details: {
            investor: event.investor
          }
        }))
      ];
      
      // Sort by timestamp (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);
      
      setTransactions(allTransactions);
      
      // Calculate stats
      const contractStats = await calculateContractStats(provider);
      setStats(contractStats);
      
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter !== "all" && tx.type.toLowerCase() !== filter.toLowerCase()) {
      return false;
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        tx.taskId.toLowerCase().includes(searchLower) ||
        tx.transactionHash.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const exportTransactions = () => {
    const csvContent = [
      ["Type", "Task ID", "Amount", "Date", "Transaction Hash", "Block Number"],
      ...filteredTransactions.map(tx => [
        tx.type,
        tx.taskId,
        formatETH(tx.amount),
        new Date(tx.timestamp).toISOString(),
        tx.transactionHash,
        tx.blockNumber.toString()
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center p-8 max-w-md w-full">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-8">Connect to view transaction history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600">Real-time transactions from Arbitrum Sepolia</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportTransactions}
              disabled={filteredTransactions.length === 0}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={fetchTransactions}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{formatETH(stats.totalPayoutAmount)}</div>
              <div className="text-sm text-gray-600">Total Volume</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalClaims}</div>
              <div className="text-sm text-gray-600">Total Claims</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.uniqueInvestors}</div>
              <div className="text-sm text-gray-600">Unique Investors</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Task ID or Transaction Hash..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {["all", "calculation", "claim"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filter === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading transactions from blockchain...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Hash</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((tx, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          tx.type === 'Calculation' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm">{shortenHash(tx.taskId, 8, 8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{formatETH(tx.amount)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm">{shortenHash(tx.transactionHash, 8, 8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://sepolia.arbiscan.io/tx/${tx.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="View on Arbiscan"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <a
                            href={`https://explorer.iex.ec/arbitrum-sepolia-testnet/task/${tx.taskId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-500 hover:text-purple-600"
                            title="View on iExec Explorer"
                          >
                            <Activity className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { 
  Filter, 
  Search, 
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Download
} from "lucide-react";

interface Transaction {
  id: string;
  type: "Calculation" | "Payout" | "Claim";
  amount: string;
  date: string;
  status: "Completed" | "Pending" | "Failed";
  hash: string;
}

export default function TransactionsPage() {
  const { isConnected } = useAccount();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const transactions: Transaction[] = [
    { id: "1", type: "Calculation", amount: "$1,000,000", date: "2024-02-04 14:30", status: "Completed", hash: "0x123...abc" },
    { id: "2", type: "Payout", amount: "$45,250", date: "2024-02-04 14:35", status: "Completed", hash: "0x456...def" },
    { id: "3", type: "Claim", amount: "$45,250", date: "2024-02-04 14:40", status: "Completed", hash: "0x789...ghi" },
    { id: "4", type: "Calculation", amount: "$750,000", date: "2024-02-03 11:20", status: "Pending", hash: "0xabc...123" },
    { id: "5", type: "Payout", amount: "$32,750", date: "2024-01-28 09:15", status: "Completed", hash: "0xdef...456" },
  ];

  const filteredTransactions = transactions.filter(tx => {
    if (filter !== "all" && tx.type.toLowerCase() !== filter) return false;
    if (search && !tx.hash.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const exportTransactions = () => {
    // Implementation for CSV export
    alert("Export functionality would be implemented here");
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Connect to view transaction history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
              <p className="text-gray-600 mt-2">All confidential calculations and payouts</p>
            </div>
            <button
              onClick={exportTransactions}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by transaction hash..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-80"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter:
              </span>
              <div className="flex flex-wrap gap-2">
                {["all", "calculation", "payout", "claim"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Explorer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        tx.type === 'Calculation' 
                          ? 'bg-blue-100 text-blue-800'
                          : tx.type === 'Payout'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-semibold text-gray-900">
                        {tx.amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {tx.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : tx.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.status === 'Completed' && <CheckCircle className="w-3 h-3" />}
                        {tx.status === 'Pending' && <Clock className="w-3 h-3" />}
                        {tx.status === 'Failed' && <AlertCircle className="w-3 h-3" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm text-gray-900">
                        {tx.hash}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`https://sepolia.arbiscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">
              ${transactions.reduce((sum, tx) => sum + parseFloat(tx.amount.replace(/[^0-9.-]+/g, "")), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Volume</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">
              {transactions.filter(tx => tx.status === 'Completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">
              {transactions.filter(tx => tx.status === 'Pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
}
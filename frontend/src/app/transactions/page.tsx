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
  Download,
  Menu,
  X
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
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center p-8 max-w-md w-full">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-8">Connect to view transaction history</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
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
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transaction History</h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-2">
                All confidential calculations and payouts
              </p>
            </div>
            <button
              onClick={exportTransactions}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Filters - Mobile First Design */}
        <div className="mb-6 sm:mb-8">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            {/* Filter Toggle for Mobile */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl flex items-center justify-between text-sm font-medium text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}</span>
                </div>
                {mobileFilterOpen ? (
                  <X className="w-4 h-4 text-gray-500" />
                ) : (
                  <Menu className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {/* Mobile Filter Dropdown */}
              {mobileFilterOpen && (
                <div className="mt-2 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    {["all", "calculation", "payout", "claim"].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFilter(type);
                          setMobileFilterOpen(false);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              )}
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium flex items-center gap-2 text-sm">
                  <Filter className="w-4 h-4" />
                  Filter:
                </span>
                <div className="flex flex-wrap gap-2">
                  {["all", "calculation", "payout", "claim"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
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
        </div>

        {/* Transactions List/Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Mobile View - Card Layout */}
          <div className="sm:hidden">
            {filteredTransactions.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tx.type === 'Calculation' 
                            ? 'bg-blue-100 text-blue-800'
                            : tx.type === 'Payout'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {tx.type}
                        </span>
                        <div className="mt-2">
                          <div className="text-lg font-bold text-gray-900">{tx.amount}</div>
                          <div className="text-sm text-gray-500">{tx.date}</div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : tx.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.status === 'Completed' && <CheckCircle className="w-3 h-3" />}
                        {tx.status === 'Pending' && <Clock className="w-3 h-3" />}
                        {tx.status === 'Failed' && <AlertCircle className="w-3 h-3" />}
                        <span className="hidden xs:inline">{tx.status}</span>
                        <span className="xs:hidden">{tx.status.charAt(0)}</span>
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Transaction Hash</div>
                        <div className="font-mono text-sm text-gray-900 break-all">
                          {tx.hash}
                        </div>
                      </div>
                      <a
                        href={`https://sepolia.arbiscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        View on Explorer
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600 text-sm">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>

          {/* Desktop View - Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Hash
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Explorer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
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
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-semibold text-gray-900">
                        {tx.amount}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-gray-500">
                      {tx.date}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
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
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm text-gray-900 max-w-[120px] lg:max-w-[200px] truncate">
                        {tx.hash}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <a
                        href={`https://sepolia.arbiscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
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

          {/* Empty State for Desktop */}
          {filteredTransactions.length === 0 && (
            <div className="hidden sm:block text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>

        {/* Stats - Responsive Grid */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{transactions.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Transactions</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              ${transactions.reduce((sum, tx) => sum + parseFloat(tx.amount.replace(/[^0-9.-]+/g, "")), 0).toLocaleString()}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Total Volume</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {transactions.filter(tx => tx.status === 'Completed').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {transactions.filter(tx => tx.status === 'Pending').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
}
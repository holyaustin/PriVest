"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { 
  Wallet, 
  DollarSign, 
  History, 
  Shield,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

interface Dividend {
  id: string;
  amount: string;
  date: string;
  status: "Pending" | "Available" | "Claimed";
  taskId: string;
}

export default function InvestorPortal() {
  const { isConnected, address } = useAccount();
  const [dividends, setDividends] = useState<Dividend[]>([
    { id: "1", amount: "$45,250", date: "2024-02-04", status: "Available", taskId: "0x123...abc" },
    { id: "2", amount: "$32,750", date: "2024-01-28", status: "Claimed", taskId: "0x456...def" },
    { id: "3", amount: "$28,500", date: "2024-01-15", status: "Available", taskId: "0x789...ghi" },
  ]);
  const [isClaiming, setIsClaiming] = useState(false);

  const totalAvailable = dividends
    .filter(d => d.status === "Available")
    .reduce((sum, d) => sum + parseFloat(d.amount.replace(/[^0-9.-]+/g, "")), 0);

  const handleClaim = async (dividendId: string) => {
    setIsClaiming(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setDividends(dividends.map(d => 
      d.id === dividendId ? { ...d, status: "Claimed" } : d
    ));
    setIsClaiming(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Connect to view your dividends</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Investor Portal</h1>
              <p className="text-gray-600 mt-2">View and claim your confidential dividends</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Connected as</div>
                <div className="font-mono font-medium text-gray-800">
                  {address?.slice(0, 8)}...{address?.slice(-6)}
                </div>
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Investor
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Available to Claim</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${totalAvailable.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <History className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Dividends</div>
                <div className="text-2xl font-bold text-gray-900">
                  {dividends.length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Privacy Protected</div>
                <div className="text-2xl font-bold text-gray-900">100%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dividends Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Dividends</h2>
            <p className="text-gray-600 text-sm mt-1">
              Dividends calculated confidentially using iExec TEEs
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dividends.map((dividend) => (
                  <tr key={dividend.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm text-gray-900">
                        {dividend.taskId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-semibold text-gray-900">
                        {dividend.amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {dividend.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        dividend.status === 'Available' 
                          ? 'bg-green-100 text-green-800' 
                          : dividend.status === 'Claimed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dividend.status === 'Available' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {dividend.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                        {dividend.status === 'Claimed' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {dividend.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dividend.status === 'Available' && (
                        <button
                          onClick={() => handleClaim(dividend.id)}
                          disabled={isClaiming}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all"
                        >
                          {isClaiming ? 'Claiming...' : 'Claim'}
                        </button>
                      )}
                      {dividend.status === 'Claimed' && (
                        <span className="text-gray-500 text-sm">Already claimed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {dividends.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No dividends yet</h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                Your dividends will appear here once they're calculated by the admin.
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">How it works</h4>
              <ul className="text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Admin runs confidential profit calculation in iExec TEE</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>Your share is calculated privately - formulas are never exposed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>Results are automatically sent to smart contract</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">4.</span>
                  <span>You can claim your dividend once calculation completes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
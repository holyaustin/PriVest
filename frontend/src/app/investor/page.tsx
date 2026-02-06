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
  AlertCircle,
  ChevronRight,
  Menu,
  X
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center p-8 max-w-md w-full">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-8">Connect to view your dividends</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Investor Portal</h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1">
                View and claim your confidential dividends
              </p>
            </div>
            
            {/* Mobile Header Controls */}
            <div className="flex items-center justify-between sm:hidden">
              <div className="text-right">
                <div className="text-xs text-gray-500">Connected as</div>
                <div className="font-mono font-medium text-gray-800 text-sm">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="ml-4 p-2 bg-gray-100 rounded-lg"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>

            {/* Desktop Header Controls */}
            <div className="hidden sm:flex sm:items-center sm:gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Connected as</div>
                <div className="font-mono font-medium text-gray-800 text-sm">
                  {address?.slice(0, 8)}...{address?.slice(-6)}
                </div>
              </div>
              <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Investor
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-500">Available to Claim</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  ${totalAvailable.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                <History className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-500">Total Dividends</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {dividends.length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg sm:rounded-xl">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-500">Privacy Protected</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">100%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dividends Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Your Dividends</h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              Dividends calculated confidentially using iExec TEEs
            </p>
          </div>

          {/* Mobile View - Card Layout */}
          <div className="sm:hidden">
            {dividends.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {dividends.map((dividend) => (
                  <div key={`dividend-${dividend.id}-${dividend.taskId}`} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-mono text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded truncate max-w-[140px]">
                            {dividend.taskId}
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            dividend.status === 'Available' 
                              ? 'bg-green-100 text-green-800' 
                              : dividend.status === 'Claimed'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {dividend.status === 'Available' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {dividend.status === 'Claimed' && <AlertCircle className="w-3 h-3 mr-1" />}
                            <span className="hidden xs:inline">{dividend.status}</span>
                            <span className="xs:hidden">{dividend.status.charAt(0)}</span>
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-gray-900">{dividend.amount}</div>
                          <div className="text-sm text-gray-500">{dividend.date}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-2" />
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100">
                      {dividend.status === 'Available' ? (
                        <button
                          onClick={() => handleClaim(dividend.id)}
                          disabled={isClaiming}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all text-sm"
                        >
                          {isClaiming ? 'Claiming...' : 'Claim Dividend'}
                        </button>
                      ) : (
                        <div className="text-center">
                          <span className="text-gray-500 text-sm">Already claimed</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No dividends yet</h3>
                <p className="text-gray-600 text-sm max-w-sm mx-auto">
                  Your dividends will appear here once they&apos;re calculated by the admin.
                </p>
              </div>
            )}
          </div>

          {/* Desktop View - Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task ID
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dividends.map((dividend) => (
                  <tr key={`dividend-${dividend.id}-${dividend.taskId}`} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm text-gray-900 max-w-[120px] lg:max-w-[200px] truncate">
                        {dividend.taskId}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-semibold text-gray-900">
                        {dividend.amount}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-gray-500">
                      {dividend.date}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
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
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {dividend.status === 'Available' && (
                        <button
                          onClick={() => handleClaim(dividend.id)}
                          disabled={isClaiming}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all text-sm"
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

          {/* Empty State for Desktop */}
          {dividends.length === 0 && (
            <div className="hidden sm:block text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No dividends yet</h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                Your dividends will appear here once they&apos;re calculated by the admin.
              </p>
            </div>
          )}
        </div>

        {/* Info Box - Responsive */}
        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl border border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">How it works</h4>
              <ul className="text-gray-700 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold flex-shrink-0">1.</span>
                  <span>Admin runs confidential profit calculation in iExec TEE</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold flex-shrink-0">2.</span>
                  <span>Your share is calculated privately - formulas are never exposed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold flex-shrink-0">3.</span>
                  <span>Results are automatically sent to smart contract</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold flex-shrink-0">4.</span>
                  <span>You can claim your dividend once calculation completes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mobile Menu Modal */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div className="absolute inset-0 bg-black/20" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">Account</h3>
                <div className="mt-4">
                  <div className="text-sm text-gray-500">Wallet Address</div>
                  <div className="font-mono text-sm text-gray-800 mt-1 break-all">
                    {address}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="px-3 py-2.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium text-center">
                  Investor Account
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
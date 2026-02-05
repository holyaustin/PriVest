"use client";

import Link from "next/link";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import wagmiNetworks from "@/config/wagmiNetworks";

export default function Header() {
  const { open } = useAppKit();
  const { disconnectAsync } = useDisconnect();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const networks = Object.values(wagmiNetworks);

  const login = () => open({ view: "Connect" });

  const logout = async () => {
    try {
      await disconnectAsync();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleChainChange = async (selectedChainId: number) => {
    if (selectedChainId && selectedChainId !== chainId && switchChain) {
      try {
        await switchChain({ chainId: selectedChainId });
      } catch (error) {
        console.error("Chain switch failed:", error);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-10">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PriVest
                </h1>
                <p className="text-xs text-gray-500">Confidential RWA Manager</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/admin" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Admin Portal
              </Link>
              <Link 
                href="/investor" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Investor Portal
              </Link>
              <Link 
                href="/transactions" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Transactions
              </Link>
            </nav>
          </div>

          {/* Wallet and Network Controls */}
          <div className="flex items-center space-x-4">
            {isConnected && (
              <>
                {/* Network Selector */}
                <div className="hidden sm:flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Network:</span>
                  <div className="relative">
                    <select
                      value={chainId}
                      onChange={(e) => handleChainChange(parseInt(e.target.value))}
                      className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    >
                      {networks.map((network) => (
                        <option key={network.id} value={network.id}>
                          {network.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="hidden md:block px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Connected as</div>
                  <div className="text-sm font-mono font-medium text-gray-800">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </>
            )}

            {!isConnected && (
              <button
                onClick={login}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
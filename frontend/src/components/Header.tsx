"use client";

import Link from "next/link";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import wagmiNetworks from "@/config/wagmiNetworks";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, LogOut, Wallet, Network } from "lucide-react";

export default function Header() {
  const { open } = useAppKit();
  const { disconnectAsync } = useDisconnect();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const networkDropdownRef = useRef<HTMLDivElement>(null);
  const addressDropdownRef = useRef<HTMLDivElement>(null);

  const networks = Object.values(wagmiNetworks);
  const currentNetwork = networks.find(network => network.id === chainId);

  const login = () => open({ view: "Connect" });

  const logout = async () => {
    try {
      await disconnectAsync();
      setShowAddressDropdown(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleChainChange = async (selectedChainId: number) => {
    if (selectedChainId && selectedChainId !== chainId && switchChain) {
      try {
        await switchChain({ chainId: selectedChainId });
        setShowNetworkDropdown(false);
      } catch (error) {
        console.error("Chain switch failed:", error);
      }
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (networkDropdownRef.current && !networkDropdownRef.current.contains(event.target as Node)) {
        setShowNetworkDropdown(false);
      }
      if (addressDropdownRef.current && !addressDropdownRef.current.contains(event.target as Node)) {
        setShowAddressDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-6 lg:space-x-10">
            <Link href="/" className="flex items-center space-x-2 lg:space-x-3 shrink-0">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg lg:text-xl">P</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PriVest
                </h1>
                <p className="text-xs text-gray-500">Confidential RWA Manager</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/" 
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                Dashboard
              </Link>
              <Link 
                href="/admin" 
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                Admin
              </Link>
              <Link 
                href="/investor" 
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                Investor
              </Link>
              <Link 
                href="/transactions" 
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                Transactions
              </Link>
            </nav>
          </div>

          {/* Mobile menu button (hidden on desktop) */}
          <div className="md:hidden">
            <button
              onClick={login}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
            >
              Connect
            </button>
          </div>

          {/* Desktop Wallet and Network Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {isConnected && (
              <>
                {/* Network Selector */}
                <div className="relative" ref={networkDropdownRef}>
                  <button
                    onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 transition-colors"
                  >
                    <Network className="w-4 h-4 text-gray-600" />
                    <span className="hidden lg:inline">{currentNetwork?.name || "Network"}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showNetworkDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showNetworkDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        Select Network
                      </div>
                      {networks.map((network) => (
                        <button
                          key={network.id}
                          onClick={() => handleChainChange(network.id)}
                          className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                            chainId === network.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${chainId === network.id ? 'bg-blue-500' : 'bg-gray-300'}`} />
                          <div className="flex-1">
                            <div className="font-medium">{network.name}</div>
                            <div className="text-xs text-gray-500">Chain ID: {network.id}</div>
                          </div>
                          {chainId === network.id && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Wallet Address with Dropdown */}
                <div className="relative" ref={addressDropdownRef}>
                  <button
                    onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                    className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-500 font-medium">Wallet</div>
                      <div className="text-sm font-mono font-semibold text-gray-800">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showAddressDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showAddressDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                      {/* Wallet Info */}
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-1">Connected Wallet</div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-mono text-sm font-semibold text-gray-900 break-all">
                              {address}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {currentNetwork?.name || "Unknown Network"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="p-2">
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-medium">Disconnect Wallet</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {!isConnected && (
              <button
                onClick={login}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation (hidden on desktop) */}
        {isConnected && (
          <div className="md:hidden border-t border-gray-100 pt-3 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-500">Connected as</div>
              <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                {currentNetwork?.name || "Network"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                {address?.slice(0, 8)}...{address?.slice(-6)}
              </div>
              <button
                onClick={logout}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
            <nav className="grid grid-cols-2 gap-2 mt-4">
              <Link 
                href="/admin" 
                className="px-3 py-2 text-sm font-medium text-center text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Admin
              </Link>
              <Link 
                href="/investor" 
                className="px-3 py-2 text-sm font-medium text-center text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Investor
              </Link>
              <Link 
                href="/" 
                className="px-3 py-2 text-sm font-medium text-center text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/transactions" 
                className="px-3 py-2 text-sm font-medium text-center text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Transactions
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
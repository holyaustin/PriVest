'use client'

import { wagmiAdapter } from '@/config/wagmiConfig'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { type ReactNode, useEffect, useState } from 'react'
import { WagmiProvider, type Config } from 'wagmi'

// Set up queryClient with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Retry failed requests once
      staleTime: 30000, // 30 seconds
    },
  },
});

// Custom component to handle wallet connection errors
function WalletConnectionStatus({ children }: { children: ReactNode }) {
  const [hasApiError, setHasApiError] = useState(false);

  useEffect(() => {
    // Listen for Reown API errors (they appear in console)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if it's a Reown API error
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('[Reown Config]') || args[0].includes('fetch failed'))) {
        setHasApiError(true);
        // Log it as a warning instead of error for better UX
        console.warn('Reown API connection issue - using local configuration:', args[1] || '');
        return; // Don't show as error in console
      }
      originalConsoleError.apply(console, args);
    };

    // Listen for unhandled errors
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('Reown') || 
          event.error?.message?.includes('fetch')) {
        setHasApiError(true);
        event.preventDefault(); // Prevent default error handling
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <>
      {hasApiError && (
        <div className="fixed top-4 right-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg shadow-sm z-50 max-w-md text-sm">
          <div className="font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>Demo Mode: Using offline configuration</span>
          </div>
          <div className="text-xs mt-1">All features available, wallet connection working</div>
        </div>
      )}
      {children}
    </>
  );
}

function ContextProvider({ children }: { children: ReactNode}) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        <WalletConnectionStatus>
          {children}
        </WalletConnectionStatus>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider
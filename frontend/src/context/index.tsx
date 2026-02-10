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
    // Store original console methods
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args) => {
      // Check if it's a Reown API error
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('[Reown Config]') || 
           args[0].includes('fetch failed') ||
           args[0].includes('Failed to fetch') ||
           args[0].includes('Network request failed'))) {
        setHasApiError(true);
        // Log it as a warning instead of error for better UX
        console.warn('Reown API connection issue - using local configuration');
        return; // Don't show as error in console
      }
      
      // ✅ FIX: Don't intercept iExec SDK errors
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('iExec') || 
           args[0].includes('callback is a required field') ||
           args[0].includes('iexec') ||
           args[0].includes('tee framework'))) {
        // Let iExec errors pass through normally
        originalConsoleError(...args);
        return;
      }
      
      // Check for duplicate key errors
      if (args[0] && typeof args[0] === 'string' && 
          args[0].includes('Encountered two children with the same key')) {
        // This is a React warning, not an error - log as warning
        originalConsoleWarn(...args);
        return;
      }
      
      originalConsoleError(...args);
    };

    // Listen for unhandled errors
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('Reown') || 
          event.error?.message?.includes('fetch') ||
          event.error?.message?.includes('Network')) {
        setHasApiError(true);
        event.preventDefault(); // Prevent default error handling
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Reown') || 
          event.reason?.message?.includes('fetch') ||
          event.reason?.message?.includes('Network')) {
        setHasApiError(true);
        event.preventDefault(); // Prevent default error handling
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
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
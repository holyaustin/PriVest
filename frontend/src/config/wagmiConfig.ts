import { http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { createAppKit } from '@reown/appkit/react'
import wagmiNetworks from './wagmiNetworks'
import { AppKitNetwork } from '@reown/appkit/networks'

// Get projectId from environment
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "demo-project-id-for-hackathon-privest"

// ✅ Convert networks to array with arbitrumSepolia first
const networks = Object.values(wagmiNetworks) as [AppKitNetwork, ...AppKitNetwork[]]

// ✅ Get arbitrumSepolia explicitly for default
const arbitrumSepoliaNetwork = networks[0] // This is arbitrumSepolia

// ✅ CORRECTED: Create WagmiAdapter with proper parameters
export const wagmiAdapter = new WagmiAdapter({
  // ⭐ CORRECTION: Use 'networks' not 'wagmi'
  networks: networks,
  transports: Object.fromEntries(
    networks.map((network) => [network.id, http()])
  ),
  projectId,
  ssr: true,
})

// ✅ Initialize AppKit with arbitrumSepolia as default
let appKitInitialized = false

export const initializeAppKit = () => {
  if (typeof window === 'undefined') return null
  
  if (!appKitInitialized) {
    try {
      // ✅ Create AppKit with arbitrumSepolia as defaultNetwork
      const appKit = createAppKit({
        adapters: [wagmiAdapter],
        projectId,
        networks,
        // ⭐ Set default network to arbitrumSepolia
        defaultNetwork: arbitrumSepoliaNetwork,
        features: {
          analytics: false, // ✅ Prevents ERR_BLOCKED_BY_CLIENT
          email: false,
          socials: false,
        },
        metadata: {
          name: 'PriVest',
          description: 'Confidential RWA Management Platform',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://privest-demo.vercel.app',
          icons: ['https://avatars.githubusercontent.com/u/37784886'],
        },
        themeMode: 'light',
        allWallets: 'HIDE',
        enableWalletGuide: false,
      })

      appKitInitialized = true
      
      console.log('✅ Wallet configured with default network: Arbitrum Sepolia (421614)')
      
      return appKit
    } catch (error) {
      console.warn('AppKit initialization warning:', error)
      return null
    }
  }
}
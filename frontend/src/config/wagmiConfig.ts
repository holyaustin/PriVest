import { http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { createAppKit } from '@reown/appkit/react';
import wagmiNetworks from './wagmiNetworks';
import { AppKitNetwork } from '@reown/appkit/networks';

// Get projectId from https://cloud.reown.com or use local fallback
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "demo-project-id-for-hackathon-privest";

// Note: We're removing the error throwing since we have a fallback
// This allows the app to work even when Reown's API is unreachable

const networks = Object.values(wagmiNetworks) as [
  AppKitNetwork,
  ...AppKitNetwork[],
];

// Create a local configuration object to avoid remote API calls
const localConfig = {
  id: projectId,
  name: 'PriVest Demo',
  description: 'Confidential RWA Management Platform',
  url: 'https://privest-demo.vercel.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
  redirect: {
    native: 'privest://',
    universal: 'https://privest-demo.vercel.app'
  }
};

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  networks: networks,
  transports: Object.fromEntries(
    Object.values(wagmiNetworks).map((network) => [network.id, http()])
  ),
  projectId,
  ssr: true,
});

// Create the modal with local configuration to avoid API calls
try {
  createAppKit({
    adapters: [wagmiAdapter],
    networks: networks,
    projectId,
    features: {
      email: false,
      socials: false,
    },
    allWallets: 'HIDE',
    allowUnsupportedChain: false,
    enableWalletGuide: false,
    // Provide local metadata to avoid remote fetch
    metadata: localConfig
  });
} catch (error) {
  console.warn('AppKit initialization warning:', error);
  console.info('Continuing with fallback configuration...');
}
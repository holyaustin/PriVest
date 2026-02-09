import {
  type AppKitNetwork,
  arbitrumSepolia,
  arbitrum,
} from '@reown/appkit/networks';

export { arbitrumSepolia, arbitrum } from '@reown/appkit/networks';

export const bellecour: AppKitNetwork = {
  id: 134, // Decimal format
  name: 'iExec Sidechain',
  nativeCurrency: {
    decimals: 18,
    name: 'xRLC',
    symbol: 'xRLC',
  },
  rpcUrls: {
    public: { http: ['https://bellecour.iex.ec'] },
    default: { http: ['https://bellecour.iex.ec'] },
  },
  blockExplorers: {
    etherscan: {
      name: 'Blockscout',
      url: 'https://blockscout-bellecour.iex.ec',
    },
    default: { name: 'Blockscout', url: 'https://blockscout-bellecour.iex.ec' },
  },
};

// ⭐ CRITICAL CHANGE: Arbitrum Sepolia FIRST for default
const wagmiNetworks = {
  arbitrumSepolia, // ✅ FIRST = Default (id: 421614)
  arbitrum,        // id: 42161
  bellecour,       // id: 134
};

export default wagmiNetworks;
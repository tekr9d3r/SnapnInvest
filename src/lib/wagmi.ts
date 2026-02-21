import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, mainnet, base, optimism } from 'wagmi/chains';
import { defineChain } from 'viem';

export const robinhoodChainTestnet = defineChain({
  id: 46630,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.testnet.chain.robinhood.com' },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: "Snap'n'Buy",
  // Public WalletConnect project ID for dev — replace with your own for production
  projectId: '04bdc5c261ea48939810f11a3da3768b',
  chains: [robinhoodChainTestnet, arbitrum, mainnet, base, optimism],
});

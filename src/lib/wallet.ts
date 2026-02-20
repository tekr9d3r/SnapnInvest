declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export const ROBINHOOD_CHAIN = {
  chainId: "0xB636", // 46630
  chainName: "Robinhood Chain Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.chain.robinhood.com", "https://sequencer.testnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://explorer.testnet.chain.robinhood.com"],
};

export async function connectWallet(): Promise<string | null> {
  if (!window.ethereum) {
    window.open("https://metamask.io/download/", "_blank");
    return null;
  }
  try {
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];
    return accounts[0] || null;
  } catch {
    return null;
  }
}

export async function getBalance(address: string): Promise<string> {
  if (!window.ethereum) return "0";
  try {
    const balance = (await window.ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    })) as string;
    const wei = BigInt(balance);
    const eth = Number(wei) / 1e18;
    return eth.toFixed(4);
  } catch {
    return "0.0000";
  }
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function generateTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

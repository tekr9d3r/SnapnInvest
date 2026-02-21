export const ROBINHOOD_CHAIN = {
  chainId: "0xB636", // 46630
  chainName: "Robinhood Chain Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.chain.robinhood.com", "https://sequencer.testnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://explorer.testnet.chain.robinhood.com"],
};

export async function getBalance(address: string): Promise<string> {
  // Always fetch from Robinhood Chain RPC, regardless of wallet's active chain
  try {
    const response = await fetch(ROBINHOOD_CHAIN.rpcUrls[0], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [address, "latest"],
        id: 1,
      }),
    });
    const data = await response.json();
    if (data.result) {
      const wei = BigInt(data.result);
      const eth = Number(wei) / 1e18;
      return eth.toFixed(4);
    }
    return "0.0000";
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

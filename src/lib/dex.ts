import { BrowserProvider, Contract, formatUnits, parseEther } from "ethers";

export const MOCK_SWAP_PAIR_ABI = [
  "function swapEthForTokens(uint256 minTokensOut, address to) external payable returns (uint256 tokensOut)",
  "function quoteEthForTokens(uint256 ethIn) external view returns (uint256 tokensOut)",
  "function getReserves() external view returns (uint256 reserveEth, uint256 reserveToken)",
];

export const ROBINHOOD_CHAIN_ID = 46630;
export const ROBINHOOD_CHAIN_HEX = "0xB636";
export const ROBINHOOD_RPC = "https://rpc.testnet.chain.robinhood.com";

// Apply slippage: bps=200 means 2%
export function applySlippage(amount: bigint, bps = 200n): bigint {
  return (amount * (10000n - bps)) / 10000n;
}

export function dollarToEthWei(dollarAmount: number, ethPriceUsd: number): bigint {
  const ethAmount = dollarAmount / ethPriceUsd;
  return parseEther(ethAmount.toFixed(8));
}

export async function fetchEthPrice(): Promise<number> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  );
  if (!res.ok) throw new Error("Failed to fetch ETH price");
  const data = await res.json();
  return data.ethereum.usd as number;
}

export async function quoteEthForTokens(
  poolAddress: string,
  ethAmountWei: bigint,
): Promise<bigint> {
  const { JsonRpcProvider } = await import("ethers");
  const provider = new JsonRpcProvider(ROBINHOOD_RPC);
  const pair = new Contract(poolAddress, MOCK_SWAP_PAIR_ABI, provider);
  return BigInt(await pair.quoteEthForTokens(ethAmountWei));
}

export async function executeSwap(
  poolAddress: string,
  ethAmountWei: bigint,
  minTokensOut: bigint,
  recipientAddress: string,
  eip1193Provider: unknown,
): Promise<{ hash: string; tokensReceived: string }> {
  const ethersProvider = new BrowserProvider(eip1193Provider as Parameters<typeof BrowserProvider>[0]);

  // Switch to Robinhood Chain, adding it first if the wallet doesn't know it
  const network = await ethersProvider.getNetwork();
  if (network.chainId !== BigInt(ROBINHOOD_CHAIN_ID)) {
    try {
      await ethersProvider.send("wallet_switchEthereumChain", [
        { chainId: ROBINHOOD_CHAIN_HEX },
      ]);
    } catch (err: any) {
      if (err?.code === 4902 || err?.error?.code === 4902) {
        await ethersProvider.send("wallet_addEthereumChain", [
          {
            chainId: ROBINHOOD_CHAIN_HEX,
            chainName: "Robinhood Chain Testnet",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: [ROBINHOOD_RPC],
            blockExplorerUrls: ["https://explorer.testnet.chain.robinhood.com"],
          },
        ]);
      } else {
        throw err;
      }
    }
  }

  const signer = await ethersProvider.getSigner();
  const pair = new Contract(poolAddress, MOCK_SWAP_PAIR_ABI, signer);

  const tx = await pair.swapEthForTokens(minTokensOut, recipientAddress, {
    value: ethAmountWei,
  });
  const receipt = await tx.wait();

  return {
    hash: receipt.hash as string,
    tokensReceived: formatUnits(minTokensOut, 18),
  };
}

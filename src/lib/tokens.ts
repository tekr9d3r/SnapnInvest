import { ROBINHOOD_CHAIN } from "./wallet";

export const STOCK_TOKENS = [
  { ticker: "TSLA", name: "Tesla", contract: "0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E" },
  { ticker: "AMZN", name: "Amazon", contract: "0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02" },
  { ticker: "PLTR", name: "Palantir", contract: "0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0" },
  { ticker: "NFLX", name: "Netflix", contract: "0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93" },
  { ticker: "AMD", name: "AMD", contract: "0x71178BAc73cBeb415514eB542a8995b82669778d" },
] as const;

// ERC-20 balanceOf(address) selector = 0x70a08231
const BALANCE_OF_SELECTOR = "0x70a08231";

// ERC-20 decimals() selector = 0x313ce567
const DECIMALS_SELECTOR = "0x313ce567";

function padAddress(address: string): string {
  return "0x" + address.slice(2).toLowerCase().padStart(64, "0");
}

async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(ROBINHOOD_CHAIN.rpcUrls[0], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  const data = await response.json();
  return data.result;
}

async function getTokenDecimals(contract: string): Promise<number> {
  try {
    const result = await rpcCall("eth_call", [
      { to: contract, data: DECIMALS_SELECTOR },
      "latest",
    ]);
    if (result && typeof result === "string" && result !== "0x") {
      return parseInt(result, 16);
    }
    return 18; // default
  } catch {
    return 18;
  }
}

async function getTokenBalance(contract: string, wallet: string): Promise<string> {
  try {
    const data = BALANCE_OF_SELECTOR + padAddress(wallet).slice(2);
    const result = await rpcCall("eth_call", [
      { to: contract, data },
      "latest",
    ]);
    if (result && typeof result === "string" && result !== "0x") {
      return result;
    }
    return "0x0";
  } catch {
    return "0x0";
  }
}

export interface TokenBalance {
  ticker: string;
  name: string;
  contract: string;
  balance: number;
  rawBalance: bigint;
  decimals: number;
}

export async function fetchAllTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
  const results = await Promise.all(
    STOCK_TOKENS.map(async (token) => {
      const [rawHex, decimals] = await Promise.all([
        getTokenBalance(token.contract, walletAddress),
        getTokenDecimals(token.contract),
      ]);
      const rawBalance = BigInt(rawHex);
      const balance = Number(rawBalance) / Math.pow(10, decimals);
      return {
        ticker: token.ticker,
        name: token.name,
        contract: token.contract,
        balance,
        rawBalance,
        decimals,
      };
    })
  );
  return results;
}

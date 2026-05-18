import stocksData from "@/data/stocks.json";

export interface DexStock {
  name: string;
  symbol: string;
  originalSymbol: string;
  tags: string[];
  tokenAddress: string;
  poolAddress: string;
}

export const STOCKS: DexStock[] = stocksData as DexStock[];

export function findStockBySymbol(ticker: string): DexStock | undefined {
  const upper = ticker.toUpperCase();
  return STOCKS.find(
    (s) => s.originalSymbol.toUpperCase() === upper || s.symbol.toUpperCase() === upper
  );
}

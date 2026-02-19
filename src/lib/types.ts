export interface Stock {
  ticker: string;
  name: string;
  logo: string;
  contractAddress: string;
  currentPrice: number;
}

export interface Holding {
  id: string;
  ticker: string;
  name: string;
  logo: string;
  amountInvested: number;
  shares: number;
  priceAtPurchase: number;
  date: string;
}

export interface PortfolioState {
  holdings: Holding[];
  totalInvested: number;
}

export const SUPPORTED_STOCKS: Stock[] = [
  {
    ticker: "TSLA",
    name: "Tesla",
    logo: "⚡",
    contractAddress: "0x1234...TSLA",
    currentPrice: 248.42,
  },
  {
    ticker: "AMZN",
    name: "Amazon",
    logo: "📦",
    contractAddress: "0x1234...AMZN",
    currentPrice: 185.63,
  },
  {
    ticker: "PLTR",
    name: "Palantir",
    logo: "🔮",
    contractAddress: "0x1234...PLTR",
    currentPrice: 22.87,
  },
  {
    ticker: "NFLX",
    name: "Netflix",
    logo: "🎬",
    contractAddress: "0x1234...NFLX",
    currentPrice: 628.15,
  },
  {
    ticker: "AMD",
    name: "AMD",
    logo: "💻",
    contractAddress: "0x1234...AMD",
    currentPrice: 154.32,
  },
];

export const BRAND_KEYWORDS: Record<string, string> = {
  tesla: "TSLA",
  tsla: "TSLA",
  "model 3": "TSLA",
  "model y": "TSLA",
  "model s": "TSLA",
  "model x": "TSLA",
  cybertruck: "TSLA",
  amazon: "AMZN",
  amzn: "AMZN",
  "prime video": "AMZN",
  "amazon prime": "AMZN",
  "whole foods": "AMZN",
  aws: "AMZN",
  palantir: "PLTR",
  pltr: "PLTR",
  netflix: "NFLX",
  nflx: "NFLX",
  amd: "AMD",
  radeon: "AMD",
  ryzen: "AMD",
  epyc: "AMD",
};

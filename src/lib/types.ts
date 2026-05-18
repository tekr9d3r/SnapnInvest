export interface Stock {
  ticker: string;
  name: string;
  logo: string;
  contractAddress: string;
  currentPrice: number;
  logoUrl?: string;
  poolAddress?: string;
  tokenAddress?: string;
}

export interface Holding {
  id: string;
  ticker: string;
  name: string;
  logo: string;
  logoUrl?: string;
  amountInvested: number;
  shares: number;
  priceAtPurchase: number;
  date: string;
  capturedImage?: string;
  txHash?: string;
  tokensReceived?: string;
  tokenAddress?: string;
  poolAddress?: string;
}

export interface PortfolioState {
  holdings: Holding[];
  totalInvested: number;
}

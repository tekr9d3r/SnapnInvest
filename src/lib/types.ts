export interface Stock {
  ticker: string;
  name: string;
  logo: string;
  contractAddress: string;
  currentPrice: number;
  logoUrl?: string;
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
  capturedImage?: string; // compressed base64 image taken at purchase
}

export interface PortfolioState {
  holdings: Holding[];
  totalInvested: number;
}

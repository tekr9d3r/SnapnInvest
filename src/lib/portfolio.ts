import { Holding, PortfolioState } from "./types";

const STORAGE_KEY = "snapnbuy_portfolio";

export function getPortfolio(): PortfolioState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { holdings: [], totalInvested: 0 };
    return JSON.parse(raw);
  } catch {
    return { holdings: [], totalInvested: 0 };
  }
}

export function addHolding(holding: Omit<Holding, "id" | "date">, capturedImage?: string): Holding {
  const portfolio = getPortfolio();
  const newHolding: Holding = {
    ...holding,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    ...(capturedImage ? { capturedImage } : {}),
  };
  portfolio.holdings.unshift(newHolding);
  portfolio.totalInvested += holding.amountInvested;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  return newHolding;
}

export function getPortfolioSummary() {
  const portfolio = getPortfolio();
  const grouped = new Map<string, {
    shares: number;
    invested: number;
    name: string;
    logoUrl?: string;
    priceAtPurchase: number;
    latestImage?: string;
  }>();

  for (const h of portfolio.holdings) {
    const existing = grouped.get(h.ticker) || {
      shares: 0,
      invested: 0,
      name: h.name,
      logoUrl: h.logoUrl,
      priceAtPurchase: h.priceAtPurchase,
      latestImage: h.capturedImage,
    };
    existing.shares += h.shares;
    existing.invested += h.amountInvested;
    // Keep the most recent purchase image (holdings are newest-first)
    if (!existing.latestImage && h.capturedImage) {
      existing.latestImage = h.capturedImage;
    }
    grouped.set(h.ticker, existing);
  }

  let totalValue = 0;
  const summaries = Array.from(grouped.entries()).map(([ticker, data]) => {
    const currentValue = data.shares * data.priceAtPurchase;
    totalValue += currentValue;
    return {
      ticker,
      name: data.name || ticker,
      logoUrl: data.logoUrl,
      shares: data.shares,
      invested: data.invested,
      currentValue,
      gainLoss: currentValue - data.invested,
      gainLossPercent: ((currentValue - data.invested) / data.invested) * 100,
      latestImage: data.latestImage,
    };
  });

  return {
    summaries,
    totalInvested: portfolio.totalInvested,
    totalValue,
    totalGainLoss: totalValue - portfolio.totalInvested,
  };
}

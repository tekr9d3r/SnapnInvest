import { Holding, PortfolioState, SUPPORTED_STOCKS } from "./types";

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

export function addHolding(holding: Omit<Holding, "id" | "date">): Holding {
  const portfolio = getPortfolio();
  const newHolding: Holding = {
    ...holding,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  portfolio.holdings.unshift(newHolding);
  portfolio.totalInvested += holding.amountInvested;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  return newHolding;
}

export function getPortfolioSummary() {
  const portfolio = getPortfolio();
  const grouped = new Map<string, { shares: number; invested: number }>();

  for (const h of portfolio.holdings) {
    const existing = grouped.get(h.ticker) || { shares: 0, invested: 0 };
    existing.shares += h.shares;
    existing.invested += h.amountInvested;
    grouped.set(h.ticker, existing);
  }

  let totalValue = 0;
  const summaries = Array.from(grouped.entries()).map(([ticker, data]) => {
    const stock = SUPPORTED_STOCKS.find((s) => s.ticker === ticker);
    const currentValue = data.shares * (stock?.currentPrice || 0);
    totalValue += currentValue;
    return {
      ticker,
      name: stock?.name || ticker,
      logo: stock?.logo || "📈",
      shares: data.shares,
      invested: data.invested,
      currentValue,
      gainLoss: currentValue - data.invested,
      gainLossPercent: ((currentValue - data.invested) / data.invested) * 100,
    };
  });

  return {
    summaries,
    totalInvested: portfolio.totalInvested,
    totalValue,
    totalGainLoss: totalValue - portfolio.totalInvested,
  };
}

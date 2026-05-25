import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { ticker } = req.body || {};
  if (!ticker || typeof ticker !== "string") return res.status(400).json({ error: "Ticker is required" });

  const symbol = ticker.toUpperCase().trim();

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

    if (!resp.ok) return res.status(404).json({ error: "Stock not found", ticker: symbol });

    const data = await resp.json();
    const result = data?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: "Stock not found", ticker: symbol });

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice ?? meta.previousClose ?? 0;
    const name = meta.shortName || meta.longName || meta.symbol || symbol;

    return res.status(200).json({
      ticker: symbol,
      name,
      currentPrice,
      logoUrl: `https://assets.parqet.com/logos/symbol/${symbol}`,
      currency: meta.currency || "USD",
    });
  } catch (e) {
    console.error("stock-lookup error:", e);
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}

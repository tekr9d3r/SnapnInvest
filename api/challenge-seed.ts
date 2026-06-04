import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// POST /api/challenge-seed — creates all three challenge tiers
// Safe to re-run: skips any challenge_type that already has an active entry.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" });

  const sql = neon(url);

  const existing = await sql`
    SELECT challenge_type FROM challenges WHERE active = true AND ends_at > now()`;
  const existingTypes = new Set(existing.map((r) => r.challenge_type as string));

  const created: string[] = [];

  // --- Weekly Sprint (5 stocks, 7 days) ---
  if (!existingTypes.has("weekly")) {
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 7);
    await sql`
      INSERT INTO challenges (name, description, tickers, prize, challenge_type, ends_at)
      VALUES (
        ${"Weekly Sprint"},
        ${"Find 5 iconic brands this week. Snap each one, mint the stock, and enter the raffle to win a free stock token!"},
        ${["AAPL", "MCD", "NKE", "SBUX", "TSLA"]},
        ${"1 free stock token"},
        ${"weekly"},
        ${endsAt.toISOString()}
      )`;
    created.push("weekly");
  }

  // --- Collector's Board (10 stocks, 30 days) ---
  if (!existingTypes.has("board")) {
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 30);
    await sql`
      INSERT INTO challenges (name, description, tickers, prize, challenge_type, ends_at)
      VALUES (
        ${"Collector's Board"},
        ${"Build your board! Snap 10 different brands across everyday life over the next 30 days to win $5 in free stocks."},
        ${["AAPL", "TSLA", "MCD", "NKE", "SBUX", "AMZN", "GOOGL", "META", "NFLX", "DIS"]},
        ${"$5 in free stock tokens"},
        ${"board"},
        ${endsAt.toISOString()}
      )`;
    created.push("board");
  }

  // --- Market Master / Grand Challenge (25 stocks, 90 days) ---
  if (!existingTypes.has("grand")) {
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 90);
    await sql`
      INSERT INTO challenges (name, description, tickers, prize, challenge_type, ends_at)
      VALUES (
        ${"Market Master"},
        ${"The ultimate challenge. Snap 25 brands across every sector of the economy over 90 days. Conquer the market and win $25 in free stocks."},
        ${["AAPL", "TSLA", "AMZN", "GOOGL", "MSFT", "META", "NFLX", "NVDA", "MCD", "NKE", "SBUX", "KO", "PEP", "DIS", "V", "JPM", "WMT", "COST", "AMD", "UBER", "ABNB", "SPOT", "SNAP", "HOOD", "RIVN"]},
        ${"$25 in free stock tokens"},
        ${"grand"},
        ${endsAt.toISOString()}
      )`;
    created.push("grand");
  }

  if (created.length === 0) {
    return res.status(200).json({ ok: true, message: "All challenge types already active", skipped: [...existingTypes] });
  }

  return res.status(201).json({ ok: true, created });
}

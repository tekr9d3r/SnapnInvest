import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// POST /api/challenge-seed — creates all four challenge types
// Safe to re-run: skips types that already have an active entry.
// Also deactivates any legacy 'board' challenges.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" });

  const sql = neon(url);

  // Deactivate any old Collector's Board challenges
  await sql`UPDATE challenges SET active = false WHERE challenge_type = 'board'`;

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
        ${"5 brands, 7 days. Snap each one in the real world, mint the stock, enter the raffle."},
        ${["AAPL", "MCD", "NKE", "SBUX", "TSLA"]},
        ${"1 TSLA"},
        ${"weekly"},
        ${endsAt.toISOString()}
      )`;
    created.push("weekly");
  }

  // --- Food & Drink Hunt (5 food stocks, 30 days) ---
  if (!existingTypes.has("food")) {
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 30);
    await sql`
      INSERT INTO challenges (name, description, tickers, prize, challenge_type, ends_at)
      VALUES (
        ${"Food & Drink Hunt"},
        ${"Find 5 of the world's biggest food and drink brands. Snap them, mint them, win free stock."},
        ${["MCD", "SBUX", "KO", "PEP", "CMG"]},
        ${"1 KO"},
        ${"food"},
        ${endsAt.toISOString()}
      )`;
    created.push("food");
  }

  // --- Fashion & Footwear Drop (5 fashion stocks, 30 days) ---
  if (!existingTypes.has("fashion")) {
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 30);
    await sql`
      INSERT INTO challenges (name, description, tickers, prize, challenge_type, ends_at)
      VALUES (
        ${"Fashion & Footwear Drop"},
        ${"Hunt down 5 iconic clothing and shoe brands in the wild. Snap, mint, and win free stock."},
        ${["NKE", "LULU", "RL", "UA", "PVH"]},
        ${"1 NKE"},
        ${"fashion"},
        ${endsAt.toISOString()}
      )`;
    created.push("fashion");
  }

  // --- Market Master / Grand Challenge (25 stocks, 90 days) ---
  if (!existingTypes.has("grand")) {
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 90);
    await sql`
      INSERT INTO challenges (name, description, tickers, prize, challenge_type, ends_at)
      VALUES (
        ${"Market Master"},
        ${"The ultimate hunt. 25 brands across every sector. 90 days. One grand prize."},
        ${["AAPL", "TSLA", "AMZN", "GOOGL", "MSFT", "META", "NFLX", "NVDA", "MCD", "NKE", "SBUX", "KO", "PEP", "DIS", "V", "JPM", "WMT", "COST", "AMD", "UBER", "ABNB", "SPOT", "SNAP", "HOOD", "RIVN"]},
        ${"5 AAPL"},
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

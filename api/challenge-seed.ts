import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// POST /api/challenge-seed  — creates the first Snap Hunt challenge
// Call once after db-init. Safe to re-run (won't duplicate if active challenge exists).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" });

  const sql = neon(url);

  // Check if an active challenge already exists
  const existing = await sql`SELECT id FROM challenges WHERE active = true LIMIT 1`;
  if (existing.length > 0) {
    return res.status(200).json({ ok: true, message: "Active challenge already exists", id: existing[0].id });
  }

  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 7); // 7-day challenge

  const rows = await sql`
    INSERT INTO challenges (name, description, tickers, prize, ends_at)
    VALUES (
      ${"Snap Hunt #1"},
      ${"Find these 5 iconic brands in the real world. Snap each one, mint the stock, and enter the raffle to win 1 TSLA token!"},
      ${["AAPL", "MCD", "NKE", "SBUX", "TSLA"]},
      ${"1 TSLA token sent to your wallet"},
      ${endsAt.toISOString()}
    )
    RETURNING id`;

  return res.status(201).json({ ok: true, id: rows[0].id });
}

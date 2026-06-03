import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

// GET /api/leaderboard
// Returns top hunters ranked by challenge completions + total mints
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const sql = getDb();

    // Get active challenge tickers
    const challenges = await sql`
      SELECT id, tickers, starts_at, ends_at
      FROM challenges
      WHERE active = true AND ends_at > now()
      ORDER BY created_at DESC
      LIMIT 1`;

    const challenge = challenges[0] || null;
    const tickers: string[] = challenge?.tickers ?? [];

    // Per-user stats: total snaps, unique stocks, challenge progress
    const rows = await sql`
      SELECT
        h.user_id,
        COUNT(*)::int AS total_snaps,
        COUNT(DISTINCT h.ticker)::int AS unique_stocks,
        COUNT(DISTINCT CASE
          WHEN ${tickers.length} > 0
            AND h.ticker = ANY(${tickers.length > 0 ? tickers : ['__none__']})
            AND (${challenge ? challenge.starts_at : 'now()'::text}::timestamptz IS NULL OR h.created_at >= ${challenge?.starts_at ?? 'now()'}::timestamptz)
          THEN h.ticker
        END)::int AS challenge_progress,
        MAX(h.created_at) AS last_snap_at
      FROM holdings h
      GROUP BY h.user_id
      ORDER BY challenge_progress DESC, total_snaps DESC
      LIMIT 50`;

    const leaderboard = rows.map((r, i) => ({
      rank: i + 1,
      user_id: r.user_id as string,
      total_snaps: r.total_snaps as number,
      unique_stocks: r.unique_stocks as number,
      challenge_progress: r.challenge_progress as number,
      challenge_total: tickers.length,
      completed: (r.challenge_progress as number) >= tickers.length && tickers.length > 0,
      last_snap_at: r.last_snap_at as string,
    }));

    return res.status(200).json({ leaderboard, challenge_tickers: tickers });
  } catch (e) {
    console.error("leaderboard error:", e);
    return res.status(500).json({ error: e instanceof Error ? e.message : "DB error" });
  }
}

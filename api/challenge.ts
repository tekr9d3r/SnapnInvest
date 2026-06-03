import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

// GET /api/challenge?userId=0x...
// Returns active challenge + user's progress on it
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const sql = getDb();
    const userId = req.query.userId as string | undefined;

    // Get active challenge
    const challenges = await sql`
      SELECT id, name, description, tickers, prize, starts_at, ends_at
      FROM challenges
      WHERE active = true AND ends_at > now()
      ORDER BY created_at DESC
      LIMIT 1`;

    if (challenges.length === 0) {
      return res.status(200).json({ challenge: null, progress: [], completedCount: 0 });
    }

    const challenge = challenges[0];

    // Count how many unique users have minted ALL required tickers during the challenge window
    const tickers = challenge.tickers as string[];
    const completedRows = await sql`
      SELECT user_id, COUNT(DISTINCT ticker) as minted_count
      FROM holdings
      WHERE ticker = ANY(${tickers})
        AND created_at >= ${challenge.starts_at}
        AND created_at <= ${challenge.ends_at}
      GROUP BY user_id
      HAVING COUNT(DISTINCT ticker) >= ${tickers.length}`;

    const completedCount = completedRows.length;

    // User's progress: which of the required tickers have they minted during the challenge window?
    let userMinted: string[] = [];
    if (userId) {
      const userRows = await sql`
        SELECT DISTINCT ticker
        FROM holdings
        WHERE user_id = ${userId}
          AND ticker = ANY(${tickers})
          AND created_at >= ${challenge.starts_at}
          AND created_at <= ${challenge.ends_at}`;
      userMinted = userRows.map((r) => r.ticker as string);
    }

    return res.status(200).json({
      challenge: {
        id: challenge.id,
        name: challenge.name,
        description: challenge.description,
        tickers,
        prize: challenge.prize,
        starts_at: challenge.starts_at,
        ends_at: challenge.ends_at,
      },
      progress: userMinted,
      completedCount,
    });
  } catch (e) {
    console.error("challenge GET error:", e);
    return res.status(500).json({ error: e instanceof Error ? e.message : "DB error" });
  }
}

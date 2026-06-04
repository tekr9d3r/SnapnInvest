import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

// GET /api/challenges?userId=0x...
// Returns all active challenges with per-user progress and enrollment status
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const sql = getDb();
    const userId = req.query.userId as string | undefined;

    const rows = await sql`
      SELECT id, name, description, tickers, prize, challenge_type, starts_at, ends_at
      FROM challenges
      WHERE active = true AND ends_at > now()
      ORDER BY
        CASE challenge_type
          WHEN 'weekly' THEN 1
          WHEN 'board' THEN 2
          WHEN 'grand' THEN 3
          ELSE 4
        END,
        created_at DESC`;

    if (rows.length === 0) {
      return res.status(200).json({ challenges: [] });
    }

    const challenges = await Promise.all(
      rows.map(async (challenge) => {
        const tickers = challenge.tickers as string[];

        const completedRows = await sql`
          SELECT user_id, COUNT(DISTINCT ticker) as minted_count
          FROM holdings
          WHERE ticker = ANY(${tickers})
            AND created_at >= ${challenge.starts_at}
            AND created_at <= ${challenge.ends_at}
          GROUP BY user_id
          HAVING COUNT(DISTINCT ticker) >= ${tickers.length}`;

        let userMinted: string[] = [];
        let enrolled = false;

        if (userId) {
          const userRows = await sql`
            SELECT DISTINCT ticker
            FROM holdings
            WHERE user_id = ${userId}
              AND ticker = ANY(${tickers})
              AND created_at >= ${challenge.starts_at}
              AND created_at <= ${challenge.ends_at}`;
          userMinted = userRows.map((r) => r.ticker as string);

          const enrollmentRows = await sql`
            SELECT id FROM user_challenge_enrollments
            WHERE user_id = ${userId} AND challenge_id = ${challenge.id}
            LIMIT 1`;
          enrolled = enrollmentRows.length > 0;
        }

        return {
          id: challenge.id,
          name: challenge.name,
          description: challenge.description,
          tickers,
          prize: challenge.prize,
          challenge_type: challenge.challenge_type,
          starts_at: challenge.starts_at,
          ends_at: challenge.ends_at,
          progress: userMinted,
          completedCount: completedRows.length,
          enrolled,
        };
      })
    );

    return res.status(200).json({ challenges });
  } catch (e) {
    console.error("challenges GET error:", e);
    return res.status(500).json({ error: e instanceof Error ? e.message : "DB error" });
  }
}

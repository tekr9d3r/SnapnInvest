import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

// GET /api/challenges?userId=0x...  → all active challenges with progress
// POST /api/challenges  body: { userId, challengeId, email }  → enroll user
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  const sql = getDb();

  // --- POST: enroll user in challenge ---
  if (req.method === "POST") {
    try {
      const { userId, challengeId, email } = req.body ?? {};
      if (!userId || !challengeId || !email) {
        return res.status(400).json({ error: "userId, challengeId, and email are required" });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      await sql`
        INSERT INTO user_challenge_enrollments (user_id, challenge_id, email)
        VALUES (${userId}, ${challengeId}, ${email})
        ON CONFLICT (user_id, challenge_id) DO NOTHING`;

      await sql`
        INSERT INTO profiles (user_id, email, created_at)
        VALUES (${userId}, ${email}, now())
        ON CONFLICT (user_id) DO UPDATE
          SET email = COALESCE(profiles.email, EXCLUDED.email)`;

      return res.status(200).json({ enrolled: true });
    } catch (e) {
      console.error("challenges POST error:", e);
      return res.status(500).json({ error: e instanceof Error ? e.message : "DB error" });
    }
  }

  // --- GET: list all active challenges ---
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const userId = req.query.userId as string | undefined;

    // Add column if it doesn't exist yet (safe migration)
    await sql`ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenge_type TEXT NOT NULL DEFAULT 'weekly'`;

    const rows = await sql`
      SELECT id, name, description, tickers, prize, challenge_type, starts_at, ends_at
      FROM challenges
      WHERE active = true AND ends_at > now()
      ORDER BY
        CASE challenge_type
          WHEN 'food'    THEN 1
          WHEN 'weekly'  THEN 2
          WHEN 'fashion' THEN 3
          WHEN 'grand'   THEN 4
          ELSE 5
        END,
        created_at DESC`;

    if (rows.length === 0) {
      return res.status(200).json({ challenges: [] });
    }

    const challenges = await Promise.all(
      rows.map(async (challenge) => {
        const tickers = challenge.tickers as string[];

        const completedRows = await sql`
          SELECT user_id
          FROM holdings
          WHERE ticker = ANY(${tickers})
            AND created_at >= ${challenge.starts_at}
            AND created_at <= ${challenge.ends_at}
          GROUP BY user_id
          HAVING COUNT(DISTINCT ticker) >= ${tickers.length}`;

        let userMinted: string[] = [];
        let snapPhotos: Record<string, string> = {};
        let enrolled = false;

        if (userId) {
          // Most recent holding per ticker — also captures photo URL in one query
          const userRows = await sql`
            SELECT DISTINCT ON (ticker) ticker, captured_image_url
            FROM holdings
            WHERE user_id = ${userId}
              AND ticker = ANY(${tickers})
              AND created_at >= ${challenge.starts_at}
              AND created_at <= ${challenge.ends_at}
            ORDER BY ticker, created_at DESC`;

          for (const r of userRows) {
            userMinted.push(r.ticker as string);
            if (r.captured_image_url) {
              snapPhotos[r.ticker as string] = r.captured_image_url as string;
            }
          }

          try {
            const enrollmentRows = await sql`
              SELECT id FROM user_challenge_enrollments
              WHERE user_id = ${userId} AND challenge_id = ${challenge.id}
              LIMIT 1`;
            enrolled = enrollmentRows.length > 0;
          } catch {
            // table may not exist yet
          }
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
          snapPhotos,
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

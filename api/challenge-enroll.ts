import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

// POST /api/challenge-enroll
// Body: { userId, challengeId, email }
// Enrolls user in challenge and saves email to profile
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { userId, challengeId, email } = req.body ?? {};

    if (!userId || !challengeId || !email) {
      return res.status(400).json({ error: "userId, challengeId, and email are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const sql = getDb();

    await sql`
      INSERT INTO user_challenge_enrollments (user_id, challenge_id, email)
      VALUES (${userId}, ${challengeId}, ${email})
      ON CONFLICT (user_id, challenge_id) DO NOTHING`;

    // Upsert profile with email (only update email if not already set)
    await sql`
      INSERT INTO profiles (user_id, email, created_at)
      VALUES (${userId}, ${email}, now())
      ON CONFLICT (user_id) DO UPDATE
        SET email = COALESCE(profiles.email, EXCLUDED.email)`;

    return res.status(200).json({ enrolled: true });
  } catch (e) {
    console.error("challenge-enroll error:", e);
    return res.status(500).json({ error: e instanceof Error ? e.message : "DB error" });
  }
}

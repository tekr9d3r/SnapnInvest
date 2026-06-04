import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

// GET /api/profile?userId=0x...  → returns { email, username }
// PATCH /api/profile  body: { userId, email } → upserts profile
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  const sql = getDb();

  if (req.method === "GET") {
    const userId = req.query.userId as string | undefined;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const rows = await sql`
      SELECT user_id, username, email FROM profiles WHERE user_id = ${userId} LIMIT 1`;

    if (rows.length === 0) return res.status(200).json({ email: null, username: null });
    return res.status(200).json({ email: rows[0].email ?? null, username: rows[0].username ?? null });
  }

  if (req.method === "PATCH") {
    const { userId, email } = req.body ?? {};
    if (!userId) return res.status(400).json({ error: "userId is required" });

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }
      await sql`
        INSERT INTO profiles (user_id, email, created_at)
        VALUES (${userId}, ${email}, now())
        ON CONFLICT (user_id) DO UPDATE SET email = ${email}`;
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

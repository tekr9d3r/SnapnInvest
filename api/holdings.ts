import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    try {
      const sql = getDb();
      const userId = req.query.userId as string | undefined;
      const limit = Math.min(parseInt((req.query.limit as string) || "50"), 200);

      const rows = userId
        ? await sql`
            SELECT id, ticker, name, logo_url, amount_invested, shares, price_at_purchase,
                   captured_image_url, tx_hash, created_at, user_id
            FROM holdings
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT ${limit}`
        : await sql`
            SELECT id, ticker, name, logo_url, amount_invested, shares, price_at_purchase,
                   captured_image_url, tx_hash, created_at, user_id
            FROM holdings
            ORDER BY created_at DESC
            LIMIT ${limit}`;

      return res.status(200).json(rows);
    } catch (e) {
      console.error("holdings GET error:", e);
      return res.status(500).json({ error: e instanceof Error ? e.message : "DB error" });
    }
  }

  if (req.method === "POST") {
    try {
      const sql = getDb();
      const { user_id, ticker, name, logo_url, amount_invested, shares, price_at_purchase, captured_image_url, tx_hash } = req.body || {};

      if (!user_id || !ticker) return res.status(400).json({ error: "user_id and ticker are required" });

      const rows = await sql`
        INSERT INTO holdings (user_id, ticker, name, logo_url, amount_invested, shares, price_at_purchase, captured_image_url, tx_hash)
        VALUES (${user_id}, ${ticker}, ${name || null}, ${logo_url || null}, ${amount_invested || null},
                ${shares || null}, ${price_at_purchase || null}, ${captured_image_url || null}, ${tx_hash || null})
        RETURNING id, created_at`;

      return res.status(201).json(rows[0]);
    } catch (e) {
      console.error("holdings POST error:", e);
      return res.status(500).json({ error: e instanceof Error ? e.message : "DB error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

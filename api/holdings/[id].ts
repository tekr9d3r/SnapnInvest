import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
};

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).setHeaders(corsHeaders).end();
  }

  if (req.method !== "DELETE") {
    return res.status(405).setHeaders(corsHeaders).json({ error: "Method not allowed" });
  }

  const id = req.query.id as string;
  const { userId } = req.body || {};

  if (!id || !userId) {
    return res.status(400).setHeaders(corsHeaders).json({ error: "id and userId are required" });
  }

  try {
    const sql = getDb();
    const result = await sql`
      DELETE FROM holdings
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id`;

    if (result.length === 0) {
      return res.status(404).setHeaders(corsHeaders).json({ error: "Not found or not authorized" });
    }

    return res.status(200).setHeaders(corsHeaders).json({ deleted: id });
  } catch (e) {
    console.error("holdings DELETE error:", e);
    return res.status(500).setHeaders(corsHeaders).json({ error: e instanceof Error ? e.message : "DB error" });
  }
}

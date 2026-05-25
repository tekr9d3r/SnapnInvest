import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  if (req.method !== "POST") {
    return res.status(405).setHeaders(corsHeaders).json({ error: "Method not allowed" });
  }

  const { email } = req.body || {};
  if (!email || typeof email !== "string") {
    return res.status(400).setHeaders(corsHeaders).json({ error: "email is required" });
  }

  try {
    const sql = getDb();
    await sql`
      INSERT INTO beta_signups (email)
      VALUES (${email.toLowerCase().trim()})
      ON CONFLICT (email) DO NOTHING`;

    return res.status(200).setHeaders(corsHeaders).json({ ok: true });
  } catch (e) {
    console.error("beta-signups error:", e);
    return res.status(500).setHeaders(corsHeaders).json({ error: e instanceof Error ? e.message : "DB error" });
  }
}

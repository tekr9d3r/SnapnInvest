import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" });

  const sql = neon(url);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS holdings (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        ticker TEXT NOT NULL,
        name TEXT,
        logo_url TEXT,
        amount_invested NUMERIC,
        shares NUMERIC,
        price_at_purchase NUMERIC,
        captured_image_url TEXT,
        tx_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    await sql`
      CREATE TABLE IF NOT EXISTS beta_signups (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    await sql`
      CREATE TABLE IF NOT EXISTS challenges (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        tickers TEXT[] NOT NULL,
        prize TEXT NOT NULL,
        challenge_type TEXT NOT NULL DEFAULT 'weekly',
        starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        ends_at TIMESTAMPTZ NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    await sql`ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenge_type TEXT NOT NULL DEFAULT 'weekly'`;

    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT NOT NULL PRIMARY KEY,
        username TEXT,
        email TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT`;

    await sql`
      CREATE TABLE IF NOT EXISTS user_challenge_enrollments (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        challenge_id UUID NOT NULL REFERENCES challenges(id),
        email TEXT NOT NULL,
        enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(user_id, challenge_id)
      )`;

    return res.status(200).json({ ok: true, message: "Tables created (or already exist)" });
  } catch (e) {
    console.error("db-init error:", e);
    return res.status(500).json({ error: e instanceof Error ? e.message : "DB error" });
  }
}

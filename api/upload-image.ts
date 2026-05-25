import { put } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { image, userId, ticker } = req.body || {};
  if (!image || !userId || !ticker) return res.status(400).json({ error: "image, userId, and ticker are required" });

  try {
    const match = (image as string).match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: "Invalid image format" });

    const buffer = Buffer.from(match[2], "base64");
    const filename = `${userId}/${Date.now()}_${ticker}.jpg`;

    const blob = await put(filename, buffer, { access: "public", contentType: "image/jpeg" });
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    console.error("upload-image error:", e);
    return res.status(500).json({ error: e instanceof Error ? e.message : "Upload failed" });
  }
}

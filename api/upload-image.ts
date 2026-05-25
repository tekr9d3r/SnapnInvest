import { put } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).setHeaders(corsHeaders).end();
  }
  if (req.method !== "POST") {
    return res.status(405).setHeaders(corsHeaders).json({ error: "Method not allowed" });
  }

  const { image, userId, ticker } = req.body || {};
  if (!image || !userId || !ticker) {
    return res.status(400).setHeaders(corsHeaders).json({ error: "image, userId, and ticker are required" });
  }

  try {
    // Decode base64 data URL
    const match = (image as string).match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return res.status(400).setHeaders(corsHeaders).json({ error: "Invalid image format" });
    }
    const buffer = Buffer.from(match[2], "base64");
    const filename = `${userId}/${Date.now()}_${ticker}.jpg`;

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: "image/jpeg",
    });

    return res.status(200).setHeaders(corsHeaders).json({ url: blob.url });
  } catch (e) {
    console.error("upload-image error:", e);
    return res.status(500).setHeaders(corsHeaders).json({ error: e instanceof Error ? e.message : "Upload failed" });
  }
}

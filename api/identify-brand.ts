import Anthropic from "@anthropic-ai/sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { image } = req.body || {};
  if (!image) return res.status(400).json({ error: "No image provided" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });

  const match = (image as string).match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: "Invalid image format" });

  const mediaType = match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const base64Data = match[2];

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: `You are a brand identification AI. Analyze the image and determine if it contains any product, logo, or branding related to a publicly traded company on US stock exchanges (NYSE, NASDAQ).

You MUST respond with ONLY a valid JSON object — no markdown, no explanation, no code blocks:
- If a publicly traded company is found: {"ticker": "AAPL", "name": "Apple", "confidence": 0.95}
- If no publicly traded company is found: {"ticker": null, "name": null, "confidence": 0}

Rules:
- Return the official US stock ticker symbol for ANY publicly traded company you recognize
- Include the company name
- This includes: tech companies, car brands, food brands, retail stores, airlines, banks, pharmaceuticals, clothing, etc.
- Look for logos, products, packaging, storefronts, vehicles, devices, clothing brands, etc.
- confidence should be between 0 and 1
- Only return companies actually traded on US exchanges`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            {
              type: "text",
              text: "What brand or company is shown in this image? Return the JSON object with the stock ticker.",
            },
          ],
        },
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(200).json({ ticker: null, name: null, confidence: 0 });

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);
  } catch (e) {
    console.error("identify-brand error:", e);
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}

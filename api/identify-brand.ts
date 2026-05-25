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

  const { image } = req.body || {};
  if (!image) {
    return res.status(400).setHeaders(corsHeaders).json({ error: "No image provided" });
  }

  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) {
    return res.status(500).setHeaders(corsHeaders).json({ error: "LOVABLE_API_KEY is not configured" });
  }

  const match = (image as string).match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return res.status(400).setHeaders(corsHeaders).json({ error: "Invalid image format" });
  }
  const mimeType = match[1];
  const base64Data = match[2];

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-preview-05-20",
        messages: [
          {
            role: "system",
            content: `You are a brand identification AI. Analyze the image and determine if it contains any product, logo, or branding related to a publicly traded company on US stock exchanges (NYSE, NASDAQ).

Respond ONLY with a JSON object in this exact format:
- If a publicly traded company is found: {"ticker": "AAPL", "name": "Apple", "confidence": 0.95}
- If no publicly traded company is found: {"ticker": null, "name": null, "confidence": 0}

Rules:
- Return the official US stock ticker symbol for ANY publicly traded company you recognize
- Include the company name
- This includes but is not limited to: tech companies, car brands, food brands, retail stores, airlines, banks, pharmaceuticals, etc.
- Look for logos, products, packaging, storefronts, vehicles, devices, clothing brands, etc.
- confidence should be between 0 and 1
- Only return companies actually traded on US exchanges`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "What brand or company is shown in this image? Identify the stock ticker." },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "identify_brand",
              description: "Return the identified brand ticker, company name, and confidence score",
              parameters: {
                type: "object",
                properties: {
                  ticker: { type: "string", description: "The US stock ticker of the identified brand, or null if no match", nullable: true },
                  name: { type: "string", description: "The company name, or null if no match", nullable: true },
                  confidence: { type: "number", description: "Confidence score between 0 and 1" },
                },
                required: ["ticker", "name", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "identify_brand" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).setHeaders(corsHeaders).json({ error: "Rate limit exceeded, please try again later." });
      }
      if (response.status === 402) {
        return res.status(402).setHeaders(corsHeaders).json({ error: "AI credits exhausted." });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return res.status(500).setHeaders(corsHeaders).json({ error: `AI gateway error: ${response.status}` });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return res.status(200).setHeaders(corsHeaders).json(result);
    }

    return res.status(200).setHeaders(corsHeaders).json({ ticker: null, name: null, confidence: 0 });
  } catch (e) {
    console.error("identify-brand error:", e);
    return res.status(500).setHeaders(corsHeaders).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}

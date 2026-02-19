import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORTED_TICKERS = ["TSLA", "AMZN", "PLTR", "NFLX", "AMD"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract base64 data and mime type from data URL
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return new Response(JSON.stringify({ error: "Invalid image format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a brand identification AI. Analyze the image and determine if it contains any product, logo, or branding related to these companies: Tesla (TSLA), Amazon (AMZN), Palantir (PLTR), Netflix (NFLX), or AMD (AMD).

Respond ONLY with a JSON object in this exact format:
- If a brand is found: {"ticker": "TSLA", "confidence": 0.95}
- If no supported brand is found: {"ticker": null, "confidence": 0}

Rules:
- Only return tickers from this list: TSLA, AMZN, PLTR, NFLX, AMD
- Tesla includes: Tesla cars, Powerwall, Supercharger, any Tesla logo
- Amazon includes: Amazon boxes, Prime, Alexa, Echo, Kindle, AWS, Whole Foods, Ring
- Palantir includes: Palantir logo, Gotham, Foundry
- Netflix includes: Netflix logo, Netflix on screens
- AMD includes: AMD logo, Radeon, Ryzen, EPYC chips
- confidence should be between 0 and 1`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "What brand or company is shown in this image? Identify the stock ticker.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "identify_brand",
                description:
                  "Return the identified brand ticker and confidence score",
                parameters: {
                  type: "object",
                  properties: {
                    ticker: {
                      type: "string",
                      enum: ["TSLA", "AMZN", "PLTR", "NFLX", "AMD"],
                      description:
                        "The stock ticker of the identified brand, or null if no match",
                      nullable: true,
                    },
                    confidence: {
                      type: "number",
                      description: "Confidence score between 0 and 1",
                    },
                  },
                  required: ["ticker", "confidence"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "identify_brand" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      // Validate ticker
      if (result.ticker && !SUPPORTED_TICKERS.includes(result.ticker)) {
        result.ticker = null;
        result.confidence = 0;
      }
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: no match
    return new Response(
      JSON.stringify({ ticker: null, confidence: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("identify-brand error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

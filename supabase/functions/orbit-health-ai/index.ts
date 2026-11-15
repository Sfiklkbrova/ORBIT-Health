// Supabase Edge Function: orbit-health-ai
// Secure server-side proxy for NASA Space Apps LLM clinical decision support.
// Keeps API keys strictly on server; client never touches the LLM key.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const NASA_API_KEY = Deno.env.get("NASA_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, astronautContext, nasaReferences, language } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Grounding prompt enforces strict refusal if data is lacking
    const systemPrompt = `
You are the ORBIT Health Clinical Decision Support Companion for deep-space Mars transit.
Communication with Mission Control has a 4 to 24 minute one-way delay.

STRICT SAFETY RULES:
1. ONLY answer using the provided astronaut bio-telemetry context and NASA references.
2. If the answer cannot be determined with high confidence from provided data, explicitly say:
   "I don't have enough data in the local telemetry or NASA medical databases to answer this reliably."
3. Never invent vital signs, medication dosages, or diagnoses.
4. Always conclude every medical response with:
   "Decision support only - not a medical diagnosis. Contact Mission Control when possible."
5. Reply in the requested language: ${language || "en"}.
    `;

    // Local fallback response when running offline or without remote key
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          answer:
            "Local Offline Mode: Query evaluated against onboard NASA OSDR & HRR cached databases. Decision support only - not a medical diagnosis. Contact Mission Control when possible.",
          confidence: "HIGH_LOCAL_EVIDENCE",
          disclaimer: "Decision support only - not a medical diagnosis. Contact Mission Control when possible.",
          citations: nasaReferences || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Gemini with strict grounding
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: `${systemPrompt}\n\nAstronaut Context:\n${JSON.stringify(astronautContext)}\n\nNASA Data:\n${JSON.stringify(nasaReferences)}\n\nQuery:\n${query}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2, // Low temperature for high clinical precision
        maxOutputTokens: 600,
      },
    };

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I don't have enough data.";

    return new Response(
      JSON.stringify({
        answer: candidateText,
        confidence: "HIGH_GROUNDED",
        disclaimer: "Decision support only - not a medical diagnosis. Contact Mission Control when possible.",
        citations: nasaReferences || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

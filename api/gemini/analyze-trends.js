// api/gemini/analyze-trends.js
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res
      .status(500)
      .json({ error: "Server configuration error: GEMINI_API_KEY is missing." });
  }

  try {
    const { brandName, idea, creativeIdeas } = req.body ?? {};
    console.log("[analyze-trends] incoming payload", req.body);

    if (!brandName) {
      return res.status(400).json({ error: "Brand name is required" });
    }

    const ideaSet = new Set();

    if (typeof idea === "string" && idea.trim().length > 0) {
      ideaSet.add(idea.trim());
    }

    if (Array.isArray(creativeIdeas)) {
      creativeIdeas.forEach((entry) => {
        if (typeof entry === "string" && entry.trim().length > 0) {
          ideaSet.add(entry.trim());
        }
      });
    } else if (typeof creativeIdeas === "string" && creativeIdeas.trim().length > 0) {
      ideaSet.add(creativeIdeas.trim());
    }

    const ideas = Array.from(ideaSet);
    console.log("[analyze-trends] normalized ideas", ideas);

    if (ideas.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one creative idea is required" });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = `You are a cultural trend strategist. A brand is evaluating the resonance of a creative concept and needs a grounded analysis.
Brand: "${brandName}"
Creative ideas to analyse:
${ideas.map((entry, index) => `${index + 1}. ${entry}`).join("\n")}

For the strongest overall opportunity across these ideas, provide:
- A numerical "trend intensity score" between 0 and 100 (higher means stronger cultural alignment right now)
- A brief rationale explaining how the idea taps into the moment
- Structured analysis covering:
  • Trend & brand fit mapping (bullet list)
  • Influencer & node IDs to activate (bullet list)
  • Activation concepts (bullet list)
  • Distribution hooks & hacks (bullet list)
- 3 to 5 grounded web sources that support the assessment (include title and URL).

Respond strictly as JSON conforming to the provided schema.`;

    const analysisSchema = {
      type: Type.OBJECT,
      properties: {
        analysis: {
          type: Type.OBJECT,
          properties: {
            trend_brand_fit_mapping: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            influencer_and_node_id: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            activation_concepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            distribution_hooks_and_hacks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "trend_brand_fit_mapping",
            "influencer_and_node_id",
            "activation_concepts",
            "distribution_hooks_and_hacks",
          ],
        },
        sources: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              web: {
                type: Type.OBJECT,
                properties: {
                  uri: { type: Type.STRING },
                  title: { type: Type.STRING },
                },
              },
            },
            required: ["web"],
          },
        },
        score: {
          type: Type.NUMBER,
          description: "Trend intensity score between 0 and 100",
        },
        rationale: {
          type: Type.STRING,
        },
      },
      required: ["analysis", "sources", "score", "rationale"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const textValue =
      typeof response.text === "function" ? await response.text() : response.text;
    const raw =
      typeof textValue === "string"
        ? textValue.trim()
        : JSON.stringify(textValue ?? "");

    if (!raw) {
      throw new Error("Empty response from Gemini analyze-trends");
    }

    const parsed = JSON.parse(raw);

    res.json(parsed);
  } catch (error) {
    console.error("Error analyzing trends:", error);
    res.status(500).json({
      error: "Failed to analyze trends.",
      detail: error?.message,
    });
  }
}

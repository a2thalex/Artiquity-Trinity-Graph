// api/gemini/synchronicity-dashboard.js
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
  }

  try {
    const { creativeOutput } = req.body;

    if (!creativeOutput) {
      return res.status(400).json({ error: 'Creative output is required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `Analyze the synchronicity and cultural trends for this creative output: ${JSON.stringify(creativeOutput)}.

    Provide insights on trend matching, audience analysis, and format suggestions.`;

    const synchronicitySchema = {
      type: Type.OBJECT,
      properties: {
        analysis: {
          type: Type.OBJECT,
          properties: {
            trend_matches: { type: Type.ARRAY, items: { type: Type.STRING } },
            audience_nodes: { type: Type.ARRAY, items: { type: Type.STRING } },
            format_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        insights: {
          type: Type.OBJECT,
          properties: {
            cultural_relevance: { type: Type.ARRAY, items: { type: Type.STRING } },
            timing_considerations: { type: Type.ARRAY, items: { type: Type.STRING } },
            market_opportunities: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: synchronicitySchema,
      },
    });

    const result = JSON.parse(response.text.trim());
    res.json(result);

  } catch (error) {
    console.error('Error generating synchronicity dashboard:', error);
    res.status(500).json({ error: 'Failed to generate synchronicity dashboard.' });
  }
}

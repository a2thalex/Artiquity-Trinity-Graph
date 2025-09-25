// api/gemini/analyze-trends.js
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
    const { brandName, creativeIdeas } = req.body;

    if (!brandName || !creativeIdeas) {
      return res.status(400).json({ error: 'Brand name and creative ideas are required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `Analyze the cultural trends and synchronicity for the brand "${brandName}" based on these creative ideas: ${JSON.stringify(creativeIdeas)}.

    Provide insights on how these ideas align with current cultural trends, timing, and market opportunities.`;

    const trendsAnalysisSchema = {
      type: Type.OBJECT,
      properties: {
        trend_analysis: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Current cultural trends relevant to the brand"
        },
        timing_insights: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Optimal timing and market conditions"
        },
        audience_insights: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Target audience and demographic insights"
        },
        competitive_landscape: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Competitive positioning and opportunities"
        }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: trendsAnalysisSchema,
      },
    });

    const result = JSON.parse(response.text.trim());
    res.json(result);

  } catch (error) {
    console.error('Error analyzing trends:', error);
    res.status(500).json({ error: 'Failed to analyze trends.' });
  }
}

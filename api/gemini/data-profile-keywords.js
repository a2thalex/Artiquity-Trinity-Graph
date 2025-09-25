// api/gemini/data-profile-keywords.js
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
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `Based on this description: "${description}", generate a data profile with keywords and suggestions for data marketplace.`;

    const dataProfileSchema = {
      type: Type.OBJECT,
      properties: {
        profile: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimated_size: { type: Type.STRING },
            quality_indicators: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        suggestions: {
          type: Type.OBJECT,
          properties: {
            pricing_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            target_markets: { type: Type.ARRAY, items: { type: Type.STRING } },
            licensing_options: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: dataProfileSchema,
      },
    });

    const result = JSON.parse(response.text.trim());
    res.json(result);

  } catch (error) {
    console.error('Error generating data profile and keywords:', error);
    res.status(500).json({ error: 'Failed to generate data profile and keywords.' });
  }
}

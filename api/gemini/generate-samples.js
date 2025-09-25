// api/gemini/generate-samples.js
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
    const { idea, brandName, identityElements } = req.body;

    if (!idea || !brandName || !identityElements) {
      return res.status(400).json({ error: 'Idea, brand name, and identity elements are required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `Generate specific samples and examples for this creative idea: "${idea}" for the brand "${brandName}" based on these identity elements: ${identityElements.join(', ')}.

    Provide concrete examples, mockups, or detailed descriptions of how this idea could be executed.`;

    const samplesSchema = {
      type: Type.OBJECT,
      properties: {
        samples: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Specific examples and samples of the creative idea"
        },
        execution_details: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Detailed execution steps and considerations"
        },
        variations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Different variations and approaches for the idea"
        }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: samplesSchema,
      },
    });

    const result = JSON.parse(response.text.trim());
    res.json(result);

  } catch (error) {
    console.error('Error generating samples:', error);
    res.status(500).json({ error: 'Failed to generate samples.' });
  }
}

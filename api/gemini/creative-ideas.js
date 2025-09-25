// api/gemini/creative-ideas.js
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
    const { brandName, identitySelections, selectedCreativeCategories } = req.body;

    if (!brandName || !identitySelections || !selectedCreativeCategories) {
      return res.status(400).json({ error: 'Brand name, identity selections, and creative categories are required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `Given the brand "${brandName}" and its core identity elements: ${identitySelections.join(', ')}, generate creative ideas for the following categories: ${selectedCreativeCategories.join(', ')}.

    For each category, provide 3-5 specific, actionable creative ideas that leverage the brand's identity elements.`;

    const creativeIdeasSchema = {
      type: Type.OBJECT,
      properties: {
        audience_expansion: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Ideas to reach new consumer segments or demographics"
        },
        product_and_format_transposition: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Ideas to re-imagine existing products or codes in new ways"
        },
        campaign_and_experience_innovation: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Ideas to translate the brand's core story into fresh activations"
        },
        category_exploration: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Ideas to extend the brand's codes into new or adjacent spaces"
        },
        partnership_and_collaboration: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Ideas to leverage the brand's codes in collaborations with others"
        }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: creativeIdeasSchema,
      },
    });

    const result = JSON.parse(response.text.trim());

    // Only return the requested categories
    const filteredResult = {};
    selectedCreativeCategories.forEach(category => {
      if (result[category]) {
        filteredResult[category] = result[category];
      }
    });

    res.json(filteredResult);

  } catch (error) {
    console.error('Error generating creative ideas:', error);
    res.status(500).json({ error: 'Failed to generate creative ideas.' });
  }
}

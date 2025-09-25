// api/gemini/generate-vision-board.js
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
    const { brandName, selectedIdeas, identityElements } = req.body;

    if (!brandName || !selectedIdeas || !identityElements) {
      return res.status(400).json({ error: 'Brand name, selected ideas, and identity elements are required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `Create a vision board description for the brand "${brandName}" based on these selected ideas: ${selectedIdeas.join(', ')} and identity elements: ${identityElements.join(', ')}.

    Generate a comprehensive vision board that captures the brand's creative direction and visual identity.`;

    const visionBoardSchema = {
      type: Type.OBJECT,
      properties: {
        vision_description: {
          type: Type.STRING,
          description: "Detailed description of the vision board concept"
        },
        visual_elements: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Key visual elements to include in the vision board"
        },
        color_palette: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Recommended color palette for the vision board"
        },
        mood_and_tone: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Mood and tone guidelines for the vision board"
        },
        layout_suggestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Layout and composition suggestions"
        }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: visionBoardSchema,
      },
    });

    const result = JSON.parse(response.text.trim());
    res.json(result);

  } catch (error) {
    console.error('Error generating vision board:', error);
    res.status(500).json({ error: 'Failed to generate vision board.' });
  }
}

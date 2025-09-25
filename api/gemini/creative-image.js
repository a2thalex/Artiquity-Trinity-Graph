// api/gemini/creative-image.js
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
  }

  try {
    const { artistName, selectedStrategy, identityElements } = req.body;

    if (!artistName || !selectedStrategy || !identityElements) {
      return res.status(400).json({ error: 'Artist name, selected strategy, and identity elements are required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `Generate a creative visual concept for the artist "${artistName}" based on the strategy "${selectedStrategy}" and identity elements: ${identityElements.join(', ')}.

    Provide a detailed description of the visual concept, including style, mood, and key elements.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    res.json({ concept: response.text.trim() });

  } catch (error) {
    console.error('Error generating creative image:', error);
    res.status(500).json({ error: 'Failed to generate creative image.' });
  }
}

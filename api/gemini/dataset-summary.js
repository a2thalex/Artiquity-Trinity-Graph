// api/gemini/dataset-summary.js
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
    const { profile } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'Profile is required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `Generate a comprehensive dataset summary for the following data profile: ${JSON.stringify(profile)}.

    Provide insights on the dataset's potential value, applications, and market opportunities.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    res.json({ summary: response.text.trim() });

  } catch (error) {
    console.error('Error generating dataset summary:', error);
    res.status(500).json({ error: 'Failed to generate dataset summary.' });
  }
}

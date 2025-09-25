// api/gemini/dataset-preview.js
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
    const { profile, capsule } = req.body;

    if (!profile || !capsule) {
      return res.status(400).json({ error: 'Profile and capsule are required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `Generate a comprehensive dataset preview based on this profile: ${JSON.stringify(profile)} and capsule: ${JSON.stringify(capsule)}.

    Provide detailed insights on the dataset's structure, potential applications, and value proposition.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    res.json({ preview: response.text.trim() });

  } catch (error) {
    console.error('Error generating dataset preview:', error);
    res.status(500).json({ error: 'Failed to generate dataset preview.' });
  }
}

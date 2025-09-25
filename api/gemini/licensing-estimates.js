// api/gemini/licensing-estimates.js
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
    const { profile, terms } = req.body;

    if (!profile || !terms) {
      return res.status(400).json({ error: 'Profile and terms are required' });
    }

    if (!terms.compensationModel || terms.maxBudget === 0) {
      res.json({ estimate: "Select a model and set a budget to see estimates." });
      return;
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `Given the following data profile and licensing terms, provide a concise, single-sentence estimate of the potential dataset size and cost.
    
    Data Profile: ${JSON.stringify(profile)}
    Licensing Terms: ${JSON.stringify(terms)}

    Example output: "With your terms, we estimate ~12,000 works, at a cost of $4,200/mo."
    Another example output: "With your terms, we estimate ~5,000 works for a one-time cost of $8,000."
    
    Keep it to one sentence.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    res.json({ estimate: response.text.trim() });

  } catch (error) {
    console.error('Error getting licensing estimates:', error);
    res.status(500).json({ error: 'Failed to get licensing estimates.' });
  }
}

// api/gemini/data-estimates.js
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
    const { description, purposes, files = [] } = req.body;

    if (!description || !purposes) {
      return res.status(400).json({ error: 'Description and purposes are required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `Based on the user's text description, their intended purposes, and any attached images, provide a concise, single-sentence estimate of the potential dataset size.
    Description: "${description}"
    Purposes: "${purposes.join(', ')}"
    
    Example output: "Estimates suggest a potential dataset of 15,000 - 20,000 high-quality works."`;

    const fileParts = files.length > 0 ? await Promise.all(files.map(fileToGenerativePart)) : [];
    const contents = { parts: [{ text: prompt }, ...fileParts] };

    const response = await ai.models.generateContent({ 
      model: 'gemini-2.5-flash', 
      contents 
    });
    
    res.json({ estimate: response.text.trim() });

  } catch (error) {
    console.error('Error getting data estimates:', error);
    res.status(500).json({ error: 'Failed to get data estimates.' });
  }
}

// Helper function to convert file data to GenerativeAI Part
function fileToGenerativePart(fileData) {
  return {
    inlineData: {
      data: fileData.base64,
      mimeType: fileData.mimeType,
    },
  };
}

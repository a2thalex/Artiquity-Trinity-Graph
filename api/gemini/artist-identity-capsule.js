// api/gemini/artist-identity-capsule.js
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
  }

  try {
    const { artistName } = req.body;

    if (!artistName) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `Analyze the artist '${artistName}' and define their enduring artistic DNA. Deconstruct their work to identify the core, recurring elements that make their creations unmistakably theirs. Populate the following categories with 3-5 distinct elements each: aesthetic codes, tonal signatures, techniques and mediums, philosophy and intent, constraints and boundaries, and signature gestures and codes.`;

    const identityCapsuleSchema = {
      type: Type.OBJECT,
      properties: {
        aestheticCodes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Visual styles, color palettes, recurring motifs."
        },
        tonalSignatures: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Emotional undertones, mood, atmosphere."
        },
        techniquesAndMediums: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Methods, materials, and processes used."
        },
        philosophyAndIntent: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Core ideas, messages, and purpose."
        },
        constraintsAndBoundaries: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Self-imposed rules, limitations, or frameworks."
        },
        signatureGesturesAndCodes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Distinctive marks, symbols, or repeated actions."
        }
      },
      required: ["aestheticCodes", "tonalSignatures", "techniquesAndMediums", "philosophyAndIntent", "constraintsAndBoundaries", "signatureGesturesAndCodes"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: identityCapsuleSchema,
      },
    });

    const jsonStr = response.text.trim();
    const parsed = JSON.parse(jsonStr);

    if (
      !parsed.aestheticCodes ||
      !parsed.tonalSignatures ||
      !parsed.techniquesAndMediums ||
      !parsed.philosophyAndIntent ||
      !parsed.constraintsAndBoundaries ||
      !parsed.signatureGesturesAndCodes
    ) {
      throw new Error('Invalid response structure from AI');
    }

    res.json(parsed);

  } catch (error) {
    console.error('Error generating artist identity capsule:', error);
    res.status(500).json({ error: 'Failed to generate artist identity capsule.' });
  }
}

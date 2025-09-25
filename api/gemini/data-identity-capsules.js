// api/gemini/data-identity-capsules.js
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
    const { description, purposes, files = [] } = req.body;

    if (!description || !purposes || !Array.isArray(purposes)) {
      return res.status(400).json({ error: 'Description and purposes are required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const model = 'gemini-2.5-flash';
    const prompt = `A user has described their desired dataset as: "${description}". They have also provided the attached images for visual reference. The intended purposes are: "${purposes.join(', ')}".

        Generate 4 distinct, creative "Identity Capsules" based on all this information. Each capsule must have:
        1. A short, evocative title (2-4 words).
        2. A one-sentence description that captures the essence of the capsule.
        3. A "profile" object containing pre-selected keywords for styles, moods, domains, demographics, and provenance. Each category should have 3-5 relevant keywords that fit the capsule's theme.
        
        Ensure the 4 capsules are thematically different from each other.`;

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          profile: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING, description: "Copy of the original user description."},
              styles: { type: Type.ARRAY, items: { type: Type.STRING } },
              moods: { type: Type.ARRAY, items: { type: Type.STRING } },
              domains: { type: Type.ARRAY, items: { type: Type.STRING } },
              demographics: { type: Type.ARRAY, items: { type: Type.STRING } },
              provenance: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["description", "styles", "moods", "domains", "demographics", "provenance"]
          }
        },
        required: ["title", "description", "profile"]
      }
    };

    const fileParts = files.length > 0 ? await Promise.all(files.map(fileToGenerativePart)) : [];
    const contents = { parts: [{ text: prompt }, ...fileParts] };

    const response = await ai.models.generateContent({
      model,
      contents,
      config: { responseMimeType: "application/json", responseSchema },
    });

    const capsules = JSON.parse(response.text.trim());
    const result = capsules.map((c) => ({ ...c, profile: { ...c.profile, description } }));

    res.json({ capsules: result });

  } catch (error) {
    console.error('Error generating data identity capsules:', error);
    res.status(500).json({ error: 'Failed to generate data identity capsules.' });
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

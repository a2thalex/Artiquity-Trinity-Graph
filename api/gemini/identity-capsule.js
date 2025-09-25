// api/gemini/identity-capsule.js
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
    const { brandName, brandFiles = [] } = req.body;

    if (!brandName) {
      return res.status(400).json({ error: 'Brand name is required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const model = 'gemini-2.5-flash';
    const prompt = `Analyze the brand "${brandName}" to create an "Identity Capsule". Deconstruct its core components into the following categories, ensuring the line items are highly specific to the brand:
1.  **Hero Products**: Identify the brand's core commercial offers (flagship products, key services).
2.  **Aesthetic Codes & Expressions**: Detail the brand's distinctive visual, sensory, and verbal identity (colors, logos, packaging, taglines, photography style).
3.  **Mission & Values**: Articulate what the brand stands for (its core purpose, guiding beliefs, and promises).
4.  **Usage Contexts**: Describe the specific situations where the brand is used (when, where, and why consumers engage with it).
5.  **Constraints & Boundaries**: Define what the brand will not do or claim (its strategic guardrails and off-limit areas).
6.  **Brand Archetype**: Explore the archetypal roles the brand plays. For each archetype, provide a brief explanation of the role and connect it to how the brand already behaves or is perceived. For example: "The Guide: Empowering athletes with tools and knowledge to achieve greatness" or "The Hero: Inspiring individuals to push their boundaries through dedicated effort."

Provide 3-5 distinct, concise points for each category.`;

    const identityCapsuleSchema = {
      type: Type.OBJECT,
      properties: {
        hero_products: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The brand's core commercial offer (hero products, key services, flagship offerings)." },
        aesthetic_codes_and_expressions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The brand's distinctive visual, sensory, and verbal identity (colors, shapes, icons, packaging, photography style, key phrases)." },
        mission_and_values: { type: Type.ARRAY, items: { type: Type.STRING }, description: "What the brand stands for and its guiding beliefs (mission statement, core values, brand promise)." },
        usage_contexts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "When, where, and for what purpose the brand is used (primary usage occasions, consumer needs, contexts)." },
        constraints_and_boundaries: { type: Type.ARRAY, items: { type: Type.STRING }, description: "What the brand will not do or claim (forbidden categories, off-limit aesthetics, guardrails)." },
        brand_archetype: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The archetypal characters the brand plays. Each item should be formatted as 'Archetype: Brief explanation of the role and its connection to the brand'. For example, 'The Guide: Empowering athletes with the tools to overcome challenges.'" },
      },
      required: [
        'hero_products',
        'aesthetic_codes_and_expressions',
        'mission_and_values',
        'usage_contexts',
        'constraints_and_boundaries',
        'brand_archetype'
      ]
    };

    const fileParts = brandFiles.length > 0 ? await Promise.all(brandFiles.map(fileToGenerativePart)) : [];
    const contents = { parts: [{ text: prompt }, ...fileParts] };

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: identityCapsuleSchema,
      },
    });

    const text = response.text.trim();
    const parsedResponse = JSON.parse(text);

    res.json(parsedResponse);

  } catch (error) {
    console.error('Error generating identity capsule:', error);
    res.status(500).json({ error: 'Failed to generate identity capsule.' });
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

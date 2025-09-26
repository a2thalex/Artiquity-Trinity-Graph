// api/gemini/generate-samples.js
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
    const { idea, brandName, identityElements, categoryType, item } = req.body;

    // Support both old and new parameter formats
    const ideaText = idea || 'creative concept';
    const brandNameText = brandName || 'Brand';
    const categoryTypeText = categoryType || 'general';
    const itemText = item || 'concept';

    if (!ideaText || !brandNameText) {
      return res.status(400).json({ error: 'Idea and brand name are required' });
    }

    console.log('Generating samples for:', { brandName: brandNameText, idea: ideaText, categoryType: categoryTypeText, item: itemText });

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = `Generate 3-5 specific, actionable samples for "${itemText}" in the context of "${categoryTypeText}" category for the creative idea: "${ideaText}" and brand "${brandNameText}".

    Focus on concrete, practical examples that could be immediately implemented. Each sample should be:
    - Specific and actionable
    - Relevant to the ${categoryTypeText} context
    - Aligned with the creative idea "${ideaText}"
    - Suitable for the brand "${brandNameText}"

    Return only the samples as a simple array of strings.`;

    const samplesSchema = {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of specific, actionable samples"
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: samplesSchema,
      },
    });

    const result = JSON.parse(response.text.trim());

    // Ensure we return an array
    const samples = Array.isArray(result) ? result : (result.samples || []);

    console.log('Generated samples:', samples);
    res.json(samples);

  } catch (error) {
    console.error('Error generating samples:', error);
    res.status(500).json({ error: 'Failed to generate samples.' });
  }
}

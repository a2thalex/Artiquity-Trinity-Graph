// api/gemini/synchronicity-dashboard.js
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
    const { creativeOutput } = req.body;

    if (!creativeOutput) {
      return res.status(400).json({ error: 'Creative output is required' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `Analyze the synchronicity and cultural trends for this creative output: ${JSON.stringify(creativeOutput)}.

    Generate a comprehensive dashboard with:
    1. Trend Matches: 3-5 current cultural trends that align with this creative work, each with a name, velocity (e.g., "Rising", "Peak", "Emerging"), and description
    2. Audience Nodes: 3 categories of audiences - Subcultures, Influencers/Tastemakers, and Platforms - each with specific items/examples
    3. Format Suggestions: 3-5 specific ideas for how to present or distribute this work, each with timing recommendations
    4. Sources: Relevant web sources that support the analysis (can be simulated for now)

    Focus on actionable insights that help launch this creative work into culture effectively.`;

    const synchronicitySchema = {
      type: Type.OBJECT,
      properties: {
        dashboard: {
          type: Type.OBJECT,
          properties: {
            trendMatches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  velocity: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            },
            audienceNodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  items: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            formatSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  idea: { type: Type.STRING },
                  timing: { type: Type.STRING }
                }
              }
            }
          }
        },
        sources: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              uri: { type: Type.STRING },
              title: { type: Type.STRING }
            }
          }
        }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: synchronicitySchema,
      },
    });

    const result = JSON.parse(response.text.trim());
    res.json(result);

  } catch (error) {
    console.error('Error generating synchronicity dashboard:', error);
    res.status(500).json({ error: 'Failed to generate synchronicity dashboard.' });
  }
}

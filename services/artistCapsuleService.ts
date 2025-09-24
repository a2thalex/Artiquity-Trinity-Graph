import { GoogleGenAI, Type } from "@google/genai";
import type { IdentityCapsule, CreativeOutput, SynchronicityResult, WebSource } from '../types/artistCapsule';

// Initialize GoogleGenAI with named apiKey parameter from environment variables
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

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
            description: "Emotional tones, mood, atmosphere conveyed."
        },
        techniquesAndMediums: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Artistic methods, materials, and processes used."
        },
        philosophyAndIntent: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Core ideas, messages, and purpose behind the work."
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

export const generateIdentityCapsule = async (artistName: string): Promise<IdentityCapsule> => {
    const prompt = `Analyze the artist '${artistName}' and define their enduring artistic DNA. Deconstruct their work to identify the core, recurring elements that make their creations unmistakably theirs. Populate the following categories with 3-5 distinct elements each: aesthetic codes, tonal signatures, techniques and mediums, philosophy and intent, constraints and boundaries, and signature gestures and codes.`;

    try {
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
          throw new Error("Received incomplete identity capsule from API.");
        }

        return parsed as IdentityCapsule;

    } catch (error) {
        console.error("Error generating identity capsule:", error);
        throw new Error(`Failed to generate identity capsule for ${artistName}. Please try again.`);
    }
};

export const generateCreativeImage = async (
    artistName: string,
    selectedElements: string[],
    strategy: string,
    customInputs: Record<string, string>
): Promise<CreativeOutput> => {
    // Step 1: Generate a detailed prompt for the image model
    const promptRequest = `
        You are an expert art director. Your task is to generate a single, detailed, and evocative prompt for an image generation AI.
        The goal is to create a new artwork in the spirit of the artist '${artistName}'.

        The core identity elements from the artist to be included are:
        - ${selectedElements.join('\n- ')}

        The creative strategy is '${strategy}'. The specific user inputs are:
        - ${Object.entries(customInputs).map(([key, value]) => `${key}: ${value}`).join('\n- ')}

        **Instructions:**
        1.  Synthesize all the above information into a single, cohesive paragraph.
        2.  This paragraph should be a rich, descriptive prompt for an AI image generator.
        3.  Describe the subject, composition, color palette, mood, and artistic techniques.
        4.  Ensure the prompt is detailed enough to generate a high-quality, specific image that reflects the artist's style and the user's creative direction.
        5.  Do NOT output anything other than the single paragraph prompt. No titles, no explanations, just the prompt itself.
    `;

    let imagePrompt = '';
    try {
        const promptResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptRequest,
        });
        imagePrompt = promptResponse.text.trim();
    } catch (error) {
        console.error("Error generating image prompt:", error);
        throw new Error("Failed to create a concept prompt. Please try again.");
    }

    // Step 2: Generate the image using the created prompt
    try {
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: imagePrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        const base64ImageBytes: string = imageResponse.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
        
        return { prompt: imagePrompt, imageUrl };

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate the visual image. The generated prompt may have been blocked. Please try modifying your inputs.");
    }
};

export const generateSynchronicityDashboard = async (creativeOutput: CreativeOutput): Promise<SynchronicityResult> => {
    const jsonFormat = `
    {
      "trendMatches": [
        { "name": "e.g., Cyberpunk Nostalgia", "velocity": "e.g., TikTok ↑ 38% this week", "description": "Briefly explain the trend." }
      ],
      "audienceNodes": [
        { "category": "Subcultures", "items": ["e.g., Cyberpunk subreddit", "NFT street art collectors"] },
        { "category": "Influencers/Tastemakers", "items": ["e.g., @digitalartcritic (IG)", "Specific relevant creator"] },
        { "category": "Platforms", "items": ["e.g., TikTok AR filters", "Instagram Reels", "Discord servers"] }
      ],
      "formatSuggestions": [
        { "idea": "e.g., AR street-art filter", "timing": "e.g., Timed to Tokyo Design Week (launch window: next 10 days)" }
      ]
    }
    `;

    const prompt = `You are a world-class cultural strategist and trend analyst. An AI has generated an artwork based on the following prompt: "${creativeOutput.prompt}".

Your task is to create a "cultural and commercial flight plan" for this artwork. Use Google Search to find real-time, current cultural signals, trends, memes, events, and online conversations that this artwork can connect with.

Analyze the artwork's theme, style, and subject matter to generate a strategic dashboard.

You MUST provide your response as a single, valid JSON object, adhering strictly to this structure. Do not add any extra text, explanations, or markdown formatting outside of the JSON object itself.
${jsonFormat}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        let jsonText = response.text.trim();
        // Clean potential markdown formatting
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        }

        const dashboard = JSON.parse(jsonText);

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: WebSource[] = groundingChunks.map(chunk => ({
            uri: chunk.web?.uri || '#',
            title: chunk.web?.title || 'Unknown Source'
        })).filter(source => source.uri !== '#');

        return { dashboard, sources };

    } catch (error) {
        console.error("Error generating synchronicity dashboard:", error);
        throw new Error("Failed to generate the cultural flight plan. The API may have returned an unexpected format.");
    }
};

// @google/genai-sdk import and initialization
import { GoogleGenAI, Type } from "@google/genai";
import type { IdentityCapsule, CreativeIdeas, SynchronicityAnalysis, GroundingChunk, SynchronicityResult } from '../types/trinity';

// FIX: Initialize the GoogleGenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

/**
 * Converts a File object to a GoogleGenAI.Part object for multimodal prompts.
 * @param file The File object to convert.
 * @returns A promise that resolves to a Part object.
 */
const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type,
        },
    };
};

// Schema for Identity Capsule to ensure structured JSON output.
const identityCapsuleSchema = {
    type: Type.OBJECT,
    properties: {
        hero_products: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The brand’s core commercial offer (hero products, key services, flagship offerings)." },
        aesthetic_codes_and_expressions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The brand’s distinctive visual, sensory, and verbal identity (colors, shapes, icons, packaging, photography style, key phrases)." },
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

/**
 * Generates the brand's Identity Capsule using Gemini.
 * @param brandName The name of the brand.
 * @param brandFiles A list of files (e.g., brand guides) for context.
 * @returns A promise that resolves to the IdentityCapsule object.
 */
export const generateIdentityCapsule = async (brandName: string, brandFiles: File[]): Promise<IdentityCapsule> => {
    // FIX: Use the recommended 'gemini-2.5-flash' model.
    const model = 'gemini-2.5-flash';

    let prompt = `Analyze the brand "${brandName}" to create an "Identity Capsule". Deconstruct its core components into the following categories, ensuring the line items are highly specific to the brand:
1.  **Hero Products**: Identify the brand’s core commercial offers (flagship products, key services).
2.  **Aesthetic Codes & Expressions**: Detail the brand’s distinctive visual, sensory, and verbal identity (colors, logos, packaging, taglines, photography style).
3.  **Mission & Values**: Articulate what the brand stands for (its core purpose, guiding beliefs, and promises).
4.  **Usage Contexts**: Describe the specific situations where the brand is used (when, where, and why consumers engage with it).
5.  **Constraints & Boundaries**: Define what the brand will not do or claim (its strategic guardrails and off-limit areas).
6.  **Brand Archetype**: Explore the archetypal roles the brand plays. For each archetype, provide a brief explanation of the role and connect it to how the brand already behaves or is perceived. For example: "The Guide: Empowering athletes with tools and knowledge to achieve greatness" or "The Hero: Inspiring individuals to push their boundaries through dedicated effort."

Provide 3-5 distinct, concise points for each category.`;

    if (brandFiles.length > 0) {
        prompt += "\n\nRefer to the attached file(s) for additional context on the brand."
    }
    
    const textPart = { text: prompt };
    const fileParts = await Promise.all(brandFiles.map(fileToGenerativePart));
    const parts = [textPart, ...fileParts];

    // FIX: Call generateContent with model, multipart contents, and JSON schema config.
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: identityCapsuleSchema,
        },
    });

    // FIX: Safely parse the JSON response from the 'text' property.
    const text = response.text.trim();
    try {
        return JSON.parse(text) as IdentityCapsule;
    } catch (e) {
        console.error("Failed to parse JSON for identity capsule:", text, e);
        throw new Error("Received malformed JSON from API for identity capsule.");
    }
};

// Base schema definitions for Creative Ideas categories.
const creativeIdeasSchemaBase: Record<keyof CreativeIdeas, any> = {
    audience_expansion: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ideas for reaching new consumer segments or demographics." },
    product_and_format_transposition: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ideas for re-imagining existing products or codes in new ways." },
    campaign_and_experience_innovation: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ideas for translating the brand's core story into fresh activations." },
    category_exploration: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ideas for extending the brand's codes into new or adjacent spaces." },
    partnership_and_collaboration: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ideas for leveraging the brand's codes in collaborations with others." },
};

/**
 * Generates creative ideas based on selected brand identity elements.
 * @param brandName The name of the brand.
 * @param identitySelections A list of selected identity elements.
 * @param selectedCreativeCategories A list of categories to generate ideas for.
 * @returns A promise that resolves to a partial CreativeIdeas object.
 */
export const generateCreativeIdeas = async (brandName: string, identitySelections: string[], selectedCreativeCategories: (keyof CreativeIdeas)[]): Promise<Partial<CreativeIdeas>> => {
    const model = 'gemini-2.5-flash';

    const prompt = `You are a creative strategist for the brand "${brandName}".
    
    Given these core identity elements of the brand:
    - ${identitySelections.join('\n- ')}

    Generate 3-5 innovative and distinct creative ideas for each of the following categories: ${selectedCreativeCategories.join(', ')}.
    The ideas should be concise, actionable, and directly inspired by the provided identity elements.
    `;

    const requestedProperties: Record<string, any> = {};
    const requiredProperties: string[] = [];
    for (const category of selectedCreativeCategories) {
        if (creativeIdeasSchemaBase[category]) {
            requestedProperties[category] = creativeIdeasSchemaBase[category];
            requiredProperties.push(category);
        }
    }

    const responseSchema = {
        type: Type.OBJECT,
        properties: requestedProperties,
        required: requiredProperties,
    };

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    const text = response.text.trim();
    try {
        return JSON.parse(text) as Partial<CreativeIdeas>;
    } catch (e) {
        console.error("Failed to parse JSON for creative ideas:", text, e);
        throw new Error("Received malformed JSON from API for creative ideas.");
    }
};

/**
 * Analyzes a creative idea against cultural trends using Google Search grounding.
 * @param brandName The name of the brand.
 * @param idea The creative idea to analyze.
 * @returns A promise that resolves to an object containing the analysis, sources, score, and rationale.
 */
export const analyzeTrendsForIdea = async (brandName: string, idea: string): Promise<{ analysis: SynchronicityAnalysis, sources: GroundingChunk[], score: number, rationale: string }> => {
    const model = 'gemini-2.5-flash';

    const prompt = `Analyze the cultural relevance of the creative idea "${idea}" for the brand "${brandName}". Use Google Search for current trends.
    
Structure your response *only* using the following markdown format. Do not add any introductory or concluding text.

## trend_brand_fit_mapping
- <A concise, headline-style trend that is relevant now.>
- <Another relevant trend.>

## influencer_and_node_id
- <A category of influencer or cultural node (e.g., 'Niche TikTok creators').>
- <Another category of influencer or cultural node.>

## activation_concepts
- <A high-level activation concept or type (e.g., 'AR Filter Campaign').>
- <Another activation concept.>

## distribution_hooks_and_hacks
- <A 'hack' for hijacking a cultural moment.>
- <Another 'hack' for hijacking a cultural moment.>

After the markdown, add the intensity score and rationale using this exact format on separate lines:
SCORE: [A number between 1 and 100]
RATIONALE: [A brief, one-sentence rationale for the score based on brand fit and real-time trend relevance]
    `;
    
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const text = response.text.trim();
    
    let score = 50;
    let rationale = "Rationale could not be determined.";
    let markdownContent = text;

    const scoreMatch = text.match(/^SCORE: (\d+)$/m);
    if (scoreMatch && scoreMatch[1]) {
        score = parseInt(scoreMatch[1], 10);
        markdownContent = markdownContent.replace(/^SCORE: .*$/m, '').trim();
    }

    const rationaleMatch = text.match(/^RATIONALE: (.+)$/m);
    if (rationaleMatch && rationaleMatch[1]) {
        rationale = rationaleMatch[1].trim();
        markdownContent = markdownContent.replace(/^RATIONALE: .*$/m, '').trim();
    }

    const parseMarkdownToAnalysis = (markdown: string): SynchronicityAnalysis => {
        const analysis: SynchronicityAnalysis = {
            trend_brand_fit_mapping: [],
            influencer_and_node_id: [],
            activation_concepts: [],
            distribution_hooks_and_hacks: [],
        };
        const lines = markdown.split('\n');
        let currentCategory: keyof SynchronicityAnalysis | null = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('## ')) {
                const category = trimmedLine.substring(3).trim() as keyof SynchronicityAnalysis;
                if (Object.keys(analysis).includes(category)) {
                    currentCategory = category;
                } else {
                    currentCategory = null;
                }
            } else if (currentCategory && (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* '))) {
                const item = trimmedLine.substring(2).trim();
                if (item) {
                    analysis[currentCategory].push(item);
                }
            }
        }
        return analysis;
    };

    let analysis: SynchronicityAnalysis;
    try {
        analysis = parseMarkdownToAnalysis(markdownContent);
        const totalItems = Object.values(analysis).reduce((sum, arr) => sum + arr.length, 0);
        if (totalItems === 0 && text.length > 0) {
            console.error("Markdown parsing for trend analysis resulted in empty data. Raw text:", text);
            throw new Error("Failed to parse the model's response into a structured format.");
        }
    } catch (e) {
        console.error("Failed to parse markdown for trend analysis:", text, e);
        throw new Error("Received an unparsable response from API for trend analysis.");
    }

    const sources: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { analysis, sources, score, rationale };
};

/**
 * Generates specific samples for a given category (influencer or activation).
 * @param brandName The name of the brand.
 * @param idea The creative idea being explored.
 * @param categoryType The type of category ('influencer' or 'activation').
 * @param item The specific category item to generate samples for.
 * @returns A promise that resolves to an array of string samples.
 */
export const generateSamples = async (
    brandName: string,
    idea: string,
    categoryType: 'influencer' | 'activation',
    item: string
): Promise<string[]> => {
    const model = 'gemini-2.5-flash';
    let prompt = '';

    if (categoryType === 'influencer') {
        prompt = `For the brand "${brandName}" and creative idea "${idea}", generate 3-4 specific, real examples of influencers or creators for the category: "${item}". Provide only a JSON array of strings with their names.`;
    } else { // activation
        prompt = `For the brand "${brandName}" and creative idea "${idea}", generate 3-4 specific, actionable examples for the activation concept: "${item}". The examples must be tied to specific, real-time, upcoming, or seasonal cultural events. Provide only a JSON array of strings.`;
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
        },
    });

    const text = response.text.trim();
    try {
        return JSON.parse(text) as string[];
    } catch (e) {
        console.error("Failed to parse JSON for samples:", text, e);
        throw new Error("Received malformed JSON from API for samples.");
    }
};


/**
 * Generates a vision board image for a creative idea.
 * @param brandName The name of the brand.
 * @param idea The creative idea.
 * @returns A promise that resolves to a base64 encoded image data URL.
 */
export const generateVisionBoard = async (brandName: string, idea: string): Promise<string> => {
    const prompt = `Create a visually stunning and cohesive vision board for a creative campaign for the brand '${brandName}'. The core idea is: '${idea}'. The vision board should capture the aesthetic, mood, and key visual elements in a modern, elegant style. It should look like a professional mood board with a mix of textures, photography styles, color palettes, and typography.`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '16:9',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Image generation failed or returned no images.");
    }

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
};
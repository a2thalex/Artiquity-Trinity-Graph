// Secure API calls to server-side Gemini proxy
import type { IdentityCapsule, CreativeIdeas, SynchronicityAnalysis, GroundingChunk, SynchronicityResult } from '../types/trinity';

// Base URL for API calls - will be handled by Vercel routing
const API_BASE = '/api';

/**
 * Converts a File object to base64 data for secure API transmission.
 * @param file The File object to convert.
 * @returns A promise that resolves to base64 data and mime type.
 */
const fileToBase64 = async (file: File): Promise<{ base64: string; mimeType: string }> => {
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    return {
        base64: base64EncodedData,
            mimeType: file.type,
    };
};


/**
 * Generates the brand's Identity Capsule using secure API proxy.
 * @param brandName The name of the brand.
 * @param brandFiles A list of files (e.g., brand guides) for context.
 * @returns A promise that resolves to the IdentityCapsule object.
 */
export const generateIdentityCapsule = async (brandName: string, brandFiles: File[]): Promise<IdentityCapsule> => {
    try {
        // Convert files to base64 for secure transmission
        const brandFilesData = await Promise.all(brandFiles.map(fileToBase64));

        const response = await fetch(`${API_BASE}/identity-capsule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                brandName,
                brandFiles: brandFilesData,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate identity capsule');
        }

        const result = await response.json();
        return result as IdentityCapsule;

    } catch (error) {
        console.error("Error generating identity capsule:", error);
        throw new Error("Failed to generate identity capsule. Please try again.");
    }
};

/**
 * Generates creative ideas based on selected brand identity elements using secure API proxy.
 * @param brandName The name of the brand.
 * @param identitySelections A list of selected identity elements.
 * @param selectedCreativeCategories A list of categories to generate ideas for.
 * @returns A promise that resolves to a partial CreativeIdeas object.
 */
export const generateCreativeIdeas = async (brandName: string, identitySelections: string[], selectedCreativeCategories: (keyof CreativeIdeas)[]): Promise<Partial<CreativeIdeas>> => {
    try {
        const response = await fetch(`${API_BASE}/creative-ideas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                brandName,
                identitySelections,
                selectedCreativeCategories,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate creative ideas');
        }

        const result = await response.json();
        return result as Partial<CreativeIdeas>;

    } catch (error) {
        console.error("Error generating creative ideas:", error);
        throw new Error("Failed to generate creative ideas. Please try again.");
    }
};

/**
 * Analyzes a creative idea against cultural trends using Google Search grounding via secure API proxy.
 * @param brandName The name of the brand.
 * @param idea The creative idea to analyze.
 * @returns A promise that resolves to an object containing the analysis, sources, score, and rationale.
 */
export const analyzeTrendsForIdea = async (brandName: string, idea: string): Promise<{ analysis: SynchronicityAnalysis, sources: GroundingChunk[], score: number, rationale: string }> => {
    try {
        const response = await fetch(`${API_BASE}/analyze-trends`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                brandName,
                idea,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to analyze trends');
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("Error analyzing trends:", error);
        throw new Error("Failed to analyze trends. Please try again.");
    }
};

/**
 * Generates specific samples for a given category (influencer or activation) using secure API proxy.
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
    try {
        const response = await fetch(`${API_BASE}/generate-samples`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                brandName,
                idea,
                categoryType,
                item,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate samples');
        }

        const result = await response.json();
        return result as string[];

    } catch (error) {
        console.error("Error generating samples:", error);
        throw new Error("Failed to generate samples. Please try again.");
    }
};


/**
 * Generates a vision board image for a creative idea using secure API proxy.
 * @param brandName The name of the brand.
 * @param idea The creative idea.
 * @returns A promise that resolves to a base64 encoded image data URL.
 */
export const generateVisionBoard = async (brandName: string, idea: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE}/generate-vision-board`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                brandName,
                idea,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate vision board');
        }

        const result = await response.json();
        return result.imageDataUrl;

    } catch (error) {
        console.error("Error generating vision board:", error);
        throw new Error("Failed to generate vision board. Please try again.");
    }
};
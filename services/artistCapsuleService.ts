import type { IdentityCapsule, CreativeOutput, SynchronicityResult, WebSource } from '../types/artistCapsule';

// Base URL for API calls - will be handled by Vercel routing
const API_BASE = '/api';

const identityCapsuleSchema = {
    type: "object",
    properties: {
        aestheticCodes: {
            type: "array",
            items: { type: "string" },
            description: "Visual styles, color palettes, recurring motifs."
        },
        tonalSignatures: {
            type: "array",
            items: { type: "string" },
            description: "Emotional undertones, mood, atmosphere."
        },
        techniquesAndMediums: {
            type: "array",
            items: { type: "string" },
            description: "Methods, materials, and processes used."
        },
        philosophyAndIntent: {
            type: "array",
            items: { type: "string" },
            description: "Core ideas, messages, and purpose."
        },
        constraintsAndBoundaries: {
            type: "array",
            items: { type: "string" },
            description: "Self-imposed rules, limitations, or frameworks."
        },
        signatureGesturesAndCodes: {
            type: "array",
            items: { type: "string" },
            description: "Distinctive marks, symbols, or repeated actions."
        }
    },
    required: ["aestheticCodes", "tonalSignatures", "techniquesAndMediums", "philosophyAndIntent", "constraintsAndBoundaries", "signatureGesturesAndCodes"]
};

export const generateIdentityCapsule = async (artistName: string): Promise<IdentityCapsule> => {
    try {
        const response = await fetch(`${API_BASE}/artist-identity-capsule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                artistName,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate identity capsule');
        }

        const result = await response.json();
        const parsed = result;
        
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

        return parsed;
    } catch (error) {
        console.error("Error generating identity capsule:", error);
        throw new Error("Failed to generate identity capsule. Please try again.");
    }
};

export const generateCreativeImage = async (
    artistName: string,
    selectedStrategy: string,
    identityElements: string[],
    userInput: string
): Promise<CreativeOutput> => {
    try {
        const response = await fetch(`${API_BASE}/creative-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                artistName,
                selectedStrategy,
                identityElements,
                userInput,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate creative image');
        }

        const result = await response.json();
        
        return {
            concept: result.concept,
            imageUrl: '', // This would be populated by an image generation service
            strategy: selectedStrategy,
            elements: identityElements,
            userInput: userInput
        };

    } catch (error) {
        console.error("Error generating creative image:", error);
        throw new Error("Failed to generate creative image. Please try again.");
    }
};

export const generateSynchronicityDashboard = async (creativeOutput: CreativeOutput): Promise<SynchronicityResult> => {
    try {
        const response = await fetch(`${API_BASE}/synchronicity-dashboard`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                creativeOutput,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate synchronicity dashboard');
        }

        const result = await response.json();
        
        return {
            analysis: result.analysis,
            insights: result.insights,
            webSources: [] // This would be populated by a web search service
        };

    } catch (error) {
        console.error("Error generating synchronicity dashboard:", error);
        throw new Error("Failed to generate synchronicity dashboard. Please try again.");
    }
};
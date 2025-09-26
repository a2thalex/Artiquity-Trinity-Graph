// Secure API calls to server-side Gemini proxy
import type { IdentityCapsule, CreativeIdeas, SynchronicityAnalysis, GroundingChunk, SynchronicityResult, Campaign, CampaignGenerationResult, CampaignExecutionPlan, ContextualCampaignResult } from '../types/trinity';

// Base URL for API calls - will be handled by Vercel routing
const API_BASE = '/api/gemini';

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
                creativeIdeas: [idea],
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

/**
 * Generates a comprehensive campaign from a creative idea and synchronicity analysis.
 * @param brandName The name of the brand.
 * @param synchronicityResult The top synchronicity result with trend analysis.
 * @param identityElements Selected brand identity elements for consistency.
 * @returns A promise that resolves to a CampaignGenerationResult object.
 */
export const generateCampaign = async (
    brandName: string,
    synchronicityResult: SynchronicityResult,
    identityElements: string[]
): Promise<CampaignGenerationResult> => {
    try {
        const response = await fetch(`${API_BASE}/generate-campaign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                brandName,
                synchronicityResult,
                identityElements,
                generationType: 'campaign'
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate campaign');
        }

        const result = await response.json();
        return result as CampaignGenerationResult;

    } catch (error) {
        console.error("Error generating campaign:", error);
        throw new Error("Failed to generate campaign. Please try again.");
    }
};

/**
 * Generates a context-aware campaign using specialized prompts for different campaign components.
 * @param brandName The name of the brand.
 * @param synchronicityDashboard The synchronicity dashboard with cultural trend analysis.
 * @param identityElements Selected brand identity elements for consistency.
 * @returns A promise that resolves to a ContextualCampaignResult object.
 */
// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateContextualCampaign = async (
    brandName: string,
    synchronicityDashboard: any, // Will be SynchronicityResult from artistCapsule types
    identityElements: string[],
    retryCount: number = 0
): Promise<ContextualCampaignResult> => {
    try {
        console.log('🚀 Starting contextual campaign generation...');
        console.log('📊 Brand Name:', brandName);
        console.log('📊 Identity Elements:', identityElements);
        console.log('📊 API URL:', `${API_BASE}/generate-contextual-campaign`);

        const requestBody = {
            brandName,
            synchronicityDashboard,
            identityElements
        };

        console.log('📊 Request Body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${API_BASE}/generate-contextual-campaign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log('📊 Response Status:', response.status);
        console.log('📊 Response Status Text:', response.statusText);
        console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            console.error('❌ Response not OK, attempting to read error...');

            // Try to get the response text first
            const responseText = await response.text();
            console.error('❌ Error Response Text:', responseText);

            // Try to parse as JSON if possible
            let errorData;
            try {
                errorData = JSON.parse(responseText);
                console.error('❌ Parsed Error Data:', errorData);
            } catch (parseError) {
                console.error('❌ Could not parse error response as JSON:', parseError.message);
                console.error('❌ Raw response (first 500 chars):', responseText.substring(0, 500));

                // If we get HTML instead of JSON, it's likely a server error page
                if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
                    throw new Error(`Server returned HTML error page instead of JSON. Status: ${response.status} ${response.statusText}`);
                }

                throw new Error(`API returned non-JSON error response: ${response.status} ${response.statusText}`);
            }

            throw new Error(errorData.error || `API request failed: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log('✅ Success Response Text (first 200 chars):', responseText.substring(0, 200));

        const result = JSON.parse(responseText);
        console.log('✅ Contextual campaign generated successfully!');
        console.log('✅ Campaign ID:', result.campaign?.id);

        return result;

    } catch (error) {
        console.error("❌ Error generating contextual campaign:", error);

        // Retry logic for 503 errors (up to 2 retries)
        if ((error.message.includes('503') || error.message.includes('Service Unavailable')) && retryCount < 2) {
            console.log(`🔄 Retrying contextual campaign generation (attempt ${retryCount + 1}/2)...`);
            await delay(2000 * (retryCount + 1)); // Exponential backoff: 2s, 4s
            return generateContextualCampaign(brandName, synchronicityDashboard, identityElements, retryCount + 1);
        }

        // Provide more specific error messages
        if (error.message.includes('fetch')) {
            throw new Error("Network error: Unable to connect to the API. Please check your internet connection and try again.");
        } else if (error.message.includes('JSON')) {
            throw new Error("Server error: The API returned an invalid response. Please try again in a moment.");
        } else if (error.message.includes('503')) {
            throw new Error("Service temporarily unavailable: The API is currently overloaded. Please wait a moment and try again.");
        } else {
            throw new Error(error.message || "Failed to generate contextual campaign. Please try again.");
        }
    }
};

/**
 * Deploys a campaign to the promote.fun platform or similar campaign management system.
 * @param campaign The campaign object to deploy.
 * @param brandName The brand name.
 * @returns A promise that resolves to deployment details.
 */
export const deployCampaign = async (
    campaign: Campaign,
    brandName: string
): Promise<{ success: boolean; deploymentUrl: string; status: string; urls?: any; nextSteps?: string[]; estimatedMetrics?: any }> => {
    try {
        const response = await fetch(`${API_BASE}/deploy-campaign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                campaign,
                brandName,
                action: 'deploy'
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to deploy campaign');
        }

        const result = await response.json();
        
        return {
            success: result.success,
            deploymentUrl: result.urls?.campaign || `https://promote.fun/campaigns/${campaign.id}`,
            status: result.status,
            urls: result.urls,
            nextSteps: result.nextSteps,
            estimatedMetrics: result.estimatedMetrics
        };

    } catch (error) {
        console.error("Error deploying campaign:", error);
        throw new Error("Failed to deploy campaign. Please try again.");
    }
};

/**
 * Generates multiple campaign variations for A/B testing.
 * @param brandName The brand name.
 * @param synchronicityResults Multiple synchronicity results to generate campaigns from.
 * @param identityElements Selected brand identity elements.
 * @param count Number of variations to generate (max 3).
 * @returns A promise that resolves to an array of CampaignGenerationResult objects.
 */
export const generateCampaignVariations = async (
    brandName: string,
    synchronicityResults: SynchronicityResult[],
    identityElements: string[],
    count: number = 3
): Promise<CampaignGenerationResult[]> => {
    try {
        // Take top N results based on count
        const topResults = synchronicityResults.slice(0, Math.min(count, 3));
        
        // Generate campaigns in parallel for efficiency
        const campaignPromises = topResults.map(result => 
            generateCampaign(brandName, result, identityElements)
        );
        
        const campaigns = await Promise.all(campaignPromises);
        return campaigns;
        
    } catch (error) {
        console.error("Error generating campaign variations:", error);
        throw new Error("Failed to generate campaign variations. Please try again.");
    }
};

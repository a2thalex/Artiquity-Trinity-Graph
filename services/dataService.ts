// Secure API calls to server-side Gemini proxy for Data functionality
import type { DataProfile, DataProfileSuggestions, DataLicensingTerms, DatasetPreview, DataIdentityCapsule } from '../types/data';

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
 * Get data estimates using direct Gemini API.
 */
export const getDataEstimates = async (description: string, purposes: string[], files: File[]): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `Based on the user's text description, their intended purposes, and any attached images, provide a concise, single-sentence estimate of the potential dataset size.
        Description: "${description}"
        Purposes: "${purposes.join(', ')}"
        
        Example output: "Estimates suggest a potential dataset of 15,000 - 20,000 high-quality works."`;

        const fileParts = files.length > 0 ? await Promise.all(files.map(fileToGenerativePart)) : [];
        const contents = { parts: [{ text: prompt }, ...fileParts] };

        const response = await ai.models.generateContent({ model, contents });
        return response.text.trim();

    } catch (error) {
        console.error("Error getting data estimates:", error);
        throw new Error("Failed to get data estimates. Please try again.");
    }
};

/**
 * Get licensing estimates using direct Gemini API.
 */
export const getLicensingEstimates = async (profile: DataProfile, terms: DataLicensingTerms): Promise<string> => {
    try {
        if (!terms.compensationModel || terms.maxBudget === 0) {
            return "Select a model and set a budget to see estimates.";
        }

        const model = 'gemini-2.5-flash';
        const prompt = `Given the following data profile and licensing terms, provide a concise, single-sentence estimate of the potential dataset size and cost.
        
        Data Profile: ${JSON.stringify(profile)}
        Licensing Terms: ${JSON.stringify(terms)}

        Example output: "With your terms, we estimate ~12,000 works, at a cost of $4,200/mo."
        Another example output: "With your terms, we estimate ~5,000 works for a one-time cost of $8,000."
        
        Keep it to one sentence.`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text.trim();

    } catch (error) {
        console.error("Error getting licensing estimates:", error);
        throw new Error("Failed to get licensing estimates. Please try again.");
    }
};

/**
 * Generate dataset summary using direct Gemini API.
 */
export const generateDatasetSummary = async (profile: DataProfile): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `Based on this data profile, create a brief, one-sentence description of the resulting dataset. Be descriptive but concise.
        Data Profile: ${JSON.stringify(profile)}`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text.trim().replace(/["*]/g, '');

    } catch (error) {
        console.error("Error generating dataset summary:", error);
        throw new Error("Failed to generate dataset summary. Please try again.");
    }
};

/**
 * Generate identity capsules using secure API proxy.
 */
export const generateIdentityCapsules = async (description: string, purposes: string[], files: File[]): Promise<DataIdentityCapsule[]> => {
    try {
        const filesData = await Promise.all(files.map(fileToBase64));

        const response = await fetch(`${API_BASE}/data-identity-capsules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description,
                purposes,
                files: filesData,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate identity capsules');
        }

        const result = await response.json();
        return result.capsules;

    } catch (error) {
        console.error("Error generating identity capsules:", error);
        throw new Error("Failed to generate identity capsules. Please try again.");
    }
};

/**
 * Generate data profile and keywords using direct Gemini API.
 */
export const generateDataProfileAndKeywords = async (description: string): Promise<{ profile: DataProfile, suggestions: DataProfileSuggestions }> => {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `Based on the user's description of their ideal dataset: "${description}", generate a data profile.
        1.  Extract relevant keywords from the description and categorize them into: styles, moods, domains, demographics, and provenance.
        2.  For each category, generate 5-7 additional, diverse, AI-suggested keyword chips that expand on the user's initial idea.
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                profile: {
                    type: Type.OBJECT,
                    properties: {
                        styles: { type: Type.ARRAY, items: { type: Type.STRING } },
                        moods: { type: Type.ARRAY, items: { type: Type.STRING } },
                        domains: { type: Type.ARRAY, items: { type: Type.STRING } },
                        demographics: { type: Type.ARRAY, items: { type: Type.STRING } },
                        provenance: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                },
                suggestions: {
                   type: Type.OBJECT,
                  properties: {
                    styles: { type: Type.ARRAY, items: { type: Type.STRING } },
                    moods: { type: Type.ARRAY, items: { type: Type.STRING } },
                    domains: { type: Type.ARRAY, items: { type: Type.STRING } },
                    demographics: { type: Type.ARRAY, items: { type: Type.STRING } },
                    provenance: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                }
            },
            required: ['profile', 'suggestions']
        };

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema },
        });

        const parsed = JSON.parse(response.text.trim());
        const finalProfile = { ...parsed.profile, description };
        const combinedSuggestions = {
            styles: [...new Set([...parsed.profile.styles, ...parsed.suggestions.styles])],
            moods: [...new Set([...parsed.profile.moods, ...parsed.suggestions.moods])],
            domains: [...new Set([...parsed.profile.domains, ...parsed.suggestions.domains])],
            demographics: [...new Set([...parsed.profile.demographics, ...parsed.suggestions.demographics])],
            provenance: [...new Set([...parsed.profile.provenance, ...parsed.suggestions.provenance])],
        };

        return { profile: finalProfile, suggestions: combinedSuggestions };

    } catch (error) {
        console.error("Error generating data profile and keywords:", error);
        throw new Error("Failed to generate data profile and keywords. Please try again.");
    }
};

/**
 * Generate dataset preview using direct Gemini API.
 */
export const generateDatasetPreview = async (
    purposes: string[],
    refinedProfile: DataProfile,
    licensing: DataLicensingTerms
): Promise<DatasetPreview> => {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `Given the following information, create a comprehensive dataset preview:
        
        Purposes: ${purposes.join(', ')}
        Refined Profile: ${JSON.stringify(refinedProfile)}
        Licensing Terms: ${JSON.stringify(licensing)}
        
        Generate a detailed preview that includes:
        1. A compelling title for the dataset
        2. A comprehensive description of what the dataset contains
        3. Key characteristics and features
        4. Expected use cases and applications
        5. Sample data points or examples
        6. Quality metrics and specifications`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });

        const previewText = response.text.trim();
        
        // For now, return a simple preview structure
        // You can enhance this to parse the response into a more structured format
        return {
            title: `Dataset Preview for ${refinedProfile.description}`,
            description: previewText,
            sampleData: ["Sample data point 1", "Sample data point 2", "Sample data point 3"],
            qualityMetrics: ["High quality", "Curated", "Verified"],
            useCases: purposes
        };

    } catch (error) {
        console.error("Error generating dataset preview:", error);
        throw new Error("Failed to generate dataset preview. Please try again.");
    }
};

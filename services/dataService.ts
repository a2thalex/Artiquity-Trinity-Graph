// Secure API calls to server-side Gemini proxy for Data functionality
import type { DataProfile, DataProfileSuggestions, DataLicensingTerms, DatasetPreview, DataIdentityCapsule } from '../types/data';

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
 * Get data estimates using secure API proxy.
 */
export const getDataEstimates = async (description: string, purposes: string[], files: File[]): Promise<string> => {
    try {
        const filesData = await Promise.all(files.map(fileToBase64));

        const response = await fetch(`${API_BASE}/data-estimates`, {
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
            throw new Error(errorData.error || 'Failed to get data estimates');
        }

        const result = await response.json();
        return result.estimate;

    } catch (error) {
        console.error("Error getting data estimates:", error);
        throw new Error("Failed to get data estimates. Please try again.");
    }
};

/**
 * Get licensing estimates using secure API proxy.
 */
export const getLicensingEstimates = async (profile: DataProfile, terms: DataLicensingTerms): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE}/licensing-estimates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                profile,
                terms,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get licensing estimates');
        }

        const result = await response.json();
        return result.estimate;

    } catch (error) {
        console.error("Error getting licensing estimates:", error);
        throw new Error("Failed to get licensing estimates. Please try again.");
    }
};

/**
 * Generate dataset summary using secure API proxy.
 */
export const generateDatasetSummary = async (profile: DataProfile): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE}/dataset-summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                profile,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate dataset summary');
        }

        const result = await response.json();
        return result.summary;

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
 * Generate data profile and keywords using secure API proxy.
 */
export const generateDataProfileAndKeywords = async (description: string): Promise<{ profile: DataProfile, suggestions: DataProfileSuggestions }> => {
    try {
        const response = await fetch(`${API_BASE}/data-profile-keywords`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate data profile and keywords');
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("Error generating data profile and keywords:", error);
        throw new Error("Failed to generate data profile and keywords. Please try again.");
    }
};

/**
 * Generate dataset preview using secure API proxy.
 */
export const generateDatasetPreview = async (
    profile: DataProfile,
    capsule: DataIdentityCapsule
): Promise<DatasetPreview> => {
    try {
        const response = await fetch(`${API_BASE}/dataset-preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                profile,
                capsule,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate dataset preview');
        }

        const result = await response.json();
        return result.preview;

    } catch (error) {
        console.error("Error generating dataset preview:", error);
        throw new Error("Failed to generate dataset preview. Please try again.");
    }
};
export enum DataStep {
  LANDING,
  DESCRIBE,
  PURPOSE,
  CAPSULE_SELECTION,
  REFINE_CAPSULE,
  LICENSING,
  FINALIZE,
}

export type Purpose = 'fine_tuning' | 'training_new_model' | 'filling_gaps' | 'bias_correction' | 'safety_filtering' | 'prototyping';

export interface DataProfile {
    description: string;
    styles: string[];
    moods: string[];
    domains: string[];
    demographics: string[];
    provenance: string[];
}

export interface DataProfileSuggestions {
    styles: string[];
    moods: string[];
    domains: string[];
    demographics: string[];
    provenance: string[];
}

export interface DataIdentityCapsule {
    title: string;
    description: string;
    profile: DataProfile;
}

export type CompensationModel = 'per_generation' | 'per_training_use' | 'subscription';

export interface DataLicensingTerms {
    compensationModel: CompensationModel | null;
    maxBudget: number;
    duration: number; // in months, 0 for one-time
    caps?: number;
}

export interface DatasetPreview {
    description: string;
    images: string[]; // array of base64 encoded strings
    summary: {
        estimatedWorks: number;
        cost: string; 
    };
}


export interface RSLFile {
    file: File;
    previewUrl: string;
}

export interface LicenseOptions {
    provenanceInfo: string;
    allowAIModels: boolean;
    allowIndexing: boolean;
    allowDerivatives: 'yes' | 'no' | 'share-alike';
    commercialUse: 'yes' | 'no' | 'with-permission';
    paymentModel: 'free' | 'attribution' | 'per-crawl' | 'per-inference' | 'subscription';
    paymentAmount?: number;
    paymentCurrency?: string;
    attributionText?: string;
    subscriptionPeriod?: string;
    geographicRestrictions?: Array<{
        countryCode: string;
        allowed: boolean;
    }>;
    userTypes?: Array<{
        type: 'commercial' | 'education' | 'government' | 'nonprofit' | 'individual';
        allowed: boolean;
    }>;
}

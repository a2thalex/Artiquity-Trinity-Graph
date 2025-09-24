import { RSLFile, LicenseOptions } from '../types';
import { embedRSLMetadata, createRSLMetadata } from './metadataEmbedder';

export async function generateRSL(rslFile: RSLFile, options: LicenseOptions): Promise<File> {
    try {
        const embeddedFile = await embedRSLMetadata(rslFile, options);
        return embeddedFile;
    } catch (error) {
        console.error('Error embedding RSL metadata:', error);
        throw new Error('Failed to embed RSL metadata. Please try again.');
    }
}

export function generateRSLPreview(rslFile: RSLFile, options: LicenseOptions): string {
    const metadata = createRSLMetadata(options);
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    return `--- BEGIN RSL METADATA PREVIEW ---

**Date of Issue:** ${currentDate}
**Certificate Version:** 1.0

## 1. Artwork Information
* **File Name:** ${rslFile.file.name}
* **File Type:** ${rslFile.file.type}
* **File Size:** ${(rslFile.file.size / 1024).toFixed(2)} KB
* **Artwork Identifier:** SHA256 Placeholder (A unique hash of the file should be generated for verification)

## 2. Provenance
* **Creator Information:** ${options.provenanceInfo}
* **Date Created:** ${currentDate}

## 3. License Terms
* **License Type:** RSL-1.0
* **Payment Model:** ${options.paymentModel}
${options.paymentAmount ? `* **Payment Amount:** ${options.paymentAmount} ${options.paymentCurrency}` : ''}
${options.attributionText ? `* **Attribution Required:** ${options.attributionText}` : ''}
${options.subscriptionPeriod ? `* **Subscription Period:** ${options.subscriptionPeriod}` : ''}

## 4. Permissions
* **AI Model Training:** ${options.allowAIModels ? 'Allowed' : 'Denied'}
* **Search Engine Indexing:** ${options.allowIndexing ? 'Allowed' : 'Denied'}
* **Derivatives:** ${options.allowDerivatives}
* **Commercial Use:** ${options.commercialUse}

## 5. Technical Implementation
* **Metadata Embedding:** RSL data will be embedded directly into the file
* **File Format:** ${rslFile.file.type}
* **License Server:** https:
* **Contact:** contact@rslplatform.com

**Note:** This metadata will be invisibly embedded into your file. The file will look and function exactly the same, but will contain licensing information that AI systems and crawlers can read.

--- END RSL METADATA PREVIEW ---`;
}
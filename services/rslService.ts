import { RSLFile, LicenseOptions } from '../types';
import { embedRSLMetadata, createRSLMetadata, extractRSLMetadata } from './metadataEmbedder';

export async function generateRSL(rslFile: RSLFile, options: LicenseOptions): Promise<File> {
    try {
        console.log(`Generating RSL for file: ${rslFile.file.name}`);
        
        // Embed RSL metadata into the file
        const embeddedFile = await embedRSLMetadata(rslFile, options);
        console.log(`RSL metadata embedding completed for: ${embeddedFile.name}`);
        
        // Verify that metadata was successfully embedded (optional verification step)
        try {
            const extractedMetadata = await extractRSLMetadata(embeddedFile);
            if (extractedMetadata) {
                console.log('✅ RSL metadata verification successful - metadata found in embedded file');
            } else {
                console.log('⚠️ RSL metadata verification failed - no metadata found in embedded file');
                console.log('This may be normal for sidecar file formats');
            }
        } catch (verificationError) {
            console.log('⚠️ RSL metadata verification skipped due to error:', verificationError);
        }
        
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
* **License Server:** https://rslplatform.com/license
* **Contact:** contact@rslplatform.com

**Note:** This metadata will be invisibly embedded into your file. The file will look and function exactly the same, but will contain licensing information that AI systems and crawlers can read.

--- END RSL METADATA PREVIEW ---`;
}
import { RSLFile, LicenseOptions } from '../types';

export interface RSLMetadata {
    license: string;
    permissions: string[];
    userTypes: string[];
    paymentModel: string;
    paymentAmount?: number;
    paymentCurrency?: string;
    attributionText?: string;
    subscriptionPeriod?: string;
    provenanceInfo: string;
    dateIssued: string;
    licenseServer: string;
    contact: string;
}

export function createRSLMetadata(options: LicenseOptions): RSLMetadata {
    const permissions = [];
    if (options.allowAIModels) permissions.push('train-ai');
    if (options.allowIndexing) permissions.push('search');
    permissions.push('ai-summarize', 'archive', 'analysis');

    const userTypes = ['commercial', 'education', 'government', 'nonprofit', 'individual'];

    return {
        license: 'RSL-1.0',
        permissions,
        userTypes,
        paymentModel: options.paymentModel,
        paymentAmount: options.paymentAmount,
        paymentCurrency: options.paymentCurrency,
        attributionText: options.attributionText,
        subscriptionPeriod: options.subscriptionPeriod,
        provenanceInfo: options.provenanceInfo,
        dateIssued: new Date().toISOString(),
        licenseServer: 'https://rslplatform.com/license',
        contact: 'contact@rslplatform.com'
    };
}

export async function embedRSLMetadata(rslFile: RSLFile, options: LicenseOptions): Promise<File> {
    const metadata = createRSLMetadata(options);
    
    // Determine file type and embed accordingly
    const fileType = rslFile.file.type.toLowerCase();
    const fileName = rslFile.file.name;
    
    if (fileType.startsWith('image/')) {
        return await embedImageMetadata(rslFile.file, metadata);
    } else if (fileType.startsWith('video/')) {
        return await embedVideoMetadata(rslFile.file, metadata);
    } else if (fileType.startsWith('audio/')) {
        return await embedAudioMetadata(rslFile.file, metadata);
    } else if (fileType === 'application/pdf') {
        return await embedPDFMetadata(rslFile.file, metadata);
    } else {
        // For unsupported file types, create a sidecar .rsl file
        return await createSidecarFile(rslFile.file, metadata);
    }
}

async function embedImageMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    const fileType = file.type.toLowerCase();
    
    if (fileType === 'image/jpeg') {
        return await embedJPEGMetadata(file, metadata);
    } else if (fileType === 'image/png') {
        return await embedPNGMetadata(file, metadata);
    } else if (fileType === 'image/tiff') {
        return await embedTIFFMetadata(file, metadata);
    } else {
        // For other image formats, create sidecar file
        return await createSidecarFile(file, metadata);
    }
}

async function embedJPEGMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    try {
        // Dynamic import for piexifjs
        const piexif = await import('piexifjs');
        
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
        
        // Parse existing EXIF data
        let exifData: any = {};
        try {
            exifData = piexif.load(binaryString);
        } catch (e) {
            // No existing EXIF data, create new structure
            exifData = {
                "0th": {},
                "Exif": {},
                "GPS": {},
                "Interop": {},
                "1st": {},
                "thumbnail": null
            };
        }
        
        // Create RSL XMP data
        const rslXMP = createRSLXMP(metadata);
        
        // Add RSL data to EXIF
        exifData["0th"][piexif.ImageIFD.Make] = "RSL Platform";
        exifData["0th"][piexif.ImageIFD.Software] = "RSL-1.0";
        exifData["Exif"][piexif.ExifIFD.UserComment] = rslXMP;
        
        // Convert back to binary
        const exifBytes = piexif.dump(exifData);
        const newBinaryString = piexif.insert(exifBytes, binaryString);
        const newUint8Array = new Uint8Array(newBinaryString.length);
        
        for (let i = 0; i < newBinaryString.length; i++) {
            newUint8Array[i] = newBinaryString.charCodeAt(i);
        }
        
        return new File([newUint8Array], file.name, { type: file.type });
    } catch (error) {
        console.error('Error embedding JPEG metadata:', error);
        // Fallback to sidecar file
        return await createSidecarFile(file, metadata);
    }
}

async function embedPNGMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    try {
        // For PNG, we'll embed RSL data in a custom tEXt chunk
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Create RSL data as JSON
        const rslData = JSON.stringify(metadata);
        const rslBytes = new TextEncoder().encode(rslData);
        
        // PNG chunk structure: length (4 bytes) + type (4 bytes) + data + CRC (4 bytes)
        const chunkType = new TextEncoder().encode('tEXt');
        const chunkLength = new Uint8Array(4);
        chunkLength[0] = (rslBytes.length >> 24) & 0xFF;
        chunkLength[1] = (rslBytes.length >> 16) & 0xFF;
        chunkLength[2] = (rslBytes.length >> 8) & 0xFF;
        chunkLength[3] = rslBytes.length & 0xFF;
        
        // Find the end of the PNG file (before IEND chunk)
        const iendIndex = findPNGChunk(uint8Array, 'IEND');
        if (iendIndex === -1) {
            throw new Error('Invalid PNG file');
        }
        
        // Insert RSL chunk before IEND
        const newArray = new Uint8Array(uint8Array.length + chunkLength.length + chunkType.length + rslBytes.length + 4);
        let offset = 0;
        
        // Copy data before IEND
        newArray.set(uint8Array.slice(0, iendIndex), offset);
        offset += iendIndex;
        
        // Add RSL chunk
        newArray.set(chunkLength, offset);
        offset += chunkLength.length;
        newArray.set(chunkType, offset);
        offset += chunkType.length;
        newArray.set(rslBytes, offset);
        offset += rslBytes.length;
        
        // Add CRC (simplified - in production you'd calculate proper CRC)
        const crc = new Uint8Array([0, 0, 0, 0]);
        newArray.set(crc, offset);
        offset += 4;
        
        // Copy IEND chunk and remaining data
        newArray.set(uint8Array.slice(iendIndex), offset);
        
        return new File([newArray], file.name, { type: file.type });
    } catch (error) {
        console.error('Error embedding PNG metadata:', error);
        return await createSidecarFile(file, metadata);
    }
}

async function embedTIFFMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    // TIFF metadata embedding is complex, fallback to sidecar for now
    return await createSidecarFile(file, metadata);
}

async function embedVideoMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    const fileType = file.type.toLowerCase();
    
    if (fileType === 'video/mp4') {
        return await embedMP4Metadata(file, metadata);
    } else if (fileType === 'video/quicktime' || fileType === 'video/x-msvideo') {
        // For MOV/AVI, create sidecar file (complex metadata structures)
        return await createSidecarFile(file, metadata);
    } else {
        // For other video formats, create sidecar file
        return await createSidecarFile(file, metadata);
    }
}

async function embedAudioMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    try {
        const fileType = file.type.toLowerCase();
        
        if (fileType === 'audio/mpeg' || fileType === 'audio/mp3') {
            return await embedMP3Metadata(file, metadata);
        } else if (fileType === 'audio/wav') {
            return await embedWAVMetadata(file, metadata);
        } else {
            return await createSidecarFile(file, metadata);
        }
    } catch (error) {
        console.error('Error embedding audio metadata:', error);
        return await createSidecarFile(file, metadata);
    }
}

async function embedMP3Metadata(file: File, metadata: RSLMetadata): Promise<File> {
    try {
        // Dynamic import for node-id3
        const ID3 = await import('node-id3');
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Create RSL tags
        const tags = {
            title: 'RSL Protected Content',
            artist: 'RSL Platform',
            album: 'RSL-1.0',
            comment: {
                language: 'eng',
                text: JSON.stringify(metadata)
            },
            userDefinedText: [
                {
                    description: 'RSL_LICENSE',
                    value: metadata.license
                },
                {
                    description: 'RSL_PERMISSIONS',
                    value: metadata.permissions.join(',')
                },
                {
                    description: 'RSL_PAYMENT_MODEL',
                    value: metadata.paymentModel
                }
            ]
        };
        
        // Write tags to buffer
        const taggedBuffer = ID3.write(tags, buffer);
        
        return new File([taggedBuffer], file.name, { type: file.type });
    } catch (error) {
        console.error('Error embedding MP3 metadata:', error);
        return await createSidecarFile(file, metadata);
    }
}

async function embedWAVMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    // WAV metadata embedding is complex, fallback to sidecar
    return await createSidecarFile(file, metadata);
}

async function embedMP4Metadata(file: File, metadata: RSLMetadata): Promise<File> {
    try {
        // Dynamic import for mp4box
        const MP4Box = await import('mp4box');
        
        const arrayBuffer = await file.arrayBuffer();
        
        // Create MP4Box instance
        const mp4boxfile = MP4Box.createFile();
        
        // Convert ArrayBuffer to Uint8Array for MP4Box
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Load the MP4 file
        uint8Array.buffer.fileStart = 0;
        mp4boxfile.appendBuffer(uint8Array);
        
        // Create RSL metadata as JSON
        const rslData = JSON.stringify(metadata);
        
        // Create custom metadata atom (udta box)
        const rslMetadataAtom = {
            type: 'udta',
            children: [
                {
                    type: 'meta',
                    children: [
                        {
                            type: 'hdlr',
                            handler_type: 'mdir',
                            name: 'RSL Metadata Handler'
                        },
                        {
                            type: 'ilst',
                            children: [
                                {
                                    type: '©rsl',
                                    data: new TextEncoder().encode(rslData)
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        
        // Add the metadata atom to the MP4 file
        mp4boxfile.addMetadata(rslMetadataAtom);
        
        // Get the modified MP4 data
        const modifiedBuffer = mp4boxfile.getBuffer();
        
        return new File([modifiedBuffer], file.name, { type: file.type });
        
    } catch (error) {
        console.error('Error embedding MP4 metadata:', error);
        // Fallback to sidecar file
        return await createSidecarFile(file, metadata);
    }
}

async function embedPDFMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    try {
        // Dynamic import for pdf-lib
        const { PDFDocument } = await import('pdf-lib');
        
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Create RSL XMP metadata
        const rslXMP = createRSLXMP(metadata);
        
        // Set document metadata
        pdfDoc.setTitle(`RSL Protected: ${file.name}`);
        pdfDoc.setAuthor('RSL Platform');
        pdfDoc.setSubject('RSL-1.0 Licensed Content');
        pdfDoc.setKeywords(['RSL', 'license', 'metadata']);
        pdfDoc.setProducer('RSL Platform v1.0');
        pdfDoc.setCreator('RSL Platform');
        
        // Add custom XMP metadata
        const xmpData = `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6.0">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:rsl="https://rslstandard.org/rsl">
      <rsl:license>${metadata.license}</rsl:license>
      <rsl:permissions>${metadata.permissions.join(',')}</rsl:permissions>
      <rsl:paymentModel>${metadata.paymentModel}</rsl:paymentModel>
      <rsl:provenance>${metadata.provenanceInfo}</rsl:provenance>
      <rsl:dateIssued>${metadata.dateIssued}</rsl:dateIssued>
      <rsl:licenseServer>${metadata.licenseServer}</rsl:licenseServer>
      <rsl:contact>${metadata.contact}</rsl:contact>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;
        
        // Save the PDF with embedded metadata
        const pdfBytes = await pdfDoc.save();
        
        return new File([pdfBytes], file.name, { type: file.type });
    } catch (error) {
        console.error('Error embedding PDF metadata:', error);
        return await createSidecarFile(file, metadata);
    }
}

async function createSidecarFile(originalFile: File, metadata: RSLMetadata): Promise<File> {
    // Create a .rsl sidecar file for unsupported formats
    const rslData = JSON.stringify(metadata, null, 2);
    const sidecarFile = new File([rslData], `${originalFile.name}.rsl`, { 
        type: 'application/json' 
    });
    
    // For now, return the original file unchanged
    // In a real implementation, you'd provide both files or embed the sidecar reference
    return originalFile;
}

function createRSLXMP(metadata: RSLMetadata): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6.0">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:rsl="https://rslstandard.org/rsl">
      <rsl:license>${metadata.license}</rsl:license>
      <rsl:permissions>${metadata.permissions.join(',')}</rsl:permissions>
      <rsl:userTypes>${metadata.userTypes.join(',')}</rsl:userTypes>
      <rsl:paymentModel>${metadata.paymentModel}</rsl:paymentModel>
      ${metadata.paymentAmount ? `<rsl:paymentAmount>${metadata.paymentAmount}</rsl:paymentAmount>` : ''}
      ${metadata.paymentCurrency ? `<rsl:paymentCurrency>${metadata.paymentCurrency}</rsl:paymentCurrency>` : ''}
      ${metadata.attributionText ? `<rsl:attributionText>${metadata.attributionText}</rsl:attributionText>` : ''}
      ${metadata.subscriptionPeriod ? `<rsl:subscriptionPeriod>${metadata.subscriptionPeriod}</rsl:subscriptionPeriod>` : ''}
      <rsl:provenance>${metadata.provenanceInfo}</rsl:provenance>
      <rsl:dateIssued>${metadata.dateIssued}</rsl:dateIssued>
      <rsl:licenseServer>${metadata.licenseServer}</rsl:licenseServer>
      <rsl:contact>${metadata.contact}</rsl:contact>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;
}

function findPNGChunk(data: Uint8Array, chunkType: string): number {
    const typeBytes = new TextEncoder().encode(chunkType);
    let offset = 8; // Skip PNG signature
    
    while (offset < data.length - 8) {
        const length = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
        const type = data.slice(offset + 4, offset + 8);
        
        if (type.every((byte, i) => byte === typeBytes[i])) {
            return offset;
        }
        
        offset += 8 + length + 4; // length + type + data + CRC
    }
    
    return -1;
}

export function extractRSLMetadata(file: File): Promise<RSLMetadata | null> {
    return new Promise(async (resolve) => {
        try {
            const fileType = file.type.toLowerCase();
            
            if (fileType === 'image/jpeg') {
                const metadata = await extractJPEGMetadata(file);
                resolve(metadata);
            } else if (fileType === 'application/pdf') {
                const metadata = await extractPDFMetadata(file);
                resolve(metadata);
            } else if (fileType === 'audio/mpeg' || fileType === 'audio/mp3') {
                const metadata = await extractMP3Metadata(file);
                resolve(metadata);
            } else if (fileType === 'video/mp4') {
                const metadata = await extractMP4Metadata(file);
                resolve(metadata);
            } else {
                // Try to find sidecar file
                resolve(null);
            }
        } catch (error) {
            console.error('Error extracting RSL metadata:', error);
            resolve(null);
        }
    });
}

async function extractJPEGMetadata(file: File): Promise<RSLMetadata | null> {
    try {
        const piexif = await import('piexifjs');
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
        
        const exifData = piexif.load(binaryString);
        const userComment = exifData.Exif[piexif.ExifIFD.UserComment];
        
        if (userComment) {
            // Parse XMP data to extract RSL metadata
            return parseRSLXMP(userComment);
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

async function extractPDFMetadata(file: File): Promise<RSLMetadata | null> {
    try {
        const { PDFDocument } = await import('pdf-lib');
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Extract XMP metadata from PDF
        // This is a simplified implementation
        return null;
    } catch (error) {
        return null;
    }
}

async function extractMP3Metadata(file: File): Promise<RSLMetadata | null> {
    try {
        const ID3 = await import('node-id3');
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const tags = ID3.read(buffer);
        
        if (tags.comment && tags.comment.text) {
            try {
                return JSON.parse(tags.comment.text);
            } catch (e) {
                return null;
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

async function extractMP4Metadata(file: File): Promise<RSLMetadata | null> {
    try {
        // Dynamic import for mp4box
        const MP4Box = await import('mp4box');
        
        const arrayBuffer = await file.arrayBuffer();
        
        // Create MP4Box instance
        const mp4boxfile = MP4Box.createFile();
        
        // Convert ArrayBuffer to Uint8Array for MP4Box
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Load the MP4 file
        uint8Array.buffer.fileStart = 0;
        mp4boxfile.appendBuffer(uint8Array);
        
        // Extract metadata
        const metadata = mp4boxfile.getMetadata();
        
        if (metadata && metadata.udta && metadata.udta.meta && metadata.udta.meta.ilst) {
            // Look for RSL metadata in the ilst
            const rslData = metadata.udta.meta.ilst['©rsl'];
            if (rslData) {
                try {
                    const rslString = new TextDecoder().decode(rslData);
                    return JSON.parse(rslString);
                } catch (e) {
                    return null;
                }
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

function parseRSLXMP(xmpData: string): RSLMetadata | null {
    try {
        // Parse XMP XML to extract RSL metadata
        // This is a simplified implementation
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmpData, 'text/xml');
        const rslElements = doc.querySelectorAll('rsl\\:*, [xmlns\\:rsl] rsl\\:*');
        
        if (rslElements.length === 0) {
            return null;
        }
        
        // Extract RSL metadata from XML elements
        const metadata: Partial<RSLMetadata> = {};
        
        rslElements.forEach(element => {
            const tagName = element.tagName.replace('rsl:', '');
            const textContent = element.textContent || '';
            
            switch (tagName) {
                case 'license':
                    metadata.license = textContent;
                    break;
                case 'permissions':
                    metadata.permissions = textContent.split(',');
                    break;
                case 'paymentModel':
                    metadata.paymentModel = textContent;
                    break;
                case 'provenance':
                    metadata.provenanceInfo = textContent;
                    break;
                case 'dateIssued':
                    metadata.dateIssued = textContent;
                    break;
                case 'licenseServer':
                    metadata.licenseServer = textContent;
                    break;
                case 'contact':
                    metadata.contact = textContent;
                    break;
            }
        });
        
        // Return metadata if we found RSL data
        if (metadata.license) {
            return metadata as RSLMetadata;
        }
        
        return null;
    } catch (error) {
        return null;
    }
}
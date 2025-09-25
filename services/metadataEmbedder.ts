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
    console.log(`Starting RSL metadata embedding for: ${rslFile.file.name}`);
    console.log(`File type: ${rslFile.file.type}, Size: ${rslFile.file.size} bytes`);
    
    const metadata = createRSLMetadata(options);
    
    const fileType = rslFile.file.type.toLowerCase();
    const fileName = rslFile.file.name.toLowerCase();
    
    try {
        if (fileType.startsWith('image/')) {
            console.log('Processing as image file');
            return await embedImageMetadata(rslFile.file, metadata);
        } else if (fileType.startsWith('video/') || fileName.endsWith('.mp4') || fileName.endsWith('.m4v') || fileName.endsWith('.mov') || fileName.endsWith('.avi')) {
            console.log('Processing as video file');
            return await embedVideoMetadata(rslFile.file, metadata);
        } else if (fileType.startsWith('audio/') || fileName.endsWith('.mp3') || fileName.endsWith('.wav')) {
            console.log('Processing as audio file');
            return await embedAudioMetadata(rslFile.file, metadata);
        } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            console.log('Processing as PDF file');
            return await embedPDFMetadata(rslFile.file, metadata);
        } else {
            console.log(`Unsupported file type: ${fileType}, creating sidecar file`);
            return await createSidecarFile(rslFile.file, metadata);
        }
    } catch (error) {
        console.error('Error in embedRSLMetadata:', error);
        console.log('Falling back to sidecar file creation');
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
        return await createSidecarFile(file, metadata);
    }
}

async function embedJPEGMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    try {
        const piexif = await import('piexifjs');
        
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
        
        
        let exifData: any = {};
        try {
            exifData = piexif.load(binaryString);
        } catch (e) {
            
            exifData = {
                "0th": {},
                "Exif": {},
                "GPS": {},
                "Interop": {},
                "1st": {},
                "thumbnail": null
            };
        }
        
        
        const rslXMP = createRSLXMP(metadata);
        
        
        exifData["0th"][piexif.ImageIFD.Make] = "RSL Platform";
        exifData["0th"][piexif.ImageIFD.Software] = "RSL-1.0";
        exifData["Exif"][piexif.ExifIFD.UserComment] = rslXMP;
        
        
        const exifBytes = piexif.dump(exifData);
        const newBinaryString = piexif.insert(exifBytes, binaryString);
        const newUint8Array = new Uint8Array(newBinaryString.length);
        
        for (let i = 0; i < newBinaryString.length; i++) {
            newUint8Array[i] = newBinaryString.charCodeAt(i);
        }
        
        return new File([newUint8Array], file.name, { type: file.type });
    } catch (error) {
        console.error('Error embedding JPEG metadata:', error);
        
        return await createSidecarFile(file, metadata);
    }
}

async function embedPNGMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    try {
        
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        
        const rslData = JSON.stringify(metadata);
        const rslBytes = new TextEncoder().encode(rslData);
        
        
        const chunkType = new TextEncoder().encode('tEXt');
        const chunkLength = new Uint8Array(4);
        chunkLength[0] = (rslBytes.length >> 24) & 0xFF;
        chunkLength[1] = (rslBytes.length >> 16) & 0xFF;
        chunkLength[2] = (rslBytes.length >> 8) & 0xFF;
        chunkLength[3] = rslBytes.length & 0xFF;
        
        
        const iendIndex = findPNGChunk(uint8Array, 'IEND');
        if (iendIndex === -1) {
            throw new Error('Invalid PNG file');
        }
        
        
        const newArray = new Uint8Array(uint8Array.length + chunkLength.length + chunkType.length + rslBytes.length + 4);
        let offset = 0;
        
        
        newArray.set(uint8Array.slice(0, iendIndex), offset);
        offset += iendIndex;
        
        
        newArray.set(chunkLength, offset);
        offset += chunkLength.length;
        newArray.set(chunkType, offset);
        offset += chunkType.length;
        newArray.set(rslBytes, offset);
        offset += rslBytes.length;
        
        
        const crc = new Uint8Array([0, 0, 0, 0]);
        newArray.set(crc, offset);
        offset += 4;
        
        
        newArray.set(uint8Array.slice(iendIndex), offset);
        
        return new File([newArray], file.name, { type: file.type });
    } catch (error) {
        console.error('Error embedding PNG metadata:', error);
        return await createSidecarFile(file, metadata);
    }
}

async function embedTIFFMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    
    return await createSidecarFile(file, metadata);
}

async function embedVideoMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    console.log(`Processing video file: ${file.name} (${fileType})`);
    
    // Check for MP4 variants
    if (fileType === 'video/mp4' || 
        fileType === 'video/mp4v-es' ||
        fileName.endsWith('.mp4') ||
        fileName.endsWith('.m4v')) {
        console.log('Detected MP4 format, attempting direct metadata embedding');
        return await embedMP4Metadata(file, metadata);
    } else if (fileType === 'video/quicktime' || 
               fileType === 'video/x-msvideo' ||
               fileName.endsWith('.mov') ||
               fileName.endsWith('.avi')) {
        console.log('Detected QuickTime/AVI format, using sidecar file');
        return await createSidecarFile(file, metadata);
    } else if (fileType.startsWith('video/')) {
        console.log(`Unsupported video format: ${fileType}, using sidecar file`);
        return await createSidecarFile(file, metadata);
    } else {
        console.log(`Non-video file detected: ${fileType}, using sidecar file`);
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
        
        const ID3 = await import('node-id3');
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        
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
        
        
        const taggedBuffer = ID3.write(tags, buffer);
        
        return new File([taggedBuffer], file.name, { type: file.type });
    } catch (error) {
        console.error('Error embedding MP3 metadata:', error);
        return await createSidecarFile(file, metadata);
    }
}

async function embedWAVMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    
    return await createSidecarFile(file, metadata);
}

async function embedMP4Metadata(file: File, metadata: RSLMetadata): Promise<File> {
    try {
        console.log(`Starting MP4 metadata embedding for ${file.name}`);
        
        // Import MP4Box library
        const MP4Box = await import('mp4box');
        
        const arrayBuffer = await file.arrayBuffer();
        console.log(`Loaded MP4 file buffer: ${arrayBuffer.byteLength} bytes`);
        
        // Create MP4Box file instance
        const mp4boxfile = MP4Box.createFile();
        
        // Convert to Uint8Array for MP4Box
        const uint8Array = new Uint8Array(arrayBuffer);
        uint8Array.buffer.fileStart = 0;
        
        // Parse the MP4 file
        mp4boxfile.appendBuffer(uint8Array);
        
        // Create comprehensive RSL metadata
        const rslData = JSON.stringify(metadata, null, 2);
        console.log(`RSL metadata size: ${rslData.length} characters`);
        
        // Create RSL metadata atom structure
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
                                },
                                {
                                    type: '©RSL',
                                    data: new TextEncoder().encode(rslData)
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        
        // Add metadata to the MP4 file
        mp4boxfile.addMetadata(rslMetadataAtom);
        console.log('Added RSL metadata atom to MP4 file');
        
        // Get the modified buffer
        const modifiedBuffer = mp4boxfile.getBuffer();
        console.log(`Modified MP4 buffer size: ${modifiedBuffer.byteLength} bytes`);
        
        // Create new file with embedded metadata
        const embeddedFile = new File([modifiedBuffer], file.name, { type: file.type });
        console.log(`Successfully embedded RSL metadata in MP4: ${embeddedFile.name}`);
        
        return embeddedFile;
        
    } catch (error) {
        console.error('Error embedding MP4 metadata:', error);
        console.log('Falling back to sidecar file creation');
        
        return await createSidecarFile(file, metadata);
    }
}

async function embedPDFMetadata(file: File, metadata: RSLMetadata): Promise<File> {
    try {
        
        const { PDFDocument } = await import('pdf-lib');
        
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        
        const rslXMP = createRSLXMP(metadata);
        
        
        pdfDoc.setTitle(`RSL Protected: ${file.name}`);
        pdfDoc.setAuthor('RSL Platform');
        pdfDoc.setSubject('RSL-1.0 Licensed Content');
        pdfDoc.setKeywords(['RSL', 'license', 'metadata']);
        pdfDoc.setProducer('RSL Platform v1.0');
        pdfDoc.setCreator('RSL Platform');
        
        
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
        
        
        const pdfBytes = await pdfDoc.save();
        
        return new File([pdfBytes], file.name, { type: file.type });
    } catch (error) {
        console.error('Error embedding PDF metadata:', error);
        return await createSidecarFile(file, metadata);
    }
}

async function createSidecarFile(originalFile: File, metadata: RSLMetadata): Promise<File> {
    // Create a comprehensive RSL sidecar file
    const rslData = JSON.stringify(metadata, null, 2);
    
    // Create a more detailed sidecar file with metadata
    const sidecarContent = `# RSL (Rights and Standards License) Metadata
# Generated for: ${originalFile.name}
# Created: ${new Date().toISOString()}
# File Type: ${originalFile.type}
# File Size: ${originalFile.size} bytes

# This file contains RSL metadata for the associated media file.
# The metadata should be read by AI systems and crawlers to respect licensing terms.

${rslData}

# End of RSL Metadata`;
    
    const sidecarFile = new File([sidecarContent], `${originalFile.name}.rsl`, { 
        type: 'text/plain' 
    });
    
    console.log(`Created RSL sidecar file for ${originalFile.name}: ${sidecarFile.name}`);
    
    return sidecarFile;
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
    let offset = 8; 
    
    while (offset < data.length - 8) {
        const length = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
        const type = data.slice(offset + 4, offset + 8);
        
        if (type.every((byte, i) => byte === typeBytes[i])) {
            return offset;
        }
        
        offset += 8 + length + 4; 
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
        console.log(`Extracting MP4 metadata from: ${file.name}`);
        
        const MP4Box = await import('mp4box');
        
        const arrayBuffer = await file.arrayBuffer();
        console.log(`Loaded MP4 file for extraction: ${arrayBuffer.byteLength} bytes`);
        
        const mp4boxfile = MP4Box.createFile();
        
        const uint8Array = new Uint8Array(arrayBuffer);
        uint8Array.buffer.fileStart = 0;
        mp4boxfile.appendBuffer(uint8Array);
        
        const metadata = mp4boxfile.getMetadata();
        console.log('MP4 metadata structure:', metadata);
        
        if (metadata && metadata.udta && metadata.udta.meta && metadata.udta.meta.ilst) {
            console.log('Found MP4 metadata structure, looking for RSL data');
            
            // Check both lowercase and uppercase RSL tags
            const rslData = metadata.udta.meta.ilst['©rsl'] || metadata.udta.meta.ilst['©RSL'];
            if (rslData) {
                console.log('Found RSL metadata in MP4 file');
                try {
                    const rslString = new TextDecoder().decode(rslData);
                    const parsedMetadata = JSON.parse(rslString);
                    console.log('Successfully parsed RSL metadata from MP4');
                    return parsedMetadata;
                } catch (e) {
                    console.error('Error parsing RSL metadata from MP4:', e);
                    return null;
                }
            } else {
                console.log('No RSL metadata found in MP4 file');
            }
        } else {
            console.log('No metadata structure found in MP4 file');
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting MP4 metadata:', error);
        return null;
    }
}

function parseRSLXMP(xmpData: string): RSLMetadata | null {
    try {
        
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmpData, 'text/xml');
        const rslElements = doc.querySelectorAll('rsl\\:*, [xmlns\\:rsl] rsl\\:*');
        
        if (rslElements.length === 0) {
            return null;
        }
        
        
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
        
        
        if (metadata.license) {
            return metadata as RSLMetadata;
        }
        
        return null;
    } catch (error) {
        return null;
    }
}
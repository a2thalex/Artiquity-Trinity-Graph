import exifr from 'exifr';
import sharp from 'sharp';
import { logger } from '../utils/logger.js';

export class MetadataEmbedder {
  constructor() {
    this.rslNamespace = 'https:
  }

  detectFormat(file) {
    const mimeType = file.mimetype.toLowerCase();
    
    if (mimeType.startsWith('image/')) {
      return 'exif';
    } else if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') {
      return 'id3';
    } else if (mimeType === 'text/html') {
      return 'html';
    } else {
      return 'sidecar';
    }
  }

  async embedInEXIF(file, rslXML) {
    try {
      if (!file.mimetype.startsWith('image/')) {
        throw new Error('EXIF embedding only supported for image files');
      }

      
      const image = sharp(file.buffer);
      const metadata = await image.metadata();
      
      
      const rslMetadata = {
        'RSL:License': rslXML,
        'RSL:Version': '1.0',
        'RSL:Namespace': this.rslNamespace
      };

      
      const modifiedImage = await image
        .withMetadata({
          exif: {
            ...metadata.exif,
            ...rslMetadata
          }
        })
        .toBuffer();

      return {
        buffer: modifiedImage,
        size: modifiedImage.length,
        originalName: file.originalname
      };
    } catch (error) {
      logger.error('EXIF embedding error:', error);
      throw new Error('Failed to embed RSL metadata in EXIF');
    }
  }

  async embedInXMP(file, rslXML) {
    try {
      
      
      const xmpData = `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http:
    <rdf:Description rdf:about="" xmlns:rsl="${this.rslNamespace}">
      <rsl:License>${this.escapeXML(rslXML)}</rsl:License>
      <rsl:Version>1.0</rsl:Version>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;

      
      
      return {
        buffer: Buffer.concat([file.buffer, Buffer.from(xmpData)]),
        size: file.buffer.length + Buffer.byteLength(xmpData),
        originalName: file.originalname
      };
    } catch (error) {
      logger.error('XMP embedding error:', error);
      throw new Error('Failed to embed RSL metadata in XMP');
    }
  }

  async embedInID3(file, rslXML) {
    try {
      
      
      const id3Tag = `TXXX:RSL_LICENSE:${rslXML}`;
      
      
      
      return {
        buffer: Buffer.concat([file.buffer, Buffer.from(id3Tag)]),
        size: file.buffer.length + Buffer.byteLength(id3Tag),
        originalName: file.originalname
      };
    } catch (error) {
      logger.error('ID3 embedding error:', error);
      throw new Error('Failed to embed RSL metadata in ID3');
    }
  }

  async embedInHTML(file, rslXML) {
    try {
      if (file.mimetype !== 'text/html') {
        throw new Error('HTML embedding only supported for HTML files');
      }

      const htmlContent = file.buffer.toString('utf-8');
      const rslScript = `
<script type="application/rss+xml" id="rsl-license">
${rslXML}
</script>
<meta name="rsl-license" content="${this.escapeHTML(rslXML)}" />
<link rel="license" href="data:application/rss+xml;base64,${Buffer.from(rslXML).toString('base64')}" />
`;

      
      const modifiedHTML = htmlContent.replace(
        /<\/head>/i,
        `${rslScript}\n</head>`
      );

      return {
        buffer: Buffer.from(modifiedHTML, 'utf-8'),
        size: Buffer.byteLength(modifiedHTML, 'utf-8'),
        originalName: file.originalname
      };
    } catch (error) {
      logger.error('HTML embedding error:', error);
      throw new Error('Failed to embed RSL metadata in HTML');
    }
  }

  async createSidecarFile(file, rslXML) {
    try {
      const sidecarContent = `# RSL License File
# Generated for: ${file.originalname}
# Created: ${new Date().toISOString()}

${rslXML}
`;

      const sidecarBuffer = Buffer.from(sidecarContent, 'utf-8');
      const sidecarName = file.originalname + '.rsl';

      return {
        buffer: sidecarBuffer,
        size: sidecarBuffer.length,
        originalName: sidecarName
      };
    } catch (error) {
      logger.error('Sidecar file creation error:', error);
      throw new Error('Failed to create RSL sidecar file');
    }
  }

  async embedMetadata(file, rslXML, format) {
    switch (format) {
      case 'exif':
        return await this.embedInEXIF(file, rslXML);
      case 'xmp':
        return await this.embedInXMP(file, rslXML);
      case 'id3':
        return await this.embedInID3(file, rslXML);
      case 'html':
        return await this.embedInHTML(file, rslXML);
      case 'sidecar':
        return await this.createSidecarFile(file, rslXML);
      default:
        throw new Error(`Unsupported metadata format: ${format}`);
    }
  }

  async extractMetadata(file) {
    try {
      const format = this.detectFormat(file);
      
      switch (format) {
        case 'exif':
          return await this.extractFromEXIF(file);
        case 'xmp':
          return await this.extractFromXMP(file);
        case 'id3':
          return await this.extractFromID3(file);
        case 'html':
          return await this.extractFromHTML(file);
        case 'sidecar':
          return await this.extractFromSidecar(file);
        default:
          return null;
      }
    } catch (error) {
      logger.error('Metadata extraction error:', error);
      return null;
    }
  }

  async extractFromEXIF(file) {
    try {
      const metadata = await exifr.parse(file.buffer);
      return metadata?.['RSL:License'] || null;
    } catch (error) {
      logger.error('EXIF extraction error:', error);
      return null;
    }
  }

  async extractFromXMP(file) {
    try {
      
      const content = file.buffer.toString('utf-8');
      const match = content.match(/<rsl:License>(.*?)<\/rsl:License>/s);
      return match ? match[1] : null;
    } catch (error) {
      logger.error('XMP extraction error:', error);
      return null;
    }
  }

  async extractFromID3(file) {
    try {
      
      const content = file.buffer.toString('utf-8');
      const match = content.match(/TXXX:RSL_LICENSE:(.*?)$/m);
      return match ? match[1] : null;
    } catch (error) {
      logger.error('ID3 extraction error:', error);
      return null;
    }
  }

  async extractFromHTML(file) {
    try {
      const content = file.buffer.toString('utf-8');
      
      
      const scriptMatch = content.match(/<script[^>]*id="rsl-license"[^>]*>(.*?)<\/script>/s);
      if (scriptMatch) {
        return scriptMatch[1].trim();
      }
      
      
      const metaMatch = content.match(/<meta[^>]*name="rsl-license"[^>]*content="([^"]*)"[^>]*>/i);
      if (metaMatch) {
        return metaMatch[1];
      }
      
      return null;
    } catch (error) {
      logger.error('HTML extraction error:', error);
      return null;
    }
  }

  async extractFromSidecar(file) {
    try {
      const content = file.buffer.toString('utf-8');
      
      
      const xmlMatch = content.match(/<rsl:license[^>]*>.*?<\/rsl:license>/s);
      return xmlMatch ? xmlMatch[0] : null;
    } catch (error) {
      logger.error('Sidecar extraction error:', error);
      return null;
    }
  }

  escapeXML(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  escapeHTML(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

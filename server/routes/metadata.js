import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import { logger } from '../utils/logger.js';
import { authenticateOAuthToken } from '../middleware/auth.js';
import { MetadataEmbedder } from '../services/metadataEmbedder.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for metadata embedding
    cb(null, true);
  }
});

// Embed RSL metadata in file
router.post('/embed', authenticateOAuthToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'no_file',
        error_description: 'No file provided for metadata embedding'
      });
    }

    const { licenseId, format } = req.body;
    const db = getDatabase();

    // Verify license exists and user has access
    const license = await db.get(
      'SELECT * FROM rsl_licenses WHERE license_id = ? AND is_active = 1',
      [licenseId]
    );

    if (!license) {
      return res.status(404).json({
        error: 'license_not_found',
        error_description: 'License not found or inactive'
      });
    }

    // Get RSL XML content
    const rslXML = license.xml_content;

    // Embed metadata based on file type and format
    const embedder = new MetadataEmbedder();
    let embeddedFile;
    let metadataType;

    switch (format) {
      case 'exif':
        embeddedFile = await embedder.embedInEXIF(req.file, rslXML);
        metadataType = 'exif';
        break;
      case 'xmp':
        embeddedFile = await embedder.embedInXMP(req.file, rslXML);
        metadataType = 'xmp';
        break;
      case 'id3':
        embeddedFile = await embedder.embedInID3(req.file, rslXML);
        metadataType = 'id3';
        break;
      case 'html':
        embeddedFile = await embedder.embedInHTML(req.file, rslXML);
        metadataType = 'html';
        break;
      case 'sidecar':
        embeddedFile = await embedder.createSidecarFile(req.file, rslXML);
        metadataType = 'sidecar';
        break;
      default:
        // Auto-detect format based on file type
        const detectedFormat = embedder.detectFormat(req.file);
        embeddedFile = await embedder.embedMetadata(req.file, rslXML, detectedFormat);
        metadataType = detectedFormat;
    }

    // Store metadata embedding record
    const metadataId = uuidv4();
    await db.run(
      `INSERT INTO file_metadata (id, license_id, file_path, metadata_type, embedded_data, size)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        metadataId,
        license.id,
        req.file.originalname,
        metadataType,
        rslXML,
        embeddedFile.size
      ]
    );

    // Log audit trail
    await db.run(
      `INSERT INTO audit_trail (id, license_id, user_id, action, ip_address, user_agent, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        license.id,
        req.user.id,
        'metadata_embedded',
        req.ip,
        req.get('User-Agent'),
        JSON.stringify({
          fileName: req.file.originalname,
          fileSize: req.file.size,
          metadataType,
          format
        })
      ]
    );

    logger.info('Metadata embedded in file', {
      licenseId,
      fileName: req.file.originalname,
      metadataType,
      userId: req.user.id
    });

    // Return embedded file
    res.set({
      'Content-Type': req.file.mimetype,
      'Content-Disposition': `attachment; filename="${req.file.originalname}"`,
      'Content-Length': embeddedFile.size
    });

    res.send(embeddedFile.buffer);
  } catch (error) {
    logger.error('Metadata embedding error:', error);
    next(error);
  }
});

// Extract RSL metadata from file
router.post('/extract', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'no_file',
        error_description: 'No file provided for metadata extraction'
      });
    }

    const embedder = new MetadataEmbedder();
    const extractedMetadata = await embedder.extractMetadata(req.file);

    if (!extractedMetadata) {
      return res.status(404).json({
        error: 'no_metadata',
        error_description: 'No RSL metadata found in file'
      });
    }

    // Validate extracted RSL XML
    const { rslGenerator } = await import('../services/rslGenerator.js');
    const validation = await rslGenerator.validateRSLXML(extractedMetadata);

    res.json({
      success: true,
      metadata: extractedMetadata,
      validation,
      fileInfo: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    logger.error('Metadata extraction error:', error);
    next(error);
  }
});

// Generate robots.txt with RSL directives
router.post('/robots-txt', authenticateOAuthToken, async (req, res, next) => {
  try {
    const { licenseId, domain, additionalDirectives } = req.body;
    const db = getDatabase();

    // Verify license exists
    const license = await db.get(
      'SELECT * FROM rsl_licenses WHERE license_id = ? AND is_active = 1',
      [licenseId]
    );

    if (!license) {
      return res.status(404).json({
        error: 'license_not_found',
        error_description: 'License not found or inactive'
      });
    }

    // Generate robots.txt content
    const robotsContent = generateRobotsTxt(license, domain, additionalDirectives);

    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="robots.txt"'
    });

    res.send(robotsContent);
  } catch (error) {
    logger.error('Robots.txt generation error:', error);
    next(error);
  }
});

// Generate HTTP Link headers
router.post('/link-headers', authenticateOAuthToken, async (req, res, next) => {
  try {
    const { licenseId, contentType } = req.body;
    const db = getDatabase();

    // Verify license exists
    const license = await db.get(
      'SELECT * FROM rsl_licenses WHERE license_id = ? AND is_active = 1',
      [licenseId]
    );

    if (!license) {
      return res.status(404).json({
        error: 'license_not_found',
        error_description: 'License not found or inactive'
      });
    }

    // Generate Link headers
    const linkHeaders = generateLinkHeaders(license, contentType);

    res.json({
      success: true,
      headers: linkHeaders,
      licenseId: license.license_id
    });
  } catch (error) {
    logger.error('Link headers generation error:', error);
    next(error);
  }
});

// Generate RSS feed with RSL namespace
router.post('/rss-feed', authenticateOAuthToken, async (req, res, next) => {
  try {
    const { licenseIds, feedTitle, feedDescription, feedUrl } = req.body;
    const db = getDatabase();

    // Get licenses
    const placeholders = licenseIds.map(() => '?').join(',');
    const licenses = await db.all(
      `SELECT * FROM rsl_licenses WHERE license_id IN (${placeholders}) AND is_active = 1`,
      licenseIds
    );

    if (licenses.length === 0) {
      return res.status(404).json({
        error: 'no_licenses',
        error_description: 'No active licenses found'
      });
    }

    // Generate RSS feed
    const rssContent = generateRSSFeed(licenses, feedTitle, feedDescription, feedUrl);

    res.set({
      'Content-Type': 'application/rss+xml',
      'Content-Disposition': 'attachment; filename="rsl-feed.rss"'
    });

    res.send(rssContent);
  } catch (error) {
    logger.error('RSS feed generation error:', error);
    next(error);
  }
});

// Helper functions
function generateRobotsTxt(license, domain, additionalDirectives = []) {
  const rslUrl = `${domain}/rsl/${license.license_id}`;
  
  let robotsContent = `# Robots.txt with RSL License Information
User-agent: *
Allow: /

# RSL License Information
# License: ${rslUrl}
# License ID: ${license.license_id}
# Created: ${license.created_at}
${license.expires_at ? `# Expires: ${license.expires_at}` : ''}

# RSL License Directive
License: ${rslUrl}

`;

  // Add additional directives
  if (additionalDirectives.length > 0) {
    robotsContent += '\n# Additional Directives\n';
    additionalDirectives.forEach(directive => {
      robotsContent += `${directive}\n`;
    });
  }

  return robotsContent;
}

function generateLinkHeaders(license, contentType = 'text/html') {
  const rslUrl = `/rsl/${license.license_id}`;
  
  const headers = [
    `<${rslUrl}>; rel="license"; type="application/rss+xml"`,
    `<${rslUrl}>; rel="alternate"; type="application/rss+xml"; title="RSL License"`,
    `<${rslUrl}>; rel="canonical"`,
    `<${rslUrl}>; rel="describedby"; type="application/rss+xml"`
  ];

  return {
    'Link': headers.join(', '),
    'X-RSL-License': license.license_id,
    'X-RSL-Version': '1.0'
  };
}

function generateRSSFeed(licenses, title, description, feedUrl) {
  const now = new Date().toISOString();
  
  let rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:rsl="https://rslstandard.org/rsl">
  <channel>
    <title>${title || 'RSL Licensed Content'}</title>
    <description>${description || 'Content licensed under RSL standard'}</description>
    <link>${feedUrl || 'https://rslplatform.com'}</link>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>RSL Platform</generator>
    
`;

  licenses.forEach(license => {
    rssContent += `    <item>
      <title>${license.title}</title>
      <description>${license.description || ''}</description>
      <link>${feedUrl}/rsl/${license.license_id}</link>
      <guid>${license.license_id}</guid>
      <pubDate>${new Date(license.created_at).toUTCString()}</pubDate>
      <rsl:license>${license.license_id}</rsl:license>
      <rsl:file-type>${license.file_type}</rsl:file-type>
      <rsl:file-size>${license.file_size}</rsl:file-size>
      <rsl:permissions>${license.permissions}</rsl:permissions>
      <rsl:payment-model>${license.payment_model}</rsl:payment-model>
    </item>
`;
  });

  rssContent += `  </channel>
</rss>`;

  return rssContent;
}

export { router as metadataRoutes };

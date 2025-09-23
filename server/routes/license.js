import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import { logger } from '../utils/logger.js';
import { rslGenerator } from '../services/rslGenerator.js';
import { validateLicenseRequest, validateRSLDocument } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create new RSL license
router.post('/create', authenticateToken, validateRSLDocument, async (req, res, next) => {
  try {
    const rslData = req.body;
    const db = getDatabase();
    const userId = req.user.id;

    // Generate RSL XML
    const xmlContent = rslGenerator.generateRSLXML(rslData);

    // Validate XML
    const validation = await rslGenerator.validateRSLXML(xmlContent);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'invalid_rsl_document',
        error_description: 'RSL XML validation failed',
        details: validation.errors
      });
    }

    // Store license in database
    const licenseId = uuidv4();
    await db.run(
      `INSERT INTO rsl_licenses (
        id, license_id, user_id, content_id, title, description, file_type, file_size, 
        file_hash, content_url, xml_content, permissions, user_types, 
        geographic_restrictions, payment_model, warranty_declaration, 
        disclaimer_config, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        licenseId,
        rslData.licenseId,
        userId,
        rslData.content.hash,
        rslData.content.title,
        rslData.content.description,
        rslData.content.fileType,
        rslData.content.fileSize,
        rslData.content.hash,
        rslData.content.url,
        xmlContent,
        JSON.stringify(rslData.permissions),
        JSON.stringify(rslData.userTypes),
        JSON.stringify(rslData.geographicRestrictions),
        JSON.stringify(rslData.paymentModel),
        JSON.stringify(rslData.metadata.warranty),
        JSON.stringify(rslData.metadata.disclaimer),
        rslData.expiresAt
      ]
    );

    // Log audit trail
    await db.run(
      `INSERT INTO audit_trail (id, license_id, user_id, action, ip_address, user_agent, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        licenseId,
        userId,
        'license_created',
        req.ip,
        req.get('User-Agent'),
        JSON.stringify({ licenseId: rslData.licenseId, title: rslData.content.title })
      ]
    );

    logger.info('RSL license created', {
      licenseId: rslData.licenseId,
      userId,
      title: rslData.content.title
    });

    res.status(201).json({
      success: true,
      licenseId: rslData.licenseId,
      xmlContent,
      expiresAt: rslData.expiresAt
    });
  } catch (error) {
    logger.error('License creation error:', error);
    next(error);
  }
});

// Get license by ID
router.get('/:licenseId', authenticateToken, async (req, res, next) => {
  try {
    const { licenseId } = req.params;
    const db = getDatabase();

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

    // Check if user has access to this license
    if (license.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        error: 'access_denied',
        error_description: 'You do not have access to this license'
      });
    }

    // Parse stored data
    const licenseData = {
      id: license.license_id,
      title: license.title,
      description: license.description,
      fileType: license.file_type,
      fileSize: license.file_size,
      fileHash: license.file_hash,
      contentUrl: license.content_url,
      xmlContent: license.xml_content,
      permissions: JSON.parse(license.permissions),
      userTypes: JSON.parse(license.user_types),
      geographicRestrictions: JSON.parse(license.geographic_restrictions),
      paymentModel: JSON.parse(license.payment_model),
      warrantyDeclaration: JSON.parse(license.warranty_declaration),
      disclaimerConfig: JSON.parse(license.disclaimer_config),
      createdAt: license.created_at,
      expiresAt: license.expires_at,
      isActive: license.is_active
    };

    res.json(licenseData);
  } catch (error) {
    logger.error('License retrieval error:', error);
    next(error);
  }
});

// List user's licenses
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const db = getDatabase();
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM rsl_licenses WHERE user_id = ?';
    let params = [userId];

    if (status === 'active') {
      query += ' AND is_active = 1 AND (expires_at IS NULL OR expires_at > datetime("now"))';
    } else if (status === 'expired') {
      query += ' AND (expires_at IS NOT NULL AND expires_at <= datetime("now"))';
    } else if (status === 'inactive') {
      query += ' AND is_active = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const licenses = await db.all(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM rsl_licenses WHERE user_id = ?';
    let countParams = [userId];

    if (status === 'active') {
      countQuery += ' AND is_active = 1 AND (expires_at IS NULL OR expires_at > datetime("now"))';
    } else if (status === 'expired') {
      countQuery += ' AND (expires_at IS NOT NULL AND expires_at <= datetime("now"))';
    } else if (status === 'inactive') {
      countQuery += ' AND is_active = 0';
    }

    const countResult = await db.get(countQuery, countParams);
    const total = countResult.total;

    const licenseList = licenses.map(license => ({
      id: license.license_id,
      title: license.title,
      description: license.description,
      fileType: license.file_type,
      fileSize: license.file_size,
      createdAt: license.created_at,
      expiresAt: license.expires_at,
      isActive: license.is_active
    }));

    res.json({
      licenses: licenseList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('License list error:', error);
    next(error);
  }
});

// Update license
router.put('/:licenseId', authenticateToken, validateRSLDocument, async (req, res, next) => {
  try {
    const { licenseId } = req.params;
    const rslData = req.body;
    const db = getDatabase();
    const userId = req.user.id;

    // Check if license exists and user owns it
    const existingLicense = await db.get(
      'SELECT * FROM rsl_licenses WHERE license_id = ? AND user_id = ?',
      [licenseId, userId]
    );

    if (!existingLicense) {
      return res.status(404).json({
        error: 'license_not_found',
        error_description: 'License not found or you do not have permission to modify it'
      });
    }

    // Generate updated RSL XML
    const xmlContent = rslGenerator.generateRSLXML(rslData);

    // Validate XML
    const validation = await rslGenerator.validateRSLXML(xmlContent);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'invalid_rsl_document',
        error_description: 'RSL XML validation failed',
        details: validation.errors
      });
    }

    // Update license
    await db.run(
      `UPDATE rsl_licenses SET 
        title = ?, description = ?, xml_content = ?, permissions = ?, 
        user_types = ?, geographic_restrictions = ?, payment_model = ?, 
        warranty_declaration = ?, disclaimer_config = ?, expires_at = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE license_id = ? AND user_id = ?`,
      [
        rslData.content.title,
        rslData.content.description,
        xmlContent,
        JSON.stringify(rslData.permissions),
        JSON.stringify(rslData.userTypes),
        JSON.stringify(rslData.geographicRestrictions),
        JSON.stringify(rslData.paymentModel),
        JSON.stringify(rslData.metadata.warranty),
        JSON.stringify(rslData.metadata.disclaimer),
        rslData.expiresAt,
        licenseId,
        userId
      ]
    );

    // Log audit trail
    await db.run(
      `INSERT INTO audit_trail (id, license_id, user_id, action, ip_address, user_agent, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        existingLicense.id,
        userId,
        'license_updated',
        req.ip,
        req.get('User-Agent'),
        JSON.stringify({ licenseId, changes: Object.keys(rslData) })
      ]
    );

    logger.info('RSL license updated', {
      licenseId,
      userId,
      title: rslData.content.title
    });

    res.json({
      success: true,
      licenseId,
      xmlContent,
      message: 'License updated successfully'
    });
  } catch (error) {
    logger.error('License update error:', error);
    next(error);
  }
});

// Deactivate license
router.delete('/:licenseId', authenticateToken, async (req, res, next) => {
  try {
    const { licenseId } = req.params;
    const db = getDatabase();
    const userId = req.user.id;

    // Check if license exists and user owns it
    const existingLicense = await db.get(
      'SELECT * FROM rsl_licenses WHERE license_id = ? AND user_id = ?',
      [licenseId, userId]
    );

    if (!existingLicense) {
      return res.status(404).json({
        error: 'license_not_found',
        error_description: 'License not found or you do not have permission to modify it'
      });
    }

    // Deactivate license
    await db.run(
      'UPDATE rsl_licenses SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE license_id = ? AND user_id = ?',
      [licenseId, userId]
    );

    // Log audit trail
    await db.run(
      `INSERT INTO audit_trail (id, license_id, user_id, action, ip_address, user_agent, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        existingLicense.id,
        userId,
        'license_deactivated',
        req.ip,
        req.get('User-Agent'),
        JSON.stringify({ licenseId })
      ]
    );

    logger.info('RSL license deactivated', {
      licenseId,
      userId
    });

    res.json({
      success: true,
      message: 'License deactivated successfully'
    });
  } catch (error) {
    logger.error('License deactivation error:', error);
    next(error);
  }
});

// Get license templates
router.get('/templates/list', async (req, res, next) => {
  try {
    const db = getDatabase();

    const templates = await db.all(
      'SELECT * FROM license_templates ORDER BY is_default DESC, name ASC'
    );

    const templateList = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      permissions: JSON.parse(template.permissions),
      userTypes: JSON.parse(template.user_types),
      paymentModel: JSON.parse(template.payment_model),
      geographicRestrictions: JSON.parse(template.geographic_restrictions),
      isDefault: template.is_default
    }));

    res.json(templateList);
  } catch (error) {
    logger.error('Template list error:', error);
    next(error);
  }
});

// Get license usage statistics
router.get('/:licenseId/stats', authenticateToken, async (req, res, next) => {
  try {
    const { licenseId } = req.params;
    const db = getDatabase();
    const userId = req.user.id;

    // Check if license exists and user owns it
    const license = await db.get(
      'SELECT * FROM rsl_licenses WHERE license_id = ? AND user_id = ?',
      [licenseId, userId]
    );

    if (!license) {
      return res.status(404).json({
        error: 'license_not_found',
        error_description: 'License not found or you do not have permission to view it'
      });
    }

    // Get audit trail entries
    const auditEntries = await db.all(
      'SELECT * FROM audit_trail WHERE license_id = ? ORDER BY timestamp DESC LIMIT 100',
      [license.id]
    );

    // Get payment transactions
    const payments = await db.all(
      'SELECT * FROM payment_transactions WHERE license_id = ? ORDER BY created_at DESC',
      [license.id]
    );

    // Calculate statistics
    const stats = {
      totalViews: auditEntries.filter(entry => entry.action === 'license_viewed').length,
      totalDownloads: auditEntries.filter(entry => entry.action === 'license_downloaded').length,
      totalPayments: payments.length,
      totalRevenue: payments
        .filter(payment => payment.status === 'completed')
        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0),
      recentActivity: auditEntries.slice(0, 10).map(entry => ({
        action: entry.action,
        timestamp: entry.timestamp,
        ipAddress: entry.ip_address,
        details: JSON.parse(entry.details || '{}')
      }))
    };

    res.json(stats);
  } catch (error) {
    logger.error('License stats error:', error);
    next(error);
  }
});

export { router as licenseRoutes };

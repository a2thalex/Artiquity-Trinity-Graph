import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import { logger } from '../utils/logger.js';
import { authenticateOAuthToken } from '../middleware/auth.js';
import { validateLicenseRequest } from '../middleware/validation.js';

const router = express.Router();


router.post('/process', authenticateOAuthToken, validateLicenseRequest, async (req, res, next) => {
  try {
    const { contentId, userId, userType, countryCode, permissions, paymentInfo } = req.body;
    const db = getDatabase();

    
    const license = await db.get(
      'SELECT * FROM rsl_licenses WHERE content_id = ? AND is_active = 1',
      [contentId]
    );

    if (!license) {
      return res.status(404).json({
        error: 'license_not_found',
        error_description: 'No active license found for this content'
      });
    }

    
    const licenseData = {
      permissions: JSON.parse(license.permissions),
      userTypes: JSON.parse(license.user_types),
      paymentModel: JSON.parse(license.payment_model),
      geographicRestrictions: JSON.parse(license.geographic_restrictions)
    };

    
    const userTypeAllowed = licenseData.userTypes.find(ut => ut.type === userType);
    if (!userTypeAllowed || !userTypeAllowed.allowed) {
      return res.status(403).json({
        error: 'user_type_not_allowed',
        error_description: `User type '${userType}' not allowed for this license`
      });
    }

    
    const geoRestriction = licenseData.geographicRestrictions.find(gr => gr.countryCode === countryCode);
    if (geoRestriction && !geoRestriction.allowed) {
      return res.status(403).json({
        error: 'geographic_restriction',
        error_description: `Access not allowed from country '${countryCode}'`
      });
    }

    
    const requiredPermissions = licenseData.permissions.filter(p => permissions.includes(p.type) && p.allowed);
    const needsPayment = requiredPermissions.some(p => p.conditions?.includes('payment'));

    if (needsPayment && !paymentInfo) {
      return res.status(402).json({
        error: 'payment_required',
        error_description: 'Payment required for requested permissions',
        requiredPermissions: requiredPermissions.map(p => p.type),
        paymentModel: licenseData.paymentModel
      });
    }

    
    let paymentResult = null;
    if (needsPayment && paymentInfo) {
      paymentResult = await processPayment(paymentInfo, licenseData.paymentModel, license);
      
      if (!paymentResult.success) {
        return res.status(402).json({
          error: 'payment_failed',
          error_description: paymentResult.error
        });
      }
    }

    
    const accessToken = `rsl_${uuidv4().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 3600000); 

    
    await db.run(
      `INSERT INTO oauth_tokens (id, access_token, client_id, user_id, scope, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        accessToken,
        req.user.clientId,
        userId,
        'license',
        expiresAt.toISOString()
      ]
    );

    
    if (paymentResult) {
      await db.run(
        `INSERT INTO payment_transactions (
          id, license_id, user_id, amount, currency, payment_method, 
          payment_provider, provider_transaction_id, status, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          license.id,
          userId,
          paymentResult.amount,
          paymentResult.currency,
          paymentInfo.method,
          paymentInfo.method,
          paymentResult.transactionId,
          'completed',
          new Date().toISOString()
        ]
      );
    }

    
    await db.run(
      `INSERT INTO audit_trail (id, license_id, user_id, action, ip_address, user_agent, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        license.id,
        userId,
        'license_accessed',
        req.ip,
        req.get('User-Agent'),
        JSON.stringify({
          permissions,
          userType,
          countryCode,
          paymentMade: !!paymentResult
        })
      ]
    );

    logger.info('License access granted', {
      licenseId: license.license_id,
      userId,
      userType,
      countryCode,
      permissions,
      paymentMade: !!paymentResult
    });

    res.json({
      success: true,
      licenseId: license.license_id,
      accessToken,
      expiresAt: expiresAt.toISOString(),
      permissions: requiredPermissions.map(p => p.type),
      restrictions: requiredPermissions.flatMap(p => p.restrictions || []),
      paymentInfo: paymentResult ? {
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        transactionId: paymentResult.transactionId
      } : null
    });
  } catch (error) {
    logger.error('Payment processing error:', error);
    next(error);
  }
});


router.get('/history', authenticateOAuthToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const db = getDatabase();
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    const transactions = await db.all(
      `SELECT pt.*, rl.title, rl.license_id 
       FROM payment_transactions pt
       JOIN rsl_licenses rl ON pt.license_id = rl.id
       WHERE pt.user_id = ?
       ORDER BY pt.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );

    
    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM payment_transactions WHERE user_id = ?',
      [userId]
    );

    const transactionList = transactions.map(tx => ({
      id: tx.id,
      licenseId: tx.license_id,
      title: tx.title,
      amount: tx.amount,
      currency: tx.currency,
      paymentMethod: tx.payment_method,
      status: tx.status,
      createdAt: tx.created_at,
      completedAt: tx.completed_at
    }));

    res.json({
      transactions: transactionList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    logger.error('Payment history error:', error);
    next(error);
  }
});


router.post('/refund/:transactionId', authenticateOAuthToken, async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const db = getDatabase();
    const userId = req.user.id;

    
    const transaction = await db.get(
      `SELECT pt.*, rl.license_id, rl.title
       FROM payment_transactions pt
       JOIN rsl_licenses rl ON pt.license_id = rl.id
       WHERE pt.id = ? AND pt.user_id = ?`,
      [transactionId, userId]
    );

    if (!transaction) {
      return res.status(404).json({
        error: 'transaction_not_found',
        error_description: 'Transaction not found or you do not have permission to refund it'
      });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({
        error: 'invalid_transaction_status',
        error_description: 'Only completed transactions can be refunded'
      });
    }

    
    const refundResult = await processRefund(transaction);

    if (!refundResult.success) {
      return res.status(400).json({
        error: 'refund_failed',
        error_description: refundResult.error
      });
    }

    
    await db.run(
      'UPDATE payment_transactions SET status = ? WHERE id = ?',
      ['refunded', transactionId]
    );

    
    await db.run(
      `INSERT INTO audit_trail (id, license_id, user_id, action, ip_address, user_agent, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        transaction.license_id,
        userId,
        'payment_refunded',
        req.ip,
        req.get('User-Agent'),
        JSON.stringify({
          transactionId,
          amount: transaction.amount,
          currency: transaction.currency
        })
      ]
    );

    logger.info('Payment refunded', {
      transactionId,
      userId,
      amount: transaction.amount,
      currency: transaction.currency
    });

    res.json({
      success: true,
      refundId: refundResult.refundId,
      amount: transaction.amount,
      currency: transaction.currency,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    logger.error('Refund processing error:', error);
    next(error);
  }
});


async function processPayment(paymentInfo, paymentModel, license) {
  try {
    
    
    
    switch (paymentInfo.method) {
      case 'stripe':
        return await processStripePayment(paymentInfo, paymentModel);
      case 'paypal':
        return await processPayPalPayment(paymentInfo, paymentModel);
      case 'crypto':
        return await processCryptoPayment(paymentInfo, paymentModel);
      default:
        return {
          success: false,
          error: 'Unsupported payment method'
        };
    }
  } catch (error) {
    logger.error('Payment processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function processStripePayment(paymentInfo, paymentModel) {
  
  return {
    success: true,
    transactionId: `stripe_${uuidv4().replace(/-/g, '')}`,
    amount: paymentModel.amount || 0.01,
    currency: paymentModel.currency || 'USD'
  };
}

async function processPayPalPayment(paymentInfo, paymentModel) {
  
  return {
    success: true,
    transactionId: `paypal_${uuidv4().replace(/-/g, '')}`,
    amount: paymentModel.amount || 0.01,
    currency: paymentModel.currency || 'USD'
  };
}

async function processCryptoPayment(paymentInfo, paymentModel) {
  
  return {
    success: true,
    transactionId: `crypto_${uuidv4().replace(/-/g, '')}`,
    amount: paymentModel.amount || 0.01,
    currency: paymentModel.currency || 'USD'
  };
}

async function processRefund(transaction) {
  try {
    
    return {
      success: true,
      refundId: `refund_${uuidv4().replace(/-/g, '')}`
    };
  } catch (error) {
    logger.error('Refund processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export { router as paymentRoutes };

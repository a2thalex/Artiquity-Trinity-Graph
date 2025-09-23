import express from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import { logger } from '../utils/logger.js';
import { authenticateOAuthToken } from '../middleware/auth.js';

const router = express.Router();

// Register webhook endpoint
router.post('/register', authenticateOAuthToken, async (req, res, next) => {
  try {
    const { url, events } = req.body;
    const db = getDatabase();
    const userId = req.user.id;

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        error: 'invalid_url',
        error_description: 'Invalid webhook URL'
      });
    }

    // Validate events
    const validEvents = [
      'license.created',
      'license.updated',
      'license.expired',
      'payment.completed',
      'usage.detected'
    ];

    const invalidEvents = events.filter(event => !validEvents.includes(event));
    if (invalidEvents.length > 0) {
      return res.status(400).json({
        error: 'invalid_events',
        error_description: `Invalid events: ${invalidEvents.join(', ')}`
      });
    }

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    // Store webhook endpoint
    const webhookId = uuidv4();
    await db.run(
      `INSERT INTO webhook_endpoints (id, user_id, url, events, secret, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        webhookId,
        userId,
        url,
        JSON.stringify(events),
        secret,
        true
      ]
    );

    logger.info('Webhook endpoint registered', {
      webhookId,
      userId,
      url,
      events
    });

    res.status(201).json({
      success: true,
      webhookId,
      secret,
      url,
      events
    });
  } catch (error) {
    logger.error('Webhook registration error:', error);
    next(error);
  }
});

// List user's webhook endpoints
router.get('/list', authenticateOAuthToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    const webhooks = await db.all(
      'SELECT id, url, events, is_active, created_at FROM webhook_endpoints WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const webhookList = webhooks.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      events: JSON.parse(webhook.events),
      isActive: webhook.is_active,
      createdAt: webhook.created_at
    }));

    res.json(webhookList);
  } catch (error) {
    logger.error('Webhook list error:', error);
    next(error);
  }
});

// Update webhook endpoint
router.put('/:webhookId', authenticateOAuthToken, async (req, res, next) => {
  try {
    const { webhookId } = req.params;
    const { url, events, isActive } = req.body;
    const db = getDatabase();
    const userId = req.user.id;

    // Check if webhook exists and user owns it
    const existingWebhook = await db.get(
      'SELECT * FROM webhook_endpoints WHERE id = ? AND user_id = ?',
      [webhookId, userId]
    );

    if (!existingWebhook) {
      return res.status(404).json({
        error: 'webhook_not_found',
        error_description: 'Webhook not found or you do not have permission to modify it'
      });
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch (error) {
        return res.status(400).json({
          error: 'invalid_url',
          error_description: 'Invalid webhook URL'
        });
      }
    }

    // Validate events if provided
    if (events) {
      const validEvents = [
        'license.created',
        'license.updated',
        'license.expired',
        'payment.completed',
        'usage.detected'
      ];

      const invalidEvents = events.filter(event => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        return res.status(400).json({
          error: 'invalid_events',
          error_description: `Invalid events: ${invalidEvents.join(', ')}`
        });
      }
    }

    // Update webhook
    const updateFields = [];
    const updateValues = [];

    if (url) {
      updateFields.push('url = ?');
      updateValues.push(url);
    }

    if (events) {
      updateFields.push('events = ?');
      updateValues.push(JSON.stringify(events));
    }

    if (typeof isActive === 'boolean') {
      updateFields.push('is_active = ?');
      updateValues.push(isActive);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'no_updates',
        error_description: 'No valid updates provided'
      });
    }

    updateValues.push(webhookId, userId);

    await db.run(
      `UPDATE webhook_endpoints SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    );

    logger.info('Webhook endpoint updated', {
      webhookId,
      userId,
      updates: { url, events, isActive }
    });

    res.json({
      success: true,
      message: 'Webhook endpoint updated successfully'
    });
  } catch (error) {
    logger.error('Webhook update error:', error);
    next(error);
  }
});

// Delete webhook endpoint
router.delete('/:webhookId', authenticateOAuthToken, async (req, res, next) => {
  try {
    const { webhookId } = req.params;
    const db = getDatabase();
    const userId = req.user.id;

    // Check if webhook exists and user owns it
    const existingWebhook = await db.get(
      'SELECT * FROM webhook_endpoints WHERE id = ? AND user_id = ?',
      [webhookId, userId]
    );

    if (!existingWebhook) {
      return res.status(404).json({
        error: 'webhook_not_found',
        error_description: 'Webhook not found or you do not have permission to delete it'
      });
    }

    // Delete webhook
    await db.run(
      'DELETE FROM webhook_endpoints WHERE id = ? AND user_id = ?',
      [webhookId, userId]
    );

    logger.info('Webhook endpoint deleted', {
      webhookId,
      userId
    });

    res.json({
      success: true,
      message: 'Webhook endpoint deleted successfully'
    });
  } catch (error) {
    logger.error('Webhook deletion error:', error);
    next(error);
  }
});

// Test webhook endpoint
router.post('/:webhookId/test', authenticateOAuthToken, async (req, res, next) => {
  try {
    const { webhookId } = req.params;
    const db = getDatabase();
    const userId = req.user.id;

    // Check if webhook exists and user owns it
    const webhook = await db.get(
      'SELECT * FROM webhook_endpoints WHERE id = ? AND user_id = ?',
      [webhookId, userId]
    );

    if (!webhook) {
      return res.status(404).json({
        error: 'webhook_not_found',
        error_description: 'Webhook not found or you do not have permission to test it'
      });
    }

    // Create test webhook event
    const testEvent = {
      id: uuidv4(),
      type: 'webhook.test',
      data: {
        message: 'This is a test webhook event',
        timestamp: new Date().toISOString(),
        webhookId: webhook.id
      },
      timestamp: new Date().toISOString()
    };

    // Send test webhook
    const result = await sendWebhook(webhook, testEvent);

    res.json({
      success: true,
      testEvent,
      result
    });
  } catch (error) {
    logger.error('Webhook test error:', error);
    next(error);
  }
});

// Get webhook delivery history
router.get('/:webhookId/history', authenticateOAuthToken, async (req, res, next) => {
  try {
    const { webhookId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const db = getDatabase();
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    // Check if webhook exists and user owns it
    const webhook = await db.get(
      'SELECT * FROM webhook_endpoints WHERE id = ? AND user_id = ?',
      [webhookId, userId]
    );

    if (!webhook) {
      return res.status(404).json({
        error: 'webhook_not_found',
        error_description: 'Webhook not found or you do not have permission to view it'
      });
    }

    // Get webhook events
    const events = await db.all(
      `SELECT * FROM webhook_events 
       WHERE endpoint_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [webhookId, parseInt(limit), offset]
    );

    // Get total count
    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM webhook_events WHERE endpoint_id = ?',
      [webhookId]
    );

    const eventList = events.map(event => ({
      id: event.id,
      eventType: event.event_type,
      status: event.status,
      attempts: event.attempts,
      lastAttemptAt: event.last_attempt_at,
      createdAt: event.created_at,
      payload: JSON.parse(event.payload)
    }));

    res.json({
      events: eventList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    logger.error('Webhook history error:', error);
    next(error);
  }
});

// Helper function to send webhook
async function sendWebhook(webhook, event) {
  try {
    const payload = JSON.stringify(event);
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(payload)
      .digest('hex');

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RSL-Signature': `sha256=${signature}`,
        'X-RSL-Event': event.type,
        'User-Agent': 'RSL-Platform-Webhook/1.0'
      },
      body: payload,
      timeout: 10000 // 10 second timeout
    });

    const success = response.ok;
    const status = response.status;
    const responseText = await response.text();

    // Store webhook event
    const db = getDatabase();
    await db.run(
      `INSERT INTO webhook_events (id, endpoint_id, event_type, payload, status, attempts, last_attempt_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        webhook.id,
        event.type,
        payload,
        success ? 'sent' : 'failed',
        1,
        new Date().toISOString()
      ]
    );

    return {
      success,
      status,
      response: responseText
    };
  } catch (error) {
    logger.error('Webhook delivery error:', error);
    
    // Store failed webhook event
    const db = getDatabase();
    await db.run(
      `INSERT INTO webhook_events (id, endpoint_id, event_type, payload, status, attempts, last_attempt_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        webhook.id,
        event.type,
        JSON.stringify(event),
        'failed',
        1,
        new Date().toISOString()
      ]
    );

    return {
      success: false,
      error: error.message
    };
  }
}

export { router as webhookRoutes };

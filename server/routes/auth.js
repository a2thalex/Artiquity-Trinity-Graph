import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import { logger } from '../utils/logger.js';
import { validateTokenRequest, validateIntrospectionRequest } from '../middleware/validation.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rsl-platform-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// OAuth 2.0 Token endpoint
router.post('/token', validateTokenRequest, async (req, res, next) => {
  try {
    const { grant_type, client_id, client_secret, code, redirect_uri, scope } = req.body;
    const db = getDatabase();

    // Verify client credentials
    const client = await db.get(
      'SELECT * FROM oauth_clients WHERE client_id = ? AND is_active = 1',
      [client_id]
    );

    if (!client) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client authentication failed'
      });
    }

    // Verify client secret
    const secretMatch = await bcrypt.compare(client_secret, client.client_secret);
    if (!secretMatch) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client authentication failed'
      });
    }

    // Handle different grant types
    switch (grant_type) {
      case 'client_credentials':
        return await handleClientCredentials(db, client, scope, res);
      
      case 'authorization_code':
        return await handleAuthorizationCode(db, client, code, redirect_uri, scope, res);
      
      case 'rsl':
        return await handleRSLGrant(db, client, req.body, res);
      
      default:
        return res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: `Grant type '${grant_type}' is not supported`
        });
    }
  } catch (error) {
    logger.error('Token endpoint error:', error);
    next(error);
  }
});

// OAuth 2.0 Token Introspection endpoint
router.post('/introspect', validateIntrospectionRequest, async (req, res, next) => {
  try {
    const { token, token_type_hint } = req.body;
    const db = getDatabase();

    // Find the token in database
    const tokenRecord = await db.get(
      'SELECT * FROM oauth_tokens WHERE access_token = ?',
      [token]
    );

    if (!tokenRecord) {
      return res.json({
        active: false
      });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenRecord.expires_at);
    
    if (now > expiresAt) {
      return res.json({
        active: false
      });
    }

    // Get client and user information
    const client = await db.get(
      'SELECT * FROM oauth_clients WHERE id = ?',
      [tokenRecord.client_id]
    );

    const user = await db.get(
      'SELECT * FROM users WHERE id = ?',
      [tokenRecord.user_id]
    );

    // Return token introspection response
    const introspection = {
      active: true,
      scope: tokenRecord.scope,
      client_id: client.client_id,
      username: user?.email,
      exp: Math.floor(expiresAt.getTime() / 1000),
      iat: Math.floor(new Date(tokenRecord.created_at).getTime() / 1000),
      sub: tokenRecord.user_id,
      aud: client.client_id,
      iss: 'rsl-platform'
    };

    res.json(introspection);
  } catch (error) {
    logger.error('Introspection endpoint error:', error);
    next(error);
  }
});

// JWK Key endpoint
router.get('/key', async (req, res, next) => {
  try {
    const db = getDatabase();
    
    // Get active JWK keys
    const keys = await db.all(
      'SELECT key_id, key_type, use_type, algorithm, public_key FROM jwk_keys WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > datetime("now"))'
    );

    const jwks = {
      keys: keys.map(key => ({
        kty: key.key_type,
        use: key.use_type,
        key_ops: ['verify'],
        alg: key.algorithm,
        kid: key.key_id,
        ...JSON.parse(key.public_key)
      }))
    };

    res.json(jwks);
  } catch (error) {
    logger.error('JWK endpoint error:', error);
    next(error);
  }
});

// Client registration endpoint
router.post('/register', async (req, res, next) => {
  try {
    const { name, redirect_uris, grant_types, scope } = req.body;
    const db = getDatabase();

    // Generate client credentials
    const client_id = `rsl_${uuidv4().replace(/-/g, '')}`;
    const client_secret = await bcrypt.hash(uuidv4(), 10);

    // Insert new client
    const clientId = uuidv4();
    await db.run(
      `INSERT INTO oauth_clients (id, client_id, client_secret, name, redirect_uris, grant_types, scope)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, client_id, client_secret, name, redirect_uris.join(','), grant_types.join(','), scope]
    );

    // Log client registration
    logger.info('New OAuth client registered', {
      client_id,
      name,
      redirect_uris,
      grant_types,
      scope
    });

    res.status(201).json({
      client_id,
      client_secret,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0
    });
  } catch (error) {
    logger.error('Client registration error:', error);
    next(error);
  }
});

// Helper functions
async function handleClientCredentials(db, client, scope, res) {
  // Generate access token
  const access_token = `rsl_${uuidv4().replace(/-/g, '')}`;
  const expires_at = new Date(Date.now() + 3600000); // 1 hour

  // Store token
  const tokenId = uuidv4();
  await db.run(
    `INSERT INTO oauth_tokens (id, access_token, client_id, user_id, scope, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tokenId, access_token, client.id, null, scope || client.scope, expires_at.toISOString()]
  );

  res.json({
    access_token,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: scope || client.scope
  });
}

async function handleAuthorizationCode(db, client, code, redirect_uri, scope, res) {
  // In a real implementation, you would validate the authorization code
  // For now, we'll create a token for demonstration
  const access_token = `rsl_${uuidv4().replace(/-/g, '')}`;
  const refresh_token = `rsl_refresh_${uuidv4().replace(/-/g, '')}`;
  const expires_at = new Date(Date.now() + 3600000); // 1 hour

  // Store token (in real implementation, you'd get user_id from the authorization code)
  const tokenId = uuidv4();
  await db.run(
    `INSERT INTO oauth_tokens (id, access_token, refresh_token, client_id, user_id, scope, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [tokenId, access_token, refresh_token, client.id, null, scope || client.scope, expires_at.toISOString()]
  );

  res.json({
    access_token,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token,
    scope: scope || client.scope
  });
}

async function handleRSLGrant(db, client, body, res) {
  // Custom RSL grant type for license-specific tokens
  const { license_id, user_type, country_code } = body;
  
  if (!license_id) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'license_id is required for RSL grant type'
    });
  }

  // Verify license exists and is active
  const license = await db.get(
    'SELECT * FROM rsl_licenses WHERE license_id = ? AND is_active = 1',
    [license_id]
  );

  if (!license) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Invalid or inactive license'
    });
  }

  // Generate RSL-specific token
  const access_token = `rsl_${uuidv4().replace(/-/g, '')}`;
  const expires_at = new Date(Date.now() + 3600000); // 1 hour

  // Store token with license information
  const tokenId = uuidv4();
  await db.run(
    `INSERT INTO oauth_tokens (id, access_token, client_id, user_id, scope, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tokenId, access_token, client.id, license.user_id, 'license', expires_at.toISOString()]
  );

  res.json({
    access_token,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'license',
    rsl_license_id: license_id
  });
}

export { router as authRoutes };

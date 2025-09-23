import jwt from 'jsonwebtoken';
import { getDatabase } from '../database.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'rsl-platform-secret-key-change-in-production';

/**
 * Authenticate JWT token
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'unauthorized',
      error_description: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Token verification failed:', { error: err.message, token: token.substring(0, 20) + '...' });
      return res.status(403).json({
        error: 'forbidden',
        error_description: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
}

/**
 * Authenticate OAuth token from database
 */
export async function authenticateOAuthToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'unauthorized',
      error_description: 'Access token required'
    });
  }

  try {
    const db = getDatabase();
    
    // Find token in database
    const tokenRecord = await db.get(
      'SELECT * FROM oauth_tokens WHERE access_token = ?',
      [token]
    );

    if (!tokenRecord) {
      return res.status(401).json({
        error: 'unauthorized',
        error_description: 'Invalid access token'
      });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenRecord.expires_at);
    
    if (now > expiresAt) {
      return res.status(401).json({
        error: 'unauthorized',
        error_description: 'Access token expired'
      });
    }

    // Get user information
    let user = null;
    if (tokenRecord.user_id) {
      user = await db.get(
        'SELECT * FROM users WHERE id = ? AND is_active = 1',
        [tokenRecord.user_id]
      );
    }

    // Get client information
    const client = await db.get(
      'SELECT * FROM oauth_clients WHERE id = ? AND is_active = 1',
      [tokenRecord.client_id]
    );

    if (!client) {
      return res.status(401).json({
        error: 'unauthorized',
        error_description: 'Invalid client'
      });
    }

    req.user = {
      id: tokenRecord.user_id,
      email: user?.email,
      userType: user?.user_type,
      countryCode: user?.country_code,
      clientId: client.client_id,
      scope: tokenRecord.scope
    };

    req.token = tokenRecord;
    next();
  } catch (error) {
    logger.error('OAuth token authentication error:', error);
    res.status(500).json({
      error: 'internal_error',
      error_description: 'Authentication service error'
    });
  }
}

/**
 * Require specific scope
 */
export function requireScope(requiredScope) {
  return (req, res, next) => {
    if (!req.user || !req.user.scope) {
      return res.status(403).json({
        error: 'insufficient_scope',
        error_description: 'Token does not have required scope'
      });
    }

    const userScopes = req.user.scope.split(' ');
    if (!userScopes.includes(requiredScope)) {
      return res.status(403).json({
        error: 'insufficient_scope',
        error_description: `Token does not have '${requiredScope}' scope`
      });
    }

    next();
  };
}

/**
 * Require specific user type
 */
export function requireUserType(allowedTypes) {
  return (req, res, next) => {
    if (!req.user || !req.user.userType) {
      return res.status(403).json({
        error: 'insufficient_privileges',
        error_description: 'User type not specified'
      });
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({
        error: 'insufficient_privileges',
        error_description: `User type '${req.user.userType}' not allowed for this operation`
      });
    }

    next();
  };
}

/**
 * Require admin privileges
 */
export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: 'insufficient_privileges',
      error_description: 'Admin privileges required'
    });
  }

  next();
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
}

/**
 * Rate limiting per user
 */
export function rateLimitPerUser(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user || !req.user.id) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    } else {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        error_description: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000 / 60} minutes.`,
        retry_after: Math.ceil((userRequests[0] + windowMs - now) / 1000)
      });
    }

    userRequests.push(now);
    next();
  };
}

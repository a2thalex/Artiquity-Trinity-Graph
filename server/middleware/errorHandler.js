import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.details || err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not Found';
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    message = 'Conflict';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Too Many Requests';
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  
  const errorResponse = {
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  
  if (isDevelopment || details) {
    errorResponse.details = details;
  }

  
  if (isDevelopment && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

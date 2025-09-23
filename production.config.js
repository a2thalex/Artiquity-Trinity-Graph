// Production Configuration
export const productionConfig = {
  // Environment
  NODE_ENV: 'production',
  PORT: process.env.PORT || 3000,
  
  // API Keys
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || './server/data/rsl_platform.db',
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'your_production_jwt_secret_here',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your_production_encryption_key_here',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://yourdomain.com',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || './logs/combined.log',
  ERROR_LOG_FILE: process.env.ERROR_LOG_FILE || './logs/error.log',
  
  // Payment Processing
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  
  // File Upload
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '50MB',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  
  // License Server
  LICENSE_SERVER_URL: process.env.LICENSE_SERVER_URL || 'https://yourdomain.com/license',
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'contact@yourdomain.com'
};

export default productionConfig;

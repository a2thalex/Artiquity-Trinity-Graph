import sqlite3 from 'sqlite3';
import { logger } from './utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export async function initDatabase() {
  return new Promise((resolve, reject) => {
    try {
      db = new sqlite3.Database(path.join(__dirname, '../data/rsl_platform.db'), (err) => {
        if (err) {
          logger.error('Database connection failed:', err);
          reject(err);
          return;
        }

        
        db.exec('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            logger.error('Failed to enable foreign keys:', err);
            reject(err);
            return;
          }

          
          createTables()
            .then(() => insertDefaultData())
            .then(() => {
              logger.info('Database initialized successfully');
              resolve();
            })
            .catch(reject);
        });
      });
    } catch (error) {
      logger.error('Database initialization failed:', error);
      reject(error);
    }
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    const tables = [
      
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        user_type TEXT NOT NULL CHECK (user_type IN ('commercial', 'education', 'government', 'nonprofit', 'individual')),
        country_code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )`,

      
      `CREATE TABLE IF NOT EXISTS oauth_clients (
        id TEXT PRIMARY KEY,
        client_id TEXT UNIQUE NOT NULL,
        client_secret TEXT NOT NULL,
        name TEXT NOT NULL,
        redirect_uris TEXT NOT NULL,
        grant_types TEXT NOT NULL,
        scope TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )`,

      
      `CREATE TABLE IF NOT EXISTS oauth_tokens (
        id TEXT PRIMARY KEY,
        access_token TEXT UNIQUE NOT NULL,
        refresh_token TEXT UNIQUE,
        client_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        scope TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES oauth_clients (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      
      `CREATE TABLE IF NOT EXISTS rsl_licenses (
        id TEXT PRIMARY KEY,
        license_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        content_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_hash TEXT NOT NULL,
        content_url TEXT,
        xml_content TEXT NOT NULL,
        permissions TEXT NOT NULL,
        user_types TEXT NOT NULL,
        geographic_restrictions TEXT NOT NULL,
        payment_model TEXT NOT NULL,
        warranty_declaration TEXT NOT NULL,
        disclaimer_config TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      
      `CREATE TABLE IF NOT EXISTS file_metadata (
        id TEXT PRIMARY KEY,
        license_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        metadata_type TEXT NOT NULL CHECK (metadata_type IN ('exif', 'xmp', 'id3', 'html', 'sidecar')),
        embedded_data TEXT NOT NULL,
        position INTEGER,
        size INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (license_id) REFERENCES rsl_licenses (id)
      )`,

      
      `CREATE TABLE IF NOT EXISTS content_encryption (
        id TEXT PRIMARY KEY,
        license_id TEXT NOT NULL,
        encrypted_file_path TEXT NOT NULL,
        encryption_key_id TEXT NOT NULL,
        algorithm TEXT NOT NULL DEFAULT 'AES-128-CTR',
        iv TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (license_id) REFERENCES rsl_licenses (id)
      )`,

      
      `CREATE TABLE IF NOT EXISTS jwk_keys (
        id TEXT PRIMARY KEY,
        key_id TEXT UNIQUE NOT NULL,
        key_type TEXT NOT NULL CHECK (key_type IN ('RSA', 'EC')),
        use_type TEXT NOT NULL CHECK (use_type IN ('enc', 'sig')),
        algorithm TEXT NOT NULL,
        public_key TEXT NOT NULL,
        private_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        is_active BOOLEAN DEFAULT 1
      )`,

      
      `CREATE TABLE IF NOT EXISTS audit_trail (
        id TEXT PRIMARY KEY,
        license_id TEXT,
        user_id TEXT,
        action TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (license_id) REFERENCES rsl_licenses (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      
      `CREATE TABLE IF NOT EXISTS payment_transactions (
        id TEXT PRIMARY KEY,
        license_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        payment_method TEXT NOT NULL,
        payment_provider TEXT NOT NULL,
        provider_transaction_id TEXT,
        status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (license_id) REFERENCES rsl_licenses (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      
      `CREATE TABLE IF NOT EXISTS license_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        permissions TEXT NOT NULL,
        user_types TEXT NOT NULL,
        payment_model TEXT NOT NULL,
        geographic_restrictions TEXT NOT NULL,
        is_default BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      
      `CREATE TABLE IF NOT EXISTS webhook_endpoints (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        url TEXT NOT NULL,
        events TEXT NOT NULL,
        secret TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      
      `CREATE TABLE IF NOT EXISTS webhook_events (
        id TEXT PRIMARY KEY,
        endpoint_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
        attempts INTEGER DEFAULT 0,
        last_attempt_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (endpoint_id) REFERENCES webhook_endpoints (id)
      )`
    ];

    let completed = 0;
    const total = tables.length;

    tables.forEach((table, index) => {
      db.exec(table, (err) => {
        if (err) {
          logger.error(`Failed to create table ${index}:`, err);
          reject(err);
          return;
        }
        completed++;
        if (completed === total) {
          
          createIndexes().then(resolve).catch(reject);
        }
      });
    });
  });
}

function createIndexes() {
  return new Promise((resolve, reject) => {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_oauth_tokens_access_token ON oauth_tokens(access_token)',
      'CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_rsl_licenses_user_id ON rsl_licenses(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_rsl_licenses_content_id ON rsl_licenses(content_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_trail_license_id ON audit_trail(license_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp)'
    ];

    let completed = 0;
    const total = indexes.length;

    indexes.forEach((index, i) => {
      db.exec(index, (err) => {
        if (err) {
          logger.error(`Failed to create index ${i}:`, err);
          reject(err);
          return;
        }
        completed++;
        if (completed === total) {
          resolve();
        }
      });
    });
  });
}

function insertDefaultData() {
  return new Promise((resolve, reject) => {
    
    const defaultClient = {
      id: 'default-client',
      client_id: 'rsl-platform-client',
      client_secret: 'rsl-platform-secret-key-change-in-production',
      name: 'RSL Platform Default Client',
      redirect_uris: 'http:
      grant_types: 'authorization_code,client_credentials,rsl',
      scope: 'read,write,license'
    };

    db.run(
      `INSERT OR IGNORE INTO oauth_clients (id, client_id, client_secret, name, redirect_uris, grant_types, scope)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        defaultClient.id,
        defaultClient.client_id,
        defaultClient.client_secret,
        defaultClient.name,
        defaultClient.redirect_uris,
        defaultClient.grant_types,
        defaultClient.scope
      ],
      (err) => {
        if (err) {
          logger.error('Failed to insert default client:', err);
          reject(err);
          return;
        }

        
        insertDefaultTemplates().then(resolve).catch(reject);
      }
    );
  });
}

function insertDefaultTemplates() {
  return new Promise((resolve, reject) => {
    const templates = [
      {
        id: 'template-free',
        name: 'Free License',
        description: 'Free use with attribution required',
        permissions: JSON.stringify([
          { type: 'search', allowed: true, conditions: ['attribution'] },
          { type: 'ai-summarize', allowed: true, conditions: ['attribution'] }
        ]),
        user_types: JSON.stringify([
          { type: 'individual', allowed: true },
          { type: 'education', allowed: true },
          { type: 'nonprofit', allowed: true }
        ]),
        payment_model: JSON.stringify({ type: 'attribution', attributionText: 'Attribution required' }),
        geographic_restrictions: JSON.stringify([])
      },
      {
        id: 'template-commercial',
        name: 'Commercial License',
        description: 'Commercial use with payment required',
        permissions: JSON.stringify([
          { type: 'train-ai', allowed: true, conditions: ['payment'] },
          { type: 'search', allowed: true, conditions: ['payment'] },
          { type: 'ai-summarize', allowed: true, conditions: ['payment'] },
          { type: 'archive', allowed: true, conditions: ['payment'] },
          { type: 'analysis', allowed: true, conditions: ['payment'] }
        ]),
        user_types: JSON.stringify([
          { type: 'commercial', allowed: true, pricing: { perCrawl: 0.01, perInference: 0.001, monthlySubscription: 10, currency: 'USD' } }
        ]),
        payment_model: JSON.stringify({ type: 'per-crawl', amount: 0.01, currency: 'USD' }),
        geographic_restrictions: JSON.stringify([])
      }
    ];

    let completed = 0;
    const total = templates.length;

    templates.forEach((template, index) => {
      db.run(
        `INSERT OR IGNORE INTO license_templates (id, name, description, permissions, user_types, payment_model, geographic_restrictions)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          template.id,
          template.name,
          template.description,
          template.permissions,
          template.user_types,
          template.payment_model,
          template.geographic_restrictions
        ],
        (err) => {
          if (err) {
            logger.error(`Failed to insert template ${index}:`, err);
            reject(err);
            return;
          }
          completed++;
          if (completed === total) {
            logger.info('Default data inserted successfully');
            resolve();
          }
        }
      );
    });
  });
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}
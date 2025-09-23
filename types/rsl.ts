// RSL Platform Type Definitions
export interface RSLDocument {
  namespace: 'https://rslstandard.org/rsl';
  version: string;
  licenseId: string;
  createdAt: string;
  expiresAt?: string;
  content: RSLContent;
  permissions: RSLPermission[];
  userTypes: RSLUserType[];
  geographicRestrictions: GeographicRestriction[];
  paymentModel: PaymentModel;
  metadata: RSLMetadata;
}

export interface RSLContent {
  title: string;
  description: string;
  fileType: string;
  fileSize: number;
  hash: string;
  url?: string;
  contentType: string;
}

export interface RSLPermission {
  type: 'train-ai' | 'search' | 'ai-summarize' | 'archive' | 'analysis';
  allowed: boolean;
  conditions?: string[];
  restrictions?: string[];
}

export interface RSLUserType {
  type: 'commercial' | 'education' | 'government' | 'nonprofit' | 'individual';
  allowed: boolean;
  conditions?: string[];
  pricing?: PricingTier;
}

export interface GeographicRestriction {
  countryCode: string; // ISO 3166-1 alpha-2
  allowed: boolean;
  conditions?: string[];
}

export interface PaymentModel {
  type: 'free' | 'attribution' | 'per-crawl' | 'per-inference' | 'subscription';
  amount?: number;
  currency?: string;
  attributionText?: string;
  subscriptionPeriod?: string;
}

export interface PricingTier {
  perCrawl: number;
  perInference: number;
  monthlySubscription: number;
  currency: string;
}

export interface RSLMetadata {
  creator: string;
  provenance: string;
  warranty: WarrantyDeclaration;
  disclaimer: DisclaimerConfiguration;
  auditTrail: AuditEntry[];
}

export interface WarrantyDeclaration {
  ownership: boolean;
  authority: boolean;
  nonInfringement: boolean;
  text: string;
}

export interface DisclaimerConfiguration {
  asIs: boolean;
  liabilityLimitations: string[];
  text: string;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
}

// OAuth 2.0 OLP Types
export interface OAuthToken {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
  rsl_license_id?: string;
}

export interface TokenIntrospection {
  active: boolean;
  scope?: string;
  client_id?: string;
  username?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  sub?: string;
  aud?: string;
  iss?: string;
  jti?: string;
}

export interface JWK {
  kty: 'RSA' | 'EC';
  use: 'enc' | 'sig';
  key_ops: string[];
  alg: string;
  kid: string;
  x5u?: string;
  x5c?: string[];
  x5t?: string;
  x5t_S256?: string;
  n?: string;
  e?: string;
  d?: string;
  p?: string;
  q?: string;
  dp?: string;
  dq?: string;
  qi?: string;
  crv?: string;
  x?: string;
  y?: string;
}

// File Processing Types
export interface FileMetadata {
  exif?: Record<string, any>;
  xmp?: Record<string, any>;
  id3?: Record<string, any>;
  custom?: Record<string, any>;
}

export interface EmbeddedRSL {
  format: 'exif' | 'xmp' | 'id3' | 'html' | 'sidecar';
  data: string;
  position?: number;
  size: number;
}

// API Types
export interface LicenseRequest {
  contentId: string;
  userId: string;
  userType: string;
  countryCode: string;
  permissions: string[];
  paymentInfo?: PaymentInfo;
}

export interface PaymentInfo {
  method: 'stripe' | 'paypal' | 'crypto';
  token: string;
  amount: number;
  currency: string;
}

export interface LicenseResponse {
  success: boolean;
  licenseId: string;
  token: string;
  expiresAt: string;
  permissions: string[];
  restrictions: string[];
  error?: string;
}

// UI Types
export interface LicenseTemplate {
  id: string;
  name: string;
  description: string;
  permissions: RSLPermission[];
  userTypes: RSLUserType[];
  paymentModel: PaymentModel;
  geographicRestrictions: GeographicRestriction[];
}

export interface BatchLicenseRequest {
  files: File[];
  template: string;
  customizations?: Partial<RSLDocument>;
}

// Webhook Types
export interface WebhookEvent {
  id: string;
  type: 'license.created' | 'license.updated' | 'license.expired' | 'payment.completed' | 'usage.detected';
  data: Record<string, any>;
  timestamp: string;
  signature: string;
}

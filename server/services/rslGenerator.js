import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { validateRSLDocument } from '../middleware/validation.js';

export class RSLGenerator {
  constructor() {
    this.namespace = 'https://rslstandard.org/rsl';
    this.version = '1.0';
  }

  generateRSLXML(rslData) {
    try {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsl:license xmlns:rsl="${this.namespace}" 
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="${this.namespace} ${this.namespace}/schema/rsl-1.0.xsd"
             version="${this.version}"
             id="${rslData.licenseId}"
             created="${rslData.createdAt}"
             ${rslData.expiresAt ? `expires="${rslData.expiresAt}"` : ''}>
  
  <!-- Content Information -->
  <rsl:content>
    <rsl:title>${this.escapeXML(rslData.content.title)}</rsl:title>
    <rsl:description>${this.escapeXML(rslData.content.description)}</rsl:description>
    <rsl:type>${this.escapeXML(rslData.content.fileType)}</rsl:type>
    <rsl:size>${rslData.content.fileSize}</rsl:size>
    <rsl:hash algorithm="sha256">${rslData.content.hash}</rsl:hash>
    ${rslData.content.url ? `<rsl:url>${this.escapeXML(rslData.content.url)}</rsl:url>` : ''}
    <rsl:content-type>${this.escapeXML(rslData.content.contentType)}</rsl:content-type>
  </rsl:content>

  <!-- Permissions -->
  <rsl:permissions>
    ${rslData.permissions.map(permission => `
    <rsl:permission type="${permission.type}" allowed="${permission.allowed}">
      ${permission.conditions ? permission.conditions.map(condition => `
      <rsl:condition>${this.escapeXML(condition)}</rsl:condition>`).join('') : ''}
      ${permission.restrictions ? permission.restrictions.map(restriction => `
      <rsl:restriction>${this.escapeXML(restriction)}</rsl:restriction>`).join('') : ''}
    </rsl:permission>`).join('')}
  </rsl:permissions>

  <!-- User Types -->
  <rsl:user-types>
    ${rslData.userTypes.map(userType => `
    <rsl:user-type type="${userType.type}" allowed="${userType.allowed}">
      ${userType.conditions ? userType.conditions.map(condition => `
      <rsl:condition>${this.escapeXML(condition)}</rsl:condition>`).join('') : ''}
      ${userType.pricing ? `
      <rsl:pricing>
        ${userType.pricing.perCrawl ? `<rsl:per-crawl amount="${userType.pricing.perCrawl}" currency="${userType.pricing.currency}"/>` : ''}
        ${userType.pricing.perInference ? `<rsl:per-inference amount="${userType.pricing.perInference}" currency="${userType.pricing.currency}"/>` : ''}
        ${userType.pricing.monthlySubscription ? `<rsl:monthly-subscription amount="${userType.pricing.monthlySubscription}" currency="${userType.pricing.currency}"/>` : ''}
      </rsl:pricing>` : ''}
    </rsl:user-type>`).join('')}
  </rsl:user-types>

  <!-- Geographic Restrictions -->
  <rsl:geographic-restrictions>
    ${rslData.geographicRestrictions.map(restriction => `
    <rsl:country code="${restriction.countryCode}" allowed="${restriction.allowed}">
      ${restriction.conditions ? restriction.conditions.map(condition => `
      <rsl:condition>${this.escapeXML(condition)}</rsl:condition>`).join('') : ''}
    </rsl:country>`).join('')}
  </rsl:geographic-restrictions>

  <!-- Payment Model -->
  <rsl:payment-model type="${rslData.paymentModel.type}">
    ${rslData.paymentModel.amount ? `<rsl:amount currency="${rslData.paymentModel.currency}">${rslData.paymentModel.amount}</rsl:amount>` : ''}
    ${rslData.paymentModel.attributionText ? `<rsl:attribution-text>${this.escapeXML(rslData.paymentModel.attributionText)}</rsl:attribution-text>` : ''}
    ${rslData.paymentModel.subscriptionPeriod ? `<rsl:subscription-period>${this.escapeXML(rslData.paymentModel.subscriptionPeriod)}</rsl:subscription-period>` : ''}
  </rsl:payment-model>

  <!-- Metadata -->
  <rsl:metadata>
    <rsl:creator>${this.escapeXML(rslData.metadata.creator)}</rsl:creator>
    <rsl:provenance>${this.escapeXML(rslData.metadata.provenance)}</rsl:provenance>
    
    <rsl:warranty>
      <rsl:ownership>${rslData.metadata.warranty.ownership}</rsl:ownership>
      <rsl:authority>${rslData.metadata.warranty.authority}</rsl:authority>
      <rsl:non-infringement>${rslData.metadata.warranty.nonInfringement}</rsl:non-infringement>
      <rsl:text>${this.escapeXML(rslData.metadata.warranty.text)}</rsl:text>
    </rsl:warranty>
    
    <rsl:disclaimer>
      <rsl:as-is>${rslData.metadata.disclaimer.asIs}</rsl:as-is>
      ${rslData.metadata.disclaimer.liabilityLimitations.map(limitation => `
      <rsl:liability-limitation>${this.escapeXML(limitation)}</rsl:liability-limitation>`).join('')}
      <rsl:text>${this.escapeXML(rslData.metadata.disclaimer.text)}</rsl:text>
    </rsl:disclaimer>
    
    <rsl:audit-trail>
      ${rslData.metadata.auditTrail.map(entry => `
      <rsl:entry timestamp="${entry.timestamp}" action="${entry.action}" user-id="${entry.userId}">
        <rsl:ip-address>${entry.ipAddress}</rsl:ip-address>
        <rsl:user-agent>${this.escapeXML(entry.userAgent)}</rsl:user-agent>
        <rsl:details>${this.escapeXML(JSON.stringify(entry.details))}</rsl:details>
      </rsl:entry>`).join('')}
    </rsl:audit-trail>
  </rsl:metadata>

</rsl:license>`;

      return xml;
    } catch (error) {
      logger.error('Error generating RSL XML:', error);
      throw new Error('Failed to generate RSL XML document');
    }
  }

  async validateRSLXML(xmlContent) {
    try {
      
      if (!xmlContent.includes('<?xml version="1.0"')) {
        throw new Error('Invalid XML declaration');
      }

      if (!xmlContent.includes(`xmlns:rsl="${this.namespace}"`)) {
        throw new Error('Missing RSL namespace');
      }

      if (!xmlContent.includes('<rsl:license')) {
        throw new Error('Missing RSL license root element');
      }

      const requiredElements = [
        'rsl:content',
        'rsl:permissions',
        'rsl:user-types',
        'rsl:geographic-restrictions',
        'rsl:payment-model',
        'rsl:metadata'
      ];

      for (const element of requiredElements) {
        if (!xmlContent.includes(`<${element}`)) {
          throw new Error(`Missing required element: ${element}`);
        }
      }

      return {
        valid: true,
        errors: []
      };
    } catch (error) {
      logger.error('RSL XML validation error:', error);
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }

  createRSLDocument(licenseOptions, fileInfo, userInfo) {
    const now = new Date().toISOString();
    const licenseId = `rsl_${uuidv4().replace(/-/g, '')}`;

    const rslDocument = {
      namespace: this.namespace,
      version: this.version,
      licenseId,
      createdAt: now,
      expiresAt: licenseOptions.expiresAt,
      content: {
        title: fileInfo.name,
        description: licenseOptions.provenanceInfo || 'Digital content with RSL license',
        fileType: fileInfo.type,
        fileSize: fileInfo.size,
        hash: fileInfo.hash || this.generateFileHash(fileInfo),
        url: fileInfo.url,
        contentType: fileInfo.type
      },
      permissions: this.createPermissions(licenseOptions),
      userTypes: this.createUserTypes(licenseOptions),
      geographicRestrictions: this.createGeographicRestrictions(licenseOptions),
      paymentModel: this.createPaymentModel(licenseOptions),
      metadata: {
        creator: userInfo.email || 'Unknown',
        provenance: licenseOptions.provenanceInfo || 'No provenance information provided',
        warranty: {
          ownership: licenseOptions.warranty?.ownership || false,
          authority: licenseOptions.warranty?.authority || false,
          nonInfringement: licenseOptions.warranty?.nonInfringement || false,
          text: licenseOptions.warranty?.text || 'No warranty provided'
        },
        disclaimer: {
          asIs: licenseOptions.disclaimer?.asIs || true,
          liabilityLimitations: licenseOptions.disclaimer?.liabilityLimitations || [
            'Content provided as-is without warranty',
            'No liability for damages arising from use'
          ],
          text: licenseOptions.disclaimer?.text || 'Use at your own risk'
        },
        auditTrail: [{
          timestamp: now,
          action: 'license_created',
          userId: userInfo.id || 'anonymous',
          ipAddress: userInfo.ipAddress || 'unknown',
          userAgent: userInfo.userAgent || 'unknown',
          details: {
            licenseId,
            fileType: fileInfo.type,
            fileSize: fileInfo.size
          }
        }]
      }
    };

    return rslDocument;
  }

  createPermissions(licenseOptions) {
    const permissions = [
      {
        type: 'train-ai',
        allowed: licenseOptions.allowAIModels || false,
        conditions: licenseOptions.allowAIModels ? ['attribution', 'payment'] : []
      },
      {
        type: 'search',
        allowed: licenseOptions.allowIndexing || false,
        conditions: licenseOptions.allowIndexing ? ['attribution'] : []
      },
      {
        type: 'ai-summarize',
        allowed: licenseOptions.allowAIModels || false,
        conditions: licenseOptions.allowAIModels ? ['attribution'] : []
      },
      {
        type: 'archive',
        allowed: licenseOptions.allowIndexing || false,
        conditions: licenseOptions.allowIndexing ? ['attribution'] : []
      },
      {
        type: 'analysis',
        allowed: licenseOptions.allowAIModels || false,
        conditions: licenseOptions.allowAIModels ? ['attribution'] : []
      }
    ];

    return permissions;
  }

  createUserTypes(licenseOptions) {
    const userTypes = [
      {
        type: 'commercial',
        allowed: licenseOptions.commercialUse === 'yes',
        conditions: licenseOptions.commercialUse === 'yes' ? ['payment'] : [],
        pricing: licenseOptions.commercialUse === 'yes' ? {
          perCrawl: 0.01,
          perInference: 0.001,
          monthlySubscription: 10,
          currency: 'USD'
        } : undefined
      },
      {
        type: 'education',
        allowed: true,
        conditions: ['attribution']
      },
      {
        type: 'government',
        allowed: true,
        conditions: ['attribution']
      },
      {
        type: 'nonprofit',
        allowed: true,
        conditions: ['attribution']
      },
      {
        type: 'individual',
        allowed: true,
        conditions: ['attribution']
      }
    ];

    return userTypes;
  }

  createGeographicRestrictions(licenseOptions) {
    if (!licenseOptions.geographicRestrictions || licenseOptions.geographicRestrictions.length === 0) {
      return [
        { countryCode: 'US', allowed: true },
        { countryCode: 'CA', allowed: true },
        { countryCode: 'GB', allowed: true },
        { countryCode: 'DE', allowed: true },
        { countryCode: 'FR', allowed: true },
        { countryCode: 'JP', allowed: true },
        { countryCode: 'AU', allowed: true }
      ];
    }

    return licenseOptions.geographicRestrictions;
  }

  createPaymentModel(licenseOptions) {
    if (licenseOptions.commercialUse === 'yes') {
      return {
        type: 'per-crawl',
        amount: 0.01,
        currency: 'USD'
      };
    } else if (licenseOptions.allowAIModels || licenseOptions.allowIndexing) {
      return {
        type: 'attribution',
        attributionText: 'Attribution required for use'
      };
    } else {
      return {
        type: 'free'
      };
    }
  }

  generateFileHash(fileInfo) {
    return `sha256_${uuidv4().replace(/-/g, '')}`;
  }

  escapeXML(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export const rslGenerator = new RSLGenerator();

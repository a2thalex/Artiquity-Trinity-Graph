import Joi from 'joi';


const tokenRequestSchema = Joi.object({
  grant_type: Joi.string().valid('authorization_code', 'client_credentials', 'rsl').required(),
  client_id: Joi.string().required(),
  client_secret: Joi.string().required(),
  code: Joi.string().when('grant_type', {
    is: 'authorization_code',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  redirect_uri: Joi.string().uri().when('grant_type', {
    is: 'authorization_code',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  scope: Joi.string().optional(),
  license_id: Joi.string().when('grant_type', {
    is: 'rsl',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  user_type: Joi.string().valid('commercial', 'education', 'government', 'nonprofit', 'individual').when('grant_type', {
    is: 'rsl',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  country_code: Joi.string().length(2).when('grant_type', {
    is: 'rsl',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  })
});


const introspectionRequestSchema = Joi.object({
  token: Joi.string().required(),
  token_type_hint: Joi.string().valid('access_token', 'refresh_token').optional()
});


const licenseRequestSchema = Joi.object({
  contentId: Joi.string().required(),
  userId: Joi.string().required(),
  userType: Joi.string().valid('commercial', 'education', 'government', 'nonprofit', 'individual').required(),
  countryCode: Joi.string().length(2).required(),
  permissions: Joi.array().items(Joi.string().valid('train-ai', 'search', 'ai-summarize', 'archive', 'analysis')).required(),
  paymentInfo: Joi.object({
    method: Joi.string().valid('stripe', 'paypal', 'crypto').required(),
    token: Joi.string().required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).required()
  }).optional()
});


const rslDocumentSchema = Joi.object({
  namespace: Joi.string().valid('https:
  version: Joi.string().required(),
  licenseId: Joi.string().required(),
  createdAt: Joi.string().isoDate().required(),
  expiresAt: Joi.string().isoDate().optional(),
  content: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    fileType: Joi.string().required(),
    fileSize: Joi.number().positive().required(),
    hash: Joi.string().required(),
    url: Joi.string().uri().optional(),
    contentType: Joi.string().required()
  }).required(),
  permissions: Joi.array().items(Joi.object({
    type: Joi.string().valid('train-ai', 'search', 'ai-summarize', 'archive', 'analysis').required(),
    allowed: Joi.boolean().required(),
    conditions: Joi.array().items(Joi.string()).optional(),
    restrictions: Joi.array().items(Joi.string()).optional()
  })).required(),
  userTypes: Joi.array().items(Joi.object({
    type: Joi.string().valid('commercial', 'education', 'government', 'nonprofit', 'individual').required(),
    allowed: Joi.boolean().required(),
    conditions: Joi.array().items(Joi.string()).optional(),
    pricing: Joi.object({
      perCrawl: Joi.number().positive().optional(),
      perInference: Joi.number().positive().optional(),
      monthlySubscription: Joi.number().positive().optional(),
      currency: Joi.string().length(3).required()
    }).optional()
  })).required(),
  geographicRestrictions: Joi.array().items(Joi.object({
    countryCode: Joi.string().length(2).required(),
    allowed: Joi.boolean().required(),
    conditions: Joi.array().items(Joi.string()).optional()
  })).required(),
  paymentModel: Joi.object({
    type: Joi.string().valid('free', 'attribution', 'per-crawl', 'per-inference', 'subscription').required(),
    amount: Joi.number().positive().optional(),
    currency: Joi.string().length(3).optional(),
    attributionText: Joi.string().optional(),
    subscriptionPeriod: Joi.string().optional()
  }).required(),
  metadata: Joi.object({
    creator: Joi.string().required(),
    provenance: Joi.string().required(),
    warranty: Joi.object({
      ownership: Joi.boolean().required(),
      authority: Joi.boolean().required(),
      nonInfringement: Joi.boolean().required(),
      text: Joi.string().required()
    }).required(),
    disclaimer: Joi.object({
      asIs: Joi.boolean().required(),
      liabilityLimitations: Joi.array().items(Joi.string()).required(),
      text: Joi.string().required()
    }).required(),
    auditTrail: Joi.array().items(Joi.object({
      timestamp: Joi.string().isoDate().required(),
      action: Joi.string().required(),
      userId: Joi.string().required(),
      ipAddress: Joi.string().ip().required(),
      userAgent: Joi.string().required(),
      details: Joi.object().required()
    })).required()
  }).required()
});


export function validateTokenRequest(req, res, next) {
  const { error } = tokenRequestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: error.details[0].message
    });
  }
  next();
}

export function validateIntrospectionRequest(req, res, next) {
  const { error } = introspectionRequestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: error.details[0].message
    });
  }
  next();
}

export function validateLicenseRequest(req, res, next) {
  const { error } = licenseRequestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: error.details[0].message
    });
  }
  next();
}

export function validateRSLDocument(req, res, next) {
  const { error } = rslDocumentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'invalid_rsl_document',
      error_description: error.details[0].message
    });
  }
  next();
}


export function validateRequest(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'validation_error',
        error_description: error.details[0].message
      });
    }
    next();
  };
}

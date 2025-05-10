import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Validation schemas
const schemas = {
  // Auth schemas
  login: Joi.object({
    username: Joi.string().required().min(3).max(50),
    password: Joi.string().required().min(8).max(100)
  }),

  register: Joi.object({
    username: Joi.string().required().min(3).max(50),
    password: Joi.string().required().min(8).max(100),
    firstName: Joi.string().required().max(50),
    lastName: Joi.string().required().max(50),
    organization: Joi.string().required().max(100)
  }),

  // Cloud account schemas
  createCloudAccount: Joi.object({
    provider: Joi.string().valid('aws', 'azure', 'gcp').required(),
    name: Joi.string().required().max(100),
    credentials: Joi.object().required(),
    region: Joi.string().required()
  }),

  updateCloudAccount: Joi.object({
    name: Joi.string().max(100),
    region: Joi.string(),
    status: Joi.string().valid('active', 'inactive', 'suspended'),
    tags: Joi.object().pattern(Joi.string(), Joi.string())
  }),

  // Scan schemas
  startScan: Joi.object({
    accountId: Joi.string().required(),
    scanType: Joi.string().valid('security', 'compliance', 'cost').required(),
    options: Joi.object({
      depth: Joi.number().min(1).max(10),
      includeResources: Joi.array().items(Joi.string()),
      excludeResources: Joi.array().items(Joi.string())
    })
  }),

  // Report schemas
  generateReport: Joi.object({
    accountId: Joi.string().required(),
    reportType: Joi.string().valid('security', 'compliance', 'cost').required(),
    format: Joi.string().valid('pdf', 'csv', 'json').required(),
    dateRange: Joi.object({
      start: Joi.date().required(),
      end: Joi.date().required()
    })
  }),

  // Monitoring schemas
  createAlert: Joi.object({
    name: Joi.string().required().max(100),
    metric: Joi.string().required(),
    condition: Joi.string().valid('above', 'below', 'equals').required(),
    threshold: Joi.number().required(),
    duration: Joi.number().min(1).required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    notificationChannels: Joi.array().items(Joi.string()).min(1).required()
  }),

  updateAlert: Joi.object({
    name: Joi.string().max(100),
    condition: Joi.string().valid('above', 'below', 'equals'),
    threshold: Joi.number(),
    duration: Joi.number().min(1),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
    notificationChannels: Joi.array().items(Joi.string()).min(1)
  }),

  // Security configuration schemas
  updateSecurityConfig: Joi.object({
    mfaEnabled: Joi.boolean(),
    passwordPolicy: Joi.object({
      minLength: Joi.number().min(8).max(32),
      requireUppercase: Joi.boolean(),
      requireLowercase: Joi.boolean(),
      requireNumbers: Joi.boolean(),
      requireSpecialChars: Joi.boolean(),
      maxAge: Joi.number().min(30).max(365)
    }),
    sessionConfig: Joi.object({
      maxConcurrentSessions: Joi.number().min(1).max(10),
      sessionTimeout: Joi.number().min(5).max(1440),
      requireReauth: Joi.boolean()
    }),
    ipWhitelist: Joi.array().items(Joi.string().ip())
  }),

  // Resource schemas
  createResource: Joi.object({
    name: Joi.string().required().max(100),
    type: Joi.string().required(),
    provider: Joi.string().valid('aws', 'azure', 'gcp').required(),
    region: Joi.string().required(),
    configuration: Joi.object().required(),
    tags: Joi.object().pattern(Joi.string(), Joi.string())
  }),

  updateResource: Joi.object({
    name: Joi.string().max(100),
    configuration: Joi.object(),
    tags: Joi.object().pattern(Joi.string(), Joi.string()),
    status: Joi.string().valid('active', 'inactive', 'maintenance')
  }),

  // Query parameter schemas
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc')
  }),

  dateRange: Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required()
  })
};

// Validation middleware factory
export const validate = (schemaName: keyof typeof schemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const schema = schemas[schemaName];
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
};

// Query parameter validation middleware
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Invalid query parameters',
        details: errors
      });
    }

    next();
  };
};

// URL parameter validation middleware
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Invalid URL parameters',
        details: errors
      });
    }

    next();
  };
};

// Export schemas for reuse
export { schemas }; 
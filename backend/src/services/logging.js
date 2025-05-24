const winston = require('winston');
const { format } = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Custom format for sensitive data redaction
const redactSensitiveData = format((info) => {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const redacted = { ...info };

  sensitiveFields.forEach(field => {
    if (redacted[field]) {
      redacted[field] = '[REDACTED]';
    }
  });

  return redacted;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    redactSensitiveData(),
    format.json()
  ),
  defaultMeta: { service: 'cloudauditpro' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Add request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip
    };

    if (res.statusCode >= 400) {
      logger.error('Request failed', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

// Add error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    user: req.user?.id
  });

  next(err);
};

// Log rotation function
const rotateLogs = () => {
  const files = fs.readdirSync(logsDir);
  const maxSize = 5242880; // 5MB

  files.forEach(file => {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);

    if (stats.size > maxSize) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newPath = path.join(logsDir, `${file}.${timestamp}`);
      fs.renameSync(filePath, newPath);
    }
  });
};

// Prisma query event handler (to be used in index.js)
const prismaQueryLogger = (prisma) => {
  prisma.$on('query', (e) => {
    logger.info({
      message: 'Prisma Query',
      query: e.query,
      params: e.params,
      duration: e.duration,
      target: e.target
    });
  });
  prisma.$on('error', (e) => {
    logger.error({
      message: 'Prisma Error',
      error: e.message,
      target: e.target
    });
  });
};

module.exports = {
  requestLogger,
  errorLogger,
  rotateLogs,
  prismaQueryLogger,
  default: logger
};

/**
 * Centralized Logger for MCP Injection Demo
 * Provides consistent logging across vulnerable and secure servers
 */

import winston from 'winston';

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mcp-demo' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // File output
    new winston.transports.File({ 
      filename: process.env.LOG_FILE || 'logs/mcp-demo.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add request logging middleware
export const logRequest = (req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });
  next();
};

// Add response logging middleware
export const logResponse = (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    logger.info('Outgoing response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseData: data
    });
    originalSend.call(this, data);
  };
  next();
};

export default logger; 
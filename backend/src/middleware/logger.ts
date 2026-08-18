import morgan from 'morgan';
import { logger, loggerStream } from '../config/logger';

morgan.token('user-id', (req: any) => req.user?.id || 'anonymous');
morgan.token('request-id', (req: any) => req.headers['x-request-id'] || '-');
// Log the path only — query strings can carry PII (tokens, emails, identifiers).
morgan.token('url', (req: any) => (req.originalUrl || req.url || '').split('?')[0]);
// Client IP addresses are personal data — never write them to logs.
morgan.token('real-ip', () => '[REDACTED]');

export const httpLogger = morgan(
  ':method :url :status :response-time ms - :res[content-length] [:request-id] [:user-id] [:real-ip]',
  { stream: loggerStream }
);

export const errorLogger = (err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: (req.originalUrl || req.url || '').split('?')[0],
    userId: req.user?.id,
    requestId: req.headers['x-request-id'],
  });
  next(err);
};

export const requestContext = (req: any, res: any, next: any) => {
  req.requestId = req.headers['x-request-id'] ||
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-Id', req.requestId);
  next();
};

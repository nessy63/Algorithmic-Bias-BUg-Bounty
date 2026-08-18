import { logger } from './logger';

// Variables the app cannot operate without — missing values abort startup in
// every environment with a clear message.
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'] as const;

// Required for production deployments; development logs a warning instead.
const REQUIRED_IN_PRODUCTION = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_APP_URL',
] as const;

// The documented development fallbacks in config/auth.ts and the local
// backend/.env template. These must never be accepted in production.
const KNOWN_DEV_JWT_SECRETS = [
  'dev-secret-change-in-production',
  'dev-secret-change-in-production-1234567890',
];

export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';

  const missingRequired = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missingRequired.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missingRequired.join(', ')} — refusing to start.`
    );
  }

  const missingProd = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missingProd.length > 0) {
    const message = `Missing required environment variable(s): ${missingProd.join(', ')}`;
    if (isProd) {
      throw new Error(`${message} — refusing to start.`);
    }
    logger.warn(`${message} — continuing in development mode.`);
  }

  if (isProd) {
    if (KNOWN_DEV_JWT_SECRETS.includes(process.env.JWT_SECRET || '')) {
      throw new Error(
        'JWT_SECRET is still set to a known development default — refusing to start. ' +
          'Generate a unique secret before deploying.'
      );
    }

    const dbUrl = process.env.DATABASE_URL || '';
    if (!/sslmode=require|sslaccept=strict/.test(dbUrl)) {
      logger.warn(
        'DATABASE_URL does not request TLS (sslmode=require). ' +
          'Production database connections should use SSL.'
      );
    }
  }

  if (!process.env.NODE_ENV) {
    logger.warn(
      'NODE_ENV is not set — defaults to development. Set it to "production" ' +
        'in deployed environments (enables secure cookies and strict env checks).'
    );
  }

  // Non-critical — these degrade gracefully:
  if (!process.env.RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY not set — transactional emails will be skipped.');
  }
  if (!process.env.ENABLE_LOG_VIEWER) {
    logger.warn('Log viewer is disabled (ENABLE_LOG_VIEWER not set to "true").');
  }
}

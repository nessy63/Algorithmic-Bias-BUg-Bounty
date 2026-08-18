import { logger } from '../config/logger';

export const audit = {
  userRegistered: (userId: string, role: string) => {
    logger.info('User registered', {
      event: 'user.registered',
      userId,
      role,
      timestamp: new Date().toISOString()
    });
  },

  userLogin: (userId: string, _ip: string) => {
    // Client IP addresses are personal data — never write them to logs.
    logger.info('User login', {
      event: 'user.login',
      userId,
      ip: '[REDACTED]',
      timestamp: new Date().toISOString()
    });
  },

  bugReportSubmitted: (bugId: string, researcherId: string, bountyId: string) => {
    logger.info('Bug report submitted', {
      event: 'bug.submitted',
      bugId,
      researcherId,
      bountyId,
      timestamp: new Date().toISOString()
    });
  },

  bugReportAccepted: (bugId: string, companyId: string, amount: number) => {
    logger.info('Bug report accepted', {
      event: 'bug.accepted',
      bugId,
      companyId,
      amount,
      timestamp: new Date().toISOString()
    });
  },

  escrowCreated: (escrowId: string, amount: number, bugId: string) => {
    logger.info('Escrow created', {
      event: 'payment.escrow_created',
      escrowId,
      amount,
      bugId,
      timestamp: new Date().toISOString()
    });
  },

  escrowReleased: (escrowId: string, amount: number) => {
    logger.info('Escrow released', {
      event: 'payment.escrow_released',
      escrowId,
      amount,
      timestamp: new Date().toISOString()
    });
  },

  unauthorizedAccess: (_ip: string, path: string) => {
    // Client IP addresses are personal data — never write them to logs.
    logger.warn('Unauthorized access attempt', {
      event: 'security.unauthorized',
      ip: '[REDACTED]',
      path,
      timestamp: new Date().toISOString()
    });
  },

  rateLimitHit: (_ip: string, path: string) => {
    // Client IP addresses are personal data — never write them to logs.
    logger.warn('Rate limit exceeded', {
      event: 'security.rate_limit',
      ip: '[REDACTED]',
      path,
      timestamp: new Date().toISOString()
    });
  },
};

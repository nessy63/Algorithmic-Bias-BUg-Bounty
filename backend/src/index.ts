import express, { Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { logger } from './config/logger';
import { validateEnv } from './config/env';
import { httpLogger, errorLogger, requestContext } from './middleware/logger';
import { stripe, STRIPE_WEBHOOK_SECRET } from './config/stripe';
import { apiLimiter } from './middleware/rateLimit';

// Refuse to start when critical environment variables are missing or insecure
// (only enforced in production; development logs warnings).
validateEnv();

// Safety net: an unhandled async rejection must never take down the whole API.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    error: reason instanceof Error ? reason.stack || reason.message : reason,
  });
});
import authRoutes from './routes/auth';
import modelRoutes from './routes/models';
import bugRoutes from './routes/bugs';
import bountyRoutes from './routes/bounties';
import userRoutes from './routes/users';
import logRoutes from './routes/logs';
import { AuthRequest } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

// Request context (adds request ID)
app.use(requestContext);

// HTTP logging
app.use(httpLogger);

// Trust one reverse-proxy hop so per-IP rate limiting sees the real client
// address behind a proxy/load balancer. Increase if your deployment has more
// proxy layers.
app.set('trust proxy', 1);

// Security headers — explicit so the posture is visible and testable:
// nosniff, X-Frame-Options DENY, HSTS (1 year), strict CSP.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// Parse cookies (httpOnly auth token)
app.use(cookieParser());

// CORS — restricted to the frontend origin only. Requests from any other
// origin (or none, e.g. same-origin/server-to-server) get no ACAO header, so
// browsers block them. Never use origin: '*' with credentials.
const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === allowedOrigin) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));

// Stripe webhook needs raw body
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req: AuthRequest, res: Response) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig!, STRIPE_WEBHOOK_SECRET);

    if (event.type === 'payment_intent.succeeded') {
      // Log only non-sensitive identifiers — never the full payment intent
      // object, which contains customer PII (email, name, billing details).
      const pi = event.data.object;
      logger.info('Payment succeeded', {
        paymentIntentId: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
      });
    }

    res.json({ received: true });
  } catch (err) {
    // Log details server-side only; never serialize the Stripe error object
    // (it can include request data) and never expose internals to the client.
    logger.error('Webhook error', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      requestId: req.requestId,
    });
    res.status(400).json({ error: 'Webhook error', requestId: req.requestId });
  }
});

app.use(express.json());
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/bounties', bountyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);

// Health check
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };
  res.json(health);
});

// JSON 404 — never let Express' default HTML "Cannot GET ..." leak path info.
app.use((req: AuthRequest, res: Response) => {
  res.status(404).json({ error: 'Not found', requestId: req.requestId });
});

// Error logging middleware
app.use(errorLogger);

// Global error handler — the client always gets a generic message plus a
// correlation ID; stack traces and details go to server logs only.
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error', {
    error: err?.message,
    stack: err?.stack,
    requestId: req.requestId,
    userId: req.user?.id,
  });

  res.status(err.status || 500).json({
    error: 'Internal server error',
    requestId: req.requestId,
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    env: process.env.NODE_ENV || 'development',
    pid: process.pid
  });
});

export default app;

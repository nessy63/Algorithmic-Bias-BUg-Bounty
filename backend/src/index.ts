import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { logger } from './config/logger';
import { httpLogger, errorLogger, requestContext } from './middleware/logger';
import { stripe, STRIPE_WEBHOOK_SECRET } from './config/stripe';
import { apiLimiter } from './middleware/rateLimit';

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

const app = express();
const PORT = process.env.PORT || 3001;

// Request context (adds request ID)
app.use(requestContext);

// HTTP logging
app.use(httpLogger);

// Security headers
app.use(helmet());

// Parse cookies (httpOnly auth token)
app.use(cookieParser());

// CORS
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}));

// Stripe webhook needs raw body
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
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
    logger.error('Webhook error', { error: err });
    res.status(400).json({ error: 'Webhook error' });
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

// Error logging middleware
app.use(errorLogger);

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    env: process.env.NODE_ENV || 'development',
    pid: process.pid
  });
});

export default app;

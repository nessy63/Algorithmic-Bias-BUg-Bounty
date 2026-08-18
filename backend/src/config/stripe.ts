import Stripe from 'stripe';

// Optional: point the SDK at a local Stripe mock (e.g. stripe-mock) for
// development/testing without real credentials. Unset in normal operation.
const apiHost = process.env.STRIPE_API_HOST;
const apiPort = process.env.STRIPE_API_PORT
  ? parseInt(process.env.STRIPE_API_PORT, 10)
  : undefined;

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  ...(apiHost
    ? { host: apiHost, port: apiPort, protocol: 'http' as const }
    : {}),
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// No hardcoded fallback: JWT_SECRET is required in every environment —
// validateEnv() refuses to start when it is missing, and production rejects
// the known development defaults.
export const JWT_SECRET = process.env.JWT_SECRET || '';
export const JWT_EXPIRES_IN = '7d';
export const BCRYPT_ROUNDS = 12;

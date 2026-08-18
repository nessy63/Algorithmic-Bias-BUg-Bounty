import { PrismaClient } from '@prisma/client';

// Note: 'query' logging is intentionally omitted — Prisma query events include
// parameter values (emails, names, hashes) which must never reach log files.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;

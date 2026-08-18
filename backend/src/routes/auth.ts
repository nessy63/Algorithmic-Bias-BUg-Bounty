import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/database';
import { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS } from '../config/auth';
import { validate } from '../middleware/validation';
import { authLimiter, loginLimiter } from '../middleware/rateLimit';
import { authenticate } from '../middleware/auth';
import { logger } from '../config/logger';
import { AuthRequest } from '../types';

const router = Router();

// httpOnly session cookie: not readable by JavaScript (XSS-safe), sent only
// on same-site requests, and only over HTTPS in production.
const TOKEN_COOKIE = 'token';
const TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // matches JWT_EXPIRES_IN
const tokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: TOKEN_COOKIE_MAX_AGE,
});

// Public profile shape — never include internal fields (passwordHash, ids,
// stripeAccountId) that the client does not need.
function publicUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  company: any;
  researcher: any;
}) {
  const { stripeAccountId, ...company } = user.company ?? {};
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    company: user.company ? { ...company, stripeConnected: !!stripeAccountId } : null,
    researcher: user.researcher ?? null,
  };
}

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    role: z.enum(['COMPANY', 'RESEARCHER']),
    companyName: z.string().optional(),
    companyDescription: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Company accounts must provide a company name — otherwise the handler
    // would crash on companyName!.toLowerCase() with a 500.
    if (data.role === 'COMPANY' && !data.companyName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyName'],
        message: 'Company name is required for company accounts',
      });
    }
  });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', authLimiter, validate(registerSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role, companyName, companyDescription } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    let companyId: string | undefined;
    let researcherId: string | undefined;

    if (role === 'COMPANY') {
      const slug = companyName!.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const company = await prisma.company.create({
        data: {
          name: companyName!,
          slug,
          description: companyDescription,
        },
      });
      companyId = company.id;
    } else if (role === 'RESEARCHER') {
      const researcher = await prisma.researcher.create({
        data: { bio: '' },
      });
      researcherId = researcher.id;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        companyId,
        researcherId,
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId,
        researcherId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie(TOKEN_COOKIE, token, tokenCookieOptions());

    // The session token is delivered exclusively via the httpOnly cookie — it
    // is never returned in the response body, so page JavaScript (including
    // XSS) cannot read it. The JWT payload contains the user's email.
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    // Never log the submitted email — it is personal data.
    logger.error('Registration failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', loginLimiter, validate(loginSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true, researcher: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        researcherId: user.researcherId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie(TOKEN_COOKIE, token, tokenCookieOptions());

    // Session token is delivered via the httpOnly cookie only — never in the
    // response body (see register above).
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    // Never log the submitted email — it is personal data.
    logger.error('Login failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: 'Login failed' });
  }
});

// Sign out: clears the httpOnly session cookie. Safe to call unauthenticated.
router.post('/logout', (_req: AuthRequest, res: Response) => {
  res.clearCookie(TOKEN_COOKIE, tokenCookieOptions());
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          website: true,
          logoUrl: true,
          verified: true,
          stripeAccountId: true,
        },
      },
      researcher: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(publicUser(user));
});

export default router;

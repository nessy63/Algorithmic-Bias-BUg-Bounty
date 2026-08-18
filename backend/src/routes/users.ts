import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AuthRequest } from '../types';
import { StripeService } from '../services/stripe';
import { BCRYPT_ROUNDS } from '../config/auth';

const router = Router();

// Public profile shape — never expose internal identifiers (stripeAccountId,
// internal ids) the client does not need.
function publicProfile(user: {
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

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
});

// Get profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
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

  res.json(publicProfile(user));
});

// Update profile
router.put('/profile', authenticate, validate(updateProfileSchema), async (req: AuthRequest, res: Response) => {
  const { name, ...researcherData } = req.body;

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { name },
  });

  if (req.user!.role === 'RESEARCHER' && req.user!.researcherId) {
    await prisma.researcher.update({
      where: { id: req.user!.researcherId },
      data: researcherData,
    });
  }

  res.json({ message: 'Profile updated' });
});

// Get earnings (researcher only)
router.get('/earnings', authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'RESEARCHER') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const researcher = await prisma.researcher.findUnique({
    where: { id: req.user!.researcherId! },
    select: { totalEarnings: true, reputation: true },
  });

  const paidBugs = await prisma.bugReport.findMany({
    where: {
      researcherId: req.user!.researcherId,
      status: 'PAID',
    },
    include: { bounty: { select: { amount: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    totalEarnings: researcher?.totalEarnings || 0,
    reputation: researcher?.reputation || 0,
    paidBugs,
  });
});

// Get company stats
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'COMPANY') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const companyId = req.user!.companyId!;

  const [models, bounties, bugs, totalPayouts] = await Promise.all([
    prisma.aIModel.count({ where: { companyId } }),
    prisma.bounty.count({ where: { companyId } }),
    prisma.bugReport.count({
      where: { model: { companyId } },
    }),
    prisma.escrow.aggregate({
      where: {
        bounty: { companyId },
        status: 'RELEASED',
      },
      _sum: { amount: true },
    }),
  ]);

  res.json({
    models,
    bounties,
    bugs,
    totalPayouts: totalPayouts._sum.amount || 0,
  });
});

// Delete account — anonymizes all personal data while preserving referential
// integrity of business records (bug reports, bounties, escrows).
router.delete('/account', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Replace the password hash so any captured credentials can never be reused.
  const unusableHash = await bcrypt.hash(crypto.randomUUID(), BCRYPT_ROUNDS);

  if (user.role === 'RESEARCHER' && user.researcherId) {
    // Clear the researcher's own notes on their reports (report content is the
    // company's business record and is retained).
    await prisma.bugReport.updateMany({
      where: { researcherId: user.researcherId },
      data: { researcherNotes: null },
    });

    await prisma.researcher.update({
      where: { id: user.researcherId },
      data: {
        bio: null,
        avatarUrl: null,
        githubUrl: null,
        reputation: 0,
        totalEarnings: 0,
      },
    });
  }

  if (user.role === 'COMPANY' && user.companyId) {
    const userCount = await prisma.user.count({ where: { companyId: user.companyId } });

    if (userCount <= 1) {
      // Last user of the company: anonymize the company record too.
      await prisma.company.update({
        where: { id: user.companyId },
        data: {
          name: 'Deleted Company',
          slug: `deleted-${user.companyId}`,
          description: null,
          website: null,
          logoUrl: null,
          stripeAccountId: null,
        },
      });
    }
  }

  // Anonymize the user record (email stays unique, no login possible). The
  // researcherId/companyId links are kept so bug reports and other business
  // records continue to resolve to an anonymized placeholder.
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted-${userId}@anonymized.invalid`,
      name: 'Deleted User',
      passwordHash: unusableHash,
    },
  });

  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  res.json({ message: 'Account deleted' });
});

// Setup Stripe Connect (company only)
router.post('/setup-payments', authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'COMPANY') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { company: true },
  });

  if (!user?.company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  let accountId = user.company.stripeAccountId;

  if (!accountId) {
    const account = await StripeService.createConnectAccount(user.email);
    accountId = account.id;

    await prisma.company.update({
      where: { id: user.companyId! },
      data: { stripeAccountId: accountId },
    });
  }

  const link = await StripeService.createOnboardingLink(accountId);

  res.json({ url: link.url });
});

export default router;

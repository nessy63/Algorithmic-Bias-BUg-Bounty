import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AuthRequest } from '../types';
import { StripeService } from '../services/stripe';

const router = Router();

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
      company: true,
      researcher: true,
    },
  });

  res.json(user);
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

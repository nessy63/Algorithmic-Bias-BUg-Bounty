import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AuthRequest } from '../types';
import { AIProxyService } from '../services/aiProxy';
import { StripeService } from '../services/stripe';
import { EmailService } from '../services/email';
import { sandboxLimiter } from '../middleware/rateLimit';

const router = Router();

const createBugSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  reproductionSteps: z.string().min(1),
  inputExample: z.string().optional(),
  outputExample: z.string().optional(),
  expectedBehavior: z.string().min(1),
  actualBehavior: z.string().min(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  modelId: z.string(),
  bountyId: z.string(),
});

const updateBugSchema = z.object({
  status: z.enum([
    'SUBMITTED', 'UNDER_REVIEW', 'REPRODUCIBLE', 'NOT_REPRODUCIBLE',
    'ACCEPTED', 'REJECTED', 'PAID',
  ]).optional(),
  researcherNotes: z.string().optional(),
  companyNotes: z.string().optional(),
});

// List bugs (filtered by role)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', status, modelId } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  let where: any = {};

  if (req.user!.role === 'COMPANY') {
    where.model = { companyId: req.user!.companyId };
  } else if (req.user!.role === 'RESEARCHER') {
    where.researcherId = req.user!.researcherId;
  }

  if (status) where.status = status;
  if (modelId) where.modelId = modelId;

  const [bugs, total] = await Promise.all([
    prisma.bugReport.findMany({
      where,
      include: {
        model: { select: { name: true, company: { select: { name: true } } } },
        bounty: { select: { title: true, amount: true } },
        researcher: { include: { user: { select: { name: true } } } },
      },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bugReport.count({ where }),
  ]);

  res.json({
    data: bugs,
    total,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    totalPages: Math.ceil(total / parseInt(limit as string)),
  });
});

// Get single bug
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const bug = await prisma.bugReport.findUnique({
    where: { id: req.params.id },
    include: {
      model: true,
      bounty: true,
      researcher: { include: { user: { select: { name: true, email: true } } } },
      escrows: true,
    },
  });

  if (!bug) {
    return res.status(404).json({ error: 'Bug report not found' });
  }

  // Check access permissions
  if (req.user!.role === 'COMPANY' && bug.model.companyId !== req.user!.companyId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (req.user!.role === 'RESEARCHER' && bug.researcherId !== req.user!.researcherId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(bug);
});

// Submit bug report (researcher only)
router.post('/', authenticate, authorize('RESEARCHER'), validate(createBugSchema), async (req: AuthRequest, res: Response) => {
  const bounty = await prisma.bounty.findUnique({
    where: { id: req.body.bountyId },
    include: { model: true },
  });

  if (!bounty) {
    return res.status(404).json({ error: 'Bounty not found' });
  }

  if (bounty.status !== 'OPEN') {
    return res.status(400).json({ error: 'Bounty is not open' });
  }

  if (bounty.modelId !== req.body.modelId) {
    return res.status(400).json({ error: 'Model does not match bounty' });
  }

  const bug = await prisma.bugReport.create({
    data: {
      ...req.body,
      researcherId: req.user!.researcherId!,
      status: 'SUBMITTED',
    },
    include: {
      model: { select: { name: true, company: { select: { name: true } } } },
      bounty: true,
    },
  });

  // Notify company
  const company = await prisma.company.findUnique({
    where: { id: bounty.companyId },
    include: { users: true },
  });

  if (company?.users[0]) {
    await EmailService.sendBugReportSubmitted(company.users[0].email, bug.title);
  }

  res.status(201).json(bug);
});

// Update bug status (company only)
router.put('/:id', authenticate, authorize('COMPANY'), validate(updateBugSchema), async (req: AuthRequest, res: Response) => {
  const existing = await prisma.bugReport.findFirst({
    where: {
      id: req.params.id,
      model: { companyId: req.user!.companyId },
    },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Bug report not found' });
  }

  const bug = await prisma.bugReport.update({
    where: { id: req.params.id },
    data: req.body,
    include: {
      model: true,
      bounty: true,
      researcher: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  // If accepted, create escrow and notify researcher
  if (req.body.status === 'ACCEPTED') {
    const escrowAmount = Math.min(bug.bounty.amount, bug.bounty.maxPayout);

    await StripeService.createEscrow(bug.id, escrowAmount);
    await EmailService.sendBugReportAccepted(
      bug.researcher.user!.email,
      bug.title,
      escrowAmount
    );
  }

  res.json(bug);
});

// Test model in sandbox
router.post('/test', authenticate, sandboxLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { modelId, input, testType } = req.body;

    if (!modelId || !input || !testType) {
      return res.status(400).json({ error: 'modelId, input, and testType are required' });
    }

    const result = await AIProxyService.testModel(modelId, input, testType);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Sandbox test failed' });
  }
});

export default router;

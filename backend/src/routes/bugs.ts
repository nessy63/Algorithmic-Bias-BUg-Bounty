import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { parsePagination } from '../lib/pagination';
import { AuthRequest } from '../types';
import { AIProxyService } from '../services/aiProxy';
import { StripeService } from '../services/stripe';
import { EmailService } from '../services/email';
import { logger } from '../config/logger';
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
  const { status, modelId } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  // Defense-in-depth: a token that claims a role without its required profile
  // id must never fall through to an unfiltered query (Prisma ignores
  // `undefined` filters, which would return every bug in the system).
  if (req.user!.role === 'COMPANY' && !req.user!.companyId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (req.user!.role === 'RESEARCHER' && !req.user!.researcherId) {
    return res.status(403).json({ error: 'Access denied' });
  }

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
        // Only the researcher's display name — never their profile URLs,
        // earnings, or internal ids.
        researcher: { select: { user: { select: { name: true } } } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bugReport.count({ where }),
  ]);

  res.json({
    data: bugs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// Get single bug
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const bug = await prisma.bugReport.findUnique({
    where: { id: req.params.id },
    include: {
      // Field-level filtering: trim models/bounties to public-safe fields and
      // never expose the researcher's email, profile URLs, or internal ids.
      model: {
        select: {
          id: true,
          name: true,
          version: true,
          category: true,
          status: true,
          company: { select: { name: true } },
        },
      },
      bounty: {
        select: { id: true, title: true, amount: true, severity: true, status: true },
      },
      researcher: { select: { user: { select: { name: true } } } },
      // Payment-intent IDs are internal Stripe identifiers — surface only
      // what the client needs.
      escrows: { select: { id: true, amount: true, status: true, createdAt: true } },
    },
  });

  if (!bug) {
    return res.status(404).json({ error: 'Bug report not found' });
  }

  // Check access permissions — look the model's companyId up separately so
  // the internal id never appears in the response payload.
  if (req.user!.role === 'COMPANY') {
    const model = await prisma.aIModel.findUnique({
      where: { id: bug.modelId },
      select: { companyId: true },
    });
    if (!model || model.companyId !== req.user!.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }
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
      bounty: { select: { id: true, title: true, amount: true } },
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

  const previousStatus = existing.status;

  const bug = await prisma.bugReport.update({
    where: { id: req.params.id },
    data: req.body,
    include: {
      // Field-level filtering: drop internal ids and model apiEndpoint from
      // the response. maxPayout is included because the escrow amount is
      // computed from it below.
      model: {
        select: {
          id: true,
          name: true,
          company: { select: { name: true } },
        },
      },
      bounty: {
        select: { id: true, title: true, amount: true, maxPayout: true },
      },
      researcher: { select: { user: { select: { name: true } } } },
    },
  });

  // If accepted, create escrow and notify researcher
  if (req.body.status === 'ACCEPTED') {
    // Idempotency guard: never create a second escrow/payment intent for a bug
    // that already has one. Without this, repeated ACCEPTED updates (retries,
    // double-clicks, or ACCEPTED → REJECTED → ACCEPTED churn) would create a
    // new payment intent each time and double-charge the company.
    const existingEscrow = await prisma.escrow.findFirst({
      where: { bugReportId: bug.id },
    });

    if (existingEscrow) {
      logger.warn('Skipping duplicate escrow creation', {
        bugId: bug.id,
        escrowId: existingEscrow.id,
      });
    } else {
      const escrowAmount = Math.min(bug.bounty.amount, bug.bounty.maxPayout);

      try {
        await StripeService.createEscrow(bug.id, escrowAmount);

        // Fetch the researcher's email server-side only — it must never appear
        // in API responses.
        const researcherUser = await prisma.user.findUnique({
          where: { researcherId: bug.researcherId },
          select: { email: true },
        });
        if (researcherUser?.email) {
          await EmailService.sendBugReportAccepted(
            researcherUser.email,
            bug.title,
            escrowAmount
          );
        }
      } catch (escrowError) {
        logger.error('Failed to create escrow for accepted bug report', {
          bugId: bug.id,
          error: escrowError instanceof Error ? escrowError.message : escrowError,
        });

        // Revert the status so the report isn't left as ACCEPTED without an escrow
        await prisma.bugReport.update({
          where: { id: bug.id },
          data: { status: previousStatus },
        });

        return res.status(400).json({
          error: 'Could not create escrow payment. Complete Stripe Connect onboarding in Settings first.',
        });
      }
    }
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

import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { parsePagination } from '../lib/pagination';
import { AuthRequest } from '../types';

const router = Router();

const createBountySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().min(10),
  maxPayout: z.number().min(10),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  modelId: z.string(),
  expiresAt: z.string().datetime().optional(),
});

const updateBountySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  amount: z.number().min(10).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'EXPIRED']).optional(),
});

// List bounties (public)
router.get('/', async (req: AuthRequest, res: Response) => {
  const { status, severity, modelId } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const where: any = {};
  if (status) where.status = status;
  if (severity) where.severity = severity;
  if (modelId) where.modelId = modelId;

  const [bounties, total] = await Promise.all([
    prisma.bounty.findMany({
      where,
      include: {
        model: { select: { name: true } },
        company: { select: { name: true, slug: true } },
        _count: { select: { bugReports: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bounty.count({ where }),
  ]);

  res.json({
    data: bounties,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// Get single bounty
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const bounty = await prisma.bounty.findUnique({
    where: { id: req.params.id },
    include: {
      // Field-level filtering: drop internal ids (companyId, modelId) and the
      // model's apiEndpoint from the public detail view.
      model: {
        select: { id: true, name: true, version: true, category: true, status: true },
      },
      company: { select: { name: true, slug: true, description: true } },
      bugReports: {
        select: { id: true, title: true, status: true, severity: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!bounty) {
    return res.status(404).json({ error: 'Bounty not found' });
  }

  res.json(bounty);
});

// Create bounty (company only)
router.post('/', authenticate, authorize('COMPANY'), validate(createBountySchema), async (req: AuthRequest, res: Response) => {
  const model = await prisma.aIModel.findFirst({
    where: {
      id: req.body.modelId,
      companyId: req.user!.companyId,
    },
  });

  if (!model) {
    return res.status(404).json({ error: 'Model not found' });
  }

  const bounty = await prisma.bounty.create({
    data: {
      ...req.body,
      companyId: req.user!.companyId!,
    },
    include: { model: { select: { name: true } } },
  });

  res.status(201).json(bounty);
});

// Update bounty (company owner only)
router.put('/:id', authenticate, authorize('COMPANY'), validate(updateBountySchema), async (req: AuthRequest, res: Response) => {
  const existing = await prisma.bounty.findFirst({
    where: {
      id: req.params.id,
      companyId: req.user!.companyId,
    },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Bounty not found' });
  }

  const bounty = await prisma.bounty.update({
    where: { id: req.params.id },
    data: req.body,
    include: { model: true },
  });

  res.json(bounty);
});

// Delete bounty (company owner only, only if OPEN and no reports)
router.delete('/:id', authenticate, authorize('COMPANY'), async (req: AuthRequest, res: Response) => {
  const existing = await prisma.bounty.findFirst({
    where: {
      id: req.params.id,
      companyId: req.user!.companyId,
    },
    include: { _count: { select: { bugReports: true } } },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Bounty not found' });
  }

  if (existing.status !== 'OPEN' || existing._count.bugReports > 0) {
    return res.status(400).json({ error: 'Cannot delete bounty with reports or non-open status' });
  }

  await prisma.bounty.delete({ where: { id: req.params.id } });

  res.json({ message: 'Bounty deleted' });
});

export default router;

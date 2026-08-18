import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { parsePagination } from '../lib/pagination';
import { AuthRequest } from '../types';

const router = Router();

const createModelSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().min(1),
  category: z.string().min(1),
  apiEndpoint: z.string().url().optional(),
  documentation: z.string().optional(),
});

const updateModelSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'UNDER_REVIEW']).optional(),
});

// List all models (public)
router.get('/', async (req: AuthRequest, res: Response) => {
  const { category, status } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const where = {
    ...(category && { category: category as string }),
    ...(status && { status: status as string }),
  };

  const [models, total] = await Promise.all([
    prisma.aIModel.findMany({
      where,
      // Field-level filtering: never expose internal ids (companyId) or
      // unpublished documentation on a public listing. apiEndpoint is kept
      // because the sandbox testing feature needs it to run tests.
      select: {
        id: true,
        name: true,
        description: true,
        version: true,
        category: true,
        status: true,
        apiEndpoint: true,
        createdAt: true,
        company: { select: { name: true, slug: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.aIModel.count({ where }),
  ]);

  res.json({
    data: models,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// Get single model (public)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const model = await prisma.aIModel.findUnique({
    where: { id: req.params.id },
    // Field-level filtering: drop internal ids (companyId) and trim bounties
    // to the fields a public visitor needs.
    select: {
      id: true,
      name: true,
      description: true,
      version: true,
      category: true,
      status: true,
      apiEndpoint: true,
      documentation: true,
      createdAt: true,
      company: { select: { name: true, slug: true, description: true } },
      bounties: {
        where: { status: 'OPEN' },
        orderBy: { amount: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          amount: true,
          maxPayout: true,
          severity: true,
          status: true,
          expiresAt: true,
          createdAt: true,
        },
      },
      _count: { select: { bugReports: true } },
    },
  });

  if (!model) {
    return res.status(404).json({ error: 'Model not found' });
  }

  res.json(model);
});

// Create model (company only)
router.post('/', authenticate, authorize('COMPANY'), validate(createModelSchema), async (req: AuthRequest, res: Response) => {
  const model = await prisma.aIModel.create({
    data: {
      ...req.body,
      companyId: req.user!.companyId!,
    },
  });

  res.status(201).json(model);
});

// Update model (company owner only)
router.put('/:id', authenticate, authorize('COMPANY'), validate(updateModelSchema), async (req: AuthRequest, res: Response) => {
  const existing = await prisma.aIModel.findFirst({
    where: {
      id: req.params.id,
      companyId: req.user!.companyId!,
    },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Model not found' });
  }

  const model = await prisma.aIModel.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json(model);
});

// Delete model (company owner only)
router.delete('/:id', authenticate, authorize('COMPANY'), async (req: AuthRequest, res: Response) => {
  const existing = await prisma.aIModel.findFirst({
    where: {
      id: req.params.id,
      companyId: req.user!.companyId!,
    },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Model not found' });
  }

  await prisma.aIModel.delete({ where: { id: req.params.id } });

  res.json({ message: 'Model deleted' });
});

export default router;

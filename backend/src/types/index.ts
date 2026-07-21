import { Request } from 'express';
import { UserRole, BugStatus, BountyStatus, SeverityLevel, ModelStatus, EscrowStatus } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  companyId?: string;
  researcherId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateBugReportInput {
  title: string;
  description: string;
  reproductionSteps: string;
  inputExample?: string;
  outputExample?: string;
  expectedBehavior: string;
  actualBehavior: string;
  severity: SeverityLevel;
  modelId: string;
  bountyId: string;
}

export interface UpdateBugReportInput {
  status?: BugStatus;
  researcherNotes?: string;
  companyNotes?: string;
}

export interface CreateBountyInput {
  title: string;
  description: string;
  amount: number;
  maxPayout: number;
  severity: SeverityLevel;
  modelId: string;
  expiresAt?: string;
}

export interface UpdateBountyInput {
  title?: string;
  description?: string;
  amount?: number;
  status?: BountyStatus;
}

export interface CreateModelInput {
  name: string;
  description: string;
  version: string;
  category: string;
  apiEndpoint?: string;
  documentation?: string;
}

export interface UpdateModelInput {
  name?: string;
  description?: string;
  version?: string;
  status?: ModelStatus;
}

export interface TestSandboxInput {
  modelId: string;
  input: string;
  testType: string;
}

export interface SandboxResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime: number;
  metrics?: Record<string, number>;
}

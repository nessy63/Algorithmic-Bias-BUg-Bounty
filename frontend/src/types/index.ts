export type UserRole = 'COMPANY' | 'RESEARCHER' | 'ADMIN';

export type BugStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'REPRODUCIBLE' | 'NOT_REPRODUCIBLE' | 'ACCEPTED' | 'REJECTED' | 'PAID';

export type BountyStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'EXPIRED';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ModelStatus = 'ACTIVE' | 'PAUSED' | 'UNDER_REVIEW';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: Company;
  researcher?: Researcher;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  verified: boolean;
}

export interface Researcher {
  id: string;
  bio?: string;
  avatarUrl?: string;
  githubUrl?: string;
  reputation: number;
  totalEarnings: number;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  apiEndpoint?: string;
  documentation?: string;
  status: ModelStatus;
  company: { name: string; slug: string };
  bounties?: Bounty[];
  _count?: { bugReports: number };
  createdAt: string;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  amount: number;
  maxPayout: number;
  severity: SeverityLevel;
  status: BountyStatus;
  model: { name: string };
  company: { name: string; slug: string };
  _count?: { bugReports: number };
  createdAt: string;
}

export interface BugReport {
  id: string;
  title: string;
  description: string;
  reproductionSteps: string;
  inputExample?: string;
  outputExample?: string;
  expectedBehavior: string;
  actualBehavior: string;
  severity: SeverityLevel;
  status: BugStatus;
  model: AIModel;
  bounty: { title: string; amount: number };
  researcher: { user: { name: string } };
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SandboxResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime: number;
  metrics?: Record<string, number>;
}

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-1234567890';

describe('Authentication Tests', () => {
  beforeAll(async () => {
    // Clean test data
    await prisma.bugReport.deleteMany();
    await prisma.escrow.deleteMany();
    await prisma.bounty.deleteMany();
    await prisma.aIModel.deleteMany();
    await prisma.user.deleteMany();
    await prisma.researcher.deleteMany();
    await prisma.company.deleteMany();

    // Seed test data
    const passwordHash = await bcrypt.hash('testpassword123', 12);

    const company = await prisma.company.create({
      data: {
        name: 'Test Company',
        slug: 'test-company',
        description: 'Test company for auth tests',
      },
    });

    const researcher = await prisma.researcher.create({
      data: {
        bio: 'Test researcher',
        reputation: 100,
        totalEarnings: 500,
      },
    });

    await prisma.user.create({
      data: {
        email: 'company@test.com',
        passwordHash,
        name: 'Test Company User',
        role: 'COMPANY',
        companyId: company.id,
      },
    });

    await prisma.user.create({
      data: {
        email: 'researcher@test.com',
        passwordHash,
        name: 'Test Researcher',
        role: 'RESEARCHER',
        researcherId: researcher.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new company user', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newcompany@test.com',
          password: 'password123',
          name: 'New Company',
          role: 'COMPANY',
          companyName: 'New Test Company',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('newcompany@test.com');
      expect(data.user.role).toBe('COMPANY');
      // The session token must NOT be returned in the body — only the
      // httpOnly cookie carries it.
      expect(data.token).toBeUndefined();
    });

    it('should register a new researcher', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newresearcher@test.com',
          password: 'password123',
          name: 'New Researcher',
          role: 'RESEARCHER',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('newresearcher@test.com');
      expect(data.user.role).toBe('RESEARCHER');
      expect(data.token).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'company@test.com',
          password: 'password123',
          name: 'Duplicate',
          role: 'COMPANY',
          companyName: 'Duplicate Company',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already registered');
    });

    it('should reject invalid email format', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test',
          role: 'COMPANY',
          companyName: 'Test',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject short password', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: '123',
          name: 'Test',
          role: 'COMPANY',
          companyName: 'Test',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login company user', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'company@test.com',
          password: 'testpassword123',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('company@test.com');
      expect(data.user.role).toBe('COMPANY');
      expect(data.token).toBeUndefined();

      // Session token is delivered via the httpOnly cookie, never the body.
      const setCookie = response.headers.get('set-cookie') || '';
      const match = setCookie.match(/token=([^;]+)/);
      expect(match).not.toBeNull();

      // Verify JWT token
      const decoded = jwt.verify(match![1], JWT_SECRET) as any;
      expect(decoded.email).toBe('company@test.com');
      expect(decoded.role).toBe('COMPANY');
    });

    it('should login researcher', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'researcher@test.com',
          password: 'testpassword123',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('researcher@test.com');
      expect(data.user.role).toBe('RESEARCHER');
      expect(data.token).toBeUndefined();
    });

    it('should reject wrong password', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'company@test.com',
          password: 'wrongpassword',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid credentials');
    });

    it('should reject non-existent email', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'password123',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'company@test.com',
          password: 'testpassword123',
        }),
      });
      await response.json();
      // Extract the session token from the httpOnly cookie (it is never
      // returned in the response body).
      const setCookie = response.headers.get('set-cookie') || '';
      const match = setCookie.match(/token=([^;]+)/);
      authToken = match ? match[1] : '';
    });

    it('should return current user with valid token', async () => {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe('company@test.com');
      expect(data.role).toBe('COMPANY');
    });

    it('should reject request without token', async () => {
      const response = await fetch(`${API_URL}/api/auth/me`);

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
    });
  });
});

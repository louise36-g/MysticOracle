/**
 * Health Routes Tests
 * Tests for GET /, POST /bootstrap, GET /admin-status
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock auth middleware
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn((_req: any, _res: any, next: any) => {
    _req.auth = { userId: 'test-user-123', sessionId: 'test-session' };
    next();
  }),
}));

// Mock prisma
vi.mock('../../db/prisma.js', () => ({
  default: {
    $queryRaw: vi.fn(),
    user: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import healthRouter from '../../routes/health.js';
import prisma from '../../db/prisma.js';

const mockedPrisma = prisma as unknown as {
  $queryRaw: Mock;
  user: {
    update: Mock;
    findUnique: Mock;
  };
};

describe('Health Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', healthRouter);
  });

  // ============================================
  // GET / — Health check
  // ============================================
  describe('GET /', () => {
    it('should return 200 healthy when DB is connected', async () => {
      mockedPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.services.database).toBe('connected');
      expect(res.body.services.api).toBe('running');
    });

    it('should include a timestamp in ISO format', async () => {
      mockedPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const res = await request(app).get('/');

      expect(res.body.timestamp).toBeDefined();
      expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
    });

    it('should return 503 unhealthy when DB fails', async () => {
      mockedPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const res = await request(app).get('/');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('unhealthy');
      expect(res.body.services.database).toBe('disconnected');
      expect(res.body.services.api).toBe('running');
      expect(res.body.error).toBe('Connection refused');
    });

    it('should return response shape with all required fields', async () => {
      mockedPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const res = await request(app).get('/');

      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('services');
      expect(res.body.services).toHaveProperty('database');
      expect(res.body.services).toHaveProperty('api');
    });
  });

  // ============================================
  // POST /bootstrap
  // ============================================
  describe('POST /bootstrap', () => {
    it('should return 403 when ADMIN_BOOTSTRAP_KEY env var is not set', async () => {
      delete process.env.ADMIN_BOOTSTRAP_KEY;

      const res = await request(app).post('/bootstrap').send({ key: 'some-key' });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/bootstrap not configured/i);
    });

    it('should return 403 when key does not match', async () => {
      process.env.ADMIN_BOOTSTRAP_KEY = 'correct-key';

      const res = await request(app).post('/bootstrap').send({ key: 'wrong-key' });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/invalid bootstrap key/i);
    });

    it('should return 200 and grant admin when key matches', async () => {
      process.env.ADMIN_BOOTSTRAP_KEY = 'secret-key';
      mockedPrisma.user.update.mockResolvedValue({
        id: 'test-user-123',
        username: 'testuser',
        email: 'test@example.com',
        isAdmin: true,
      });

      const res = await request(app).post('/bootstrap').send({ key: 'secret-key' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.isAdmin).toBe(true);
      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-123' },
        data: { isAdmin: true },
        select: { id: true, username: true, email: true, isAdmin: true },
      });
    });

    it('should return 500 when DB update fails', async () => {
      process.env.ADMIN_BOOTSTRAP_KEY = 'secret-key';
      mockedPrisma.user.update.mockRejectedValue(new Error('DB error'));

      const res = await request(app).post('/bootstrap').send({ key: 'secret-key' });

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/bootstrap failed/i);
    });

    afterEach(() => {
      delete process.env.ADMIN_BOOTSTRAP_KEY;
    });
  });

  // ============================================
  // GET /admin-status
  // ============================================
  describe('GET /admin-status', () => {
    it('should return 200 with user data when found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-123',
        username: 'testuser',
        email: 'test@example.com',
        isAdmin: true,
      });

      const res = await request(app).get('/admin-status');

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual({
        id: 'test-user-123',
        username: 'testuser',
        email: 'test@example.com',
        isAdmin: true,
      });
    });

    it('should return 404 when user not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/admin-status');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/user not found/i);
    });

    it('should return 500 when DB query fails', async () => {
      mockedPrisma.user.findUnique.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/admin-status');

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/failed to check admin status/i);
    });
  });
});

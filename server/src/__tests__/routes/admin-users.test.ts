/**
 * Admin User Management Routes Tests
 * Tests for GET /, GET /:userId, PATCH /:userId/status,
 * POST /:userId/credits, PATCH /:userId/admin, DELETE /:userId
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock fs before shared.ts side-effect
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

// Mock Prisma
vi.mock('../../db/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock shared admin services pulled in via shared.ts
vi.mock('../../services/cache.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    flushPattern: vi.fn(),
  },
}));

vi.mock('../../services/aiSettings.js', () => ({
  clearAISettingsCache: vi.fn(),
}));

vi.mock('../../services/CreditService.js', () => ({
  creditService: { addCredits: vi.fn() },
}));

// Mock auth middleware (referenced via shared.ts re-export but not applied in users.ts)
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn((_req: any, _res: any, next: any) => next()),
  requireAdmin: vi.fn((_req: any, _res: any, next: any) => next()),
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  debug: { log: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock @clerk/backend for the DELETE route
vi.mock('@clerk/backend', () => ({
  createClerkClient: vi.fn(() => ({
    users: {
      deleteUser: vi.fn(),
    },
  })),
}));

// Imports after mocks
import usersRouter from '../../routes/admin/users.js';
import prisma from '../../db/prisma.js';
import { createClerkClient } from '@clerk/backend';

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: Mock;
    delete: Mock;
  };
};

const mockedCreateClerkClient = createClerkClient as Mock;

// ============================================
// Test data helpers
// ============================================

const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-abc-123',
  email: 'user@example.com',
  username: 'testuser',
  credits: 10,
  isAdmin: false,
  status: 'ACTIVE',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

// ============================================
// DI container mock registry
// ============================================

const mockListUsersUseCase = { execute: vi.fn() };
const mockGetUserUseCase = { execute: vi.fn() };
const mockUpdateUserStatusUseCase = { execute: vi.fn() };
const mockAdjustUserCreditsUseCase = { execute: vi.fn() };
const mockToggleUserAdminUseCase = { execute: vi.fn() };

const containerRegistry: Record<string, unknown> = {
  listUsersUseCase: mockListUsersUseCase,
  getUserUseCase: mockGetUserUseCase,
  updateUserStatusUseCase: mockUpdateUserStatusUseCase,
  adjustUserCreditsUseCase: mockAdjustUserCreditsUseCase,
  toggleUserAdminUseCase: mockToggleUserAdminUseCase,
};

// ============================================
// App setup
// ============================================

describe('Admin User Management Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());

    // Simulate auth + admin middleware setting req.auth
    app.use((req: any, _res: any, next: any) => {
      req.auth = { userId: 'test-admin-123', sessionId: 'test-session' };
      next();
    });

    // Inject DI container
    app.use((req: any, _res: any, next: any) => {
      req.container = {
        resolve: (name: string) => containerRegistry[name],
      };
      next();
    });

    app.use('/', usersRouter);

    // CRITICAL: Error handler MUST be registered AFTER routes
    app.use((err: any, _req: any, res: any, _next: any) => {
      const status = err.statusCode || (err.name === 'ZodError' ? 400 : 500);
      const body =
        err.name === 'ZodError'
          ? { error: 'Validation failed', details: err.errors }
          : { error: err.message || 'Internal server error' };
      res.status(status).json(body);
    });
  });

  // ============================================
  // GET / — List users
  // ============================================

  describe('GET /', () => {
    it('should return paginated users with default params', async () => {
      const mockResult = {
        users: [createMockUser()],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      mockListUsersUseCase.execute.mockResolvedValue(mockResult);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.pagination).toEqual(mockResult.pagination);
      expect(mockListUsersUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });

    it('should pass search param to the use case', async () => {
      mockListUsersUseCase.execute.mockResolvedValue({ users: [], pagination: {} });

      await request(app).get('/?search=alice');

      expect(mockListUsersUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'alice' })
      );
    });

    it('should pass status filter to the use case', async () => {
      mockListUsersUseCase.execute.mockResolvedValue({ users: [], pagination: {} });

      await request(app).get('/?status=FLAGGED');

      expect(mockListUsersUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FLAGGED' })
      );
    });

    it('should pass sortBy and sortOrder to the use case', async () => {
      mockListUsersUseCase.execute.mockResolvedValue({ users: [], pagination: {} });

      await request(app).get('/?sortBy=credits&sortOrder=asc');

      expect(mockListUsersUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'credits', sortOrder: 'asc' })
      );
    });

    it('should return 400 when status param is invalid', async () => {
      const res = await request(app).get('/?status=BANNED');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 when sortBy param is invalid', async () => {
      const res = await request(app).get('/?sortBy=nonexistentField');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 500 on use case throw', async () => {
      mockListUsersUseCase.execute.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });

  // ============================================
  // GET /:userId — Get single user
  // ============================================

  describe('GET /:userId', () => {
    it('should return user details on success', async () => {
      const mockUser = createMockUser();
      mockGetUserUseCase.execute.mockResolvedValue({ success: true, user: mockUser });

      const res = await request(app).get('/user-abc-123');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('user-abc-123');
      expect(res.body.email).toBe('user@example.com');
      expect(mockGetUserUseCase.execute).toHaveBeenCalledWith({ userId: 'user-abc-123' });
    });

    it('should return 404 when use case reports not found', async () => {
      mockGetUserUseCase.execute.mockResolvedValue({ success: false });

      const res = await request(app).get('/nonexistent-user');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 500 on use case throw', async () => {
      mockGetUserUseCase.execute.mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app).get('/user-abc-123');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB connection lost');
    });
  });

  // ============================================
  // PATCH /:userId/status — Update user status
  // ============================================

  describe('PATCH /:userId/status', () => {
    it('should update status successfully', async () => {
      const updatedUser = createMockUser({ status: 'SUSPENDED' });
      mockUpdateUserStatusUseCase.execute.mockResolvedValue({
        success: true,
        user: updatedUser,
      });

      const res = await request(app).patch('/user-abc-123/status').send({ status: 'SUSPENDED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.status).toBe('SUSPENDED');
      expect(mockUpdateUserStatusUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-abc-123',
        status: 'SUSPENDED',
      });
    });

    it('should accept all valid status values', async () => {
      for (const status of ['ACTIVE', 'FLAGGED', 'SUSPENDED']) {
        mockUpdateUserStatusUseCase.execute.mockResolvedValue({
          success: true,
          user: createMockUser({ status }),
        });

        const res = await request(app).patch('/user-abc-123/status').send({ status });

        expect(res.status).toBe(200);
      }
    });

    it('should return 400 when use case reports failure', async () => {
      mockUpdateUserStatusUseCase.execute.mockResolvedValue({
        success: false,
        error: 'User is locked',
      });

      const res = await request(app).patch('/user-abc-123/status').send({ status: 'ACTIVE' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('User is locked');
    });

    it('should return 400 for an invalid status value', async () => {
      const res = await request(app).patch('/user-abc-123/status').send({ status: 'DELETED' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 when status field is missing', async () => {
      const res = await request(app).patch('/user-abc-123/status').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 500 on use case throw', async () => {
      mockUpdateUserStatusUseCase.execute.mockRejectedValue(new Error('Unexpected error'));

      const res = await request(app).patch('/user-abc-123/status').send({ status: 'ACTIVE' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Unexpected error');
    });
  });

  // ============================================
  // POST /:userId/credits — Adjust user credits
  // ============================================

  describe('POST /:userId/credits', () => {
    it('should adjust credits successfully and return new balance', async () => {
      mockAdjustUserCreditsUseCase.execute.mockResolvedValue({
        success: true,
        newBalance: 25,
      });

      const res = await request(app)
        .post('/user-abc-123/credits')
        .send({ amount: 15, reason: 'Admin bonus' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.newBalance).toBe(25);
      expect(mockAdjustUserCreditsUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-abc-123',
        amount: 15,
        reason: 'Admin bonus',
        adminUserId: 'test-admin-123',
      });
    });

    it('should accept negative amounts for credit deduction', async () => {
      mockAdjustUserCreditsUseCase.execute.mockResolvedValue({
        success: true,
        newBalance: 0,
      });

      const res = await request(app)
        .post('/user-abc-123/credits')
        .send({ amount: -10, reason: 'Penalty' });

      expect(res.status).toBe(200);
      expect(mockAdjustUserCreditsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ amount: -10 })
      );
    });

    it('should pass the calling admin userId to the use case', async () => {
      mockAdjustUserCreditsUseCase.execute.mockResolvedValue({
        success: true,
        newBalance: 5,
      });

      await request(app).post('/user-abc-123/credits').send({ amount: 5, reason: 'Test' });

      expect(mockAdjustUserCreditsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ adminUserId: 'test-admin-123' })
      );
    });

    it('should return 400 when use case reports failure', async () => {
      mockAdjustUserCreditsUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Credit limit exceeded',
      });

      const res = await request(app)
        .post('/user-abc-123/credits')
        .send({ amount: 99999, reason: 'Too many credits' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Credit limit exceeded');
    });

    it('should return 400 when amount is missing', async () => {
      const res = await request(app)
        .post('/user-abc-123/credits')
        .send({ reason: 'Missing amount' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 when reason is missing', async () => {
      const res = await request(app).post('/user-abc-123/credits').send({ amount: 10 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 when reason is an empty string', async () => {
      const res = await request(app).post('/user-abc-123/credits').send({ amount: 10, reason: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 when amount is a float', async () => {
      const res = await request(app)
        .post('/user-abc-123/credits')
        .send({ amount: 1.5, reason: 'Float not allowed' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 500 on use case throw', async () => {
      mockAdjustUserCreditsUseCase.execute.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/user-abc-123/credits')
        .send({ amount: 10, reason: 'Test' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });

  // ============================================
  // PATCH /:userId/admin — Toggle admin status
  // ============================================

  describe('PATCH /:userId/admin', () => {
    it('should toggle admin status on for a non-admin user', async () => {
      const existingUser = createMockUser({ isAdmin: false });
      mockedPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockToggleUserAdminUseCase.execute.mockResolvedValue({
        success: true,
        user: { ...existingUser, isAdmin: true },
      });

      const res = await request(app).patch('/user-abc-123/admin');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isAdmin).toBe(true);
      expect(mockToggleUserAdminUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-abc-123',
        isAdmin: true, // toggled from false → true
      });
    });

    it('should toggle admin status off for a current admin user', async () => {
      const existingUser = createMockUser({ isAdmin: true });
      mockedPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockToggleUserAdminUseCase.execute.mockResolvedValue({
        success: true,
        user: { ...existingUser, isAdmin: false },
      });

      const res = await request(app).patch('/user-abc-123/admin');

      expect(res.status).toBe(200);
      expect(res.body.isAdmin).toBe(false);
      expect(mockToggleUserAdminUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-abc-123',
        isAdmin: false, // toggled from true → false
      });
    });

    it('should return 400 when the admin tries to toggle their own status', async () => {
      // The requesting admin's userId is 'test-admin-123' — same as the target
      const res = await request(app).patch('/test-admin-123/admin');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cannot change your own admin status');
      // Prisma and use case should not be called
      expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockToggleUserAdminUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return 404 when target user does not exist', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).patch('/nonexistent-user/admin');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
      expect(mockToggleUserAdminUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return 400 when use case reports failure', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(createMockUser());
      mockToggleUserAdminUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Last admin cannot be demoted',
      });

      const res = await request(app).patch('/user-abc-123/admin');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Last admin cannot be demoted');
    });

    it('should return 500 on use case throw', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(createMockUser());
      mockToggleUserAdminUseCase.execute.mockRejectedValue(new Error('DB error'));

      const res = await request(app).patch('/user-abc-123/admin');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });

    it('should return 500 on prisma throw', async () => {
      mockedPrisma.user.findUnique.mockRejectedValue(new Error('Connection failed'));

      const res = await request(app).patch('/user-abc-123/admin');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Connection failed');
    });
  });

  // ============================================
  // DELETE /:userId — Delete user permanently
  // ============================================

  describe('DELETE /:userId', () => {
    it('should delete user from Clerk and database on success', async () => {
      const mockDeleteUser = vi.fn().mockResolvedValue(undefined);
      mockedCreateClerkClient.mockReturnValue({ users: { deleteUser: mockDeleteUser } });
      mockedPrisma.user.findUnique.mockResolvedValue(createMockUser());
      mockedPrisma.user.delete.mockResolvedValue(createMockUser());

      const res = await request(app).delete('/user-abc-123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User deleted successfully');
      expect(mockDeleteUser).toHaveBeenCalledWith('user-abc-123');
      expect(mockedPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-abc-123' } });
    });

    it('should still delete from database even when Clerk deletion throws', async () => {
      const mockDeleteUser = vi.fn().mockRejectedValue(new Error('Clerk API unavailable'));
      mockedCreateClerkClient.mockReturnValue({ users: { deleteUser: mockDeleteUser } });
      mockedPrisma.user.findUnique.mockResolvedValue(createMockUser());
      mockedPrisma.user.delete.mockResolvedValue(createMockUser());

      const res = await request(app).delete('/user-abc-123');

      // Clerk failure is swallowed — DB deletion must still succeed
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockedPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-abc-123' } });
    });

    it('should return 400 when the admin tries to delete their own account', async () => {
      const res = await request(app).delete('/test-admin-123');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cannot delete your own account');
      expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockedPrisma.user.delete).not.toHaveBeenCalled();
    });

    it('should return 404 when target user does not exist', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).delete('/nonexistent-user');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
      expect(mockedPrisma.user.delete).not.toHaveBeenCalled();
    });

    it('should return 500 when database delete throws', async () => {
      const mockDeleteUser = vi.fn().mockResolvedValue(undefined);
      mockedCreateClerkClient.mockReturnValue({ users: { deleteUser: mockDeleteUser } });
      mockedPrisma.user.findUnique.mockResolvedValue(createMockUser());
      mockedPrisma.user.delete.mockRejectedValue(new Error('DB constraint violation'));

      const res = await request(app).delete('/user-abc-123');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB constraint violation');
    });

    it('should return 500 when the findUnique lookup throws', async () => {
      mockedPrisma.user.findUnique.mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app).delete('/user-abc-123');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB connection lost');
    });

    it('should look up user by the route param id, not the admin id', async () => {
      const mockDeleteUser = vi.fn().mockResolvedValue(undefined);
      mockedCreateClerkClient.mockReturnValue({ users: { deleteUser: mockDeleteUser } });
      mockedPrisma.user.findUnique.mockResolvedValue(createMockUser({ id: 'target-user-999' }));
      mockedPrisma.user.delete.mockResolvedValue(createMockUser());

      await request(app).delete('/target-user-999');

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'target-user-999' },
      });
    });
  });
});

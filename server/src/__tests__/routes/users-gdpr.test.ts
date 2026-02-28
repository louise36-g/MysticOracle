/**
 * Users GDPR Routes Tests
 * Tests for GET /me/export, DELETE /me, POST /withdrawal-request
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
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
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock CreditService
vi.mock('../../services/CreditService.js', () => ({
  creditService: { addCredits: vi.fn() },
  CREDIT_COSTS: { DAILY_BONUS_BASE: 2, WEEKLY_STREAK_BONUS: 5 },
}));

// Mock AchievementService
vi.mock('../../services/AchievementService.js', () => ({
  AchievementService: class {
    checkAndUnlockAchievements = vi.fn();
  },
}));

// Mock ApplicationErrors
vi.mock('../../shared/errors/ApplicationError.js', async () => {
  const actual = await vi.importActual('../../shared/errors/ApplicationError.js');
  return actual;
});

vi.mock('../../middleware/validateQuery.js', () => ({
  validateQuery: vi.fn(() => (_req: any, _res: any, next: any) => next()),
  paginationQuerySchema: {},
}));

vi.mock('../../shared/pagination/pagination.js', () => ({
  parsePaginationParams: vi.fn(),
  createPaginatedResponse: vi.fn(),
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  debug: { log: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock email
vi.mock('../../services/email.js', () => ({
  sendEmail: vi.fn(),
}));

import gdprRouter from '../../routes/users/gdpr.js';
import prisma from '../../db/prisma.js';
import { sendEmail } from '../../services/email.js';

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: Mock;
  };
};

const mockSendEmail = sendEmail as Mock;

// DI container mocks
const mockExportUserDataUseCase = { execute: vi.fn() };
const mockDeleteUserAccountUseCase = { execute: vi.fn() };
const mockAuditService = { log: vi.fn() };

const containerRegistry: Record<string, unknown> = {
  exportUserDataUseCase: mockExportUserDataUseCase,
  deleteUserAccountUseCase: mockDeleteUserAccountUseCase,
  auditService: mockAuditService,
};

describe('Users GDPR Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req: any, _res: any, next: any) => {
      req.container = {
        resolve: (name: string) => containerRegistry[name],
      };
      next();
    });
    app.use('/', gdprRouter);

    mockAuditService.log.mockResolvedValue(undefined);
  });

  // ============================================
  // GET /me/export — Data export
  // ============================================
  describe('GET /me/export', () => {
    it('should return 200 with JSON data and Content-Disposition header', async () => {
      const exportData = {
        profile: { id: 'test-user-123', email: 'test@example.com' },
        readings: [],
        transactions: [],
      };
      mockExportUserDataUseCase.execute.mockResolvedValue({
        success: true,
        data: exportData,
      });

      const res = await request(app).get('/me/export');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(exportData);
      expect(res.headers['content-disposition']).toMatch(
        /attachment; filename="celestiarcana-data-/
      );
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('should log the export for audit trail', async () => {
      mockExportUserDataUseCase.execute.mockResolvedValue({
        success: true,
        data: { profile: {} },
      });

      await request(app).get('/me/export');

      expect(mockAuditService.log).toHaveBeenCalledWith(
        'USER_DATA_EXPORT',
        'User',
        'test-user-123',
        expect.objectContaining({
          userId: 'test-user-123',
        })
      );
    });

    it('should return 404 when user not found', async () => {
      mockExportUserDataUseCase.execute.mockResolvedValue({
        success: false,
        error: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      });

      const res = await request(app).get('/me/export');

      expect(res.status).toBe(404);
    });

    it('should return 500 on use case error', async () => {
      mockExportUserDataUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Internal error',
        errorCode: 'INTERNAL_ERROR',
      });

      const res = await request(app).get('/me/export');

      expect(res.status).toBe(500);
    });

    it('should return 500 on unexpected throw', async () => {
      mockExportUserDataUseCase.execute.mockRejectedValue(new Error('boom'));

      const res = await request(app).get('/me/export');

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/failed to export/i);
    });
  });

  // ============================================
  // DELETE /me — Account deletion
  // ============================================
  describe('DELETE /me', () => {
    it('should return 400 when confirmEmail is missing', async () => {
      const res = await request(app).delete('/me').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email confirmation required/i);
    });

    it('should return 400 when confirmEmail is not a string', async () => {
      const res = await request(app).delete('/me').send({ confirmEmail: 123 });

      expect(res.status).toBe(400);
    });

    it('should log deletion request before executing', async () => {
      mockDeleteUserAccountUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Account deleted',
      });

      await request(app).delete('/me').send({ confirmEmail: 'test@example.com' });

      // First call should be ACCOUNT_DELETION_REQUESTED
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'ACCOUNT_DELETION_REQUESTED',
        'User',
        'test-user-123',
        expect.objectContaining({ userId: 'test-user-123' })
      );
    });

    it('should return 200 on successful deletion', async () => {
      mockDeleteUserAccountUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Account deleted successfully',
      });

      const res = await request(app).delete('/me').send({ confirmEmail: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Account deleted successfully');
    });

    it('should log ACCOUNT_DELETED after successful deletion', async () => {
      mockDeleteUserAccountUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Account deleted',
      });

      await request(app).delete('/me').send({ confirmEmail: 'test@example.com' });

      expect(mockAuditService.log).toHaveBeenCalledWith(
        'ACCOUNT_DELETED',
        'User',
        'test-user-123',
        expect.objectContaining({ userId: 'test-user-123' })
      );
    });

    it('should return 404 when user not found', async () => {
      mockDeleteUserAccountUseCase.execute.mockResolvedValue({
        success: false,
        error: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      });

      const res = await request(app).delete('/me').send({ confirmEmail: 'test@example.com' });

      expect(res.status).toBe(404);
    });

    it('should return 400 when email does not match', async () => {
      mockDeleteUserAccountUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Email does not match',
        errorCode: 'EMAIL_MISMATCH',
      });

      const res = await request(app).delete('/me').send({ confirmEmail: 'wrong@example.com' });

      expect(res.status).toBe(400);
    });

    it('should return 403 when admin is protected', async () => {
      mockDeleteUserAccountUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Admin accounts cannot be deleted',
        errorCode: 'ADMIN_PROTECTED',
      });

      const res = await request(app).delete('/me').send({ confirmEmail: 'admin@example.com' });

      expect(res.status).toBe(403);
    });

    it('should return 500 on unexpected throw', async () => {
      mockDeleteUserAccountUseCase.execute.mockRejectedValue(new Error('boom'));

      const res = await request(app).delete('/me').send({ confirmEmail: 'test@example.com' });

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/failed to delete/i);
    });
  });

  // ============================================
  // POST /withdrawal-request
  // ============================================
  describe('POST /withdrawal-request', () => {
    const validRequest = {
      email: 'user@example.com',
      orderReference: 'TXN-12345',
      purchaseDate: '2026-01-10',
    };

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/withdrawal-request')
        .send({ ...validRequest, email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/validation failed/i);
    });

    it('should return 400 when orderReference is missing', async () => {
      const { orderReference, ...body } = validRequest;
      const res = await request(app).post('/withdrawal-request').send(body);

      expect(res.status).toBe(400);
    });

    it('should return 400 when purchaseDate is missing', async () => {
      const { purchaseDate, ...body } = validRequest;
      const res = await request(app).post('/withdrawal-request').send(body);

      expect(res.status).toBe(400);
    });

    it('should return 200 with requestId on success', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        email: 'user@example.com',
        username: 'testuser',
      });
      mockSendEmail.mockResolvedValue(true);

      const res = await request(app).post('/withdrawal-request').send(validRequest);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.requestId).toMatch(/^WR-/);
    });

    it('should send notification email to admin', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        email: 'user@example.com',
        username: 'testuser',
      });
      mockSendEmail.mockResolvedValue(true);

      await request(app).post('/withdrawal-request').send(validRequest);

      // First call: admin notification
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'contact@celestiarcana.com',
          subject: expect.stringContaining('Withdrawal Request'),
        })
      );
    });

    it('should send confirmation email to user', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        email: 'user@example.com',
        username: 'testuser',
      });
      mockSendEmail.mockResolvedValue(true);

      await request(app).post('/withdrawal-request').send(validRequest);

      // Second call: user confirmation
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Withdrawal Request Received'),
        })
      );
    });

    it('should still succeed if notification email fails', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        email: 'user@example.com',
        username: 'testuser',
      });
      // First call (admin notification) throws, second (confirmation) succeeds
      mockSendEmail.mockRejectedValueOnce(new Error('SMTP down')).mockResolvedValueOnce(true);

      const res = await request(app).post('/withdrawal-request').send(validRequest);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should still succeed if confirmation email fails', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        email: 'user@example.com',
        username: 'testuser',
      });
      mockSendEmail.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('SMTP down'));

      const res = await request(app).post('/withdrawal-request').send(validRequest);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 when user not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).post('/withdrawal-request').send(validRequest);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/user not found/i);
    });

    it('should accept optional reason field', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        email: 'user@example.com',
        username: 'testuser',
      });
      mockSendEmail.mockResolvedValue(true);

      const res = await request(app)
        .post('/withdrawal-request')
        .send({ ...validRequest, reason: 'Changed my mind' });

      expect(res.status).toBe(200);
    });

    it('should return 500 on unexpected throw', async () => {
      mockedPrisma.user.findUnique.mockRejectedValue(new Error('DB error'));

      const res = await request(app).post('/withdrawal-request').send(validRequest);

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/failed to submit/i);
    });
  });
});

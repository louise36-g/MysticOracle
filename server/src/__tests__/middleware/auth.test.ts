/**
 * Auth Middleware Tests
 * Tests for requireAuth, optionalAuth, and requireAdmin middleware
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth, optionalAuth, requireAdmin } from '../../middleware/auth.js';

// Mock @clerk/backend
vi.mock('@clerk/backend', () => ({
  createClerkClient: vi.fn(() => ({})),
  verifyToken: vi.fn(),
}));

// Mock prisma
vi.mock('../../db/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { verifyToken } from '@clerk/backend';
import prisma from '../../db/prisma.js';

const mockVerifyToken = verifyToken as Mock;
const mockFindUnique = prisma.user.findUnique as Mock;

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('requireAuth', () => {
    it('should return 401 when authorization header is missing', async () => {
      mockReq.headers = {};

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing authorization header' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', async () => {
      mockReq.headers = { authorization: 'Basic token123' };

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing authorization header' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token verification fails', async () => {
      mockReq.headers = { authorization: 'Bearer invalid_token' };
      mockVerifyToken.mockResolvedValue(null);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token payload has no sub', async () => {
      mockReq.headers = { authorization: 'Bearer valid_token' };
      mockVerifyToken.mockResolvedValue({ iat: 123456 }); // No sub field

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when verifyToken throws an error', async () => {
      mockReq.headers = { authorization: 'Bearer error_token' };
      mockVerifyToken.mockRejectedValue(new Error('Token expired'));

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach auth info and call next on valid token', async () => {
      mockReq.headers = { authorization: 'Bearer valid_token' };
      mockVerifyToken.mockResolvedValue({ sub: 'user_123', sid: 'session_456' });

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.auth).toEqual({
        userId: 'user_123',
        sessionId: 'session_456',
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle missing session ID gracefully', async () => {
      mockReq.headers = { authorization: 'Bearer valid_token' };
      mockVerifyToken.mockResolvedValue({ sub: 'user_123' }); // No sid

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.auth).toEqual({
        userId: 'user_123',
        sessionId: '',
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should call next without auth when no authorization header', async () => {
      mockReq.headers = {};

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.auth).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next without auth when header is not Bearer', async () => {
      mockReq.headers = { authorization: 'Basic token123' };

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.auth).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should attach auth info when valid token provided', async () => {
      mockReq.headers = { authorization: 'Bearer valid_token' };
      mockVerifyToken.mockResolvedValue({ sub: 'user_123', sid: 'session_456' });

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.auth).toEqual({
        userId: 'user_123',
        sessionId: 'session_456',
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without auth when token verification fails', async () => {
      mockReq.headers = { authorization: 'Bearer invalid_token' };
      mockVerifyToken.mockResolvedValue(null);

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.auth).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without auth when verifyToken throws', async () => {
      mockReq.headers = { authorization: 'Bearer error_token' };
      mockVerifyToken.mockRejectedValue(new Error('Token error'));

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.auth).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    beforeEach(() => {
      // Set up auth info as if requireAuth already ran
      mockReq.auth = { userId: 'user_123', sessionId: 'session_456' };
    });

    it('should return 401 when req.auth is not set', async () => {
      mockReq.auth = undefined;

      await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when req.auth.userId is missing', async () => {
      mockReq.auth = { userId: '', sessionId: 'session_456' };

      await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    it('should return 403 when user is not found in database', async () => {
      mockFindUnique.mockResolvedValue(null);

      await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        select: { isAdmin: true },
      });
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not an admin', async () => {
      mockFindUnique.mockResolvedValue({ isAdmin: false });

      await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next when user is an admin', async () => {
      mockFindUnique.mockResolvedValue({ isAdmin: true });

      await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 when database query throws', async () => {
      mockFindUnique.mockRejectedValue(new Error('Database error'));

      await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Admin verification failed',
        details: 'Database error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

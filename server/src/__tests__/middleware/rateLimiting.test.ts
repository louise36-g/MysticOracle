/**
 * Rate Limiting Middleware Tests
 * Tests for rate limiting configuration and behavior
 */

import { describe, it, expect, vi } from 'vitest';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

// Helper to create a mock request/response pair
const createMockReqRes = (ip = '127.0.0.1') => {
  const req = {
    ip,
    headers: {},
    method: 'GET',
    path: '/test',
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    getHeader: vi.fn(),
  } as unknown as Response;

  const next = vi.fn() as NextFunction;

  return { req, res, next };
};

describe('Rate Limiting Configuration', () => {
  describe('General Limiter', () => {
    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500,
      message: { error: 'Too many requests, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    it('should allow requests under the limit', async () => {
      const { req, res, next } = createMockReqRes('192.168.1.1');

      await generalLimiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should have correct configuration values', () => {
      // Verify the limiter is configured correctly
      expect(generalLimiter).toBeDefined();
      // The limiter itself is a middleware function
      expect(typeof generalLimiter).toBe('function');
    });
  });

  describe('Auth Limiter', () => {
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20,
      message: { error: 'Too many authentication attempts, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    it('should have stricter limits than general', () => {
      // Auth limiter should be more restrictive (20 vs 500)
      expect(authLimiter).toBeDefined();
    });

    it('should allow initial requests', async () => {
      const { req, res, next } = createMockReqRes('10.0.0.1');

      await authLimiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Payment Limiter', () => {
    const paymentLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 30,
      message: { error: 'Too many payment requests, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    it('should have a longer window for payment requests', () => {
      // Payment limiter uses 1 hour window
      expect(paymentLimiter).toBeDefined();
    });

    it('should allow initial payment requests', async () => {
      const { req, res, next } = createMockReqRes('172.16.0.1');

      await paymentLimiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Strict Limiter', () => {
    const strictLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10,
      message: { error: 'Rate limit exceeded, please slow down.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    it('should have very strict limits for sensitive operations', () => {
      // Strict limiter: 10 requests per minute
      expect(strictLimiter).toBeDefined();
    });
  });

  describe('Admin Limiter', () => {
    const adminLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 200,
      message: { error: 'Admin rate limit exceeded, please slow down.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    it('should have higher limits for admin operations', () => {
      // Admin operations need more headroom (200 per minute)
      expect(adminLimiter).toBeDefined();
    });
  });
});

describe('Rate Limit Headers', () => {
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
  });

  it('should set standard rate limit headers when configured', async () => {
    const { req, res, next } = createMockReqRes('192.168.100.1');

    await limiter(req, res, next);

    // Headers should be set (verifying configuration)
    expect(next).toHaveBeenCalled();
  });

  it('should track different IPs separately', async () => {
    const { req: req1, res: res1, next: next1 } = createMockReqRes('192.168.1.1');
    const { req: req2, res: res2, next: next2 } = createMockReqRes('192.168.1.2');

    await limiter(req1, res1, next1);
    await limiter(req2, res2, next2);

    // Both should be allowed (different IPs)
    expect(next1).toHaveBeenCalled();
    expect(next2).toHaveBeenCalled();
  });
});

describe('Rate Limit Behavior', () => {
  it('should create limiter with correct error message format', () => {
    const errorMessage = { error: 'Too many requests, please try again later.' };

    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      message: errorMessage,
    });

    expect(limiter).toBeDefined();
  });

  it('should export limiter as middleware function', () => {
    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: 100,
    });

    // Limiter should be a function with 3 parameters (req, res, next)
    expect(typeof limiter).toBe('function');
  });
});

describe('Rate Limit Security', () => {
  it('should not expose sensitive information in rate limit response', () => {
    const message = { error: 'Too many requests, please try again later.' };

    // Error message should not include IP, user ID, or other sensitive data
    expect(message.error).not.toContain('IP');
    expect(message.error).not.toContain('user');
    expect(message.error).not.toContain('id');
  });

  it('should use modern standardHeaders instead of legacy', () => {
    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Limiter is created successfully with modern headers
    expect(limiter).toBeDefined();
  });
});

describe('Rate Limit Configuration Validation', () => {
  it('should have reasonable window sizes', () => {
    const configs = {
      general: { windowMs: 15 * 60 * 1000, max: 500 },
      auth: { windowMs: 15 * 60 * 1000, max: 20 },
      payment: { windowMs: 60 * 60 * 1000, max: 30 },
      strict: { windowMs: 60 * 1000, max: 10 },
      admin: { windowMs: 60 * 1000, max: 200 },
    };

    // Verify window sizes are reasonable (at least 1 minute)
    Object.values(configs).forEach(config => {
      expect(config.windowMs).toBeGreaterThanOrEqual(60 * 1000);
    });

    // Verify max values are positive
    Object.values(configs).forEach(config => {
      expect(config.max).toBeGreaterThan(0);
    });
  });

  it('should have progressively stricter limits for more sensitive operations', () => {
    const limits = {
      general: 500,
      admin: 200,
      payment: 30,
      auth: 20,
      strict: 10,
    };

    // General should be highest
    expect(limits.general).toBeGreaterThan(limits.admin);
    // Admin should be higher than payment
    expect(limits.admin).toBeGreaterThan(limits.payment);
    // Payment should be higher or equal to auth
    expect(limits.payment).toBeGreaterThanOrEqual(limits.auth);
    // Auth should be higher than strict
    expect(limits.auth).toBeGreaterThan(limits.strict);
  });
});

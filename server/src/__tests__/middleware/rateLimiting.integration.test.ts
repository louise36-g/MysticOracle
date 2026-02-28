/**
 * Rate Limiting Integration Tests
 *
 * Tests that spin up a minimal Express app with actual rate limiters
 * and use supertest to verify 429 responses, headers, per-IP tracking,
 * window resets, and error format.
 *
 * NOTE: These tests create standalone Express apps and do NOT import
 * from index.ts (which has side effects: Sentry, DB, env validation).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';

/** Shared validation config matching production (Render reverse proxy) */
const proxyValidation = { validate: { xForwardedForHeader: false } };

/** Helper: create a minimal Express app with a rate limiter on a test route */
function createApp(limiterOptions: Parameters<typeof rateLimit>[0]): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  const limiter = rateLimit({ ...proxyValidation, ...limiterOptions });
  app.use('/test', limiter, (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

/** Helper: fire N sequential requests and return all responses */
async function fireRequests(
  app: Express,
  count: number,
  ip = '127.0.0.1',
  path = '/test'
): Promise<request.Response[]> {
  const responses: request.Response[] = [];
  for (let i = 0; i < count; i++) {
    const res = await request(app).get(path).set('X-Forwarded-For', ip);
    responses.push(res);
  }
  return responses;
}

// ---------------------------------------------------------------------------
// General Limiter Tier
// ---------------------------------------------------------------------------
describe('Integration: General Limiter', () => {
  const MAX = 5;
  const WINDOW_MS = 1000;
  let app: Express;

  beforeEach(() => {
    app = createApp({
      windowMs: WINDOW_MS,
      max: MAX,
      message: { error: 'Too many requests, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
  });

  it('should return 429 after exceeding the limit', async () => {
    const responses = await fireRequests(app, MAX + 1);

    // First MAX requests succeed
    for (let i = 0; i < MAX; i++) {
      expect(responses[i].status).toBe(200);
    }
    // The (MAX+1)th request is rate limited
    expect(responses[MAX].status).toBe(429);
  });

  it('should return correct JSON error body on 429', async () => {
    const responses = await fireRequests(app, MAX + 1);
    const blocked = responses[MAX];

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      error: 'Too many requests, please try again later.',
    });
  });

  it('should set RateLimit-Limit header', async () => {
    const res = await request(app).get('/test');

    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(Number(res.headers['ratelimit-limit'])).toBe(MAX);
  });

  it('should decrement RateLimit-Remaining on each request', async () => {
    const responses = await fireRequests(app, 3);

    expect(Number(responses[0].headers['ratelimit-remaining'])).toBe(MAX - 1);
    expect(Number(responses[1].headers['ratelimit-remaining'])).toBe(MAX - 2);
    expect(Number(responses[2].headers['ratelimit-remaining'])).toBe(MAX - 3);
  });

  it('should include RateLimit-Reset header', async () => {
    const res = await request(app).get('/test');

    expect(res.headers['ratelimit-reset']).toBeDefined();
    // Reset is seconds remaining; should be > 0
    expect(Number(res.headers['ratelimit-reset'])).toBeGreaterThan(0);
  });

  it('should allow requests again after window expires', async () => {
    // Exhaust the limit
    await fireRequests(app, MAX);

    // Wait for the window to expire
    await new Promise(r => setTimeout(r, WINDOW_MS + 100));

    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Auth Limiter Tier
// ---------------------------------------------------------------------------
describe('Integration: Auth Limiter', () => {
  const MAX = 3;
  let app: Express;

  beforeEach(() => {
    app = createApp({
      windowMs: 1000,
      max: MAX,
      message: { error: 'Too many authentication attempts, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
  });

  it('should enforce auth tier limit and return correct message', async () => {
    const responses = await fireRequests(app, MAX + 1);

    expect(responses[MAX].status).toBe(429);
    expect(responses[MAX].body).toEqual({
      error: 'Too many authentication attempts, please try again later.',
    });
  });
});

// ---------------------------------------------------------------------------
// Payment Limiter Tier
// ---------------------------------------------------------------------------
describe('Integration: Payment Limiter', () => {
  const MAX = 4;
  let app: Express;

  beforeEach(() => {
    app = createApp({
      windowMs: 1000,
      max: MAX,
      message: { error: 'Too many payment requests, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
  });

  it('should enforce payment tier limit and return correct message', async () => {
    const responses = await fireRequests(app, MAX + 1);

    expect(responses[MAX].status).toBe(429);
    expect(responses[MAX].body).toEqual({
      error: 'Too many payment requests, please try again later.',
    });
  });
});

// ---------------------------------------------------------------------------
// Strict Limiter Tier
// ---------------------------------------------------------------------------
describe('Integration: Strict Limiter', () => {
  const MAX = 3;
  let app: Express;

  beforeEach(() => {
    app = createApp({
      windowMs: 1000,
      max: MAX,
      message: { error: 'Rate limit exceeded, please slow down.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
  });

  it('should enforce strict tier limit and return correct message', async () => {
    const responses = await fireRequests(app, MAX + 1);

    expect(responses[MAX].status).toBe(429);
    expect(responses[MAX].body).toEqual({
      error: 'Rate limit exceeded, please slow down.',
    });
  });
});

// ---------------------------------------------------------------------------
// Admin Limiter Tier
// ---------------------------------------------------------------------------
describe('Integration: Admin Limiter', () => {
  const MAX = 5;
  let app: Express;

  beforeEach(() => {
    app = createApp({
      windowMs: 1000,
      max: MAX,
      message: { error: 'Admin rate limit exceeded, please slow down.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
  });

  it('should enforce admin tier limit and return correct message', async () => {
    const responses = await fireRequests(app, MAX + 1);

    expect(responses[MAX].status).toBe(429);
    expect(responses[MAX].body).toEqual({
      error: 'Admin rate limit exceeded, please slow down.',
    });
  });
});

// ---------------------------------------------------------------------------
// Per-IP Isolation
// ---------------------------------------------------------------------------
describe('Integration: Per-IP Isolation', () => {
  const MAX = 3;
  let app: Express;

  beforeEach(() => {
    app = createApp({
      windowMs: 1000,
      max: MAX,
      message: { error: 'Rate limited.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
  });

  it('should track different IPs independently', async () => {
    const ip1 = '10.0.0.1';
    const ip2 = '10.0.0.2';

    // Exhaust limit for IP 1
    await fireRequests(app, MAX, ip1);

    // IP 1 should be blocked
    const blocked = await request(app).get('/test').set('X-Forwarded-For', ip1);
    expect(blocked.status).toBe(429);

    // IP 2 should still be allowed
    const allowed = await request(app).get('/test').set('X-Forwarded-For', ip2);
    expect(allowed.status).toBe(200);
  });

  it('should have separate remaining counts per IP', async () => {
    const ip1 = '10.0.0.10';
    const ip2 = '10.0.0.20';

    // Send 2 requests from IP 1
    await fireRequests(app, 2, ip1);

    // IP 2's first request should have full remaining
    const res = await request(app).get('/test').set('X-Forwarded-For', ip2);
    expect(Number(res.headers['ratelimit-remaining'])).toBe(MAX - 1);
  });
});

// ---------------------------------------------------------------------------
// Global + Per-Route Stacking
// ---------------------------------------------------------------------------
describe('Integration: Global + Per-Route Limiter Stacking', () => {
  it('should reject when the global limiter is exhausted even if per-route has budget', async () => {
    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());

    // Global limiter: very tight (2 requests)
    const globalLimiter = rateLimit({
      windowMs: 1000,
      max: 2,
      message: { error: 'Global limit reached.' },
      standardHeaders: true,
      legacyHeaders: false,
      ...proxyValidation,
    });

    // Per-route limiter: more generous (10 requests)
    const routeLimiter = rateLimit({
      windowMs: 1000,
      max: 10,
      message: { error: 'Route limit reached.' },
      standardHeaders: true,
      legacyHeaders: false,
      ...proxyValidation,
    });

    app.use(globalLimiter);
    app.use('/api', routeLimiter, (_req, res) => {
      res.json({ ok: true });
    });

    const responses = await fireRequests(app, 3, '127.0.0.1', '/api');

    expect(responses[0].status).toBe(200);
    expect(responses[1].status).toBe(200);
    // 3rd request exceeds global limit (max=2), even though route allows 10
    expect(responses[2].status).toBe(429);
    expect(responses[2].body).toEqual({ error: 'Global limit reached.' });
  });

  it('should reject when the per-route limiter is exhausted even if global has budget', async () => {
    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());

    // Global limiter: generous (10 requests)
    const globalLimiter = rateLimit({
      windowMs: 1000,
      max: 10,
      message: { error: 'Global limit reached.' },
      standardHeaders: true,
      legacyHeaders: false,
      ...proxyValidation,
    });

    // Per-route limiter: tight (2 requests)
    const routeLimiter = rateLimit({
      windowMs: 1000,
      max: 2,
      message: { error: 'Route limit reached.' },
      standardHeaders: true,
      legacyHeaders: false,
      ...proxyValidation,
    });

    app.use(globalLimiter);
    app.use('/api', routeLimiter, (_req, res) => {
      res.json({ ok: true });
    });

    const responses = await fireRequests(app, 3, '127.0.0.1', '/api');

    expect(responses[0].status).toBe(200);
    expect(responses[1].status).toBe(200);
    // 3rd request exceeds route limit (max=2), global still has budget
    expect(responses[2].status).toBe(429);
    expect(responses[2].body).toEqual({ error: 'Route limit reached.' });
  });
});

// ---------------------------------------------------------------------------
// JSON Error Format
// ---------------------------------------------------------------------------
describe('Integration: JSON Error Format', () => {
  it('should return { error: string } shape on 429', async () => {
    const app = createApp({
      windowMs: 1000,
      max: 1,
      message: { error: 'Test limit.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // First request succeeds, second is blocked
    await request(app).get('/test');
    const blocked = await request(app).get('/test');

    expect(blocked.status).toBe(429);
    expect(blocked.body).toHaveProperty('error');
    expect(typeof blocked.body.error).toBe('string');
    // Should only have the 'error' key
    expect(Object.keys(blocked.body)).toEqual(['error']);
  });

  it('should return Content-Type application/json on 429', async () => {
    const app = createApp({
      windowMs: 1000,
      max: 1,
      message: { error: 'Test limit.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    await request(app).get('/test');
    const blocked = await request(app).get('/test');

    expect(blocked.headers['content-type']).toMatch(/application\/json/);
  });
});

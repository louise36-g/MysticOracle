import { Router } from 'express';
import express from 'express';
import prisma from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
import { captureMessage } from '../config/sentry.js';

const router = Router();
const startedAt = Date.now();

// DB check with timeout to avoid hanging health checks
const DB_CHECK_TIMEOUT_MS = 3000;

async function checkDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database check timed out')), DB_CHECK_TIMEOUT_MS)
      ),
    ]);
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─── Liveness probe ──────────────────────────────────────────
// Is the process alive? No external dependency checks.
// Use this for uptime monitors and container liveness probes.
router.get('/livez', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startedAt) / 1000),
  });
});

// Keep /ping as alias for backward compatibility
router.get('/ping', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ─── Readiness probe ─────────────────────────────────────────
// Can the service handle traffic? Checks database connectivity.
// Returns 503 if not ready — load balancers should stop routing traffic.
router.get('/readyz', async (_req, res) => {
  const db = await checkDatabase();

  if (!db.ok) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'fail', latencyMs: db.latencyMs, error: db.error },
      },
    });
    return;
  }

  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'pass', latencyMs: db.latencyMs },
    },
  });
});

// ─── Combined health (backward compatible) ───────────────────
// Existing endpoint kept for current monitors and admin dashboard.
router.get('/', async (_req, res) => {
  const db = await checkDatabase();

  if (!db.ok) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      services: {
        database: 'disconnected',
        api: 'running',
      },
      checks: {
        database: { status: 'fail', latencyMs: db.latencyMs, error: db.error },
      },
    });
    return;
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    services: {
      database: 'connected',
      api: 'running',
    },
    checks: {
      database: { status: 'pass', latencyMs: db.latencyMs },
    },
  });
});

// CSP violation reporting endpoint
router.post('/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const report = req.body?.['csp-report'];
  if (report) {
    logger.warn('[CSP Violation]', {
      documentUri: report['document-uri'],
      violatedDirective: report['violated-directive'],
      blockedUri: report['blocked-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
    });
    captureMessage(
      `CSP Violation: ${report['violated-directive']} blocked ${report['blocked-uri']}`,
      'warning'
    );
  }
  res.status(204).end();
});

// Bootstrap endpoint to set admin user (requires ADMIN_BOOTSTRAP_KEY env var)
// Usage: POST /api/health/bootstrap with { key: "your-secret-key" }
router.post('/bootstrap', requireAuth, async (req, res) => {
  try {
    const { key } = req.body;
    const bootstrapKey = process.env.ADMIN_BOOTSTRAP_KEY;

    // Must have bootstrap key configured
    if (!bootstrapKey) {
      return res.status(403).json({
        error: 'Bootstrap not configured. Set ADMIN_BOOTSTRAP_KEY environment variable.',
      });
    }

    // Key must match
    if (key !== bootstrapKey) {
      return res.status(403).json({ error: 'Invalid bootstrap key' });
    }

    // Grant admin to the authenticated user
    const user = await prisma.user.update({
      where: { id: req.auth.userId },
      data: { isAdmin: true },
      select: { id: true, username: true, email: true, isAdmin: true },
    });

    logger.info(`Bootstrap: Granted admin access to ${user.username} (${user.email})`);

    res.json({
      success: true,
      message: `Admin access granted to ${user.username}`,
      user,
    });
  } catch (error) {
    logger.error('Bootstrap error:', error);
    res.status(500).json({ error: 'Bootstrap failed' });
  }
});

// Get current user's admin status (for debugging)
router.get('/admin-status', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { id: true, username: true, email: true, isAdmin: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Admin status check error:', error);
    res.status(500).json({ error: 'Failed to check admin status' });
  }
});

export default router;

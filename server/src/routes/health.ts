import { Router } from 'express';
import prisma from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        api: 'running'
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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
        error: 'Bootstrap not configured. Set ADMIN_BOOTSTRAP_KEY environment variable.'
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
      select: { id: true, username: true, email: true, isAdmin: true }
    });

    console.log(`Bootstrap: Granted admin access to ${user.username} (${user.email})`);

    res.json({
      success: true,
      message: `Admin access granted to ${user.username}`,
      user
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: 'Bootstrap failed' });
  }
});

// Get current user's admin status (for debugging)
router.get('/admin-status', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { id: true, username: true, email: true, isAdmin: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Admin status check error:', error);
    res.status(500).json({ error: 'Failed to check admin status' });
  }
});

export default router;

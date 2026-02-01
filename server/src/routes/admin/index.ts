/**
 * Admin Routes - Combined Router
 *
 * Modular structure:
 * - users.ts: User management (list, get, status, credits, admin toggle)
 * - transactions.ts: Transactions, revenue, revenue export
 * - analytics.ts: Dashboard stats, reading stats, analytics
 * - packages.ts: Credit packages CRUD + seed
 * - templates.ts: Email templates CRUD + seed
 * - settings.ts: System settings, AI config, services, health
 * - maintenance.ts: Cache, maintenance jobs, error logs
 * - debug.ts: Debug endpoints for testing
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';

// Import route modules
import usersRoutes from './users.js';
import transactionsRoutes from './transactions.js';
import analyticsRoutes from './analytics.js';
import packagesRoutes from './packages.js';
import templatesRoutes from './templates.js';
import settingsRoutes from './settings.js';
import maintenanceRoutes from './maintenance.js';
import debugRoutes from './debug.js';
import promptsRouter from '../prompts.js';

const router = Router();

// All admin routes require authentication AND admin privileges
router.use(requireAuth);
router.use(requireAdmin);

// Mount route modules
router.use('/users', usersRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/packages', packagesRoutes);
router.use('/email-templates', templatesRoutes);
router.use('/settings', settingsRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/debug', debugRoutes);
router.use('/prompts', promptsRouter);

// Top-level endpoints that don't fit in a specific module
// These are mounted at /api/admin/* directly

// Dashboard stats (shortcut)
router.get('/stats', async (req, res) => {
  try {
    const adminStatsService = req.container.resolve('adminStatsService');
    const stats = await adminStatsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Revenue (shortcut - also available at /transactions/revenue)
router.get('/revenue', async (req, res) => {
  // Forward to transactions module
  req.url = '/revenue';
  transactionsRoutes(req, res, () => {});
});

// Readings stats (shortcut)
router.get('/readings/stats', async (req, res) => {
  // Forward to analytics module
  req.url = '/readings/stats';
  analyticsRoutes(req, res, () => {});
});

// Services (shortcut)
router.get('/services', async (req, res) => {
  req.url = '/services';
  settingsRoutes(req, res, () => {});
});

// Health (shortcut)
router.get('/health', async (req, res) => {
  req.url = '/health';
  settingsRoutes(req, res, () => {});
});

// AI Config (shortcut)
router.get('/config/ai', async (req, res) => {
  req.url = '/config/ai';
  settingsRoutes(req, res, () => {});
});

// Cache stats (shortcut)
router.get('/cache/stats', async (req, res) => {
  req.url = '/cache/stats';
  maintenanceRoutes(req, res, () => {});
});

// Cache purge (shortcut)
router.post('/cache/purge', async (req, res) => {
  req.url = '/cache/purge';
  maintenanceRoutes(req, res, () => {});
});

// Error logs (shortcut)
router.get('/error-logs', (req, res) => {
  req.url = '/error-logs';
  maintenanceRoutes(req, res, () => {});
});

router.delete('/error-logs', (req, res) => {
  req.url = '/error-logs';
  maintenanceRoutes(req, res, () => {});
});

// Seed endpoints (shortcuts)
router.post('/seed/packages', async (req, res) => {
  req.url = '/seed';
  packagesRoutes(req, res, () => {});
});

router.post('/seed/email-templates', async (req, res) => {
  req.url = '/seed';
  templatesRoutes(req, res, () => {});
});

// Re-export logError for use by other modules
export { logError } from './maintenance.js';

export default router;

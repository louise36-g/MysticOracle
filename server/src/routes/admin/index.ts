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
 * - invoices.ts: Invoices listing, stats, and accounting
 * - debug.ts: Debug endpoints for testing
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { logger } from '../../lib/logger.js';

// Import route modules
import usersRoutes from './users.js';
import transactionsRoutes from './transactions.js';
import analyticsRoutes from './analytics.js';
import packagesRoutes from './packages.js';
import templatesRoutes from './templates.js';
import settingsRoutes from './settings.js';
import maintenanceRoutes from './maintenance.js';
import debugRoutes from './debug.js';
import invoicesRoutes from './invoices.js';
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
router.use('/invoices', invoicesRoutes);
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
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Helper to forward requests to sub-routers with proper error handling
const forward =
  (targetRouter: Router, url: string) => (req: Request, res: Response, next: NextFunction) => {
    req.url = url;
    targetRouter(req, res, next);
  };

// Shortcut routes that forward to sub-modules
router.get('/revenue', forward(transactionsRoutes, '/revenue'));
router.get('/readings/stats', forward(analyticsRoutes, '/readings/stats'));
router.get('/services', forward(settingsRoutes, '/services'));
router.get('/health', forward(settingsRoutes, '/health'));
router.get('/config/ai', forward(settingsRoutes, '/config/ai'));
router.get('/cache/stats', forward(maintenanceRoutes, '/cache/stats'));
router.post('/cache/purge', forward(maintenanceRoutes, '/cache/purge'));
router.get('/error-logs', forward(maintenanceRoutes, '/error-logs'));
router.delete('/error-logs', forward(maintenanceRoutes, '/error-logs'));
router.post('/seed/packages', forward(packagesRoutes, '/seed'));
router.post('/seed/email-templates', forward(templatesRoutes, '/seed'));

// Re-export logError for use by other modules
export { logError } from './maintenance.js';

export default router;

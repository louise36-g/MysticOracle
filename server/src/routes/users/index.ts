/**
 * Users Routes - Combined Router
 *
 * Modular structure:
 * - profile.ts: User profile & preferences (/me, /me/credits)
 * - history.ts: Reading & transaction history (/me/readings, /me/transactions)
 * - bonus.ts: Daily login bonus (/me/daily-bonus)
 * - gdpr.ts: GDPR compliance (/me/export, DELETE /me, /withdrawal-request)
 */

import { Router } from 'express';

// Import route modules
import profileRoutes from './profile.js';
import historyRoutes from './history.js';
import bonusRoutes from './bonus.js';
import gdprRoutes from './gdpr.js';
import referralRoutes from './referral.js';

const router = Router();

// Mount all route modules at root level
// Routes are prefixed with /me or specific paths in each module
router.use('/', profileRoutes);
router.use('/', historyRoutes);
router.use('/', bonusRoutes);
router.use('/', gdprRoutes);
router.use('/', referralRoutes);

export default router;

/**
 * Translations Routes - Combined router
 *
 * Modular structure:
 * - public.ts: Public endpoints (fetch translations, languages, version)
 * - admin.ts: Admin endpoints (CRUD, seeding)
 * - defaults.ts: Default translation strings (EN/FR)
 * - shared.ts: Shared types and utilities
 */

import { Router } from 'express';
import publicRoutes from './public.js';
import adminRoutes from './admin.js';

const router = Router();

// Mount public routes at root
router.use('/', publicRoutes);

// Mount admin routes at /admin
router.use('/admin', adminRoutes);

export default router;

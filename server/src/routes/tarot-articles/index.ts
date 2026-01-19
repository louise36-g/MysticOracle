/**
 * Tarot Articles API Routes
 *
 * Modular route structure:
 * - public.ts: Public endpoints (no auth)
 * - admin.ts: Admin CRUD operations
 * - trash.ts: Soft delete, restore, permanent delete
 *
 * Note: Taxonomy (categories/tags) is now unified and available at /api/v1/taxonomy/*
 *
 * Route structure:
 * GET  /api/tarot-articles/overview          - Public overview
 * GET  /api/tarot-articles/:slug             - Public single article
 * GET  /api/tarot-articles                   - Public list
 * POST /api/tarot-articles/admin/validate    - Validate article JSON
 * POST /api/tarot-articles/admin/import      - Import article
 * GET  /api/tarot-articles/admin/list        - Admin list (inc. drafts)
 * GET  /api/tarot-articles/admin/preview/:id - Preview any article
 * GET  /api/tarot-articles/admin/:id         - Get for editing
 * PATCH /api/tarot-articles/admin/reorder    - Reorder articles
 * PATCH /api/tarot-articles/admin/:id        - Update article
 * DELETE /api/tarot-articles/admin/:id       - Soft delete
 * POST /api/tarot-articles/admin/:id/restore - Restore from trash
 * DELETE /api/tarot-articles/admin/:id/permanent - Permanent delete
 * DELETE /api/tarot-articles/admin/trash/empty   - Empty trash
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';

import publicRoutes from './public.js';
import adminRoutes from './admin.js';
import trashRoutes from './trash.js';

const router = Router();

// Public routes (no auth required)
router.use('/', publicRoutes);

// Admin routes (require auth + admin)
router.use('/admin', requireAuth, requireAdmin, adminRoutes);

// Trash routes (require auth + admin) - mounted under /admin
router.use('/admin', requireAuth, requireAdmin, trashRoutes);

export default router;

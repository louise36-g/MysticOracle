/**
 * Blog API Routes
 *
 * Modular route structure:
 * - public.ts: Public endpoints (no auth)
 * - posts.ts: Admin post CRUD operations
 * - trash.ts: Soft delete, restore, permanent delete
 * - taxonomy.ts: Category and tag management
 * - media.ts: Media upload and management
 * - import.ts: JSON import and seeding
 * - sitemap.ts: XML sitemap generation
 *
 * Route structure:
 * GET  /api/blog/posts                    - Public list
 * GET  /api/blog/posts/:slug              - Public single post
 * GET  /api/blog/categories               - Public categories
 * GET  /api/blog/tags                     - Public tags
 * GET  /api/blog/sitemap.xml              - XML sitemap
 * GET  /api/blog/admin/preview/:id        - Preview any post
 * GET  /api/blog/admin/posts              - Admin list (inc. drafts)
 * GET  /api/blog/admin/posts/:id          - Get for editing
 * POST /api/blog/admin/posts              - Create post
 * PATCH /api/blog/admin/posts/reorder     - Reorder posts
 * PATCH /api/blog/admin/posts/:id         - Update post
 * DELETE /api/blog/admin/posts/:id        - Soft delete
 * POST /api/blog/admin/posts/:id/restore  - Restore from trash
 * DELETE /api/blog/admin/posts/:id/permanent - Permanent delete
 * DELETE /api/blog/admin/trash/empty      - Empty trash
 * GET  /api/blog/admin/categories         - List categories
 * POST /api/blog/admin/categories         - Create category
 * PATCH /api/blog/admin/categories/:id    - Update category
 * DELETE /api/blog/admin/categories/:id   - Delete category
 * GET  /api/blog/admin/tags               - List tags
 * POST /api/blog/admin/tags               - Create tag
 * PATCH /api/blog/admin/tags/:id          - Update tag
 * DELETE /api/blog/admin/tags/:id         - Delete tag
 * POST /api/blog/admin/upload             - Upload media
 * GET  /api/blog/admin/media              - List media
 * DELETE /api/blog/admin/media/:id        - Delete media
 * POST /api/blog/admin/import             - Import articles
 * POST /api/blog/admin/seed               - Seed default data
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';

import publicRoutes from './public.js';
import postsRoutes from './posts.js';
import trashRoutes from './trash.js';
import taxonomyRoutes from './taxonomy.js';
import mediaRoutes from './media.js';
import importRoutes from './import.js';
import sitemapRoutes from './sitemap.js';

const router = Router();

// Public routes (no auth required)
router.use('/', publicRoutes);

// Sitemap (no auth required)
router.use('/', sitemapRoutes);

// Admin routes (require auth + admin)
router.use('/admin', requireAuth, requireAdmin, postsRoutes);
router.use('/admin', requireAuth, requireAdmin, trashRoutes);
router.use('/admin', requireAuth, requireAdmin, taxonomyRoutes);
router.use('/admin', requireAuth, requireAdmin, mediaRoutes);
router.use('/admin', requireAuth, requireAdmin, importRoutes);

export default router;

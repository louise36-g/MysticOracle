/**
 * Unified Taxonomy Routes
 *
 * Shared category and tag endpoints for both blog and tarot articles.
 * All endpoints require admin authentication.
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  taxonomyService,
  CreateCategoryInput,
  CreateTagInput,
} from '../services/TaxonomyService.js';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ValidationError } from '../shared/errors/ApplicationError.js';

const router = Router();

// All routes require admin authentication
router.use(requireAuth, requireAdmin);

// ============================================
// Category Routes
// ============================================

/**
 * GET /api/v1/taxonomy/categories
 * List all categories with counts for both content types
 */
router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await taxonomyService.listCategories();
    res.json({ categories });
  })
);

/**
 * POST /api/v1/taxonomy/categories
 * Create a new category
 */
router.post(
  '/categories',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().min(1).max(100),
      nameFr: z.string().min(1).max(100).optional(),
      slug: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      description: z.string().max(500).optional(),
      descriptionFr: z.string().max(500).optional(),
      color: z.string().max(20).optional(),
      icon: z.string().max(50).optional(),
    });

    const data = schema.parse(req.body) as CreateCategoryInput;

    // Check if slug is available
    const isAvailable = await taxonomyService.isCategorySlugAvailable(data.slug);
    if (!isAvailable) {
      throw new ValidationError(`Category with slug "${data.slug}" already exists`);
    }

    const category = await taxonomyService.createCategory(data);
    res.status(201).json({ category });
  })
);

/**
 * PATCH /api/v1/taxonomy/categories/:id
 * Update a category
 */
router.patch(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const schema = z.object({
      name: z.string().min(1).max(100).optional(),
      nameFr: z.string().min(1).max(100).optional(),
      slug: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .optional(),
      description: z.string().max(500).optional(),
      descriptionFr: z.string().max(500).optional(),
      color: z.string().max(20).optional(),
      icon: z.string().max(50).optional(),
    });

    const data = schema.parse(req.body);

    // Check if slug is available (if changing)
    if (data.slug) {
      const isAvailable = await taxonomyService.isCategorySlugAvailable(data.slug, id);
      if (!isAvailable) {
        throw new ValidationError(`Category with slug "${data.slug}" already exists`);
      }
    }

    const category = await taxonomyService.updateCategory(id, data);
    res.json({ category });
  })
);

/**
 * DELETE /api/v1/taxonomy/categories/:id
 * Delete a category (fails if used by blog posts)
 * Idempotent: returns success if category already gone (clears stale cache)
 */
router.delete(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await taxonomyService.getCategoryById(id);
    if (!category) {
      // Category already gone — clear cache so ghost entries disappear
      await taxonomyService.invalidateAll();
      return res.json({ success: true });
    }

    if (category.blogPostCount > 0) {
      throw new ValidationError(
        `Cannot delete category: used by ${category.blogPostCount} blog post(s)`
      );
    }

    await taxonomyService.deleteCategory(id);
    res.json({ success: true });
  })
);

// ============================================
// Tag Routes
// ============================================

/**
 * GET /api/v1/taxonomy/tags
 * List all tags with counts for both content types
 */
router.get(
  '/tags',
  asyncHandler(async (_req, res) => {
    const tags = await taxonomyService.listTags();
    res.json({ tags });
  })
);

/**
 * POST /api/v1/taxonomy/tags
 * Create a new tag
 */
router.post(
  '/tags',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().min(1).max(100),
      nameFr: z.string().min(1).max(100).optional(),
      slug: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    });

    const data = schema.parse(req.body) as CreateTagInput;

    // Check if slug is available
    const isAvailable = await taxonomyService.isTagSlugAvailable(data.slug);
    if (!isAvailable) {
      throw new ValidationError(`Tag with slug "${data.slug}" already exists`);
    }

    const tag = await taxonomyService.createTag(data);
    res.status(201).json({ tag });
  })
);

/**
 * PATCH /api/v1/taxonomy/tags/:id
 * Update a tag
 */
router.patch(
  '/tags/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const schema = z.object({
      name: z.string().min(1).max(100).optional(),
      nameFr: z.string().min(1).max(100).optional(),
      slug: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .optional(),
    });

    const data = schema.parse(req.body);

    // Check if slug is available (if changing)
    if (data.slug) {
      const isAvailable = await taxonomyService.isTagSlugAvailable(data.slug, id);
      if (!isAvailable) {
        throw new ValidationError(`Tag with slug "${data.slug}" already exists`);
      }
    }

    const tag = await taxonomyService.updateTag(id, data);
    res.json({ tag });
  })
);

/**
 * DELETE /api/v1/taxonomy/tags/:id
 * Delete a tag (fails if used by blog posts)
 * Idempotent: returns success if tag already gone (clears stale cache)
 */
router.delete(
  '/tags/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const tag = await taxonomyService.getTagById(id);
    if (!tag) {
      // Tag already gone — clear cache so ghost entries disappear
      await taxonomyService.invalidateAll();
      return res.json({ success: true });
    }

    if (tag.blogPostCount > 0) {
      throw new ValidationError(`Cannot delete tag: used by ${tag.blogPostCount} blog post(s)`);
    }

    await taxonomyService.deleteTag(id);
    res.json({ success: true });
  })
);

export default router;

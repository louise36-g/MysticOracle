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
router.get('/categories', async (req, res) => {
  try {
    const categories = await taxonomyService.listCategories();
    res.json({ categories });
  } catch (error) {
    console.error('[Taxonomy] Error listing categories:', error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

/**
 * POST /api/v1/taxonomy/categories
 * Create a new category
 */
router.post('/categories', async (req, res) => {
  try {
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
      return res.status(400).json({ error: `Category with slug "${data.slug}" already exists` });
    }

    const category = await taxonomyService.createCategory(data);
    res.status(201).json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('[Taxonomy] Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

/**
 * PATCH /api/v1/taxonomy/categories/:id
 * Update a category
 */
router.patch('/categories/:id', async (req, res) => {
  try {
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
        return res.status(400).json({ error: `Category with slug "${data.slug}" already exists` });
      }
    }

    const category = await taxonomyService.updateCategory(id, data);
    res.json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('[Taxonomy] Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

/**
 * DELETE /api/v1/taxonomy/categories/:id
 * Delete a category (fails if used by blog posts)
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category is used by blog posts
    const category = await taxonomyService.getCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.blogPostCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category: used by ${category.blogPostCount} blog post(s)`,
      });
    }

    await taxonomyService.deleteCategory(id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Taxonomy] Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============================================
// Tag Routes
// ============================================

/**
 * GET /api/v1/taxonomy/tags
 * List all tags with counts for both content types
 */
router.get('/tags', async (req, res) => {
  try {
    const tags = await taxonomyService.listTags();
    res.json({ tags });
  } catch (error) {
    console.error('[Taxonomy] Error listing tags:', error);
    res.status(500).json({ error: 'Failed to list tags' });
  }
});

/**
 * POST /api/v1/taxonomy/tags
 * Create a new tag
 */
router.post('/tags', async (req, res) => {
  try {
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
      return res.status(400).json({ error: `Tag with slug "${data.slug}" already exists` });
    }

    const tag = await taxonomyService.createTag(data);
    res.status(201).json({ tag });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('[Taxonomy] Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

/**
 * PATCH /api/v1/taxonomy/tags/:id
 * Update a tag
 */
router.patch('/tags/:id', async (req, res) => {
  try {
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
        return res.status(400).json({ error: `Tag with slug "${data.slug}" already exists` });
      }
    }

    const tag = await taxonomyService.updateTag(id, data);
    res.json({ tag });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('[Taxonomy] Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

/**
 * DELETE /api/v1/taxonomy/tags/:id
 * Delete a tag (fails if used by blog posts)
 */
router.delete('/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tag is used by blog posts
    const tag = await taxonomyService.getTagById(id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    if (tag.blogPostCount > 0) {
      return res.status(400).json({
        error: `Cannot delete tag: used by ${tag.blogPostCount} blog post(s)`,
      });
    }

    await taxonomyService.deleteTag(id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Taxonomy] Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;

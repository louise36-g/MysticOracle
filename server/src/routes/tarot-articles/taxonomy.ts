/**
 * Tarot Article Taxonomy Routes
 *
 * Category and tag management for tarot articles.
 * Uses shared BlogCategory/BlogTag tables.
 * Requires authentication and admin privileges.
 */

import { Router } from 'express';
import { prisma, z } from './shared.js';

const router = Router();

// ============================================
// CATEGORY MANAGEMENT
// ============================================

/**
 * GET /categories
 * List all categories (shared with blog)
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        _count: {
          select: { tarotArticles: true },
        },
      },
    });

    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.nameEn,
      nameFr: cat.nameFr,
      slug: cat.slug,
      description: cat.descEn,
      articleCount: cat._count.tarotArticles,
    }));

    res.json({ categories: result });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
});

/**
 * POST /categories
 * Create a new category (shared with blog)
 */
router.post('/categories', async (req, res) => {
  try {
    const data = createCategorySchema.parse(req.body);

    const category = await prisma.blogCategory.create({
      data: {
        nameEn: data.name,
        nameFr: data.name,
        slug: data.slug,
        descEn: data.description,
      },
    });

    res.status(201).json({
      category: {
        id: category.id,
        name: category.nameEn,
        slug: category.slug,
        description: category.descEn,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

/**
 * PATCH /categories/:id
 * Update a category (shared with blog)
 */
router.patch('/categories/:id', async (req, res) => {
  try {
    const data = createCategorySchema.partial().parse(req.body);

    const updateData: Record<string, string | undefined> = {};
    if (data.name) {
      updateData.nameEn = data.name;
      updateData.nameFr = data.name;
    }
    if (data.slug) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.descEn = data.description;

    const category = await prisma.blogCategory.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({
      category: {
        id: category.id,
        name: category.nameEn,
        slug: category.slug,
        description: category.descEn,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

/**
 * DELETE /categories/:id
 * Delete a category (shared with blog)
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    // First remove tarot article associations
    await prisma.tarotArticleCategory.deleteMany({
      where: { categoryId: req.params.id },
    });

    // Then delete the category (will fail if blog posts use it)
    await prisma.blogCategory.delete({ where: { id: req.params.id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category (may be used by blog posts)' });
  }
});

// ============================================
// TAG MANAGEMENT
// ============================================

/**
 * GET /tags
 * List all tags (shared with blog)
 */
router.get('/tags', async (req, res) => {
  try {
    const tags = await prisma.blogTag.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        _count: {
          select: { tarotArticles: true },
        },
      },
    });

    const result = tags.map((tag) => ({
      id: tag.id,
      name: tag.nameEn,
      nameFr: tag.nameFr,
      slug: tag.slug,
      articleCount: tag._count.tarotArticles,
    }));

    res.json({ tags: result });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
});

/**
 * POST /tags
 * Create a new tag (shared with blog)
 */
router.post('/tags', async (req, res) => {
  try {
    const data = createTagSchema.parse(req.body);

    const tag = await prisma.blogTag.create({
      data: {
        nameEn: data.name,
        nameFr: data.name,
        slug: data.slug,
      },
    });

    res.status(201).json({
      tag: {
        id: tag.id,
        name: tag.nameEn,
        slug: tag.slug,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

/**
 * PATCH /tags/:id
 * Update a tag (shared with blog)
 */
router.patch('/tags/:id', async (req, res) => {
  try {
    const data = createTagSchema.partial().parse(req.body);

    const updateData: Record<string, string | undefined> = {};
    if (data.name) {
      updateData.nameEn = data.name;
      updateData.nameFr = data.name;
    }
    if (data.slug) updateData.slug = data.slug;

    const tag = await prisma.blogTag.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({
      tag: {
        id: tag.id,
        name: tag.nameEn,
        slug: tag.slug,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

/**
 * DELETE /tags/:id
 * Delete a tag (shared with blog)
 */
router.delete('/tags/:id', async (req, res) => {
  try {
    // First remove tarot article associations
    await prisma.tarotArticleTag.deleteMany({
      where: { tagId: req.params.id },
    });

    // Then delete the tag (will fail if blog posts use it)
    await prisma.blogTag.delete({ where: { id: req.params.id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag (may be used by blog posts)' });
  }
});

export default router;

/**
 * Category and tag admin routes
 */

import { Router } from 'express';
import { prisma, z, ConflictError, categorySchema, tagSchema } from './shared.js';

const router = Router();

// ============================================
// CATEGORY ADMIN
// ============================================

router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
    res.json({ categories });
  } catch (error) {
    console.error(
      'Error fetching categories:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const data = categorySchema.parse(req.body);

    // Check for duplicate slug
    const existing = await prisma.blogCategory.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ConflictError(`Category with slug "${data.slug}" already exists`);
    }

    const category = await prisma.blogCategory.create({
      data: {
        slug: data.slug,
        nameEn: data.nameEn,
        nameFr: data.nameFr,
        descEn: data.descEn,
        descFr: data.descFr,
        color: data.color,
        icon: data.icon,
        sortOrder: data.sortOrder,
      },
    });
    res.json({ success: true, category });
  } catch (error) {
    console.error(
      'Error creating category:',
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.patch('/categories/:id', async (req, res) => {
  try {
    const data = categorySchema.partial().parse(req.body);

    // Check for duplicate slug if changing
    if (data.slug) {
      const existing = await prisma.blogCategory.findFirst({
        where: { slug: data.slug, id: { not: req.params.id } },
      });
      if (existing) {
        return res.status(400).json({ error: 'A category with this slug already exists' });
      }
    }

    const category = await prisma.blogCategory.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, category });
  } catch (error) {
    console.error(
      'Error updating category:',
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await prisma.blogCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error(
      'Error deleting category:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============================================
// TAG ADMIN
// ============================================

router.get('/tags', async (req, res) => {
  try {
    const tags = await prisma.blogTag.findMany({
      orderBy: { nameEn: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

router.post('/tags', async (req, res) => {
  try {
    const data = tagSchema.parse(req.body);

    // Check for duplicate slug
    const existing = await prisma.blogTag.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ConflictError(`Tag with slug "${data.slug}" already exists`);
    }

    const tag = await prisma.blogTag.create({
      data: {
        slug: data.slug,
        nameEn: data.nameEn,
        nameFr: data.nameFr,
      },
    });
    res.json({ success: true, tag });
  } catch (error) {
    console.error('Error creating tag:', error instanceof Error ? error.message : String(error));
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

router.patch('/tags/:id', async (req, res) => {
  try {
    const data = tagSchema.partial().parse(req.body);

    // Check for duplicate slug if changing
    if (data.slug) {
      const existing = await prisma.blogTag.findFirst({
        where: { slug: data.slug, id: { not: req.params.id } },
      });
      if (existing) {
        return res.status(400).json({ error: 'A tag with this slug already exists' });
      }
    }

    const tag = await prisma.blogTag.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, tag });
  } catch (error) {
    console.error('Error updating tag:', error instanceof Error ? error.message : String(error));
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

router.delete('/tags/:id', async (req, res) => {
  try {
    await prisma.blogTag.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;

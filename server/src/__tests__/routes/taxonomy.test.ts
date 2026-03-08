/**
 * Taxonomy Routes Tests
 * Tests for categories and tags CRUD endpoints (admin-only)
 *
 * Routes under test:
 *   GET    /categories
 *   POST   /categories
 *   PATCH  /categories/:id
 *   DELETE /categories/:id
 *   GET    /tags
 *   POST   /tags
 *   PATCH  /tags/:id
 *   DELETE /tags/:id
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock dependencies BEFORE imports
vi.mock('../../db/prisma.js', () => ({ default: {} }));
vi.mock('../../lib/logger.js', () => ({ debug: { log: vi.fn() } }));

// Mock the TaxonomyService singleton
vi.mock('../../services/TaxonomyService.js', () => ({
  taxonomyService: {
    listCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    getCategoryById: vi.fn(),
    isCategorySlugAvailable: vi.fn(),
    listTags: vi.fn(),
    createTag: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
    getTagById: vi.fn(),
    isTagSlugAvailable: vi.fn(),
  },
}));

// Mock auth middleware — router.use(requireAuth, requireAdmin) is applied at router level
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (_req: any, _res: any, next: any) => next(),
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

// Import AFTER mocks
import taxonomyRouter from '../../routes/taxonomy.js';
import { taxonomyService } from '../../services/TaxonomyService.js';

// Cast to typed mocks for IDE support
const mockedService = taxonomyService as {
  listCategories: Mock;
  createCategory: Mock;
  updateCategory: Mock;
  deleteCategory: Mock;
  getCategoryById: Mock;
  isCategorySlugAvailable: Mock;
  listTags: Mock;
  createTag: Mock;
  updateTag: Mock;
  deleteTag: Mock;
  getTagById: Mock;
  isTagSlugAvailable: Mock;
};

// Build the Express app under test
const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.auth = { userId: 'admin-1', sessionId: 'sess-1' };
  next();
});
app.use('/', taxonomyRouter);

// Error handler — must come AFTER routes so asyncHandler errors reach it
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.statusCode || (err.name === 'ZodError' ? 400 : 500);
  const body =
    err.name === 'ZodError'
      ? { error: 'Validation failed', details: err.errors }
      : { error: err.message || 'Internal server error' };
  res.status(status).json(body);
});

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const mockCategory = {
  id: 'cat-1',
  name: 'Tarot Guides',
  nameFr: 'Guides Tarot',
  slug: 'tarot-guides',
  description: 'A guide to tarot',
  descriptionFr: null,
  color: '#7c3aed',
  icon: 'star',
  sortOrder: 0,
  blogPostCount: 0,
  tarotArticleCount: 0,
};

const mockTag = {
  id: 'tag-1',
  name: 'Beginners',
  nameFr: 'Débutants',
  slug: 'beginners',
  blogPostCount: 0,
  tarotArticleCount: 0,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Taxonomy Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Categories
  // ==========================================================================

  describe('GET /categories', () => {
    it('returns the list of categories from the service', async () => {
      mockedService.listCategories.mockResolvedValue([mockCategory]);

      const res = await request(app).get('/categories');

      expect(res.status).toBe(200);
      expect(res.body.categories).toHaveLength(1);
      expect(res.body.categories[0].id).toBe('cat-1');
      expect(res.body.categories[0].slug).toBe('tarot-guides');
      expect(mockedService.listCategories).toHaveBeenCalledOnce();
    });

    it('returns an empty array when no categories exist', async () => {
      mockedService.listCategories.mockResolvedValue([]);

      const res = await request(app).get('/categories');

      expect(res.status).toBe(200);
      expect(res.body.categories).toEqual([]);
    });

    it('returns 500 when the service throws', async () => {
      mockedService.listCategories.mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app).get('/categories');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB connection lost');
    });
  });

  // --------------------------------------------------------------------------

  describe('POST /categories', () => {
    const validBody = {
      name: 'Tarot Guides',
      slug: 'tarot-guides',
    };

    it('creates a category and returns 201 with valid data', async () => {
      mockedService.isCategorySlugAvailable.mockResolvedValue(true);
      mockedService.createCategory.mockResolvedValue(mockCategory);

      const res = await request(app).post('/categories').send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.category.id).toBe('cat-1');
      expect(res.body.category.slug).toBe('tarot-guides');
      expect(mockedService.isCategorySlugAvailable).toHaveBeenCalledWith('tarot-guides');
      expect(mockedService.createCategory).toHaveBeenCalledWith(expect.objectContaining(validBody));
    });

    it('accepts all optional fields and passes them to the service', async () => {
      mockedService.isCategorySlugAvailable.mockResolvedValue(true);
      mockedService.createCategory.mockResolvedValue(mockCategory);

      const fullBody = {
        name: 'Tarot Guides',
        nameFr: 'Guides Tarot',
        slug: 'tarot-guides',
        description: 'A guide to tarot',
        descriptionFr: 'Un guide du tarot',
        color: '#7c3aed',
        icon: 'star',
      };

      const res = await request(app).post('/categories').send(fullBody);

      expect(res.status).toBe(201);
      expect(mockedService.createCategory).toHaveBeenCalledWith(expect.objectContaining(fullBody));
    });

    it('returns 400 with validation error message when slug is already taken', async () => {
      mockedService.isCategorySlugAvailable.mockResolvedValue(false);

      const res = await request(app).post('/categories').send(validBody);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('tarot-guides');
      expect(res.body.error).toContain('already exists');
      expect(mockedService.createCategory).not.toHaveBeenCalled();
    });

    it('returns 400 when slug contains uppercase letters (ZodError)', async () => {
      const res = await request(app).post('/categories').send({
        name: 'Tarot Guides',
        slug: 'Tarot-Guides',
      });

      expect(res.status).toBe(400);
      expect(mockedService.isCategorySlugAvailable).not.toHaveBeenCalled();
    });

    it('returns 400 when slug contains spaces (ZodError)', async () => {
      const res = await request(app).post('/categories').send({
        name: 'Tarot Guides',
        slug: 'tarot guides',
      });

      expect(res.status).toBe(400);
      expect(mockedService.isCategorySlugAvailable).not.toHaveBeenCalled();
    });

    it('returns 400 when slug starts with a hyphen (ZodError)', async () => {
      const res = await request(app).post('/categories').send({
        name: 'Tarot Guides',
        slug: '-tarot-guides',
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 when name is missing (ZodError)', async () => {
      const res = await request(app).post('/categories').send({ slug: 'tarot-guides' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when slug is missing (ZodError)', async () => {
      const res = await request(app).post('/categories').send({ name: 'Tarot Guides' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when name exceeds 100 characters (ZodError)', async () => {
      const res = await request(app)
        .post('/categories')
        .send({ name: 'x'.repeat(101), slug: 'tarot-guides' });

      expect(res.status).toBe(400);
    });
  });

  // --------------------------------------------------------------------------

  describe('PATCH /categories/:id', () => {
    it('updates a category and returns the updated object', async () => {
      const updated = { ...mockCategory, name: 'Updated Name' };
      mockedService.updateCategory.mockResolvedValue(updated);

      const res = await request(app).patch('/categories/cat-1').send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.category.name).toBe('Updated Name');
      expect(mockedService.updateCategory).toHaveBeenCalledWith(
        'cat-1',
        expect.objectContaining({ name: 'Updated Name' })
      );
    });

    it('checks slug availability when a new slug is provided', async () => {
      mockedService.isCategorySlugAvailable.mockResolvedValue(true);
      mockedService.updateCategory.mockResolvedValue({ ...mockCategory, slug: 'new-slug' });

      const res = await request(app).patch('/categories/cat-1').send({ slug: 'new-slug' });

      expect(res.status).toBe(200);
      // The current category id should be passed as excludeId so the category's own
      // slug does not trigger a false conflict
      expect(mockedService.isCategorySlugAvailable).toHaveBeenCalledWith('new-slug', 'cat-1');
    });

    it('returns 400 when the new slug is already taken by another category', async () => {
      mockedService.isCategorySlugAvailable.mockResolvedValue(false);

      const res = await request(app).patch('/categories/cat-1').send({ slug: 'taken-slug' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('taken-slug');
      expect(res.body.error).toContain('already exists');
      expect(mockedService.updateCategory).not.toHaveBeenCalled();
    });

    it('does not check slug availability when no slug field is sent', async () => {
      mockedService.updateCategory.mockResolvedValue({ ...mockCategory, name: 'New Name' });

      await request(app).patch('/categories/cat-1').send({ name: 'New Name' });

      expect(mockedService.isCategorySlugAvailable).not.toHaveBeenCalled();
    });

    it('returns 400 when slug format is invalid (ZodError)', async () => {
      const res = await request(app).patch('/categories/cat-1').send({ slug: 'Invalid Slug!' });

      expect(res.status).toBe(400);
      expect(mockedService.isCategorySlugAvailable).not.toHaveBeenCalled();
    });

    it('accepts an empty body without error (all fields optional)', async () => {
      mockedService.updateCategory.mockResolvedValue(mockCategory);

      const res = await request(app).patch('/categories/cat-1').send({});

      expect(res.status).toBe(200);
    });

    it('returns 500 when the service throws', async () => {
      mockedService.updateCategory.mockRejectedValue(new Error('Record not found'));

      const res = await request(app).patch('/categories/cat-1').send({ name: 'X' });

      expect(res.status).toBe(500);
    });
  });

  // --------------------------------------------------------------------------

  describe('DELETE /categories/:id', () => {
    it('deletes an unused category and returns success', async () => {
      mockedService.getCategoryById.mockResolvedValue({ ...mockCategory, blogPostCount: 0 });
      mockedService.deleteCategory.mockResolvedValue(undefined);

      const res = await request(app).delete('/categories/cat-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockedService.deleteCategory).toHaveBeenCalledWith('cat-1');
    });

    it('returns 404 when the category does not exist', async () => {
      mockedService.getCategoryById.mockResolvedValue(null);

      const res = await request(app).delete('/categories/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
      expect(mockedService.deleteCategory).not.toHaveBeenCalled();
    });

    it('returns 400 when the category is used by one or more blog posts', async () => {
      mockedService.getCategoryById.mockResolvedValue({ ...mockCategory, blogPostCount: 3 });

      const res = await request(app).delete('/categories/cat-1');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('3 blog post');
      expect(mockedService.deleteCategory).not.toHaveBeenCalled();
    });

    it('returns 400 even when a single post uses the category', async () => {
      mockedService.getCategoryById.mockResolvedValue({ ...mockCategory, blogPostCount: 1 });

      const res = await request(app).delete('/categories/cat-1');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('1 blog post');
    });

    it('returns 500 when getCategoryById throws', async () => {
      mockedService.getCategoryById.mockRejectedValue(new Error('DB timeout'));

      const res = await request(app).delete('/categories/cat-1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB timeout');
    });
  });

  // ==========================================================================
  // Tags
  // ==========================================================================

  describe('GET /tags', () => {
    it('returns the list of tags from the service', async () => {
      mockedService.listTags.mockResolvedValue([mockTag]);

      const res = await request(app).get('/tags');

      expect(res.status).toBe(200);
      expect(res.body.tags).toHaveLength(1);
      expect(res.body.tags[0].id).toBe('tag-1');
      expect(res.body.tags[0].slug).toBe('beginners');
      expect(mockedService.listTags).toHaveBeenCalledOnce();
    });

    it('returns an empty array when no tags exist', async () => {
      mockedService.listTags.mockResolvedValue([]);

      const res = await request(app).get('/tags');

      expect(res.status).toBe(200);
      expect(res.body.tags).toEqual([]);
    });

    it('returns 500 when the service throws', async () => {
      mockedService.listTags.mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app).get('/tags');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB connection lost');
    });
  });

  // --------------------------------------------------------------------------

  describe('POST /tags', () => {
    const validBody = { name: 'Beginners', slug: 'beginners' };

    it('creates a tag and returns 201 with valid data', async () => {
      mockedService.isTagSlugAvailable.mockResolvedValue(true);
      mockedService.createTag.mockResolvedValue(mockTag);

      const res = await request(app).post('/tags').send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.tag.id).toBe('tag-1');
      expect(res.body.tag.slug).toBe('beginners');
      expect(mockedService.isTagSlugAvailable).toHaveBeenCalledWith('beginners');
      expect(mockedService.createTag).toHaveBeenCalledWith(expect.objectContaining(validBody));
    });

    it('accepts the optional nameFr field', async () => {
      mockedService.isTagSlugAvailable.mockResolvedValue(true);
      mockedService.createTag.mockResolvedValue(mockTag);

      const res = await request(app)
        .post('/tags')
        .send({ ...validBody, nameFr: 'Débutants' });

      expect(res.status).toBe(201);
      expect(mockedService.createTag).toHaveBeenCalledWith(
        expect.objectContaining({ nameFr: 'Débutants' })
      );
    });

    it('returns 400 with validation error message when slug is already taken', async () => {
      mockedService.isTagSlugAvailable.mockResolvedValue(false);

      const res = await request(app).post('/tags').send(validBody);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('beginners');
      expect(res.body.error).toContain('already exists');
      expect(mockedService.createTag).not.toHaveBeenCalled();
    });

    it('returns 400 when slug contains uppercase letters (ZodError)', async () => {
      const res = await request(app).post('/tags').send({ name: 'Beginners', slug: 'Beginners' });

      expect(res.status).toBe(400);
      expect(mockedService.isTagSlugAvailable).not.toHaveBeenCalled();
    });

    it('returns 400 when slug contains special characters (ZodError)', async () => {
      const res = await request(app).post('/tags').send({ name: 'X', slug: 'my_tag!' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when name is missing (ZodError)', async () => {
      const res = await request(app).post('/tags').send({ slug: 'beginners' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when slug is missing (ZodError)', async () => {
      const res = await request(app).post('/tags').send({ name: 'Beginners' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when name exceeds 100 characters (ZodError)', async () => {
      const res = await request(app)
        .post('/tags')
        .send({ name: 'x'.repeat(101), slug: 'beginners' });

      expect(res.status).toBe(400);
    });

    it('rejects extra fields the schema does not allow (color/icon are not tag fields)', async () => {
      // color/icon are category-only — they should be stripped by Zod parse()
      // so createTag must still be called with just the tag fields
      mockedService.isTagSlugAvailable.mockResolvedValue(true);
      mockedService.createTag.mockResolvedValue(mockTag);

      const res = await request(app)
        .post('/tags')
        .send({ name: 'X', slug: 'x-tag', color: '#fff', icon: 'star' });

      expect(res.status).toBe(201);
      expect(mockedService.createTag).toHaveBeenCalledWith(
        expect.not.objectContaining({ color: '#fff' })
      );
    });
  });

  // --------------------------------------------------------------------------

  describe('PATCH /tags/:id', () => {
    it('updates a tag and returns the updated object', async () => {
      const updated = { ...mockTag, name: 'Advanced' };
      mockedService.updateTag.mockResolvedValue(updated);

      const res = await request(app).patch('/tags/tag-1').send({ name: 'Advanced' });

      expect(res.status).toBe(200);
      expect(res.body.tag.name).toBe('Advanced');
      expect(mockedService.updateTag).toHaveBeenCalledWith(
        'tag-1',
        expect.objectContaining({ name: 'Advanced' })
      );
    });

    it('checks slug availability when a new slug is provided', async () => {
      mockedService.isTagSlugAvailable.mockResolvedValue(true);
      mockedService.updateTag.mockResolvedValue({ ...mockTag, slug: 'advanced' });

      const res = await request(app).patch('/tags/tag-1').send({ slug: 'advanced' });

      expect(res.status).toBe(200);
      // excludeId must match the route :id param so the tag's own slug is not flagged
      expect(mockedService.isTagSlugAvailable).toHaveBeenCalledWith('advanced', 'tag-1');
    });

    it('returns 400 when the new slug is already taken by another tag', async () => {
      mockedService.isTagSlugAvailable.mockResolvedValue(false);

      const res = await request(app).patch('/tags/tag-1').send({ slug: 'taken-slug' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('taken-slug');
      expect(res.body.error).toContain('already exists');
      expect(mockedService.updateTag).not.toHaveBeenCalled();
    });

    it('does not check slug availability when no slug field is sent', async () => {
      mockedService.updateTag.mockResolvedValue({ ...mockTag, name: 'New Name' });

      await request(app).patch('/tags/tag-1').send({ name: 'New Name' });

      expect(mockedService.isTagSlugAvailable).not.toHaveBeenCalled();
    });

    it('returns 400 when slug format is invalid (ZodError)', async () => {
      const res = await request(app).patch('/tags/tag-1').send({ slug: 'INVALID SLUG' });

      expect(res.status).toBe(400);
      expect(mockedService.isTagSlugAvailable).not.toHaveBeenCalled();
    });

    it('accepts an empty body without error (all fields optional)', async () => {
      mockedService.updateTag.mockResolvedValue(mockTag);

      const res = await request(app).patch('/tags/tag-1').send({});

      expect(res.status).toBe(200);
    });

    it('returns 500 when the service throws', async () => {
      mockedService.updateTag.mockRejectedValue(new Error('Prisma update failed'));

      const res = await request(app).patch('/tags/tag-1').send({ name: 'X' });

      expect(res.status).toBe(500);
    });
  });

  // --------------------------------------------------------------------------

  describe('DELETE /tags/:id', () => {
    it('deletes an unused tag and returns success', async () => {
      mockedService.getTagById.mockResolvedValue({ ...mockTag, blogPostCount: 0 });
      mockedService.deleteTag.mockResolvedValue(undefined);

      const res = await request(app).delete('/tags/tag-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockedService.deleteTag).toHaveBeenCalledWith('tag-1');
    });

    it('returns 404 when the tag does not exist', async () => {
      mockedService.getTagById.mockResolvedValue(null);

      const res = await request(app).delete('/tags/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
      expect(mockedService.deleteTag).not.toHaveBeenCalled();
    });

    it('returns 400 when the tag is used by one or more blog posts', async () => {
      mockedService.getTagById.mockResolvedValue({ ...mockTag, blogPostCount: 5 });

      const res = await request(app).delete('/tags/tag-1');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('5 blog post');
      expect(mockedService.deleteTag).not.toHaveBeenCalled();
    });

    it('returns 400 when a single post uses the tag', async () => {
      mockedService.getTagById.mockResolvedValue({ ...mockTag, blogPostCount: 1 });

      const res = await request(app).delete('/tags/tag-1');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('1 blog post');
    });

    it('returns 500 when getTagById throws', async () => {
      mockedService.getTagById.mockRejectedValue(new Error('DB timeout'));

      const res = await request(app).delete('/tags/tag-1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB timeout');
    });
  });
});

/**
 * Tarot Articles Admin Routes Tests
 * Tests for POST /validate, POST /import, GET /list, GET /preview/:id,
 * GET /:id, PATCH /reorder, PATCH /:id
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock Prisma — shared.ts uses named `prisma` export; also expose as default for direct imports
vi.mock('../../db/prisma.js', () => {
  const client = {
    blogPost: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    blogCategory: { findMany: vi.fn() },
    blogTag: { findMany: vi.fn() },
    blogPostCategory: { createMany: vi.fn(), deleteMany: vi.fn() },
    blogPostTag: { createMany: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(),
  };
  return { prisma: client, default: client };
});

// Mock cache service — shared.ts uses named `cacheService` and `CacheService` exports
vi.mock('../../services/cache.js', () => {
  const service = {
    get: vi.fn(),
    set: vi.fn(),
    invalidateTarot: vi.fn(),
    invalidateTarotArticle: vi.fn(),
  };
  return {
    cacheService: service,
    default: service,
    CacheService: {
      TTL: {
        ARTICLES: 300,
        ARTICLE: 600,
      },
    },
  };
});

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  debug: { log: vi.fn() },
}));

// Mock validation helpers
vi.mock('../../lib/validation.js', () => ({
  validateTarotArticle: vi.fn(),
  validateArticleWithWarnings: vi.fn(),
  convertToPrismaFormatLenient: vi.fn(),
}));

// Mock schema builder
vi.mock('../../lib/schema-builder.js', () => ({
  processArticleSchema: vi.fn(),
}));

// Mock reorderUtils so PATCH /reorder can be tested in isolation
vi.mock('../../routes/shared/reorderUtils.js', () => ({
  handleReorder: vi.fn(),
}));

// Import after mocks
import adminRouter from '../../routes/tarot-articles/admin.js';
import prisma from '../../db/prisma.js';
import cacheService from '../../services/cache.js';
import {
  validateTarotArticle,
  validateArticleWithWarnings,
  convertToPrismaFormatLenient,
} from '../../lib/validation.js';
import { processArticleSchema } from '../../lib/schema-builder.js';
import { handleReorder } from '../../routes/shared/reorderUtils.js';

const app = express();
app.use(express.json());
// Simulate auth middleware — admin.ts itself does not apply auth; the parent index.ts does
app.use((req, _res, next) => {
  req.auth = { userId: 'admin-1', sessionId: 'sess-1' };
  next();
});
app.use('/', adminRouter);

// Error handler after routes
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.statusCode || (err.name === 'ZodError' ? 400 : 500);
  const body =
    err.name === 'ZodError'
      ? { error: 'Validation failed', details: err.errors }
      : { error: err.message || 'Internal server error' };
  res.status(status).json(body);
});

// Type mocked modules
const mockedPrisma = prisma as unknown as {
  blogPost: {
    findMany: Mock;
    findFirst: Mock;
    findUnique: Mock;
    count: Mock;
    create: Mock;
    update: Mock;
  };
  blogCategory: { findMany: Mock };
  blogTag: { findMany: Mock };
  blogPostCategory: { createMany: Mock; deleteMany: Mock };
  blogPostTag: { createMany: Mock; deleteMany: Mock };
  $transaction: Mock;
};

const mockedCache = cacheService as unknown as {
  get: Mock;
  set: Mock;
  invalidateTarot: Mock;
  invalidateTarotArticle: Mock;
};

const mockedValidateTarotArticle = validateTarotArticle as Mock;
const mockedValidateArticleWithWarnings = validateArticleWithWarnings as Mock;
const mockedConvertToPrismaFormatLenient = convertToPrismaFormatLenient as Mock;
const mockedProcessArticleSchema = processArticleSchema as Mock;
const _mockedHandleReorder = handleReorder as Mock;

// Test data factories
const createMockArticle = (overrides: Record<string, unknown> = {}) => ({
  id: 'article-1',
  slug: 'the-fool',
  titleEn: 'The Fool',
  titleFr: 'Le Fou',
  excerptEn: 'The beginning of the journey',
  excerptFr: 'Le début du voyage',
  contentEn: '<p>Full content here</p>',
  contentFr: '<p>Contenu complet ici</p>',
  coverImage: '/img/fool.jpg',
  coverImageAlt: 'The Fool card',
  coverImageAltFr: 'La carte du Fou',
  cardType: 'MAJOR_ARCANA',
  cardNumber: '0',
  authorName: 'Mystic Author',
  datePublished: new Date('2025-01-15'),
  dateModified: null,
  readTimeMinutes: 5,
  status: 'DRAFT',
  publishedAt: null,
  deletedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-15'),
  sortOrder: 0,
  astrologicalCorrespondence: 'Uranus',
  element: 'AIR',
  faq: null,
  breadcrumbCategory: 'Major Arcana',
  breadcrumbCategoryUrl: '/tarot/major-arcana',
  relatedCards: [],
  isCourtCard: false,
  isChallengeCard: false,
  schemaJson: {},
  schemaHtml: '',
  metaTitleEn: 'The Fool Tarot Card',
  metaTitleFr: 'Le Fou Tarot',
  metaDescEn: 'Learn about The Fool',
  metaDescFr: 'Apprenez sur Le Fou',
  seoFocusKeyword: 'the fool tarot',
  seoFocusKeywordFr: 'le fou tarot',
  originalSlug: null,
  categories: [
    {
      category: {
        id: 'cat-1',
        slug: 'major-arcana',
        nameEn: 'Major Arcana',
        nameFr: 'Arcanes Majeures',
      },
    },
  ],
  tags: [
    {
      tag: {
        id: 'tag-1',
        slug: 'beginners',
        nameEn: 'Beginners',
        nameFr: 'Débutants',
      },
    },
  ],
  ...overrides,
});

// Helper: set up convertToPrismaFormatLenient to return minimal mapped data
const defaultPrismaData = {
  title: 'The Fool',
  excerpt: 'The beginning of the journey',
  content: '<p>Full content</p>',
  author: 'Mystic Author',
  featuredImage: '/img/fool.jpg',
  featuredImageAlt: 'The Fool card',
  readTime: '5 min read',
  seoMetaTitle: 'The Fool Tarot Card',
  seoMetaDescription: 'Learn about The Fool',
  seoFocusKeyword: 'the fool tarot',
  slug: 'the-fool',
  cardType: 'MAJOR_ARCANA',
  cardNumber: '0',
  element: null,
  astrologicalCorrespondence: null,
  isCourtCard: false,
  isChallengeCard: false,
  relatedCards: [],
  faq: null,
  breadcrumbCategory: 'Major Arcana',
  breadcrumbCategoryUrl: '/tarot/major-arcana',
  datePublished: null,
  dateModified: null,
  status: 'DRAFT',
};

describe('Tarot Articles Admin Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // POST /validate
  // ---------------------------------------------------------------------------

  describe('POST /validate', () => {
    it('should return success with schema when article is valid', async () => {
      mockedValidateTarotArticle.mockReturnValue({
        success: true,
        data: { title: 'The Fool', slug: 'the-fool' },
        errors: [],
        warnings: [],
        stats: { wordCount: 500 },
      });
      mockedProcessArticleSchema.mockReturnValue({
        schema: { '@type': 'Article' },
        schemaHtml: '<script type="application/ld+json">{}</script>',
      });

      const res = await request(app).post('/validate').send({ title: 'The Fool' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.errors).toHaveLength(0);
      expect(res.body.schema).toEqual({ '@type': 'Article' });
      expect(res.body.data).toEqual({ title: 'The Fool', slug: 'the-fool' });
    });

    it('should return 400 with errors when article fails validation', async () => {
      mockedValidateTarotArticle.mockReturnValue({
        success: false,
        data: null,
        errors: ['Title is required', 'Content is required'],
        warnings: [{ message: 'Missing SEO data' }],
        stats: null,
      });

      const res = await request(app).post('/validate').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain('Title is required');
      expect(res.body.errors).toContain('Content is required');
      expect(res.body.warnings).toContain('Missing SEO data');
    });

    it('should include warnings even when validation succeeds', async () => {
      mockedValidateTarotArticle.mockReturnValue({
        success: true,
        data: { title: 'The Fool', slug: 'the-fool' },
        errors: [],
        warnings: [{ message: 'Low word count' }],
        stats: { wordCount: 80 },
      });
      mockedProcessArticleSchema.mockReturnValue({ schema: null, schemaHtml: '' });

      const res = await request(app).post('/validate').send({ title: 'The Fool' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.warnings).toContain('Low word count');
    });

    it('should return success with null schema when schema generation fails', async () => {
      mockedValidateTarotArticle.mockReturnValue({
        success: true,
        data: { title: 'The Fool', slug: 'the-fool' },
        errors: [],
        warnings: [],
        stats: {},
      });
      mockedProcessArticleSchema.mockImplementation(() => {
        throw new Error('Schema error');
      });

      const res = await request(app).post('/validate').send({ title: 'The Fool' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.schema).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // POST /import
  // ---------------------------------------------------------------------------

  describe('POST /import', () => {
    it('should create an article with valid data and return 201', async () => {
      mockedValidateTarotArticle.mockReturnValue({
        success: true,
        data: { title: 'The Fool', slug: 'the-fool', content: '<p>Content</p>' },
        errors: [],
        warnings: [],
        stats: {},
      });
      mockedConvertToPrismaFormatLenient.mockReturnValue(defaultPrismaData);
      mockedProcessArticleSchema.mockReturnValue({ schema: {}, schemaHtml: '' });
      mockedPrisma.blogPost.findUnique.mockResolvedValue(null);
      const createdArticle = createMockArticle({ status: 'DRAFT' });
      mockedPrisma.blogPost.create.mockResolvedValue(createdArticle);

      const res = await request(app)
        .post('/import')
        .send({ title: 'The Fool', slug: 'the-fool', content: '<p>Content</p>' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.article.id).toBe('article-1');
      expect(res.body.article.slug).toBe('the-fool');
      expect(res.body.article.status).toBe('DRAFT');
      expect(mockedCache.invalidateTarot).toHaveBeenCalledOnce();
    });

    it('should return 409 when a duplicate slug already exists', async () => {
      mockedValidateTarotArticle.mockReturnValue({
        success: true,
        data: { title: 'The Fool', slug: 'the-fool', content: '<p>Content</p>' },
        errors: [],
        warnings: [],
        stats: {},
      });
      mockedConvertToPrismaFormatLenient.mockReturnValue(defaultPrismaData);
      mockedPrisma.blogPost.findUnique.mockResolvedValue({ id: 'existing-1', slug: 'the-fool' });

      const res = await request(app)
        .post('/import')
        .send({ title: 'The Fool', slug: 'the-fool', content: '<p>Content</p>' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already exists/i);
      expect(mockedPrisma.blogPost.create).not.toHaveBeenCalled();
    });

    it('should return 400 when validation fails in standard mode', async () => {
      mockedValidateTarotArticle.mockReturnValue({
        success: false,
        data: null,
        errors: ['Title is required'],
        warnings: [],
        stats: null,
      });

      const res = await request(app).post('/import').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain('Title is required');
      expect(mockedPrisma.blogPost.create).not.toHaveBeenCalled();
    });

    it('should create an article in force mode bypassing strict validation', async () => {
      mockedValidateArticleWithWarnings.mockReturnValue({
        data: { title: 'The Fool', slug: 'force-fool' },
        warnings: [],
        stats: {},
      });
      mockedConvertToPrismaFormatLenient.mockReturnValue({
        ...defaultPrismaData,
        slug: 'force-fool',
      });
      mockedProcessArticleSchema.mockReturnValue({ schema: {}, schemaHtml: '' });
      mockedPrisma.blogPost.findUnique.mockResolvedValue(null);
      const createdArticle = createMockArticle({ slug: 'force-fool' });
      mockedPrisma.blogPost.create.mockResolvedValue(createdArticle);

      const res = await request(app)
        .post('/import?force=true')
        .send({ title: 'The Fool', slug: 'force-fool' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.forceSaved).toBe(true);
    });

    it('should return 400 in force mode when slug is missing', async () => {
      mockedValidateArticleWithWarnings.mockReturnValue({
        data: { title: 'The Fool' },
        warnings: [],
        stats: {},
      });

      const res = await request(app).post('/import?force=true').send({ title: 'The Fool' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain('Slug is required');
    });

    it('should return 409 in force mode when slug already exists', async () => {
      mockedValidateArticleWithWarnings.mockReturnValue({
        data: { title: 'The Fool', slug: 'the-fool' },
        warnings: [],
        stats: {},
      });
      mockedPrisma.blogPost.findUnique.mockResolvedValue({ id: 'existing-1', slug: 'the-fool' });

      const res = await request(app)
        .post('/import?force=true')
        .send({ title: 'The Fool', slug: 'the-fool' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /list — REMOVED (use blog admin endpoint with contentType=TAROT_ARTICLE)
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // GET /preview/:id
  // ---------------------------------------------------------------------------

  describe('GET /preview/:id', () => {
    it('should return the article preview for any status', async () => {
      const mockArticle = createMockArticle({ status: 'DRAFT' });
      mockedPrisma.blogPost.findFirst.mockResolvedValue(mockArticle);

      const res = await request(app).get('/preview/article-1');

      expect(res.status).toBe(200);
      // mapBlogPostToTarotFields maps titleEn -> title
      expect(res.body.title).toBe('The Fool');
      expect(res.body.slug).toBe('the-fool');
    });

    it('should query without a status filter (bypasses published check)', async () => {
      mockedPrisma.blogPost.findFirst.mockResolvedValue(createMockArticle());

      await request(app).get('/preview/article-1');

      expect(mockedPrisma.blogPost.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'article-1',
            contentType: 'TAROT_ARTICLE',
            deletedAt: null,
          }),
        })
      );
      // status should NOT be in the where clause
      expect(mockedPrisma.blogPost.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ status: expect.anything() }),
        })
      );
    });

    it('should return 404 when article is not found', async () => {
      mockedPrisma.blogPost.findFirst.mockResolvedValue(null);

      const res = await request(app).get('/preview/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Article not found');
    });

    it('should return 500 on database error', async () => {
      mockedPrisma.blogPost.findFirst.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/preview/article-1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /:id
  // ---------------------------------------------------------------------------

  describe('GET /:id', () => {
    it('should return the full article for editing with relations', async () => {
      const mockArticle = createMockArticle();
      mockedPrisma.blogPost.findFirst.mockResolvedValue(mockArticle);

      const res = await request(app).get('/article-1');

      expect(res.status).toBe(200);
      expect(res.body.slug).toBe('the-fool');
      expect(res.body.title).toBe('The Fool');
      // transformArticleResponse flattens categories and tags
      expect(res.body.categories).toContain('Major Arcana');
      expect(res.body.tags).toContain('Beginners');
      expect(res.body.categoryObjects[0].id).toBe('cat-1');
      expect(res.body.tagObjects[0].id).toBe('tag-1');
    });

    it('should return 404 when article is not found', async () => {
      mockedPrisma.blogPost.findFirst.mockResolvedValue(null);

      const res = await request(app).get('/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Article not found');
    });

    it('should return 500 on database error', async () => {
      mockedPrisma.blogPost.findFirst.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/article-1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /reorder
  // ---------------------------------------------------------------------------

  // PATCH /reorder tests removed — endpoint retired, use blog admin reorder

  // ---------------------------------------------------------------------------
  // PATCH /:id — visual editor mode
  // ---------------------------------------------------------------------------

  describe('PATCH /:id (visual editor mode)', () => {
    it('should update article fields in visual editor mode', async () => {
      const existing = createMockArticle({ status: 'DRAFT' });
      mockedPrisma.blogPost.findFirst
        .mockResolvedValueOnce(existing) // existence check
        .mockResolvedValueOnce(createMockArticle({ titleEn: 'Updated Fool' })); // re-fetch
      mockedPrisma.blogPost.update.mockResolvedValue(
        createMockArticle({ titleEn: 'Updated Fool' })
      );
      mockedPrisma.blogPostCategory.deleteMany.mockResolvedValue({ count: 0 });
      mockedPrisma.blogPostTag.deleteMany.mockResolvedValue({ count: 0 });
      mockedCache.invalidateTarotArticle.mockResolvedValue(undefined);

      const res = await request(app).patch('/article-1').send({
        _visualEditorMode: true,
        title: 'Updated Fool',
        excerpt: 'New excerpt',
      });

      expect(res.status).toBe(200);
      expect(mockedPrisma.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'article-1' },
          data: expect.objectContaining({ titleEn: 'Updated Fool' }),
        })
      );
      expect(mockedCache.invalidateTarotArticle).toHaveBeenCalledOnce();
    });

    it('should map TarotArticle field names to BlogPost column names', async () => {
      const existing = createMockArticle();
      mockedPrisma.blogPost.findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(createMockArticle());
      mockedPrisma.blogPost.update.mockResolvedValue(createMockArticle());
      mockedPrisma.blogPostCategory.deleteMany.mockResolvedValue({ count: 0 });
      mockedPrisma.blogPostTag.deleteMany.mockResolvedValue({ count: 0 });
      mockedCache.invalidateTarotArticle.mockResolvedValue(undefined);

      await request(app).patch('/article-1').send({
        _visualEditorMode: true,
        title: 'New Title',
        excerpt: 'New excerpt',
        content: '<p>New content</p>',
        featuredImage: '/img/new.jpg',
        featuredImageAlt: 'New alt',
        seoMetaTitle: 'New SEO Title',
        seoMetaDescription: 'New SEO desc',
        author: 'New Author',
      });

      expect(mockedPrisma.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            titleEn: 'New Title',
            excerptEn: 'New excerpt',
            contentEn: '<p>New content</p>',
            coverImage: '/img/new.jpg',
            coverImageAlt: 'New alt',
            metaTitleEn: 'New SEO Title',
            metaDescEn: 'New SEO desc',
            authorName: 'New Author',
          }),
        })
      );
    });

    it('should return 400 for an invalid status in visual editor mode', async () => {
      const existing = createMockArticle();
      mockedPrisma.blogPost.findFirst.mockResolvedValueOnce(existing);

      const res = await request(app).patch('/article-1').send({
        _visualEditorMode: true,
        status: 'INVALID_STATUS',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid status value');
    });

    it('should return 404 when article is not found', async () => {
      mockedPrisma.blogPost.findFirst.mockResolvedValue(null);

      const res = await request(app).patch('/nonexistent').send({
        _visualEditorMode: true,
        title: 'Updated',
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Article not found');
    });

    it('should handle category updates in visual editor mode', async () => {
      const existing = createMockArticle();
      mockedPrisma.blogPost.findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(createMockArticle());
      mockedPrisma.blogPost.update.mockResolvedValue(createMockArticle());
      mockedPrisma.blogPostCategory.deleteMany.mockResolvedValue({ count: 1 });
      mockedPrisma.blogCategory.findMany.mockResolvedValue([
        { id: 'cat-1', nameEn: 'Major Arcana' },
      ]);
      mockedPrisma.blogPostCategory.createMany.mockResolvedValue({ count: 1 });
      mockedPrisma.blogPostTag.deleteMany.mockResolvedValue({ count: 0 });
      mockedCache.invalidateTarotArticle.mockResolvedValue(undefined);

      await request(app)
        .patch('/article-1')
        .send({
          _visualEditorMode: true,
          categories: ['Major Arcana'],
        });

      expect(mockedPrisma.blogPostCategory.deleteMany).toHaveBeenCalledWith({
        where: { postId: 'article-1' },
      });
      expect(mockedPrisma.blogCategory.findMany).toHaveBeenCalledWith({
        where: { nameEn: { in: ['Major Arcana'] } },
      });
      expect(mockedPrisma.blogPostCategory.createMany).toHaveBeenCalledWith({
        data: [{ postId: 'article-1', categoryId: 'cat-1' }],
      });
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /:id — simple status update
  // ---------------------------------------------------------------------------

  describe('PATCH /:id (simple status update)', () => {
    it('should update status to PUBLISHED and set publishedAt', async () => {
      const existing = createMockArticle({ status: 'DRAFT', publishedAt: null });
      mockedPrisma.blogPost.findFirst.mockResolvedValueOnce(existing);
      const updatedArticle = createMockArticle({
        status: 'PUBLISHED',
        publishedAt: new Date(),
        datePublished: new Date(),
      });
      mockedPrisma.blogPost.update.mockResolvedValue(updatedArticle);
      mockedCache.invalidateTarotArticle.mockResolvedValue(undefined);

      const res = await request(app).patch('/article-1').send({ status: 'PUBLISHED' });

      expect(res.status).toBe(200);
      expect(mockedPrisma.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PUBLISHED',
            publishedAt: expect.any(Date),
            datePublished: expect.any(Date),
          }),
        })
      );
      expect(mockedCache.invalidateTarotArticle).toHaveBeenCalledOnce();
    });

    it('should not overwrite publishedAt when article is already PUBLISHED', async () => {
      const existing = createMockArticle({
        status: 'PUBLISHED',
        publishedAt: new Date('2025-01-15'),
      });
      mockedPrisma.blogPost.findFirst.mockResolvedValueOnce(existing);
      mockedPrisma.blogPost.update.mockResolvedValue(existing);
      mockedCache.invalidateTarotArticle.mockResolvedValue(undefined);

      await request(app).patch('/article-1').send({ status: 'PUBLISHED' });

      expect(mockedPrisma.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ publishedAt: expect.any(Date) }),
        })
      );
    });

    it('should return 400 for an invalid status value', async () => {
      const existing = createMockArticle({ status: 'DRAFT' });
      mockedPrisma.blogPost.findFirst.mockResolvedValueOnce(existing);

      const res = await request(app).patch('/article-1').send({ status: 'INVALID' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid status value');
      expect(mockedPrisma.blogPost.update).not.toHaveBeenCalled();
    });

    it('should update status to ARCHIVED without setting publishedAt', async () => {
      const existing = createMockArticle({ status: 'PUBLISHED' });
      mockedPrisma.blogPost.findFirst.mockResolvedValueOnce(existing);
      mockedPrisma.blogPost.update.mockResolvedValue(createMockArticle({ status: 'ARCHIVED' }));
      mockedCache.invalidateTarotArticle.mockResolvedValue(undefined);

      await request(app).patch('/article-1').send({ status: 'ARCHIVED' });

      expect(mockedPrisma.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'ARCHIVED' }),
        })
      );
      expect(mockedPrisma.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ publishedAt: expect.any(Date) }),
        })
      );
    });

    it('should return 404 when article is not found', async () => {
      mockedPrisma.blogPost.findFirst.mockResolvedValue(null);

      const res = await request(app).patch('/nonexistent').send({ status: 'PUBLISHED' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Article not found');
    });

    it('should return 500 on database error', async () => {
      mockedPrisma.blogPost.findFirst.mockRejectedValue(new Error('DB error'));

      const res = await request(app).patch('/article-1').send({ status: 'PUBLISHED' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });
});

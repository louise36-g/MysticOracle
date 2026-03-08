/**
 * Tarot Articles Public Routes Tests
 * Tests for GET /overview, GET /:slug, GET /
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

// Import after mocks
import publicRouter from '../../routes/tarot-articles/public.js';
import prisma from '../../db/prisma.js';
import cacheService from '../../services/cache.js';

const app = express();
app.use(express.json());
app.use('/', publicRouter);

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
  };
};

const mockedCache = cacheService as unknown as {
  get: Mock;
  set: Mock;
  invalidateTarot: Mock;
  invalidateTarotArticle: Mock;
};

// Test data factories
const createMockOverviewArticle = (overrides: Record<string, unknown> = {}) => ({
  id: 'article-1',
  slug: 'the-fool',
  titleEn: 'The Fool',
  titleFr: 'Le Fou',
  excerptEn: 'The beginning of the journey',
  excerptFr: 'Le début du voyage',
  coverImage: '/img/fool.jpg',
  coverImageAlt: 'The Fool card',
  coverImageAltFr: 'La carte du Fou',
  cardType: 'MAJOR_ARCANA',
  cardNumber: '0',
  readTimeMinutes: 5,
  ...overrides,
});

const createMockListArticle = (overrides: Record<string, unknown> = {}) => ({
  id: 'article-1',
  slug: 'the-fool',
  titleEn: 'The Fool',
  titleFr: 'Le Fou',
  excerptEn: 'The beginning of the journey',
  excerptFr: 'Le début du voyage',
  coverImage: '/img/fool.jpg',
  coverImageAlt: 'The Fool card',
  coverImageAltFr: 'La carte du Fou',
  cardType: 'MAJOR_ARCANA',
  cardNumber: '0',
  datePublished: new Date('2025-01-15'),
  readTimeMinutes: 5,
  status: 'PUBLISHED',
  ...overrides,
});

const createMockFullArticle = (overrides: Record<string, unknown> = {}) => ({
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
  status: 'PUBLISHED',
  publishedAt: new Date('2025-01-15'),
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

describe('Tarot Articles Public Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /overview', () => {
    it('should return articles grouped by card type', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockResolvedValue([
        createMockOverviewArticle({ cardType: 'MAJOR_ARCANA', slug: 'the-fool' }),
        createMockOverviewArticle({
          id: 'article-2',
          cardType: 'SUIT_OF_WANDS',
          slug: 'ace-of-wands',
          titleEn: 'Ace of Wands',
          titleFr: 'As de Bâtons',
          cardNumber: '1',
        }),
        createMockOverviewArticle({
          id: 'article-3',
          cardType: 'SUIT_OF_CUPS',
          slug: 'ace-of-cups',
          titleEn: 'Ace of Cups',
          titleFr: 'As de Coupes',
          cardNumber: '1',
        }),
      ]);

      const res = await request(app).get('/overview');

      expect(res.status).toBe(200);
      expect(res.body.majorArcana).toHaveLength(1);
      expect(res.body.majorArcana[0].slug).toBe('the-fool');
      expect(res.body.majorArcana[0].title).toBe('The Fool');
      expect(res.body.majorArcana[0].cardType).toBe('MAJOR_ARCANA');
      expect(res.body.majorArcana[0].readTime).toBe('5 min read');
      expect(res.body.wands).toHaveLength(1);
      expect(res.body.wands[0].slug).toBe('ace-of-wands');
      expect(res.body.cups).toHaveLength(1);
      expect(res.body.swords).toHaveLength(0);
      expect(res.body.pentacles).toHaveLength(0);
      expect(res.body.counts).toEqual({
        majorArcana: 1,
        wands: 1,
        cups: 1,
        swords: 0,
        pentacles: 0,
      });
    });

    it('should return from cache when a cached value exists', async () => {
      const cachedData = {
        majorArcana: [{ slug: 'cached-fool', title: 'The Fool' }],
        wands: [],
        cups: [],
        swords: [],
        pentacles: [],
        counts: { majorArcana: 1, wands: 0, cups: 0, swords: 0, pentacles: 0 },
      };
      mockedCache.get.mockResolvedValue(cachedData);

      const res = await request(app).get('/overview');

      expect(res.status).toBe(200);
      expect(res.body.majorArcana[0].slug).toBe('cached-fool');
      expect(mockedPrisma.blogPost.findMany).not.toHaveBeenCalled();
    });

    it('should populate the cache on a cache miss', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockResolvedValue([
        createMockOverviewArticle({ cardType: 'MAJOR_ARCANA' }),
      ]);

      await request(app).get('/overview');

      expect(mockedCache.set).toHaveBeenCalledWith(
        'tarot:overview',
        expect.objectContaining({ majorArcana: expect.any(Array) }),
        300
      );
    });

    it('should query only PUBLISHED, non-deleted TAROT_ARTICLE records', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockResolvedValue([]);

      await request(app).get('/overview');

      expect(mockedPrisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contentType: 'TAROT_ARTICLE',
            status: 'PUBLISHED',
            deletedAt: null,
          }),
        })
      );
    });

    it('should return 500 on database error', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/overview');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });

  describe('GET /:slug', () => {
    it('should return a published article by slug', async () => {
      mockedCache.get.mockResolvedValue(null);
      const mockArticle = createMockFullArticle();
      mockedPrisma.blogPost.findFirst.mockResolvedValue(mockArticle);

      const res = await request(app).get('/the-fool');

      expect(res.status).toBe(200);
      expect(res.body.slug).toBe('the-fool');
      expect(res.body.title).toBe('The Fool');
      expect(res.body.cardType).toBe('MAJOR_ARCANA');
      // transformArticleResponse flattens categories and tags to name strings
      expect(res.body.categories).toContain('Major Arcana');
      expect(res.body.tags).toContain('Beginners');
      // categoryObjects and tagObjects should be present
      expect(res.body.categoryObjects[0].slug).toBe('major-arcana');
      expect(res.body.tagObjects[0].slug).toBe('beginners');
    });

    it('should return from cache when a cached value exists', async () => {
      const cachedArticle = { slug: 'the-fool', title: 'The Fool (cached)' };
      mockedCache.get.mockResolvedValue(cachedArticle);

      const res = await request(app).get('/the-fool');

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('The Fool (cached)');
      expect(mockedPrisma.blogPost.findFirst).not.toHaveBeenCalled();
    });

    it('should populate the cache after a database fetch', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findFirst.mockResolvedValue(createMockFullArticle());

      await request(app).get('/the-fool');

      expect(mockedCache.set).toHaveBeenCalledWith(
        'tarot:article:the-fool',
        expect.objectContaining({ slug: 'the-fool' }),
        600
      );
    });

    it('should return 404 when no article exists for the given slug', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findFirst.mockResolvedValue(null);

      const res = await request(app).get('/nonexistent-slug');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Article not found');
    });

    it('should query only PUBLISHED, non-deleted TAROT_ARTICLE records', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findFirst.mockResolvedValue(createMockFullArticle());

      await request(app).get('/the-fool');

      expect(mockedPrisma.blogPost.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            slug: 'the-fool',
            contentType: 'TAROT_ARTICLE',
            status: 'PUBLISHED',
            deletedAt: null,
          }),
        })
      );
    });

    it('should return 500 on database error', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findFirst.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/the-fool');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });

  describe('GET /', () => {
    it('should return a paginated list with defaults', async () => {
      mockedCache.get.mockResolvedValue(null);
      const mockArticles = [createMockListArticle()];
      mockedPrisma.blogPost.findMany.mockResolvedValue(mockArticles);
      mockedPrisma.blogPost.count.mockResolvedValue(1);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body.articles).toHaveLength(1);
      expect(res.body.articles[0].slug).toBe('the-fool');
      expect(res.body.articles[0].title).toBe('The Fool');
      expect(res.body.articles[0].readTime).toBe('5 min read');
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
      expect(res.body.total).toBe(1);
    });

    it('should filter articles by cardType when provided', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockResolvedValue([]);
      mockedPrisma.blogPost.count.mockResolvedValue(0);

      await request(app).get('/?cardType=MAJOR_ARCANA');

      expect(mockedPrisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cardType: 'MAJOR_ARCANA',
          }),
        })
      );
    });

    it('should return from cache when a cached value exists', async () => {
      const cachedData = {
        articles: [{ slug: 'cached-fool' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        total: 1,
      };
      mockedCache.get.mockResolvedValue(cachedData);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body.articles[0].slug).toBe('cached-fool');
      expect(mockedPrisma.blogPost.findMany).not.toHaveBeenCalled();
    });

    it('should populate the cache on a cache miss', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockResolvedValue([createMockListArticle()]);
      mockedPrisma.blogPost.count.mockResolvedValue(1);

      await request(app).get('/');

      expect(mockedCache.set).toHaveBeenCalledWith(
        'tarot:list:1:20::',
        expect.objectContaining({ articles: expect.any(Array) }),
        300
      );
    });

    it('should respect page and limit query parameters', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockResolvedValue([]);
      mockedPrisma.blogPost.count.mockResolvedValue(50);

      const res = await request(app).get('/?page=2&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.totalPages).toBe(5);
      expect(mockedPrisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should default to PUBLISHED status when no status filter is provided', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockResolvedValue([]);
      mockedPrisma.blogPost.count.mockResolvedValue(0);

      await request(app).get('/');

      expect(mockedPrisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
          }),
        })
      );
    });

    it('should return 400 for an invalid cardType value', async () => {
      const res = await request(app).get('/?cardType=INVALID_TYPE');

      expect(res.status).toBe(400);
    });

    it('should return 500 on database error', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });
});

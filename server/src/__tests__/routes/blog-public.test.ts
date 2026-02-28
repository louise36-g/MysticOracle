/**
 * Blog Public Routes Tests
 * Tests for GET /posts, GET /posts/:slug, GET /categories, GET /tags
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock fs before shared.ts side-effect (mkdirSync at module level)
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

// Mock Prisma
vi.mock('../../db/prisma.js', () => ({
  default: {
    blogPost: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    blogCategory: {
      findMany: vi.fn(),
    },
    blogTag: {
      findMany: vi.fn(),
    },
  },
}));

// Mock cache service
vi.mock('../../services/cache.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    flushPattern: vi.fn(),
  },
  CacheService: {
    TTL: {
      BLOG_POSTS: 300,
    },
  },
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  debug: vi.fn(),
}));

// Import after mocks
import publicRouter from '../../routes/blog/public.js';
import prisma from '../../db/prisma.js';
import cacheService from '../../services/cache.js';

const app = express();
app.use(express.json());
app.use('/blog', publicRouter);

// Type mocked modules
const mockedPrisma = prisma as unknown as {
  blogPost: {
    findMany: Mock;
    findFirst: Mock;
    count: Mock;
    update: Mock;
  };
  blogCategory: {
    findMany: Mock;
  };
  blogTag: {
    findMany: Mock;
  };
};

const mockedCache = cacheService as unknown as {
  get: Mock;
  set: Mock;
  flushPattern: Mock;
};

// Test data factories
const createMockPost = (overrides = {}) => ({
  id: 'post-1',
  slug: 'test-post',
  titleEn: 'Test Post',
  titleFr: 'Article Test',
  excerptEn: 'Test excerpt',
  excerptFr: 'Extrait test',
  coverImage: '/img/cover.jpg',
  coverImageAlt: 'Cover alt',
  authorName: 'Author',
  featured: false,
  viewCount: 10,
  readTimeMinutes: 5,
  publishedAt: new Date('2025-01-15'),
  categories: [
    {
      categoryId: 'cat-1',
      category: {
        slug: 'tarot-guides',
        nameEn: 'Tarot Guides',
        nameFr: 'Guides Tarot',
        color: '#6B21A8',
      },
    },
  ],
  tags: [
    {
      tagId: 'tag-1',
      tag: { slug: 'beginners', nameEn: 'Beginners', nameFr: 'Débutants' },
    },
  ],
  ...overrides,
});

describe('Blog Public Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /blog/posts', () => {
    it('should return paginated published posts with defaults', async () => {
      const mockPosts = [createMockPost()];
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockResolvedValue(mockPosts);
      mockedPrisma.blogPost.count.mockResolvedValue(1);

      const res = await request(app).get('/blog/posts');

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].slug).toBe('test-post');
      // Categories should be flattened
      expect(res.body.posts[0].categories[0].slug).toBe('tarot-guides');
      // Tags should be flattened
      expect(res.body.posts[0].tags[0].slug).toBe('beginners');
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1,
      });
    });

    it('should return cached response when cache hit', async () => {
      const cachedData = {
        posts: [{ slug: 'cached-post' }],
        pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
      };
      mockedCache.get.mockResolvedValue(cachedData);

      const res = await request(app).get('/blog/posts');

      expect(res.status).toBe(200);
      expect(res.body.posts[0].slug).toBe('cached-post');
      expect(mockedPrisma.blogPost.findMany).not.toHaveBeenCalled();
    });

    it('should filter by category slug', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockResolvedValue([]);
      mockedPrisma.blogPost.count.mockResolvedValue(0);

      await request(app).get('/blog/posts?category=tarot-guides');

      expect(mockedPrisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categories: { some: { category: { slug: 'tarot-guides' } } },
          }),
        })
      );
    });

    it('should filter by tag slug', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockResolvedValue([]);
      mockedPrisma.blogPost.count.mockResolvedValue(0);

      await request(app).get('/blog/posts?tag=beginners');

      expect(mockedPrisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { some: { tag: { slug: 'beginners' } } },
          }),
        })
      );
    });

    it('should filter by featured flag', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockResolvedValue([]);
      mockedPrisma.blogPost.count.mockResolvedValue(0);

      await request(app).get('/blog/posts?featured=true');

      expect(mockedPrisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            featured: true,
          }),
        })
      );
    });

    it('should return 500 on database error', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/blog/posts');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch posts');
    });
  });

  describe('GET /blog/posts/:slug', () => {
    it('should return post with categories, tags, and related posts', async () => {
      const mockPost = createMockPost();
      mockedPrisma.blogPost.findFirst.mockResolvedValue(mockPost);
      mockedPrisma.blogPost.update.mockResolvedValue(mockPost);
      mockedPrisma.blogPost.findMany.mockResolvedValue([
        { slug: 'related-1', titleEn: 'Related Post' },
      ]);

      const res = await request(app).get('/blog/posts/test-post');

      expect(res.status).toBe(200);
      expect(res.body.post.slug).toBe('test-post');
      // Categories flattened
      expect(res.body.post.categories[0].slug).toBe('tarot-guides');
      // Tags flattened
      expect(res.body.post.tags[0].slug).toBe('beginners');
      // Related posts included
      expect(res.body.relatedPosts).toHaveLength(1);
      expect(res.body.relatedPosts[0].slug).toBe('related-1');
    });

    it('should return 404 when post not found', async () => {
      mockedPrisma.blogPost.findFirst.mockResolvedValue(null);

      const res = await request(app).get('/blog/posts/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Post not found');
    });

    it('should increment view count (non-blocking)', async () => {
      const mockPost = createMockPost();
      mockedPrisma.blogPost.findFirst.mockResolvedValue(mockPost);
      mockedPrisma.blogPost.update.mockResolvedValue(mockPost);
      mockedPrisma.blogPost.findMany.mockResolvedValue([]);

      await request(app).get('/blog/posts/test-post');

      expect(mockedPrisma.blogPost.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { viewCount: { increment: 1 } },
      });
    });

    it('should return 500 on database error', async () => {
      mockedPrisma.blogPost.findFirst.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/blog/posts/test-post');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch post');
    });
  });

  describe('GET /blog/categories', () => {
    it('should return categories with post counts', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          slug: 'tarot-guides',
          nameEn: 'Tarot Guides',
          nameFr: 'Guides Tarot',
          sortOrder: 0,
          _count: { posts: 5 },
        },
        {
          id: 'cat-2',
          slug: 'astrology',
          nameEn: 'Astrology',
          nameFr: 'Astrologie',
          sortOrder: 1,
          _count: { posts: 3 },
        },
      ];
      mockedPrisma.blogCategory.findMany.mockResolvedValue(mockCategories);

      const res = await request(app).get('/blog/categories');

      expect(res.status).toBe(200);
      expect(res.body.categories).toHaveLength(2);
      expect(res.body.categories[0].postCount).toBe(5);
      expect(res.body.categories[1].postCount).toBe(3);
    });

    it('should return 500 on database error', async () => {
      mockedPrisma.blogCategory.findMany.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/blog/categories');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch categories');
    });
  });

  describe('GET /blog/tags', () => {
    it('should return tags with post counts', async () => {
      const mockTags = [
        {
          id: 'tag-1',
          slug: 'beginners',
          nameEn: 'Beginners',
          nameFr: 'Débutants',
          _count: { posts: 8 },
        },
      ];
      mockedPrisma.blogTag.findMany.mockResolvedValue(mockTags);

      const res = await request(app).get('/blog/tags');

      expect(res.status).toBe(200);
      expect(res.body.tags).toHaveLength(1);
      expect(res.body.tags[0].postCount).toBe(8);
      expect(res.body.tags[0].slug).toBe('beginners');
    });

    it('should return 500 on database error', async () => {
      mockedPrisma.blogTag.findMany.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/blog/tags');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch tags');
    });
  });
});

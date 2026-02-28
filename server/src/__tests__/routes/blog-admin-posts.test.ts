/**
 * Blog Admin Posts Routes Tests
 * Tests for admin CRUD endpoints: preview, list, get, create, reorder, update
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock fs before shared.ts side-effect
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
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    blogPostCategory: {
      deleteMany: vi.fn(),
    },
    blogPostTag: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
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
  debug: {
    log: vi.fn(),
  },
}));

// Mock URL replacer
vi.mock('../../utils/urlReplacer.js', () => ({
  processBlogContent: vi.fn((en?: string, fr?: string) => ({
    contentEn: en || '',
    contentFr: fr || '',
  })),
}));

// Import after mocks
import postsRouter from '../../routes/blog/posts.js';
import prisma from '../../db/prisma.js';
import cacheService from '../../services/cache.js';

// Set up app -- posts.ts routes are relative (no /admin prefix in the file itself)
const app = express();
app.use(express.json());
// Simulate auth middleware setting req.auth
app.use((req, _res, next) => {
  req.auth = { userId: 'test-admin-123', sessionId: 'test-session' };
  next();
});
app.use('/', postsRouter);

// Type mocked modules
const mockedPrisma = prisma as unknown as {
  blogPost: {
    findUnique: Mock;
    findFirst: Mock;
    findMany: Mock;
    count: Mock;
    create: Mock;
    update: Mock;
  };
  blogPostCategory: {
    deleteMany: Mock;
  };
  blogPostTag: {
    deleteMany: Mock;
  };
  $transaction: Mock;
};

const mockedCache = cacheService as unknown as {
  flushPattern: Mock;
};

// Test data
const createMockPost = (overrides = {}) => ({
  id: 'post-1',
  slug: 'test-post',
  titleEn: 'Test Post',
  titleFr: 'Article Test',
  excerptEn: 'Excerpt',
  excerptFr: '',
  contentEn: '<p>Content</p>',
  contentFr: '',
  coverImage: null,
  coverImageAlt: null,
  metaTitleEn: null,
  metaTitleFr: null,
  metaDescEn: null,
  metaDescFr: null,
  ogImage: null,
  authorName: 'Author',
  authorId: 'test-admin-123',
  status: 'DRAFT',
  featured: false,
  viewCount: 0,
  readTimeMinutes: 5,
  sortOrder: 0,
  publishedAt: null,
  deletedAt: null,
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-01-15'),
  faq: null,
  cta: null,
  categories: [
    {
      categoryId: 'cat-1',
      postId: 'post-1',
      category: {
        id: 'cat-1',
        slug: 'tarot-guides',
        nameEn: 'Tarot Guides',
        nameFr: 'Guides Tarot',
      },
    },
  ],
  tags: [
    {
      tagId: 'tag-1',
      postId: 'post-1',
      tag: { id: 'tag-1', slug: 'beginners', nameEn: 'Beginners', nameFr: 'Débutants' },
    },
  ],
  ...overrides,
});

const validCreateBody = {
  slug: 'new-post',
  titleEn: 'New Post',
  authorName: 'Admin',
  status: 'DRAFT',
};

describe('Blog Admin Posts Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /preview/:id', () => {
    it('should return post with transformed categories/tags and related posts', async () => {
      const mockPost = createMockPost();
      mockedPrisma.blogPost.findUnique.mockResolvedValue(mockPost);
      mockedPrisma.blogPost.findMany.mockResolvedValue([{ slug: 'related-1', titleEn: 'Related' }]);

      const res = await request(app).get('/preview/post-1');

      expect(res.status).toBe(200);
      expect(res.body.post.slug).toBe('test-post');
      // Categories should be flattened
      expect(res.body.post.categories[0].slug).toBe('tarot-guides');
      // Tags should be flattened
      expect(res.body.post.tags[0].slug).toBe('beginners');
      expect(res.body.relatedPosts).toHaveLength(1);
    });

    it('should return 404 when post not found', async () => {
      mockedPrisma.blogPost.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/preview/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Post not found');
    });

    it('should return 500 on database error', async () => {
      mockedPrisma.blogPost.findUnique.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/preview/post-1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to load post preview');
    });
  });

  describe('GET /posts', () => {
    it('should return paginated posts with defaults', async () => {
      const mockPost = createMockPost();
      mockedPrisma.blogPost.findMany.mockResolvedValue([mockPost]);
      mockedPrisma.blogPost.count.mockResolvedValue(1);

      const res = await request(app).get('/posts');

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter by status', async () => {
      mockedPrisma.blogPost.findMany.mockResolvedValue([]);
      mockedPrisma.blogPost.count.mockResolvedValue(0);

      await request(app).get('/posts?status=DRAFT');

      expect(mockedPrisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'DRAFT',
          }),
        })
      );
    });

    it('should filter by search term', async () => {
      mockedPrisma.blogPost.findMany.mockResolvedValue([]);
      mockedPrisma.blogPost.count.mockResolvedValue(0);

      await request(app).get('/posts?search=tarot');

      expect(mockedPrisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { titleEn: { contains: 'tarot', mode: 'insensitive' } },
              { titleFr: { contains: 'tarot', mode: 'insensitive' } },
              { slug: { contains: 'tarot', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should show deleted posts when deleted=true', async () => {
      mockedPrisma.blogPost.findMany.mockResolvedValue([]);
      mockedPrisma.blogPost.count.mockResolvedValue(0);

      await request(app).get('/posts?deleted=true');

      expect(mockedPrisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: { not: null },
          }),
        })
      );
    });
  });

  describe('GET /posts/:id', () => {
    it('should return post with categoryIds and tagIds', async () => {
      const mockPost = createMockPost();
      mockedPrisma.blogPost.findUnique.mockResolvedValue(mockPost);

      const res = await request(app).get('/posts/post-1');

      expect(res.status).toBe(200);
      expect(res.body.post.categoryIds).toEqual(['cat-1']);
      expect(res.body.post.tagIds).toEqual(['tag-1']);
    });

    it('should return 404 when post not found', async () => {
      mockedPrisma.blogPost.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/posts/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Post not found');
    });
  });

  describe('POST /posts', () => {
    it('should create post successfully with valid data', async () => {
      mockedPrisma.blogPost.findUnique.mockResolvedValue(null); // no slug conflict
      const createdPost = createMockPost({ slug: 'new-post' });
      mockedPrisma.blogPost.create.mockResolvedValue(createdPost);

      const res = await request(app).post('/posts').send(validCreateBody);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.post.slug).toBe('new-post');
    });

    it('should return 500 when slug already exists', async () => {
      mockedPrisma.blogPost.findUnique.mockResolvedValue({ id: 'existing' }); // slug conflict

      const res = await request(app).post('/posts').send(validCreateBody);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to create post');
    });

    it('should set publishedAt when status is PUBLISHED', async () => {
      mockedPrisma.blogPost.findUnique.mockResolvedValue(null);
      const createdPost = createMockPost({ status: 'PUBLISHED', publishedAt: new Date() });
      mockedPrisma.blogPost.create.mockResolvedValue(createdPost);

      await request(app)
        .post('/posts')
        .send({
          ...validCreateBody,
          status: 'PUBLISHED',
        });

      expect(mockedPrisma.blogPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should flush blog cache after creation', async () => {
      mockedPrisma.blogPost.findUnique.mockResolvedValue(null);
      mockedPrisma.blogPost.create.mockResolvedValue(createMockPost());

      await request(app).post('/posts').send(validCreateBody);

      expect(mockedCache.flushPattern).toHaveBeenCalledWith('blog:');
    });
  });

  describe('PATCH /posts/reorder', () => {
    it('should return 400 when missing required fields', async () => {
      const res = await request(app).patch('/posts/reorder').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required fields');
    });

    it('should return success when post is already at target position', async () => {
      const mockPost = createMockPost();
      mockedPrisma.blogPost.findUnique.mockResolvedValue(mockPost);
      mockedPrisma.blogPost.findMany.mockResolvedValue([
        { id: 'post-1', sortOrder: 0 },
        { id: 'post-2', sortOrder: 1 },
      ]);

      const res = await request(app).patch('/posts/reorder').send({
        postId: 'post-1',
        newPosition: 0,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('already at the target position');
    });

    it('should return 404 when post not found', async () => {
      mockedPrisma.blogPost.findUnique.mockResolvedValue(null);
      mockedPrisma.blogPost.findMany.mockResolvedValue([]);

      const res = await request(app).patch('/posts/reorder').send({
        postId: 'nonexistent',
        newPosition: 0,
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Post not found');
    });
  });

  describe('PATCH /posts/:id', () => {
    it('should update post successfully and flush cache', async () => {
      const currentPost = createMockPost();
      mockedPrisma.blogPost.findUnique.mockResolvedValue(currentPost);
      const updatedPost = createMockPost({ titleEn: 'Updated Title' });
      mockedPrisma.blogPost.update.mockResolvedValue(updatedPost);

      const res = await request(app).patch('/posts/post-1').send({
        titleEn: 'Updated Title',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockedCache.flushPattern).toHaveBeenCalledWith('blog:');
    });

    it('should return 404 when post not found', async () => {
      mockedPrisma.blogPost.findUnique.mockResolvedValue(null);

      const res = await request(app).patch('/posts/nonexistent').send({
        titleEn: 'Updated',
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Post not found');
    });

    it('should set publishedAt when transitioning to PUBLISHED', async () => {
      const currentPost = createMockPost({ status: 'DRAFT' });
      mockedPrisma.blogPost.findUnique.mockResolvedValue(currentPost);
      mockedPrisma.blogPost.update.mockResolvedValue(
        createMockPost({ status: 'PUBLISHED', publishedAt: new Date() })
      );

      await request(app).patch('/posts/post-1').send({
        status: 'PUBLISHED',
      });

      expect(mockedPrisma.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: expect.any(Date),
          }),
        })
      );
    });
  });
});

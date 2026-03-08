/**
 * Public blog routes (no authentication required)
 */

import { Router } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma, cacheService, CacheService, z } from './shared.js';
import { logger } from '../../lib/logger.js';
import {
  includeCategoriesAndTags,
  flattenCategories,
  flattenTags,
  extractCategoryIds,
} from '../shared/queryUtils.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { NotFoundError } from '../../shared/errors/ApplicationError.js';

const router = Router();

// View count buffer — flushes to DB periodically
const viewCountBuffer = new Map<string, number>();

function incrementViewCount(postId: string): void {
  viewCountBuffer.set(postId, (viewCountBuffer.get(postId) || 0) + 1);
}

async function flushViewCounts(): Promise<void> {
  if (viewCountBuffer.size === 0) return;
  const entries = [...viewCountBuffer.entries()];
  viewCountBuffer.clear();

  try {
    await Promise.all(
      entries.map(([id, count]) =>
        prisma.blogPost.update({
          where: { id },
          data: { viewCount: { increment: count } },
        })
      )
    );
  } catch (err) {
    logger.error('[ViewCount] Flush failed:', err);
  }
}

// Flush every 60 seconds
setInterval(() => {
  flushViewCounts().catch(() => {});
}, 60_000);

// Also flush on process exit
process.on('beforeExit', () => {
  flushViewCounts().catch(() => {});
});

// List published posts with pagination
router.get(
  '/posts',
  asyncHandler(async (req, res) => {
    const params = z
      .object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(50).default(12),
        category: z.string().optional(),
        tag: z.string().optional(),
        featured: z.coerce.boolean().optional(),
      })
      .parse(req.query);

    // Build cache key from sorted params
    const cacheKey = `blog:posts:${JSON.stringify({
      p: params.page,
      l: params.limit,
      c: params.category || '',
      t: params.tag || '',
      f: params.featured ?? '',
    })}`;

    // Check cache first
    const cached = await cacheService.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const where: Prisma.BlogPostWhereInput = {
      status: 'PUBLISHED',
      publishedAt: { not: null },
      deletedAt: null,
    };

    if (params.category) {
      where.categories = { some: { category: { slug: params.category } } };
    }
    if (params.tag) {
      where.tags = { some: { tag: { slug: params.tag } } };
    }
    if (params.featured !== undefined) {
      where.featured = params.featured;
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          slug: true,
          titleEn: true,
          titleFr: true,
          excerptEn: true,
          excerptFr: true,
          coverImage: true,
          coverImageAlt: true,
          coverImageAltFr: true,
          authorName: true,
          featured: true,
          viewCount: true,
          readTimeMinutes: true,
          publishedAt: true,
          contentType: true,
          cardType: true,
          categories: {
            include: {
              category: { select: { slug: true, nameEn: true, nameFr: true, color: true } },
            },
          },
          tags: {
            include: { tag: { select: { slug: true, nameEn: true, nameFr: true } } },
          },
        },
        orderBy: params.category
          ? [{ sortOrder: 'asc' }, { publishedAt: 'desc' }]
          : [{ featured: 'desc' }, { publishedAt: 'desc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    const response = {
      posts: posts.map(p => ({
        ...p,
        contentType: p.contentType,
        categories: flattenCategories(p.categories),
        tags: flattenTags(p.tags),
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };

    // Cache for 5 minutes
    await cacheService.set(cacheKey, response, CacheService.TTL.BLOG_POSTS);

    res.json(response);
  })
);

// Get single post by slug (with view count increment)
router.get(
  '/posts/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;

    // Check cache first (2 min TTL — views are batched separately)
    const cacheKey = `blog:post:${slug}`;
    const cached = await cacheService.get<{ post: { id: string }; relatedPosts: unknown[] }>(
      cacheKey
    );
    if (cached) {
      // Still count the view even on cache hit
      incrementViewCount(cached.post.id);
      res.json(cached);
      return;
    }

    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        publishedAt: { not: null },
      },
      include: includeCategoriesAndTags,
    });

    if (!post) {
      throw new NotFoundError('Post');
    }

    // Increment view count (batched, flushes every 60s)
    incrementViewCount(post.id);

    // Get related posts (same category, excluding current and deleted)
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { not: null },
        deletedAt: null,
        id: { not: post.id },
        categories: {
          some: {
            categoryId: { in: extractCategoryIds(post.categories) },
          },
        },
      },
      select: {
        slug: true,
        titleEn: true,
        titleFr: true,
        excerptEn: true,
        excerptFr: true,
        coverImage: true,
        publishedAt: true,
        readTimeMinutes: true,
      },
      take: 3,
      orderBy: { publishedAt: 'desc' },
    });

    const response = {
      post: {
        ...post,
        contentType: post.contentType,
        categories: flattenCategories(post.categories),
        tags: flattenTags(post.tags),
      },
      relatedPosts,
    };

    await cacheService.set(cacheKey, response, 120); // 2 min cache
    res.json(response);
  })
);

// List all categories
router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const cached = await cacheService.get<Record<string, unknown>>('blog:categories');
    if (cached) {
      res.json(cached);
      return;
    }

    const categories = await prisma.blogCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                post: {
                  status: 'PUBLISHED',
                  publishedAt: { not: null },
                  deletedAt: null,
                },
              },
            },
          },
        },
      },
    });

    const response = {
      categories: categories.map(c => ({
        ...c,
        postCount: c._count.posts,
      })),
    };

    await cacheService.set('blog:categories', response, CacheService.TTL.CATEGORIES);
    res.json(response);
  })
);

// List all tags with post counts
router.get(
  '/tags',
  asyncHandler(async (_req, res) => {
    const cached = await cacheService.get<Record<string, unknown>>('blog:tags');
    if (cached) {
      res.json(cached);
      return;
    }

    const tags = await prisma.blogTag.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                post: {
                  status: 'PUBLISHED',
                  publishedAt: { not: null },
                  deletedAt: null,
                },
              },
            },
          },
        },
      },
    });

    const response = {
      tags: tags.map(t => ({
        ...t,
        postCount: t._count.posts,
      })),
    };

    await cacheService.set('blog:tags', response, CacheService.TTL.TAGS);
    res.json(response);
  })
);

export { flushViewCounts };
export default router;

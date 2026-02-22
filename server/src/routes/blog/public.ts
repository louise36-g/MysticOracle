/**
 * Public blog routes (no authentication required)
 */

import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma, cacheService, CacheService, z } from './shared.js';

const router = Router();

// List published posts with pagination
router.get('/posts', async (req, res) => {
  try {
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
      return res.json(cached);
    }

    const where: Prisma.BlogPostWhereInput = {
      status: 'PUBLISHED',
      publishedAt: { not: null },
      deletedAt: null, // Exclude deleted posts
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
          authorName: true,
          featured: true,
          viewCount: true,
          readTimeMinutes: true,
          publishedAt: true,
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
        categories: p.categories.map(c => c.category),
        tags: p.tags.map(t => t.tag),
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
  } catch (error) {
    console.error('Error fetching posts:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post by slug (with view count increment)
router.get('/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        publishedAt: { not: null },
      },
      include: {
        categories: {
          include: { category: true },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count (non-blocking)
    prisma.blogPost
      .update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    // Get related posts (same category, excluding current and deleted)
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { not: null },
        deletedAt: null,
        id: { not: post.id },
        categories: {
          some: {
            categoryId: { in: post.categories.map(c => c.categoryId) },
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

    res.json({
      post: {
        ...post,
        categories: post.categories.map(c => c.category),
        tags: post.tags.map(t => t.tag),
      },
      relatedPosts,
    });
  } catch (error) {
    console.error('Error fetching post:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// List all categories
router.get('/categories', async (req, res) => {
  try {
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
                },
              },
            },
          },
        },
      },
    });

    res.json({
      categories: categories.map(c => ({
        ...c,
        postCount: c._count.posts,
      })),
    });
  } catch (error) {
    console.error(
      'Error fetching categories:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// List all tags with post counts
router.get('/tags', async (req, res) => {
  try {
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
                },
              },
            },
          },
        },
      },
    });

    res.json({
      tags: tags.map(t => ({
        ...t,
        postCount: t._count.posts,
      })),
    });
  } catch (error) {
    console.error('Error fetching tags:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

export default router;

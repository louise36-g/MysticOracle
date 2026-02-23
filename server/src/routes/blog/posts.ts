/**
 * Admin post CRUD routes
 */

import { Router } from 'express';
import { Prisma } from '@prisma/client';
import {
  prisma,
  cacheService,
  z,
  ConflictError,
  processBlogContent,
  debug,
  createPostSchema,
} from './shared.js';

const router = Router();

// Preview any post (admin only) - bypasses published status check
router.get('/preview/:id', async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id, deletedAt: null },
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

    // Transform to flat structure
    const transformedPost = {
      ...post,
      categories: post.categories.map(pc => pc.category),
      tags: post.tags.map(pt => pt.tag),
    };

    // Get related posts (same category) for preview
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
        readTimeMinutes: true,
      },
      take: 3,
      orderBy: { publishedAt: 'desc' },
    });

    res.json({ post: transformedPost, relatedPosts });
  } catch (error) {
    console.error('Preview post error:', error);
    res.status(500).json({ error: 'Failed to load post preview' });
  }
});

// List all posts (including drafts) for admin
router.get('/posts', async (req, res) => {
  try {
    const params = z
      .object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
        search: z.string().optional(),
        deleted: z.coerce.boolean().optional(), // true = show trash, false/undefined = show active
        category: z.string().optional(), // filter by category slug
      })
      .parse(req.query);

    const where: Prisma.BlogPostWhereInput = {};

    // Filter by deleted status
    if (params.deleted) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { titleEn: { contains: params.search, mode: 'insensitive' } },
        { titleFr: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.category) {
      where.categories = { some: { category: { slug: params.category } } };
    }

    // When filtering by category, order by sortOrder for drag-and-drop
    // Otherwise, order by updatedAt
    const orderBy = params.category
      ? { sortOrder: 'asc' as const }
      : { updatedAt: 'desc' as const };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
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
    });
  } catch (error) {
    console.error(
      'Error fetching admin posts:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post for editing
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      post: {
        ...post,
        categoryIds: post.categories.map(c => c.categoryId),
        tagIds: post.tags.map(t => t.tagId),
      },
    });
  } catch (error) {
    console.error('Error fetching post:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create post
router.post('/posts', async (req, res) => {
  try {
    const data = createPostSchema.parse(req.body);
    const { categoryIds, tagIds, faq, cta } = data;

    // Check slug uniqueness
    const existing = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ConflictError(`Post with slug "${data.slug}" already exists`);
    }

    // Process content to replace placeholder URLs
    const processedContent = processBlogContent(data.contentEn, data.contentFr);

    const post = await prisma.blogPost.create({
      data: {
        slug: data.slug,
        titleEn: data.titleEn,
        titleFr: data.titleFr,
        excerptEn: data.excerptEn,
        excerptFr: data.excerptFr,
        contentEn: processedContent.contentEn,
        contentFr: processedContent.contentFr || '',
        coverImage: data.coverImage,
        coverImageAlt: data.coverImageAlt,
        metaTitleEn: data.metaTitleEn,
        metaTitleFr: data.metaTitleFr,
        metaDescEn: data.metaDescEn,
        metaDescFr: data.metaDescFr,
        ogImage: data.ogImage,
        authorName: data.authorName,
        authorId: req.auth.userId,
        status: data.status,
        featured: data.featured,
        readTimeMinutes: data.readTimeMinutes,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        faq: faq ?? undefined,
        cta: cta ?? undefined,
        categories: {
          create: categoryIds.map(categoryId => ({ categoryId })),
        },
        tags: {
          create: tagIds.map(tagId => ({ tagId })),
        },
      },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    // Invalidate blog cache
    await cacheService.flushPattern('blog:');

    res.json({ success: true, post });
  } catch (error) {
    console.error('Error creating post:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Reorder blog post (for admin drag-and-drop within category)
// NOTE: This route MUST be defined BEFORE /posts/:id to avoid :id matching "reorder"
router.patch('/posts/reorder', async (req, res) => {
  try {
    const { postId, categorySlug, newPosition } = req.body;

    debug.log('=== REORDER REQUEST ===');
    debug.log('postId:', postId, 'type:', typeof postId);
    debug.log('categorySlug:', categorySlug);
    debug.log('newPosition:', newPosition);

    // Validate input
    if (!postId || typeof newPosition !== 'number') {
      debug.log('Validation failed: missing fields');
      return res.status(400).json({
        error: 'Missing required fields: postId, newPosition',
      });
    }

    if (newPosition < 0) {
      return res.status(400).json({
        error: 'newPosition must be >= 0',
      });
    }

    // Verify post exists
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      include: { categories: { include: { category: true } } },
    });

    if (!post) {
      // Debug: list some post IDs to compare
      const samplePosts = await prisma.blogPost.findMany({
        take: 5,
        select: { id: true, slug: true, deletedAt: true },
        orderBy: { updatedAt: 'desc' },
      });
      debug.log(
        'Post not found. Sample post IDs:',
        samplePosts.map(p => ({ id: p.id, slug: p.slug, deleted: !!p.deletedAt }))
      );
      return res.status(404).json({ error: 'Post not found' });
    }

    // Build where clause based on whether we're filtering by category
    const whereClause: Prisma.BlogPostWhereInput = {
      deletedAt: null,
    };

    if (categorySlug) {
      whereClause.categories = {
        some: { category: { slug: categorySlug } },
      };
    }

    // Get all posts in the same context (all posts or posts in category), ordered by current sortOrder
    const allPosts = await prisma.blogPost.findMany({
      where: whereClause,
      orderBy: { sortOrder: 'asc' },
      select: { id: true, sortOrder: true },
    });

    debug.log('Posts in context:', allPosts.length);
    debug.log('Requested newPosition:', newPosition);

    if (newPosition >= allPosts.length) {
      debug.log('Position exceeds post count');
      return res.status(400).json({
        error: `newPosition (${newPosition}) exceeds number of posts (${allPosts.length})`,
      });
    }

    // Reorder logic: remove post from old position, insert at new position
    const oldIndex = allPosts.findIndex(p => p.id === postId);
    if (oldIndex === -1) {
      return res.status(404).json({ error: 'Post not found in list' });
    }

    if (oldIndex === newPosition) {
      // No change needed
      return res.json({
        success: true,
        message: 'Post is already at the target position',
      });
    }

    // Remove from old position
    const [movedPost] = allPosts.splice(oldIndex, 1);
    // Insert at new position
    allPosts.splice(newPosition, 0, movedPost);

    // Update sortOrder for all posts in transaction
    await prisma.$transaction(
      allPosts.map((p, index) =>
        prisma.blogPost.update({
          where: { id: p.id },
          data: { sortOrder: index },
        })
      )
    );

    // Invalidate blog cache
    await cacheService.flushPattern('blog:');

    debug.log('Reorder successful');
    res.json({
      success: true,
      message: 'Post reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering post:', error);
    res.status(500).json({
      error: 'Failed to reorder post',
    });
  }
});

// Update post
router.patch('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = createPostSchema.partial().parse(req.body);
    const { categoryIds, tagIds, faq, cta, ...postData } = data;

    // Check slug uniqueness if changing
    if (postData.slug) {
      const existing = await prisma.blogPost.findFirst({
        where: { slug: postData.slug, id: { not: id } },
      });
      if (existing) {
        throw new ConflictError(`Post with slug "${postData.slug}" already exists`);
      }
    }

    // Get current post to check status change
    const current = await prisma.blogPost.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Set publishedAt if transitioning to published
    if (postData.status === 'PUBLISHED' && current.status !== 'PUBLISHED') {
      (postData as Record<string, unknown>).publishedAt = new Date();
    }

    // Process content to replace placeholder URLs
    if (postData.contentEn !== undefined || postData.contentFr !== undefined) {
      const processedContent = processBlogContent(
        postData.contentEn !== undefined ? postData.contentEn : current.contentEn,
        postData.contentFr !== undefined ? postData.contentFr : undefined
      );

      if (postData.contentEn !== undefined) {
        postData.contentEn = processedContent.contentEn;
      }
      if (postData.contentFr !== undefined) {
        postData.contentFr = processedContent.contentFr || '';
      }
    }

    // Update post
    const updateData: Prisma.BlogPostUpdateInput = { ...postData };

    // Handle FAQ and CTA updates
    if (faq !== undefined) {
      updateData.faq = faq ?? Prisma.JsonNull;
    }
    if (cta !== undefined) {
      updateData.cta = cta ?? Prisma.JsonNull;
    }

    // Handle category updates
    if (categoryIds !== undefined) {
      await prisma.blogPostCategory.deleteMany({ where: { postId: id } });
      updateData.categories = {
        create: categoryIds.map(categoryId => ({ categoryId })),
      };
    }

    // Handle tag updates
    if (tagIds !== undefined) {
      await prisma.blogPostTag.deleteMany({ where: { postId: id } });
      updateData.tags = {
        create: tagIds.map(tagId => ({ tagId })),
      };
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    // Invalidate blog cache
    await cacheService.flushPattern('blog:');

    res.json({ success: true, post });
  } catch (error) {
    console.error('Error updating post:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to update post' });
  }
});

export default router;

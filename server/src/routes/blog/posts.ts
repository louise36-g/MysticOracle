/**
 * Admin post CRUD routes
 */

import { Router } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import {
  prisma,
  cacheService,
  z,
  ConflictError,
  processBlogContent,
  createPostSchema,
} from './shared.js';
import {
  includeCategoriesAndTags,
  flattenCategories,
  flattenTags,
  extractCategoryIds,
  extractTagIds,
} from '../shared/queryUtils.js';
import { handleReorder } from '../shared/reorderUtils.js';

const router = Router();

// Preview any post (admin only) - bypasses published status check
router.get('/preview/:id', async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id, deletedAt: null },
      include: includeCategoriesAndTags,
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Transform to flat structure
    const transformedPost = {
      ...post,
      categories: flattenCategories(post.categories),
      tags: flattenTags(post.tags),
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
        contentType: z.enum(['BLOG_POST', 'TAROT_ARTICLE']).optional(),
      })
      .parse(req.query);

    const where: Prisma.BlogPostWhereInput = {};

    if (params.contentType) {
      where.contentType = params.contentType;
    }

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
    // createdAt tiebreaker ensures deterministic order when sortOrder values match
    // Otherwise, order by updatedAt
    const orderBy = params.category
      ? [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }]
      : { updatedAt: 'desc' as const };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: includeCategoriesAndTags,
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
      posts: posts.map(p => ({
        ...p,
        categories: flattenCategories(p.categories),
        tags: flattenTags(p.tags),
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
      include: includeCategoriesAndTags,
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      post: {
        ...post,
        categoryIds: extractCategoryIds(post.categories),
        tagIds: extractTagIds(post.tags),
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
      include: includeCategoriesAndTags,
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
router.patch('/posts/reorder', (req, res) => {
  handleReorder(
    {
      entityName: 'Post',
      getItemId: body => body.postId as string | undefined,
      findItem: id =>
        prisma.blogPost.findUnique({
          where: { id },
          include: { categories: { include: { category: true } } },
        }),
      buildWhereClause: body => {
        const where: Prisma.BlogPostWhereInput = { deletedAt: null };
        const { contentType, categorySlug, status } = body as Record<string, string>;
        if (contentType && ['BLOG_POST', 'TAROT_ARTICLE'].includes(contentType)) {
          where.contentType = contentType as Prisma.BlogPostWhereInput['contentType'];
        }
        if (categorySlug) {
          where.categories = { some: { category: { slug: categorySlug } } };
        }
        if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
          where.status = status as Prisma.BlogPostWhereInput['status'];
        }
        return where;
      },
      invalidateCache: async () => {
        await cacheService.flushPattern('blog:');
      },
    },
    req,
    res
  );
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
      include: includeCategoriesAndTags,
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

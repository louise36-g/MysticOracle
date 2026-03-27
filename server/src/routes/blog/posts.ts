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
import { taxonomyService } from '../../services/TaxonomyService.js';
import {
  includeCategoriesAndTags,
  flattenCategories,
  flattenTags,
  extractCategoryIds,
  extractTagIds,
} from '../shared/queryUtils.js';
import { handleReorder } from '../shared/reorderUtils.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { NotFoundError } from '../../shared/errors/ApplicationError.js';
import { parsePaginationParams, createPaginationMeta } from '../../shared/pagination/pagination.js';
import { notifyBlogPost } from '../../services/indexNowService.js';

const router = Router();

// Preview any post (admin only) - bypasses published status check
router.get(
  '/preview/:id',
  asyncHandler(async (req, res) => {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id, deletedAt: null },
      include: includeCategoriesAndTags,
    });

    if (!post) {
      throw new NotFoundError('Post');
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
  })
);

// List all posts (including drafts) for admin
router.get(
  '/posts',
  asyncHandler(async (req, res) => {
    const paginationParams = parsePaginationParams(req.query as Record<string, unknown>, 20, 100);
    const filters = z
      .object({
        status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
        search: z.string().optional(),
        deleted: z.coerce.boolean().optional(), // true = show trash, false/undefined = show active
        category: z.string().optional(), // filter by category slug
        contentType: z.enum(['BLOG_POST', 'TAROT_ARTICLE']).optional(),
      })
      .parse(req.query);

    const where: Prisma.BlogPostWhereInput = {};

    if (filters.contentType) {
      where.contentType = filters.contentType;
    }

    // Filter by deleted status
    if (filters.deleted) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { titleEn: { contains: filters.search, mode: 'insensitive' } },
        { titleFr: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.category) {
      where.categories = { some: { category: { slug: filters.category } } };
    }

    // When filtering by category, order by sortOrder for drag-and-drop
    // createdAt tiebreaker ensures deterministic order when sortOrder values match
    // Otherwise, order by updatedAt
    const orderBy = filters.category
      ? [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }]
      : { updatedAt: 'desc' as const };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        // Exclude heavy content/schema fields at DB level (loaded individually when editing)
        omit: {
          contentEn: true,
          contentFr: true,
          schemaJson: true,
          schemaHtml: true,
        },
        include: includeCategoriesAndTags,
        orderBy,
        skip: paginationParams.skip,
        take: paginationParams.take,
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
      posts: posts.map(p => ({
        ...p,
        categories: flattenCategories(p.categories),
        tags: flattenTags(p.tags),
      })),
      pagination: createPaginationMeta(paginationParams, total),
    });
  })
);

// Get single post for editing
router.get(
  '/posts/:id',
  asyncHandler(async (req, res) => {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id },
      include: includeCategoriesAndTags,
    });

    if (!post) {
      throw new NotFoundError('Post');
    }

    res.json({
      post: {
        ...post,
        categoryIds: extractCategoryIds(post.categories),
        tagIds: extractTagIds(post.tags),
      },
    });
  })
);

// Create post
router.post(
  '/posts',
  asyncHandler(async (req, res) => {
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

    // Invalidate blog + taxonomy cache (counts changed)
    await cacheService.flushPattern('blog:');
    await taxonomyService.invalidateAll();

    // Notify search engines via IndexNow if published on creation
    if (post.status === 'PUBLISHED' && post.slug) {
      notifyBlogPost(post.slug);
    }

    res.json({ success: true, post });
  })
);

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
router.patch(
  '/posts/:id',
  asyncHandler(async (req, res) => {
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
      throw new NotFoundError('Post');
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

    // Invalidate blog + taxonomy cache (counts may have changed)
    await cacheService.flushPattern('blog:');
    if (categoryIds !== undefined || tagIds !== undefined) {
      await taxonomyService.invalidateAll();
    }

    // Notify search engines via IndexNow if published
    if (post.status === 'PUBLISHED' && post.slug) {
      notifyBlogPost(post.slug);
    }

    res.json({ success: true, post });
  })
);

export default router;

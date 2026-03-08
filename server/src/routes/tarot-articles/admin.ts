/**
 * Admin Tarot Article Routes
 *
 * CRUD operations for tarot articles (admin only).
 * Requires authentication and admin privileges.
 *
 * Queries BlogPost table with contentType = 'TAROT_ARTICLE'
 * and transforms responses to the existing TarotArticle API shape.
 */

import { Router } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { NotFoundError } from '../../shared/errors/ApplicationError.js';
import {
  validateTarotArticle,
  validateArticleWithWarnings,
  convertToPrismaFormatLenient,
} from '../../lib/validation.js';
import { processArticleSchema, type TarotArticleData } from '../../lib/schema-builder.js';
import {
  prisma,
  cacheService,
  z,
  articleFullInclude,
  transformArticleResponse,
  mapBlogPostToTarotFields,
} from './shared.js';
import { handleReorder } from '../shared/reorderUtils.js';

const router = Router();

// Validation schema for list query params
const listArticlesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  cardType: z
    .enum(['MAJOR_ARCANA', 'SUIT_OF_WANDS', 'SUIT_OF_CUPS', 'SUIT_OF_SWORDS', 'SUIT_OF_PENTACLES'])
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
  deleted: z.coerce.boolean().optional(),
});

/**
 * Convert validated tarot article data to BlogPost create/update format.
 * Takes the output of convertToPrismaFormatLenient (TarotArticle field names)
 * and maps to BlogPost field names.
 */
function tarotToBlogPostData(prismaData: ReturnType<typeof convertToPrismaFormatLenient>) {
  return {
    titleEn: prismaData.title,
    excerptEn: prismaData.excerpt,
    contentEn: prismaData.content,
    authorName: prismaData.author,
    coverImage: prismaData.featuredImage,
    coverImageAlt: prismaData.featuredImageAlt,
    readTimeMinutes:
      typeof prismaData.readTime === 'string'
        ? parseInt(prismaData.readTime.replace(/[^0-9]/g, ''), 10) || 5
        : 5,
    metaTitleEn: prismaData.seoMetaTitle,
    metaDescEn: prismaData.seoMetaDescription,
    seoFocusKeyword: prismaData.seoFocusKeyword,
    slug: prismaData.slug,
    cardType: prismaData.cardType,
    cardNumber: prismaData.cardNumber,
    element: prismaData.element,
    astrologicalCorrespondence: prismaData.astrologicalCorrespondence,
    isCourtCard: prismaData.isCourtCard,
    isChallengeCard: prismaData.isChallengeCard,
    relatedCards: prismaData.relatedCards,
    faq: prismaData.faq,
    breadcrumbCategory: prismaData.breadcrumbCategory,
    breadcrumbCategoryUrl: prismaData.breadcrumbCategoryUrl,
    datePublished: prismaData.datePublished,
    dateModified: prismaData.dateModified,
    status: prismaData.status as Prisma.EnumBlogPostStatusFieldUpdateOperationsInput['set'],
    contentType: 'TAROT_ARTICLE' as const,
  };
}

/**
 * POST /admin/validate
 * Validate tarot article JSON with content quality checks
 */
router.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const result = validateTarotArticle(req.body);
    const warningMessages = result.warnings.map(w => w.message);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.errors || [],
        warnings: warningMessages,
        stats: result.stats,
        schema: null,
      });
    }

    let schema = null;
    try {
      const schemaResult = processArticleSchema(result.data as TarotArticleData);
      schema = schemaResult.schema;
    } catch {
      // Schema generation failed - not critical
    }

    res.json({
      success: true,
      errors: [],
      warnings: warningMessages,
      stats: result.stats,
      schema,
      data: result.data,
    });
  })
);

/**
 * POST /admin/import
 * Import and save a validated tarot article
 */
router.post(
  '/import',
  asyncHandler(async (req, res) => {
    const articleData = req.body;
    const forceMode = req.query.force === 'true';

    if (forceMode) {
      const warningsResult = validateArticleWithWarnings(articleData);
      const slug = warningsResult.data.slug;

      if (!slug) {
        return res.status(400).json({
          success: false,
          error: 'Slug is required even in force-save mode',
          errors: ['Slug is required'],
          warnings: warningsResult.warnings,
        });
      }

      const existingArticle = await prisma.blogPost.findUnique({ where: { slug } });
      if (existingArticle) {
        return res.status(409).json({
          success: false,
          error: `Article with slug "${slug}" already exists`,
          errors: [`Article with slug "${slug}" already exists`],
          warnings: warningsResult.warnings,
        });
      }

      const prismaData = convertToPrismaFormatLenient(warningsResult.data);
      const blogPostData = tarotToBlogPostData(prismaData);

      let schema: object | null = null;
      let schemaHtml = '';
      try {
        const schemaResult = processArticleSchema(warningsResult.data as TarotArticleData);
        schema = schemaResult.schema;
        schemaHtml = schemaResult.schemaHtml;
      } catch {
        warningsResult.warnings.push('[Schema] Could not generate structured data');
      }

      const article = await prisma.blogPost.create({
        data: {
          ...blogPostData,
          schemaJson: (schema as Prisma.InputJsonValue) || {},
          schemaHtml,
          status: 'DRAFT',
          contentType: 'TAROT_ARTICLE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await cacheService.invalidateTarot();

      return res.status(201).json({
        success: true,
        forceSaved: true,
        article: {
          id: article.id,
          title: article.titleEn,
          slug: article.slug,
          status: article.status,
        },
        warnings: warningsResult.warnings,
        stats: warningsResult.stats,
      });
    }

    // Standard validation mode
    const validationResult = validateTarotArticle(articleData);
    const warningMessages = validationResult.warnings.map(w => w.message);

    if (!validationResult.success || !validationResult.data) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validationResult.errors || [],
        warnings: warningMessages,
      });
    }

    const validatedData = validationResult.data;
    const slug = validatedData.slug || `article-${Date.now()}`;

    const existingArticle = await prisma.blogPost.findUnique({ where: { slug } });
    if (existingArticle) {
      return res.status(409).json({
        success: false,
        error: `Article with slug "${slug}" already exists`,
        errors: [`Article with slug "${slug}" already exists`],
        warnings: warningMessages,
      });
    }

    const dataForPrisma = { ...validatedData, slug } as Parameters<
      typeof convertToPrismaFormatLenient
    >[0];
    const prismaData = convertToPrismaFormatLenient(dataForPrisma);
    const blogPostData = tarotToBlogPostData(prismaData);

    let schema: object | null = null;
    let schemaHtml = '';
    try {
      const schemaResult = processArticleSchema(validatedData as TarotArticleData);
      schema = schemaResult.schema;
      schemaHtml = schemaResult.schemaHtml;
    } catch {
      warningMessages.push('Could not generate structured data schema');
    }

    const article = await prisma.blogPost.create({
      data: {
        ...blogPostData,
        schemaJson: (schema as Prisma.InputJsonValue) || {},
        schemaHtml,
        status: 'DRAFT',
        contentType: 'TAROT_ARTICLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await cacheService.invalidateTarot();

    res.status(201).json({
      success: true,
      article: {
        id: article.id,
        title: article.titleEn,
        slug: article.slug,
        status: article.status,
      },
      warnings: warningMessages,
      stats: validationResult.stats,
    });
  })
);

/**
 * GET /admin/list
 * List all tarot articles (including drafts)
 */
router.get(
  '/list',
  asyncHandler(async (req, res) => {
    const params = listArticlesSchema.parse(req.query);
    const { page, limit, cardType, status, search, deleted } = params;

    const where: Prisma.BlogPostWhereInput = {
      contentType: 'TAROT_ARTICLE',
    };

    if (deleted === true) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (cardType) where.cardType = cardType;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { titleEn: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          titleEn: true,
          titleFr: true,
          slug: true,
          excerptEn: true,
          excerptFr: true,
          contentEn: true,
          contentFr: true,
          coverImage: true,
          coverImageAlt: true,
          coverImageAltFr: true,
          cardType: true,
          cardNumber: true,
          datePublished: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          originalSlug: true,
          seoFocusKeyword: true,
          metaTitleEn: true,
          metaDescEn: true,
          seoFocusKeywordFr: true,
          metaTitleFr: true,
          metaDescFr: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.blogPost.count({ where }),
    ]);

    // Transform to TarotArticle API shape
    const transformedArticles = articles.map(a =>
      mapBlogPostToTarotFields(a as unknown as Record<string, unknown>)
    );

    res.json({
      articles: transformedArticles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

/**
 * GET /admin/preview/:id
 * Preview any article (bypasses published status check)
 */
router.get(
  '/preview/:id',
  asyncHandler(async (req, res) => {
    const article = await prisma.blogPost.findFirst({
      where: { id: req.params.id, contentType: 'TAROT_ARTICLE', deletedAt: null },
    });

    if (!article) {
      throw new NotFoundError('Article');
    }

    // Transform to TarotArticle API shape
    res.json(mapBlogPostToTarotFields(article as unknown as Record<string, unknown>));
  })
);

/**
 * GET /admin/:id
 * Get single article for editing
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const article = await prisma.blogPost.findFirst({
      where: { id, contentType: 'TAROT_ARTICLE' },
      include: articleFullInclude,
    });

    if (!article) {
      throw new NotFoundError('Article');
    }

    res.json(transformArticleResponse(article));
  })
);

/**
 * PATCH /admin/reorder
 * Reorder a tarot article within its card type
 */
router.patch('/reorder', (req, res) => {
  handleReorder(
    {
      entityName: 'Article',
      getItemId: body => body.articleId as string | undefined,
      findItem: id =>
        prisma.blogPost.findFirst({
          where: { id, contentType: 'TAROT_ARTICLE' },
        }) as Promise<Record<string, unknown> | null>,
      validateItem: (item, body) => {
        const { cardType } = body as Record<string, string>;
        if (!cardType) {
          return 'Missing required field: cardType';
        }
        if (item.cardType !== cardType) {
          return `Article cardType (${item.cardType}) does not match provided cardType (${cardType})`;
        }
        return null;
      },
      buildWhereClause: body => {
        const { cardType } = body as Record<string, string>;
        return {
          contentType: 'TAROT_ARTICLE',
          cardType: cardType as Prisma.EnumCardTypeNullableFilter['equals'],
          deletedAt: null,
        };
      },
      invalidateCache: () => cacheService.invalidateTarot(),
    },
    req,
    res
  );
});

/**
 * PATCH /admin/:id
 * Update a tarot article
 */
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const isVisualEditorMode = updates._visualEditorMode === true;
    const forceUpdate = req.query.force === 'true';

    const existingArticle = await prisma.blogPost.findFirst({
      where: { id, contentType: 'TAROT_ARTICLE' },
    });

    if (!existingArticle) {
      throw new NotFoundError('Article');
    }

    // Visual editor mode: partial updates without strict validation
    if (isVisualEditorMode) {
      delete updates._visualEditorMode;

      // Map TarotArticle field names to BlogPost field names
      const sanitizedUpdates: Record<string, unknown> = {};

      // Direct field mappings (TarotArticle name -> BlogPost name)
      if ('title' in updates) sanitizedUpdates.titleEn = updates.title;
      if ('titleFr' in updates) sanitizedUpdates.titleFr = updates.titleFr;
      if ('excerpt' in updates) sanitizedUpdates.excerptEn = updates.excerpt;
      if ('excerptFr' in updates) sanitizedUpdates.excerptFr = updates.excerptFr;
      if ('content' in updates) sanitizedUpdates.contentEn = updates.content;
      if ('contentFr' in updates) sanitizedUpdates.contentFr = updates.contentFr;
      if ('slug' in updates) sanitizedUpdates.slug = updates.slug;
      if ('author' in updates) sanitizedUpdates.authorName = updates.author;
      if ('readTime' in updates) {
        const match = String(updates.readTime).match(/(\d+)/);
        sanitizedUpdates.readTimeMinutes = match ? parseInt(match[1], 10) : 5;
      }
      if ('featuredImage' in updates) sanitizedUpdates.coverImage = updates.featuredImage;
      if ('featuredImageAlt' in updates) sanitizedUpdates.coverImageAlt = updates.featuredImageAlt;
      if ('featuredImageAltFr' in updates) {
        sanitizedUpdates.coverImageAltFr = updates.featuredImageAltFr;
      }
      if ('seoFocusKeyword' in updates) sanitizedUpdates.seoFocusKeyword = updates.seoFocusKeyword;
      if ('seoMetaTitle' in updates) sanitizedUpdates.metaTitleEn = updates.seoMetaTitle;
      if ('seoMetaDescription' in updates) sanitizedUpdates.metaDescEn = updates.seoMetaDescription;
      if ('seoFocusKeywordFr' in updates) {
        sanitizedUpdates.seoFocusKeywordFr = updates.seoFocusKeywordFr;
      }
      if ('seoMetaTitleFr' in updates) sanitizedUpdates.metaTitleFr = updates.seoMetaTitleFr;
      if ('seoMetaDescriptionFr' in updates) {
        sanitizedUpdates.metaDescFr = updates.seoMetaDescriptionFr;
      }

      // Fields that map 1:1
      const directFields = [
        'cardType',
        'cardNumber',
        'astrologicalCorrespondence',
        'element',
        'faq',
        'breadcrumbCategory',
        'breadcrumbCategoryUrl',
        'relatedCards',
        'isCourtCard',
        'isChallengeCard',
        'status',
      ];
      for (const key of directFields) {
        if (key in updates && updates[key] !== undefined) {
          sanitizedUpdates[key] = updates[key];
        }
      }

      if (
        sanitizedUpdates.status &&
        !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(sanitizedUpdates.status as string)
      ) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      // Extract category/tag name arrays before the main update
      const categoryNames: string[] | undefined = updates.categories;
      const tagNames: string[] | undefined = updates.tags;

      await prisma.blogPost.update({
        where: { id },
        data: { ...sanitizedUpdates, updatedAt: new Date() },
      });

      // Handle category updates (names -> IDs -> junction table)
      if (Array.isArray(categoryNames)) {
        await prisma.blogPostCategory.deleteMany({ where: { postId: id } });
        if (categoryNames.length > 0) {
          const categories = await prisma.blogCategory.findMany({
            where: { nameEn: { in: categoryNames } },
          });
          if (categories.length > 0) {
            await prisma.blogPostCategory.createMany({
              data: categories.map(c => ({ postId: id, categoryId: c.id })),
            });
          }
        }
      }

      // Handle tag updates (names -> IDs -> junction table)
      if (Array.isArray(tagNames)) {
        await prisma.blogPostTag.deleteMany({ where: { postId: id } });
        if (tagNames.length > 0) {
          const tags = await prisma.blogTag.findMany({
            where: { nameEn: { in: tagNames } },
          });
          if (tags.length > 0) {
            await prisma.blogPostTag.createMany({
              data: tags.map(t => ({ postId: id, tagId: t.id })),
            });
          }
        }
      }

      await cacheService.invalidateTarotArticle(
        existingArticle.slug,
        sanitizedUpdates.slug as string | undefined
      );

      // Re-fetch with relations so categories/tags are included in response
      const refreshedArticle = await prisma.blogPost.findFirst({
        where: { id, contentType: 'TAROT_ARTICLE' },
        include: articleFullInclude,
      });

      if (!refreshedArticle) {
        throw new NotFoundError('Article');
      }

      return res.json(transformArticleResponse(refreshedArticle));
    }

    // Full validation mode
    if (updates.title && updates.content && updates.slug) {
      if (forceUpdate) {
        const warningsResult = validateArticleWithWarnings(updates);
        const prismaData = convertToPrismaFormatLenient(warningsResult.data);
        const blogPostData = tarotToBlogPostData(prismaData);

        let schema: object | null = null;
        let schemaHtml = '';
        try {
          const schemaResult = processArticleSchema(warningsResult.data as TarotArticleData);
          schema = schemaResult.schema;
          schemaHtml = schemaResult.schemaHtml;
        } catch {
          warningsResult.warnings.push('[Schema] Could not generate structured data');
        }

        const updatedArticle = await prisma.blogPost.update({
          where: { id },
          data: {
            ...blogPostData,
            schemaJson: schema
              ? (schema as Prisma.InputJsonValue)
              : ((existingArticle.schemaJson as Prisma.InputJsonValue | undefined) ?? undefined),
            schemaHtml: schemaHtml || existingArticle.schemaHtml || '',
            updatedAt: new Date(),
          },
        });

        await cacheService.invalidateTarotArticle(existingArticle.slug, blogPostData.slug);

        return res.json({
          ...mapBlogPostToTarotFields(updatedArticle as unknown as Record<string, unknown>),
          _forceUpdated: true,
          _warnings: warningsResult.warnings,
          _stats: warningsResult.stats,
        });
      }

      // Standard validation
      const validationResult = validateTarotArticle(updates);
      const warningMessages = validationResult.warnings.map(w => w.message);

      if (!validationResult.success || !validationResult.data) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: validationResult.errors || [],
          warnings: warningMessages,
        });
      }

      const prismaData = convertToPrismaFormatLenient(
        validationResult.data as Parameters<typeof convertToPrismaFormatLenient>[0]
      );
      const blogPostData = tarotToBlogPostData(prismaData);

      let schema: object | null = null;
      let schemaHtml = '';
      try {
        const schemaResult = processArticleSchema(validationResult.data as TarotArticleData);
        schema = schemaResult.schema;
        schemaHtml = schemaResult.schemaHtml;
      } catch {
        warningMessages.push('Could not generate structured data schema');
      }

      const updatedArticle = await prisma.blogPost.update({
        where: { id },
        data: {
          ...blogPostData,
          schemaJson: schema
            ? (schema as Prisma.InputJsonValue)
            : ((existingArticle.schemaJson as Prisma.InputJsonValue | undefined) ?? undefined),
          schemaHtml: schemaHtml || existingArticle.schemaHtml || '',
          updatedAt: new Date(),
        },
      });

      await cacheService.invalidateTarotArticle(existingArticle.slug, blogPostData.slug);

      return res.json({
        ...mapBlogPostToTarotFields(updatedArticle as unknown as Record<string, unknown>),
        _warnings: warningMessages,
        _stats: validationResult.stats,
      });
    }

    // Simple status update
    const sanitizedUpdates: Record<string, unknown> = {};
    if ('status' in updates) {
      if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(updates.status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      sanitizedUpdates.status = updates.status;

      if (updates.status === 'PUBLISHED' && existingArticle.status !== 'PUBLISHED') {
        sanitizedUpdates.datePublished = new Date();
        sanitizedUpdates.publishedAt = new Date();
      }
    }

    const updatedArticle = await prisma.blogPost.update({
      where: { id },
      data: { ...sanitizedUpdates, updatedAt: new Date() },
    });

    await cacheService.invalidateTarotArticle(existingArticle.slug);

    res.json(mapBlogPostToTarotFields(updatedArticle as unknown as Record<string, unknown>));
  })
);

export default router;

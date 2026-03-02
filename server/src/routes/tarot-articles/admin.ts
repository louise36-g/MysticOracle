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
import { Prisma } from '@prisma/client';
import {
  validateTarotArticle,
  validateArticleWithWarnings,
  convertToPrismaFormatLenient,
} from '../../lib/validation.js';
import { processArticleSchema, type TarotArticleData } from '../../lib/schema-builder.js';
import { prisma, cacheService, z, articleFullInclude, transformArticleResponse } from './shared.js';

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
router.post('/validate', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

/**
 * POST /admin/import
 * Import and save a validated tarot article
 */
router.post('/import', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error importing tarot article:', error);
    res.status(500).json({
      success: false,
      error: 'Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      errors: ['Import failed'],
      warnings: [],
    });
  }
});

/**
 * GET /admin/list
 * List all tarot articles (including drafts)
 */
router.get('/list', async (req, res) => {
  try {
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
    const transformedArticles = articles.map(a => ({
      id: a.id,
      title: a.titleEn,
      titleFr: a.titleFr,
      slug: a.slug,
      excerpt: a.excerptEn,
      excerptFr: a.excerptFr,
      content: a.contentEn,
      contentFr: a.contentFr,
      featuredImage: a.coverImage || '',
      featuredImageAlt: a.coverImageAlt || '',
      featuredImageAltFr: a.coverImageAltFr || '',
      cardType: a.cardType,
      cardNumber: a.cardNumber,
      datePublished: a.datePublished,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      deletedAt: a.deletedAt,
      originalSlug: a.originalSlug,
      seoFocusKeyword: a.seoFocusKeyword || '',
      seoMetaTitle: a.metaTitleEn || '',
      seoMetaDescription: a.metaDescEn || '',
      seoFocusKeywordFr: a.seoFocusKeywordFr || '',
      seoMetaTitleFr: a.metaTitleFr || '',
      seoMetaDescriptionFr: a.metaDescFr || '',
    }));

    res.json({
      articles: transformedArticles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error listing tarot articles (admin):', error);
    res.status(500).json({ error: 'Failed to list articles' });
  }
});

/**
 * GET /admin/preview/:id
 * Preview any article (bypasses published status check)
 */
router.get('/preview/:id', async (req, res) => {
  try {
    const article = await prisma.blogPost.findFirst({
      where: { id: req.params.id, contentType: 'TAROT_ARTICLE', deletedAt: null },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Transform to TarotArticle API shape
    const bp = article as Record<string, unknown>;
    res.json({
      ...bp,
      title: article.titleEn,
      excerpt: article.excerptEn,
      content: article.contentEn,
      author: article.authorName,
      readTime: `${article.readTimeMinutes} min read`,
      featuredImage: article.coverImage || '',
      featuredImageAlt: article.coverImageAlt || '',
      featuredImageAltFr: article.coverImageAltFr || '',
      seoFocusKeyword: article.seoFocusKeyword || '',
      seoMetaTitle: article.metaTitleEn || '',
      seoMetaDescription: article.metaDescEn || '',
      seoFocusKeywordFr: article.seoFocusKeywordFr || '',
      seoMetaTitleFr: article.metaTitleFr || '',
      seoMetaDescriptionFr: article.metaDescFr || '',
      categories: [] as string[],
      tags: [] as string[],
    });
  } catch (error) {
    console.error('Error previewing tarot article:', error);
    res.status(500).json({ error: 'Failed to preview article' });
  }
});

/**
 * GET /admin/:id
 * Get single article for editing
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const article = await prisma.blogPost.findFirst({
      where: { id, contentType: 'TAROT_ARTICLE' },
      include: articleFullInclude,
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(transformArticleResponse(article));
  } catch (error) {
    console.error('Error fetching single tarot article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

/**
 * PATCH /admin/reorder
 * Reorder a tarot article within its card type
 */
router.patch('/reorder', async (req, res) => {
  try {
    const { articleId, cardType, newPosition } = req.body;

    if (!articleId || !cardType || typeof newPosition !== 'number') {
      return res.status(400).json({
        error: 'Missing required fields: articleId, cardType, newPosition',
      });
    }

    if (newPosition < 0) {
      return res.status(400).json({ error: 'newPosition must be >= 0' });
    }

    const article = await prisma.blogPost.findFirst({
      where: { id: articleId, contentType: 'TAROT_ARTICLE' },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.cardType !== cardType) {
      return res.status(400).json({
        error: `Article cardType (${article.cardType}) does not match provided cardType (${cardType})`,
      });
    }

    const articles = await prisma.blogPost.findMany({
      where: {
        contentType: 'TAROT_ARTICLE',
        cardType: cardType as Prisma.EnumCardTypeNullableFilter['equals'],
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, sortOrder: true },
    });

    if (newPosition >= articles.length) {
      return res.status(400).json({
        error: `newPosition (${newPosition}) exceeds number of articles (${articles.length})`,
      });
    }

    const oldIndex = articles.findIndex(a => a.id === articleId);
    if (oldIndex === -1) {
      return res.status(404).json({ error: 'Article not found in card type' });
    }

    if (oldIndex === newPosition) {
      return res.json({ success: true, message: 'Article is already at the target position' });
    }

    const [movedArticle] = articles.splice(oldIndex, 1);
    articles.splice(newPosition, 0, movedArticle);

    await prisma.$transaction(
      articles.map((article, index) =>
        prisma.blogPost.update({
          where: { id: article.id },
          data: { sortOrder: index },
        })
      )
    );

    await cacheService.invalidateTarot();

    res.json({ success: true, message: 'Article reordered successfully' });
  } catch (error) {
    console.error('Error reordering article:', error);
    res.status(500).json({ error: 'Failed to reorder article' });
  }
});

/**
 * PATCH /admin/:id
 * Update a tarot article
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const isVisualEditorMode = updates._visualEditorMode === true;
    const forceUpdate = req.query.force === 'true';

    const existingArticle = await prisma.blogPost.findFirst({
      where: { id, contentType: 'TAROT_ARTICLE' },
    });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
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
      if ('featuredImageAltFr' in updates)
        sanitizedUpdates.coverImageAltFr = updates.featuredImageAltFr;
      if ('seoFocusKeyword' in updates) sanitizedUpdates.seoFocusKeyword = updates.seoFocusKeyword;
      if ('seoMetaTitle' in updates) sanitizedUpdates.metaTitleEn = updates.seoMetaTitle;
      if ('seoMetaDescription' in updates) sanitizedUpdates.metaDescEn = updates.seoMetaDescription;
      if ('seoFocusKeywordFr' in updates)
        sanitizedUpdates.seoFocusKeywordFr = updates.seoFocusKeywordFr;
      if ('seoMetaTitleFr' in updates) sanitizedUpdates.metaTitleFr = updates.seoMetaTitleFr;
      if ('seoMetaDescriptionFr' in updates)
        sanitizedUpdates.metaDescFr = updates.seoMetaDescriptionFr;

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

      const updatedArticle = await prisma.blogPost.update({
        where: { id },
        data: { ...sanitizedUpdates, updatedAt: new Date() },
      });

      await cacheService.invalidateTarotArticle(
        existingArticle.slug,
        sanitizedUpdates.slug as string | undefined
      );

      // Return in TarotArticle API shape
      const bp = updatedArticle as Record<string, unknown>;
      return res.json({
        ...bp,
        title: updatedArticle.titleEn,
        excerpt: updatedArticle.excerptEn,
        content: updatedArticle.contentEn,
        author: updatedArticle.authorName,
        readTime: `${updatedArticle.readTimeMinutes} min read`,
        featuredImage: updatedArticle.coverImage || '',
        featuredImageAlt: updatedArticle.coverImageAlt || '',
        featuredImageAltFr: updatedArticle.coverImageAltFr || '',
        seoFocusKeyword: updatedArticle.seoFocusKeyword || '',
        seoMetaTitle: updatedArticle.metaTitleEn || '',
        seoMetaDescription: updatedArticle.metaDescEn || '',
        seoFocusKeywordFr: updatedArticle.seoFocusKeywordFr || '',
        seoMetaTitleFr: updatedArticle.metaTitleFr || '',
        seoMetaDescriptionFr: updatedArticle.metaDescFr || '',
        categories: [] as string[],
        tags: [] as string[],
      });
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

        const bp = updatedArticle as Record<string, unknown>;
        return res.json({
          ...bp,
          title: updatedArticle.titleEn,
          excerpt: updatedArticle.excerptEn,
          content: updatedArticle.contentEn,
          author: updatedArticle.authorName,
          readTime: `${updatedArticle.readTimeMinutes} min read`,
          featuredImage: updatedArticle.coverImage || '',
          featuredImageAlt: updatedArticle.coverImageAlt || '',
          seoMetaTitle: updatedArticle.metaTitleEn || '',
          seoMetaDescription: updatedArticle.metaDescEn || '',
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

      const bp = updatedArticle as Record<string, unknown>;
      return res.json({
        ...bp,
        title: updatedArticle.titleEn,
        excerpt: updatedArticle.excerptEn,
        content: updatedArticle.contentEn,
        author: updatedArticle.authorName,
        readTime: `${updatedArticle.readTimeMinutes} min read`,
        featuredImage: updatedArticle.coverImage || '',
        featuredImageAlt: updatedArticle.coverImageAlt || '',
        seoMetaTitle: updatedArticle.metaTitleEn || '',
        seoMetaDescription: updatedArticle.metaDescEn || '',
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

    const bp = updatedArticle as Record<string, unknown>;
    res.json({
      ...bp,
      title: updatedArticle.titleEn,
      excerpt: updatedArticle.excerptEn,
      content: updatedArticle.contentEn,
      author: updatedArticle.authorName,
      readTime: `${updatedArticle.readTimeMinutes} min read`,
      featuredImage: updatedArticle.coverImage || '',
      featuredImageAlt: updatedArticle.coverImageAlt || '',
      seoMetaTitle: updatedArticle.metaTitleEn || '',
      seoMetaDescription: updatedArticle.metaDescEn || '',
    });
  } catch (error) {
    console.error('Error updating tarot article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

export default router;

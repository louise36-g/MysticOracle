/**
 * Admin Tarot Article Routes
 *
 * CRUD operations for tarot articles (admin only).
 * Requires authentication and admin privileges.
 */

import { Router } from 'express';
import { Prisma } from '@prisma/client';
import {
  validateTarotArticle,
  validateArticleWithWarnings,
  convertToPrismaFormatLenient,
} from '../../lib/validation.js';
import { processArticleSchema, type TarotArticleData } from '../../lib/schema-builder.js';
import { prisma, cacheService, z, articleFullFields, transformArticleResponse } from './shared.js';

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

      const existingArticle = await prisma.tarotArticle.findUnique({ where: { slug } });
      if (existingArticle) {
        return res.status(409).json({
          success: false,
          error: `Article with slug "${slug}" already exists`,
          errors: [`Article with slug "${slug}" already exists`],
          warnings: warningsResult.warnings,
        });
      }

      const prismaData = convertToPrismaFormatLenient(warningsResult.data);

      let schema: object | null = null;
      let schemaHtml = '';
      try {
        const schemaResult = processArticleSchema(warningsResult.data as TarotArticleData);
        schema = schemaResult.schema;
        schemaHtml = schemaResult.schemaHtml;
      } catch {
        warningsResult.warnings.push('[Schema] Could not generate structured data');
      }

      const article = await prisma.tarotArticle.create({
        data: {
          ...prismaData,
          schemaJson: (schema as Prisma.InputJsonValue) || {},
          schemaHtml,
          status: 'DRAFT',
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
          title: article.title,
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

    const existingArticle = await prisma.tarotArticle.findUnique({ where: { slug } });
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

    let schema: object | null = null;
    let schemaHtml = '';
    try {
      const schemaResult = processArticleSchema(validatedData as TarotArticleData);
      schema = schemaResult.schema;
      schemaHtml = schemaResult.schemaHtml;
    } catch {
      warningMessages.push('Could not generate structured data schema');
    }

    const article = await prisma.tarotArticle.create({
      data: {
        ...prismaData,
        schemaJson: (schema as Prisma.InputJsonValue) || {},
        schemaHtml,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await cacheService.invalidateTarot();

    res.status(201).json({
      success: true,
      article: { id: article.id, title: article.title, slug: article.slug, status: article.status },
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

    const where: Prisma.TarotArticleWhereInput = {};

    if (deleted === true) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (cardType) where.cardType = cardType;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.tarotArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          titleFr: true,
          slug: true,
          excerpt: true,
          excerptFr: true,
          content: true,
          contentFr: true,
          featuredImage: true,
          featuredImageAlt: true,
          featuredImageAltFr: true,
          cardType: true,
          cardNumber: true,
          datePublished: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          originalSlug: true,
          seoFocusKeyword: true,
          seoMetaTitle: true,
          seoMetaDescription: true,
          seoFocusKeywordFr: true,
          seoMetaTitleFr: true,
          seoMetaDescriptionFr: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.tarotArticle.count({ where }),
    ]);

    res.json({
      articles,
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
    const article = await prisma.tarotArticle.findUnique({
      where: { id: req.params.id, deletedAt: null },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
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

    const article = await prisma.tarotArticle.findUnique({
      where: { id },
      include: articleFullFields,
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

    const article = await prisma.tarotArticle.findUnique({ where: { id: articleId } });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.cardType !== cardType) {
      return res.status(400).json({
        error: `Article cardType (${article.cardType}) does not match provided cardType (${cardType})`,
      });
    }

    const articles = await prisma.tarotArticle.findMany({
      where: { cardType: cardType as Prisma.EnumCardTypeFilter, deletedAt: null },
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
        prisma.tarotArticle.update({
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

    const existingArticle = await prisma.tarotArticle.findUnique({ where: { id } });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Visual editor mode: partial updates without strict validation
    if (isVisualEditorMode) {
      delete updates._visualEditorMode;

      const allowedFields = [
        'title',
        'titleFr',
        'excerpt',
        'excerptFr',
        'content',
        'contentFr',
        'slug',
        'author',
        'readTime',
        'featuredImage',
        'featuredImageAlt',
        'featuredImageAltFr',
        'cardType',
        'cardNumber',
        'astrologicalCorrespondence',
        'element',
        'categories',
        'tags',
        'faq',
        'breadcrumbCategory',
        'breadcrumbCategoryUrl',
        'relatedCards',
        'isCourtCard',
        'isChallengeCard',
        'status',
        'seoFocusKeyword',
        'seoMetaTitle',
        'seoMetaDescription',
        'seoFocusKeywordFr',
        'seoMetaTitleFr',
        'seoMetaDescriptionFr',
      ];

      const sanitizedUpdates: Record<string, unknown> = {};
      for (const key of allowedFields) {
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

      const updatedArticle = await prisma.tarotArticle.update({
        where: { id },
        data: { ...sanitizedUpdates, updatedAt: new Date() },
      });

      await cacheService.invalidateTarotArticle(
        existingArticle.slug,
        sanitizedUpdates.slug as string | undefined
      );

      return res.json(updatedArticle);
    }

    // Full validation mode
    if (updates.title && updates.content && updates.slug) {
      if (forceUpdate) {
        const warningsResult = validateArticleWithWarnings(updates);
        const prismaData = convertToPrismaFormatLenient(warningsResult.data);

        let schema: object | null = null;
        let schemaHtml = '';
        try {
          const schemaResult = processArticleSchema(warningsResult.data as TarotArticleData);
          schema = schemaResult.schema;
          schemaHtml = schemaResult.schemaHtml;
        } catch {
          warningsResult.warnings.push('[Schema] Could not generate structured data');
        }

        const updatedArticle = await prisma.tarotArticle.update({
          where: { id },
          data: {
            ...prismaData,
            schemaJson: schema
              ? (schema as Prisma.InputJsonValue)
              : ((existingArticle.schemaJson as Prisma.InputJsonValue | undefined) ?? undefined),
            schemaHtml: schemaHtml || existingArticle.schemaHtml,
            updatedAt: new Date(),
          },
        });

        await cacheService.invalidateTarotArticle(existingArticle.slug, prismaData.slug);

        return res.json({
          ...updatedArticle,
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

      let schema: object | null = null;
      let schemaHtml = '';
      try {
        const schemaResult = processArticleSchema(validationResult.data as TarotArticleData);
        schema = schemaResult.schema;
        schemaHtml = schemaResult.schemaHtml;
      } catch {
        warningMessages.push('Could not generate structured data schema');
      }

      const updatedArticle = await prisma.tarotArticle.update({
        where: { id },
        data: {
          ...prismaData,
          schemaJson: schema
            ? (schema as Prisma.InputJsonValue)
            : ((existingArticle.schemaJson as Prisma.InputJsonValue | undefined) ?? undefined),
          schemaHtml: schemaHtml || existingArticle.schemaHtml,
          updatedAt: new Date(),
        },
      });

      await cacheService.invalidateTarotArticle(existingArticle.slug, prismaData.slug);

      return res.json({
        ...updatedArticle,
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
      }
    }

    const updatedArticle = await prisma.tarotArticle.update({
      where: { id },
      data: { ...sanitizedUpdates, updatedAt: new Date() },
    });

    await cacheService.invalidateTarotArticle(existingArticle.slug);

    res.json(updatedArticle);
  } catch (error) {
    console.error('Error updating tarot article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../db/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  validateTarotArticle,
  validateArticleWithWarnings,
  convertToPrismaFormat,
  convertToPrismaFormatLenient,
} from '../lib/validation.js';
import { processArticleSchema, type TarotArticleData } from '../lib/schema-builder.js';
import { cacheService, CacheService } from '../services/cache.js';

// Note: Media is now handled by the shared blog media system
// See /api/blog/admin/media endpoints in blog.ts

const router = Router();

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * GET /api/tarot-articles/overview
 * Fetch overview data: first 5 cards per category + counts
 * NOTE: This must be defined BEFORE /:slug to avoid being matched as a slug
 */
router.get('/overview', async (req, res) => {
  try {
    const cacheKey = 'tarot:overview';

    // Check cache first
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const cardTypes = [
      'MAJOR_ARCANA',
      'SUIT_OF_WANDS',
      'SUIT_OF_CUPS',
      'SUIT_OF_SWORDS',
      'SUIT_OF_PENTACLES',
    ] as const;

    const selectFields = {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      featuredImageAlt: true,
      cardType: true,
      cardNumber: true,
      readTime: true,
    };

    // Fetch all cards per category in parallel (no DB sorting - done in JS for numeric correctness)
    const [majorArcana, wands, cups, swords, pentacles] = await Promise.all([
      prisma.tarotArticle.findMany({
        where: { cardType: 'MAJOR_ARCANA', status: 'PUBLISHED', deletedAt: null },
        select: selectFields,
      }),
      prisma.tarotArticle.findMany({
        where: { cardType: 'SUIT_OF_WANDS', status: 'PUBLISHED', deletedAt: null },
        select: selectFields,
      }),
      prisma.tarotArticle.findMany({
        where: { cardType: 'SUIT_OF_CUPS', status: 'PUBLISHED', deletedAt: null },
        select: selectFields,
      }),
      prisma.tarotArticle.findMany({
        where: { cardType: 'SUIT_OF_SWORDS', status: 'PUBLISHED', deletedAt: null },
        select: selectFields,
      }),
      prisma.tarotArticle.findMany({
        where: { cardType: 'SUIT_OF_PENTACLES', status: 'PUBLISHED', deletedAt: null },
        select: selectFields,
      }),
    ]);

    // Sort numerically (cardNumber is stored as string)
    const sortByCardNumber = (a: { cardNumber: string }, b: { cardNumber: string }) => {
      const numA = parseInt(a.cardNumber, 10) || 0;
      const numB = parseInt(b.cardNumber, 10) || 0;
      return numA - numB;
    };

    // Sort all arrays numerically by cardNumber
    const sortedMajorArcana = majorArcana.sort(sortByCardNumber);
    const sortedWands = wands.sort(sortByCardNumber);
    const sortedCups = cups.sort(sortByCardNumber);
    const sortedSwords = swords.sort(sortByCardNumber);
    const sortedPentacles = pentacles.sort(sortByCardNumber);

    const result = {
      majorArcana: sortedMajorArcana,
      wands: sortedWands,
      cups: sortedCups,
      swords: sortedSwords,
      pentacles: sortedPentacles,
      counts: {
        majorArcana: sortedMajorArcana.length,
        wands: sortedWands.length,
        cups: sortedCups.length,
        swords: sortedSwords.length,
        pentacles: sortedPentacles.length,
      },
    };

    // Cache result for 5 minutes
    await cacheService.set(cacheKey, result, CacheService.TTL.ARTICLES);

    res.json(result);
  } catch (error) {
    console.error('Error fetching tarot overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview data' });
  }
});

/**
 * GET /api/tarot-articles/:slug
 * Fetch a single published tarot article by slug
 * NOTE: This must be defined AFTER specific routes like /overview
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `tarot:article:${slug}`;

    // Check cache first
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const article = await prisma.tarotArticle.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        deletedAt: null, // Exclude deleted articles
      },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Cache for 10 minutes
    await cacheService.set(cacheKey, article, CacheService.TTL.ARTICLE);

    res.json(article);
  } catch (error) {
    console.error('Error fetching tarot article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

/**
 * GET /api/tarot-articles
 * List published tarot articles with pagination and filters
 */
const listArticlesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  cardType: z
    .enum(['MAJOR_ARCANA', 'SUIT_OF_WANDS', 'SUIT_OF_CUPS', 'SUIT_OF_SWORDS', 'SUIT_OF_PENTACLES'])
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
  deleted: z.coerce.boolean().optional(), // true = show trash, false/undefined = show active
  sortBy: z.enum(['datePublished', 'cardNumber']).optional(), // cardNumber for tarot card order
});

router.get('/', async (req, res) => {
  try {
    const params = listArticlesSchema.parse(req.query);
    const { page, limit, cardType, status, sortBy } = params;

    const where: Prisma.TarotArticleWhereInput = {
      status: status || 'PUBLISHED', // Default to published only
      deletedAt: null, // Exclude deleted articles from public list
    };

    if (cardType) {
      where.cardType = cardType;
    }

    const selectFields = {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      featuredImageAlt: true,
      cardType: true,
      cardNumber: true,
      datePublished: true,
      readTime: true,
      tags: true,
      categories: true,
      status: true,
    };

    // For cardNumber sorting, we need to fetch all and sort in JS (cardNumber is stored as string)
    if (sortBy === 'cardNumber') {
      const [allArticles, total] = await Promise.all([
        prisma.tarotArticle.findMany({
          where,
          select: selectFields,
        }),
        prisma.tarotArticle.count({ where }),
      ]);

      // Sort numerically by cardNumber
      const sorted = allArticles.sort((a, b) => {
        const numA = parseInt(a.cardNumber || '0', 10);
        const numB = parseInt(b.cardNumber || '0', 10);
        return numA - numB;
      });

      // Apply pagination after sorting
      const paginated = sorted.slice((page - 1) * limit, page * limit);

      return res.json({
        articles: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Default: sort by datePublished desc with DB pagination
    const [articles, total] = await Promise.all([
      prisma.tarotArticle.findMany({
        where,
        select: selectFields,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { datePublished: 'desc' },
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
    console.error('Error listing tarot articles:', error);
    res.status(500).json({ error: 'Failed to list articles' });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// All admin routes require authentication AND admin privileges
router.use('/admin', requireAuth);
router.use('/admin', requireAdmin);

/**
 * POST /api/tarot-articles/admin/validate
 * Validate tarot article JSON with content quality checks
 * Uses two-tier validation: core errors (blocking) and quality warnings (non-blocking)
 */
router.post('/admin/validate', async (req, res) => {
  try {
    const result = validateTarotArticle(req.body);

    // Convert QualityWarning[] to string[] for frontend compatibility
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

    // Generate schema preview for valid articles
    let schema = null;
    try {
      const schemaResult = processArticleSchema(result.data as TarotArticleData);
      schema = schemaResult.schema;
    } catch {
      // Schema generation failed - not critical for validation
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
 * POST /api/tarot-articles/admin/import
 * Import and save a validated tarot article to the database
 *
 * Query params:
 * - force=true: Force-save mode - bypasses all validation entirely
 *
 * Standard mode uses two-tier validation:
 * - Core errors (blocking) - must be fixed before import
 * - Quality warnings (non-blocking) - returned in response for review
 */
router.post('/admin/import', async (req, res) => {
  try {
    const articleData = req.body;
    const forceMode = req.query.force === 'true';

    if (forceMode) {
      // Force-save mode: use warnings-only validation (bypasses all validation)
      const warningsResult = validateArticleWithWarnings(articleData);

      // Check for slug even in force mode (database constraint)
      const slug = warningsResult.data.slug;
      if (!slug) {
        return res.status(400).json({
          success: false,
          error: 'Slug is required even in force-save mode',
          errors: ['Slug is required even in force-save mode'],
          warnings: warningsResult.warnings,
        });
      }

      // Check if article with this slug already exists
      const existingArticle = await prisma.tarotArticle.findUnique({
        where: { slug },
      });

      if (existingArticle) {
        return res.status(409).json({
          success: false,
          error: `Article with slug "${slug}" already exists`,
          errors: [`Article with slug "${slug}" already exists`],
          warnings: warningsResult.warnings,
        });
      }

      // Convert to Prisma format with defaults for missing fields
      const prismaData = convertToPrismaFormatLenient(warningsResult.data);

      // Try to generate schema (may fail with incomplete data)
      let schema: object | null = null;
      let schemaHtml = '';
      try {
        const schemaResult = processArticleSchema(warningsResult.data as TarotArticleData);
        schema = schemaResult.schema;
        schemaHtml = schemaResult.schemaHtml;
      } catch (schemaError) {
        // Schema generation failed - add as warning but continue
        warningsResult.warnings.push(
          '[Schema] Could not generate structured data - article may need additional fields'
        );
      }

      // Create the article in the database
      const article = await prisma.tarotArticle.create({
        data: {
          ...prismaData,
          schemaJson: (schema as any) || {},
          schemaHtml,
          status: 'DRAFT', // Force-saved articles always start as draft
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Invalidate cache for overview (new article added)
      await cacheService.del('tarot:overview');

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

    // Standard mode: two-tier validation (core errors block, quality warnings don't)
    const validationResult = validateTarotArticle(articleData);

    // Convert QualityWarning[] to string[] for frontend compatibility
    const warningMessages = validationResult.warnings.map(w => w.message);

    if (!validationResult.success || !validationResult.data) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validationResult.errors || [],
        warnings: warningMessages,
      });
    }

    // At this point, validationResult.data is guaranteed to exist
    const validatedData = validationResult.data;

    // Check if article with this slug already exists
    const slug = validatedData.slug || `article-${Date.now()}`;
    const existingArticle = await prisma.tarotArticle.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      return res.status(409).json({
        success: false,
        error: `Article with slug "${slug}" already exists`,
        errors: [`Article with slug "${slug}" already exists`],
        warnings: warningMessages,
      });
    }

    // Convert to Prisma format (maps display names to enum keys)
    // Note: Core schema allows optional slug, so we need to handle that
    const dataForPrisma = { ...validatedData, slug } as any;
    const prismaData = convertToPrismaFormatLenient(dataForPrisma);

    // Generate schema for the article
    let schema: object | null = null;
    let schemaHtml = '';
    try {
      const schemaResult = processArticleSchema(validatedData as TarotArticleData);
      schema = schemaResult.schema;
      schemaHtml = schemaResult.schemaHtml;
    } catch {
      // Schema generation failed - add as warning but continue
      warningMessages.push('Could not generate structured data schema');
    }

    // Create the article in the database
    const article = await prisma.tarotArticle.create({
      data: {
        ...prismaData,
        schemaJson: (schema as any) || {},
        schemaHtml,
        status: 'DRAFT', // Import as draft by default
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Invalidate cache for overview (new article added)
    await cacheService.del('tarot:overview');

    res.status(201).json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
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
      errors: ['Import failed: ' + (error instanceof Error ? error.message : 'Unknown error')],
      warnings: [],
    });
  }
});

/**
 * GET /api/tarot-articles/admin/list
 * List all tarot articles (including drafts) - admin only
 */
router.get('/admin/list', async (req, res) => {
  try {
    const params = listArticlesSchema.parse(req.query);
    const { page, limit, cardType, status, search, deleted } = params;

    const where: Prisma.TarotArticleWhereInput = {};

    // Filter by trash status
    if (deleted === true) {
      where.deletedAt = { not: null }; // Show only trashed articles
    } else {
      where.deletedAt = null; // Show only active articles (default)
    }

    if (cardType) {
      where.cardType = cardType;
    }

    if (status) {
      where.status = status;
    }

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
          slug: true,
          excerpt: true,
          content: true, // Add content for word count
          featuredImage: true,
          featuredImageAlt: true,
          cardType: true,
          cardNumber: true,
          datePublished: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          originalSlug: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
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
 * GET /api/tarot-articles/admin/preview/:id
 * Preview any article (admin only) - bypasses published status check
 * NOTE: This route MUST be before /admin/:id to avoid 'preview' being captured as an ID
 */
router.get('/admin/preview/:id', async (req, res) => {
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
 * GET /api/tarot-articles/admin/:id
 * Get single article for editing - admin only
 */
router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const article = await prisma.tarotArticle.findUnique({
      where: { id },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Error fetching single tarot article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

/**
 * PATCH /api/tarot-articles/admin/:id
 * Update a tarot article - admin only
 * Supports both:
 * - Full validation mode (for JSON import updates) - uses two-tier validation
 * - Visual editor mode (for field-by-field updates from TarotArticleEditor)
 *
 * Query params:
 * - force=true: Force-update mode - bypasses all validation entirely
 */
router.patch('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const isVisualEditorMode = updates._visualEditorMode === true;
    const forceUpdate = req.query.force === 'true';

    // Check if article exists
    const existingArticle = await prisma.tarotArticle.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Visual editor mode: allow partial updates without strict validation
    if (isVisualEditorMode) {
      // Remove the flag before saving
      delete updates._visualEditorMode;

      // Whitelist allowed fields for visual editor updates
      const allowedFields = [
        'title',
        'excerpt',
        'content',
        'slug',
        'author',
        'readTime',
        'featuredImage',
        'featuredImageAlt',
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
      ];

      const sanitizedUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (key in updates && updates[key] !== undefined) {
          sanitizedUpdates[key] = updates[key];
        }
      }

      // Validate status if present
      if (
        sanitizedUpdates.status &&
        !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(sanitizedUpdates.status)
      ) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      // Update with sanitized data
      const updatedArticle = await prisma.tarotArticle.update({
        where: { id },
        data: {
          ...sanitizedUpdates,
          updatedAt: new Date(),
        },
      });

      // Invalidate cache for this article and overview
      await cacheService.del('tarot:overview');
      await cacheService.del(`tarot:article:${existingArticle.slug}`);
      if (sanitizedUpdates.slug && sanitizedUpdates.slug !== existingArticle.slug) {
        await cacheService.del(`tarot:article:${sanitizedUpdates.slug}`);
      }

      return res.json(updatedArticle);
    }

    // Full validation mode: If this is a full article update (from JSON import edit)
    if (updates.title && updates.content && updates.slug) {
      if (forceUpdate) {
        // Force-update mode: proceed with warnings instead of errors (bypasses all validation)
        const warningsResult = validateArticleWithWarnings(updates);

        // Convert to Prisma format with defaults for missing fields
        const prismaData = convertToPrismaFormatLenient(warningsResult.data);

        // Try to generate schema (may fail with incomplete data)
        let schema: object | null = null;
        let schemaHtml = '';
        try {
          const schemaResult = processArticleSchema(warningsResult.data as TarotArticleData);
          schema = schemaResult.schema;
          schemaHtml = schemaResult.schemaHtml;
        } catch (schemaError) {
          // Schema generation failed - add as warning but continue
          warningsResult.warnings.push(
            '[Schema] Could not generate structured data - article may need additional fields'
          );
        }

        // Update with validated data
        const updatedArticle = await prisma.tarotArticle.update({
          where: { id },
          data: {
            ...prismaData,
            schemaJson: (schema as any) || existingArticle.schemaJson,
            schemaHtml: schemaHtml || existingArticle.schemaHtml,
            updatedAt: new Date(),
          },
        });

        // Invalidate cache for this article and overview
        await cacheService.del('tarot:overview');
        await cacheService.del(`tarot:article:${existingArticle.slug}`);
        if (prismaData.slug && prismaData.slug !== existingArticle.slug) {
          await cacheService.del(`tarot:article:${prismaData.slug}`);
        }

        return res.json({
          ...updatedArticle,
          _forceUpdated: true,
          _warnings: warningsResult.warnings,
          _stats: warningsResult.stats,
        });
      }

      // Standard mode: two-tier validation (core errors block, quality warnings don't)
      const validationResult = validateTarotArticle(updates);

      // Convert QualityWarning[] to string[] for frontend compatibility
      const warningMessages = validationResult.warnings.map(w => w.message);

      if (!validationResult.success || !validationResult.data) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: validationResult.errors || [],
          warnings: warningMessages,
        });
      }

      // Convert to Prisma format
      const prismaData = convertToPrismaFormatLenient(validationResult.data as any);

      // Regenerate schema
      let schema: object | null = null;
      let schemaHtml = '';
      try {
        const schemaResult = processArticleSchema(validationResult.data as TarotArticleData);
        schema = schemaResult.schema;
        schemaHtml = schemaResult.schemaHtml;
      } catch {
        // Schema generation failed - add as warning but continue
        warningMessages.push('Could not generate structured data schema');
      }

      // Update with validated data
      const updatedArticle = await prisma.tarotArticle.update({
        where: { id },
        data: {
          ...prismaData,
          schemaJson: (schema as any) || existingArticle.schemaJson,
          schemaHtml: schemaHtml || existingArticle.schemaHtml,
          updatedAt: new Date(),
        },
      });

      // Invalidate cache for this article and overview
      await cacheService.del('tarot:overview');
      await cacheService.del(`tarot:article:${existingArticle.slug}`);
      if (prismaData.slug && prismaData.slug !== existingArticle.slug) {
        await cacheService.del(`tarot:article:${prismaData.slug}`);
      }

      return res.json({
        ...updatedArticle,
        _warnings: warningMessages,
        _stats: validationResult.stats,
      });
    }

    // Simple field update (status only)
    const allowedSimpleUpdates = ['status'];
    const sanitizedUpdates: Record<string, any> = {};

    for (const key of allowedSimpleUpdates) {
      if (key in updates) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    // Validate status value if present
    if (
      sanitizedUpdates.status &&
      !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(sanitizedUpdates.status)
    ) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Set publishedAt when publishing
    if (sanitizedUpdates.status === 'PUBLISHED' && existingArticle.status !== 'PUBLISHED') {
      sanitizedUpdates.datePublished = new Date();
    }

    const updatedArticle = await prisma.tarotArticle.update({
      where: { id },
      data: {
        ...sanitizedUpdates,
        updatedAt: new Date(),
      },
    });

    // Invalidate cache for this article and overview
    await cacheService.del('tarot:overview');
    await cacheService.del(`tarot:article:${existingArticle.slug}`);

    res.json(updatedArticle);
  } catch (error) {
    console.error('Error updating tarot article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

/**
 * DELETE /api/tarot-articles/admin/:id
 * Soft delete a tarot article (move to trash) - admin only
 */
router.delete('/admin/:id', async (req, res) => {
  try {
    const article = await prisma.tarotArticle.findUnique({
      where: { id: req.params.id },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Save original slug and modify current slug to avoid conflicts
    const timestamp = Date.now();
    const trashedSlug = `_deleted_${timestamp}_${article.slug}`;

    await prisma.tarotArticle.update({
      where: { id: req.params.id },
      data: {
        deletedAt: new Date(),
        originalSlug: article.slug,
        slug: trashedSlug,
      },
    });

    // Invalidate cache for this article and overview
    await cacheService.del('tarot:overview');
    await cacheService.del(`tarot:article:${article.slug}`);

    res.json({ success: true, message: 'Article moved to trash' });
  } catch (error) {
    console.error('Error deleting tarot article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

/**
 * POST /api/tarot-articles/admin/:id/restore
 * Restore a tarot article from trash - admin only
 */
router.post('/admin/:id/restore', async (req, res) => {
  try {
    const article = await prisma.tarotArticle.findUnique({
      where: { id: req.params.id },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (!article.deletedAt) {
      return res.status(400).json({ error: 'Article is not in trash' });
    }

    // Check if original slug is available
    const originalSlug = article.originalSlug || article.slug.replace(/^_deleted_\d+_/, '');
    const existingWithSlug = await prisma.tarotArticle.findFirst({
      where: { slug: originalSlug, id: { not: article.id } },
    });

    // If original slug is taken, generate a new one
    let newSlug = originalSlug;
    if (existingWithSlug) {
      newSlug = `${originalSlug}-restored-${Date.now()}`;
    }

    await prisma.tarotArticle.update({
      where: { id: req.params.id },
      data: {
        deletedAt: null,
        originalSlug: null,
        slug: newSlug,
      },
    });

    // Invalidate cache for overview (article restored)
    await cacheService.del('tarot:overview');

    res.json({ success: true, slug: newSlug, message: 'Article restored successfully' });
  } catch (error) {
    console.error('Error restoring tarot article:', error);
    res.status(500).json({ error: 'Failed to restore article' });
  }
});

/**
 * DELETE /api/tarot-articles/admin/:id/permanent
 * Permanently delete a tarot article - admin only
 */
router.delete('/admin/:id/permanent', async (req, res) => {
  try {
    const article = await prisma.tarotArticle.findUnique({
      where: { id: req.params.id },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (!article.deletedAt) {
      return res.status(400).json({ error: 'Article must be in trash before permanent deletion' });
    }

    await prisma.tarotArticle.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Article permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting tarot article:', error);
    res.status(500).json({ error: 'Failed to permanently delete article' });
  }
});

/**
 * DELETE /api/tarot-articles/admin/trash/empty
 * Empty trash (permanently delete all trashed articles) - admin only
 */
router.delete('/admin/trash/empty', async (req, res) => {
  try {
    const result = await prisma.tarotArticle.deleteMany({
      where: { deletedAt: { not: null } },
    });

    res.json({
      success: true,
      deleted: result.count,
      message: `${result.count} articles permanently deleted`,
    });
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ error: 'Failed to empty trash' });
  }
});

// ============================================
// CATEGORY MANAGEMENT
// ============================================

/**
 * GET /api/tarot-articles/admin/categories
 * List all tarot categories
 */
router.get('/admin/categories', async (req, res) => {
  try {
    const categories = await prisma.tarotCategory.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching tarot categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * POST /api/tarot-articles/admin/categories
 * Create a new tarot category
 */
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
});

router.post('/admin/categories', async (req, res) => {
  try {
    const data = createCategorySchema.parse(req.body);
    const category = await prisma.tarotCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
      },
    });
    res.status(201).json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating tarot category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

/**
 * PATCH /api/tarot-articles/admin/categories/:id
 * Update a tarot category
 */
router.patch('/admin/categories/:id', async (req, res) => {
  try {
    const data = createCategorySchema.partial().parse(req.body);
    const category = await prisma.tarotCategory.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating tarot category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

/**
 * DELETE /api/tarot-articles/admin/categories/:id
 * Delete a tarot category
 */
router.delete('/admin/categories/:id', async (req, res) => {
  try {
    await prisma.tarotCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tarot category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============================================
// TAG MANAGEMENT
// ============================================

/**
 * GET /api/tarot-articles/admin/tags
 * List all tarot tags
 */
router.get('/admin/tags', async (req, res) => {
  try {
    const tags = await prisma.tarotTag.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tarot tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

/**
 * POST /api/tarot-articles/admin/tags
 * Create a new tarot tag
 */
const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
});

router.post('/admin/tags', async (req, res) => {
  try {
    const data = createTagSchema.parse(req.body);
    const tag = await prisma.tarotTag.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
    });
    res.status(201).json({ tag });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating tarot tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

/**
 * PATCH /api/tarot-articles/admin/tags/:id
 * Update a tarot tag
 */
router.patch('/admin/tags/:id', async (req, res) => {
  try {
    const data = createTagSchema.partial().parse(req.body);
    const tag = await prisma.tarotTag.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ tag });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating tarot tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

/**
 * DELETE /api/tarot-articles/admin/tags/:id
 * Delete a tarot tag
 */
router.delete('/admin/tags/:id', async (req, res) => {
  try {
    await prisma.tarotTag.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tarot tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;

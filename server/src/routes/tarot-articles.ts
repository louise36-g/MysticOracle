import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateArticleExtended, convertToPrismaFormat } from '../lib/validation.js';
import { processArticleSchema } from '../lib/schema-builder.js';

const router = Router();

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * GET /api/tarot-articles/:slug
 * Fetch a single published tarot article by slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const article = await prisma.tarotArticle.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

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
  cardType: z.enum(['MAJOR_ARCANA', 'SUIT_OF_WANDS', 'SUIT_OF_CUPS', 'SUIT_OF_SWORDS', 'SUIT_OF_PENTACLES']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
});

router.get('/', async (req, res) => {
  try {
    const params = listArticlesSchema.parse(req.query);
    const { page, limit, cardType, status } = params;

    const where: any = {
      status: status || 'PUBLISHED', // Default to published only
    };

    if (cardType) {
      where.cardType = cardType;
    }

    const [articles, total] = await Promise.all([
      prisma.tarotArticle.findMany({
        where,
        select: {
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
        },
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
 */
router.post('/admin/validate', async (req, res) => {
  try {
    const articleData = req.body;

    // Perform extended validation with warnings
    const validationResult = validateArticleExtended(articleData);

    if (!validationResult.success || !validationResult.data) {
      return res.status(400).json({
        success: false,
        errors: validationResult.errors,
        warnings: [],
        stats: null,
        schema: null,
      });
    }

    // At this point, validationResult.data is guaranteed to exist
    const validatedData = validationResult.data;

    // Generate schema preview
    const { schema } = processArticleSchema(validatedData);

    res.json({
      success: true,
      errors: [],
      warnings: validationResult.warnings || [],
      stats: validationResult.stats || null,
      schema,
      data: validatedData,
    });
  } catch (error) {
    console.error('Error validating tarot article:', error);
    res.status(500).json({
      success: false,
      errors: ['Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')],
      warnings: [],
      stats: null,
      schema: null,
    });
  }
});

/**
 * POST /api/tarot-articles/admin/import
 * Import and save a validated tarot article to the database
 */
router.post('/admin/import', async (req, res) => {
  try {
    const articleData = req.body;

    // Validate the article data
    const validationResult = validateArticleExtended(articleData);

    if (!validationResult.success || !validationResult.data) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validationResult.errors,
        warnings: [],
      });
    }

    // At this point, validationResult.data is guaranteed to exist
    const validatedData = validationResult.data;

    // Check if article with this slug already exists
    const existingArticle = await prisma.tarotArticle.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingArticle) {
      return res.status(409).json({
        success: false,
        error: `Article with slug "${validatedData.slug}" already exists`,
        errors: [`Article with slug "${validatedData.slug}" already exists`],
        warnings: [],
      });
    }

    // Convert to Prisma format (maps display names to enum keys)
    const prismaData = convertToPrismaFormat(validatedData);

    // Generate schema for the article
    const { schema, schemaHtml } = processArticleSchema(validatedData);

    // Create the article in the database
    const article = await prisma.tarotArticle.create({
      data: {
        ...prismaData,
        schemaJson: schema as any,
        schemaHtml,
        status: 'DRAFT', // Import as draft by default
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: article.status,
      },
      warnings: validationResult.warnings || [],
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
    const { page, limit, cardType, status, search } = params;

    const where: any = {};

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
          cardType: true,
          cardNumber: true,
          datePublished: true,
          status: true,
          createdAt: true,
          updatedAt: true,
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
 */
router.patch('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if article exists
    const existingArticle = await prisma.tarotArticle.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // If status is being changed to PUBLISHED, set publishedAt
    if (updates.status === 'PUBLISHED' && existingArticle.status !== 'PUBLISHED') {
      updates.publishedAt = new Date();
    }

    // Update the article
    const updatedArticle = await prisma.tarotArticle.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    res.json(updatedArticle);
  } catch (error) {
    console.error('Error updating tarot article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

/**
 * DELETE /api/tarot-articles/admin/:id
 * Delete a tarot article - admin only
 */
router.delete('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if article exists
    const existingArticle = await prisma.tarotArticle.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Delete the article
    await prisma.tarotArticle.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting tarot article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

export default router;

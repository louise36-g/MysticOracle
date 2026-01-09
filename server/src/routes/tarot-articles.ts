import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../db/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateArticleExtended, convertToPrismaFormat } from '../lib/validation.js';
import { processArticleSchema, type TarotArticleData } from '../lib/schema-builder.js';

// Configure multer for tarot media uploads
const tarotMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'tarot');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const tarotMediaUpload = multer({
  storage: tarotMediaStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

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
        deletedAt: null, // Exclude deleted articles
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
  deleted: z.coerce.boolean().optional(),  // true = show trash, false/undefined = show active
});

router.get('/', async (req, res) => {
  try {
    const params = listArticlesSchema.parse(req.query);
    const { page, limit, cardType, status } = params;

    const where: any = {
      status: status || 'PUBLISHED', // Default to published only
      deletedAt: null, // Exclude deleted articles from public list
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
        errors: validationResult.errorMessages || [],
        warnings: [],
        stats: null,
        schema: null,
      });
    }

    // At this point, validationResult.data is guaranteed to exist
    const validatedData = validationResult.data;

    // Generate schema preview (cast to TarotArticleData since validation passed)
    const { schema } = processArticleSchema(validatedData as TarotArticleData);

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
        errors: validationResult.errorMessages || [],
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

    // Generate schema for the article (cast to TarotArticleData since validation passed)
    const { schema, schemaHtml } = processArticleSchema(validatedData as TarotArticleData);

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
    const { page, limit, cardType, status, search, deleted } = params;

    const where: any = {};

    // Filter by trash status
    if (deleted === true) {
      where.deletedAt = { not: null };  // Show only trashed articles
    } else {
      where.deletedAt = null;  // Show only active articles (default)
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

    // If this is a full article update (from edit mode), process it
    if (updates.title && updates.content && updates.slug) {
      // Validate the updated article data
      const validationResult = validateArticleExtended(updates);

      if (!validationResult.success || !validationResult.data) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: validationResult.errorMessages || [],
        });
      }

      // Convert to Prisma format
      const prismaData = convertToPrismaFormat(validationResult.data);

      // Regenerate schema (cast to TarotArticleData since validation passed)
      const { schema, schemaHtml } = processArticleSchema(validationResult.data as TarotArticleData);

      // Update with validated data
      const updatedArticle = await prisma.tarotArticle.update({
        where: { id },
        data: {
          ...prismaData,
          schemaJson: schema as any,
          schemaHtml,
          updatedAt: new Date(),
        },
      });

      return res.json(updatedArticle);
    }

    // Otherwise, simple field update (status, etc.)
    // Whitelist allowed simple update fields for security
    const allowedSimpleUpdates = ['status'];
    const sanitizedUpdates: Record<string, any> = {};

    for (const key of allowedSimpleUpdates) {
      if (key in updates) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    // Validate status value if present
    if (sanitizedUpdates.status && !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(sanitizedUpdates.status)) {
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

    res.json({ success: true, deleted: result.count, message: `${result.count} articles permanently deleted` });
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
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
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
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
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

// ============================================
// MEDIA MANAGEMENT
// ============================================

const listMediaSchema = z.object({
  deleted: z.coerce.boolean().optional(),
});

/**
 * GET /api/tarot-articles/admin/media
 * List all tarot media (with trash filter)
 */
router.get('/admin/media', async (req, res) => {
  try {
    const params = listMediaSchema.parse(req.query);
    const where = params.deleted
      ? { deletedAt: { not: null } }
      : { deletedAt: null };

    const media = await prisma.tarotMedia.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ media });
  } catch (error) {
    console.error('Error fetching tarot media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

/**
 * POST /api/tarot-articles/admin/media/upload
 * Upload a new media file
 */
router.post('/admin/media/upload', tarotMediaUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    const url = `${baseUrl}/uploads/tarot/${req.file.filename}`;

    const media = await prisma.tarotMedia.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });

    res.status(201).json({ media });
  } catch (error) {
    console.error('Error uploading tarot media:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

/**
 * PATCH /api/tarot-articles/admin/media/:id
 * Update media metadata
 */
const updateMediaSchema = z.object({
  altText: z.string().max(500).optional(),
  caption: z.string().max(500).optional(),
});

router.patch('/admin/media/:id', async (req, res) => {
  try {
    const data = updateMediaSchema.parse(req.body);
    const media = await prisma.tarotMedia.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ media });
  } catch (error) {
    console.error('Error updating tarot media:', error);
    res.status(500).json({ error: 'Failed to update media' });
  }
});

/**
 * DELETE /api/tarot-articles/admin/media/:id
 * Soft delete media (move to trash)
 */
router.delete('/admin/media/:id', async (req, res) => {
  try {
    await prisma.tarotMedia.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tarot media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

/**
 * POST /api/tarot-articles/admin/media/:id/restore
 * Restore media from trash
 */
router.post('/admin/media/:id/restore', async (req, res) => {
  try {
    await prisma.tarotMedia.update({
      where: { id: req.params.id },
      data: { deletedAt: null },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error restoring tarot media:', error);
    res.status(500).json({ error: 'Failed to restore media' });
  }
});

/**
 * DELETE /api/tarot-articles/admin/media/:id/permanent
 * Permanently delete media (from trash only)
 */
router.delete('/admin/media/:id/permanent', async (req, res) => {
  try {
    const media = await prisma.tarotMedia.findUnique({
      where: { id: req.params.id },
    });

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    if (!media.deletedAt) {
      return res.status(400).json({ error: 'Media must be in trash first' });
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'uploads', 'tarot', media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.tarotMedia.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error permanently deleting tarot media:', error);
    res.status(500).json({ error: 'Failed to permanently delete media' });
  }
});

export default router;

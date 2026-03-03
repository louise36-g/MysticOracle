/**
 * Public Tarot Article Routes
 *
 * Endpoints for public-facing tarot article access.
 * No authentication required.
 *
 * Queries BlogPost table with contentType = 'TAROT_ARTICLE'
 * and transforms responses to the existing TarotArticle API shape.
 */

import { Router } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import {
  prisma,
  cacheService,
  CacheService,
  z,
  articleListSelect,
  articleFullInclude,
  transformArticleResponse,
  transformListItem,
} from './shared.js';

const router = Router();

/**
 * GET /api/tarot-articles/overview
 * Get overview of all published tarot articles grouped by card type
 */
router.get('/overview', async (req, res) => {
  try {
    // Check cache first
    const cached = await cacheService.get<unknown>('tarot:overview');
    if (cached) {
      return res.json(cached);
    }

    const selectFields = {
      id: true,
      slug: true,
      titleEn: true,
      titleFr: true,
      excerptEn: true,
      excerptFr: true,
      coverImage: true,
      coverImageAlt: true,
      coverImageAltFr: true,
      cardType: true,
      cardNumber: true,
      readTimeMinutes: true,
    };

    const baseWhere = {
      contentType: 'TAROT_ARTICLE' as const,
      status: 'PUBLISHED' as const,
      deletedAt: null,
    };

    // Fetch all cards per category in parallel
    const [majorArcana, wands, cups, swords, pentacles] = await Promise.all([
      prisma.blogPost.findMany({
        where: { ...baseWhere, cardType: 'MAJOR_ARCANA' },
        select: selectFields,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.blogPost.findMany({
        where: { ...baseWhere, cardType: 'SUIT_OF_WANDS' },
        select: selectFields,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.blogPost.findMany({
        where: { ...baseWhere, cardType: 'SUIT_OF_CUPS' },
        select: selectFields,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.blogPost.findMany({
        where: { ...baseWhere, cardType: 'SUIT_OF_SWORDS' },
        select: selectFields,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.blogPost.findMany({
        where: { ...baseWhere, cardType: 'SUIT_OF_PENTACLES' },
        select: selectFields,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    // Transform to TarotArticle API shape
    const transform = (items: typeof majorArcana) =>
      items.map(p => ({
        id: p.id,
        title: p.titleEn,
        titleFr: p.titleFr,
        slug: p.slug,
        excerpt: p.excerptEn,
        excerptFr: p.excerptFr,
        featuredImage: p.coverImage || '',
        featuredImageAlt: p.coverImageAlt || '',
        featuredImageAltFr: p.coverImageAltFr || '',
        cardType: p.cardType,
        cardNumber: p.cardNumber,
        readTime: `${p.readTimeMinutes} min read`,
      }));

    const result = {
      majorArcana: transform(majorArcana),
      wands: transform(wands),
      cups: transform(cups),
      swords: transform(swords),
      pentacles: transform(pentacles),
      counts: {
        majorArcana: majorArcana.length,
        wands: wands.length,
        cups: cups.length,
        swords: swords.length,
        pentacles: pentacles.length,
      },
    };

    // Cache for 5 minutes
    await cacheService.set('tarot:overview', result, CacheService.TTL.ARTICLES);

    res.json(result);
  } catch (error) {
    console.error('Error fetching tarot overview:', error);
    res.status(500).json({ error: 'Failed to fetch tarot overview' });
  }
});

/**
 * GET /api/tarot-articles/:slug
 * Fetch a single published tarot article by slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `tarot:article:${slug}`;

    // Check cache first
    const cached = await cacheService.get<unknown>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const article = await prisma.blogPost.findFirst({
      where: {
        slug,
        contentType: 'TAROT_ARTICLE',
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: articleFullInclude,
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const response = transformArticleResponse(article);

    // Cache for 10 minutes
    await cacheService.set(cacheKey, response, CacheService.TTL.ARTICLE);

    res.json(response);
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
  deleted: z.coerce.boolean().optional(),
  sortBy: z.enum(['datePublished', 'cardNumber']).optional(),
});

router.get('/', async (req, res) => {
  try {
    const params = listArticlesSchema.parse(req.query);
    const { page, limit, cardType, status } = params;

    const where: Prisma.BlogPostWhereInput = {
      contentType: 'TAROT_ARTICLE',
      status: status || 'PUBLISHED',
      deletedAt: null,
    };

    if (cardType) {
      where.cardType = cardType;
    }

    // Sort by admin-configured sortOrder (respects drag-drop reordering)
    const [articles, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: articleListSelect,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
      articles: articles.map(transformListItem),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      // Legacy response shape compatibility
      total,
    });
  } catch (error) {
    console.error('Error listing tarot articles:', error);
    res.status(500).json({ error: 'Failed to list articles' });
  }
});

export default router;

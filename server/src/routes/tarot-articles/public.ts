/**
 * Public Tarot Article Routes
 *
 * Endpoints for public-facing tarot article access.
 * No authentication required.
 */

import { Router } from 'express';
import { Prisma } from '@prisma/client';
import {
  prisma,
  cacheService,
  CacheService,
  z,
  sortByCardNumber,
  articleListFields,
  articleFullFields,
  transformArticleResponse,
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

    const _cardTypes = [
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

    // Fetch all cards per category in parallel
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

    // Sort all arrays numerically by cardNumber
    const sortedMajorArcana = sortByCardNumber(majorArcana);
    const sortedWands = sortByCardNumber(wands);
    const sortedCups = sortByCardNumber(cups);
    const sortedSwords = sortByCardNumber(swords);
    const sortedPentacles = sortByCardNumber(pentacles);

    const result = {
      majorArcana: sortedMajorArcana,
      wands: sortedWands,
      cups: sortedCups,
      swords: sortedSwords,
      pentacles: sortedPentacles,
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

    const article = await prisma.tarotArticle.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: articleFullFields,
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
    const { page, limit, cardType, status, sortBy } = params;

    const where: Prisma.TarotArticleWhereInput = {
      status: status || 'PUBLISHED',
      deletedAt: null,
    };

    if (cardType) {
      where.cardType = cardType;
    }

    // For cardNumber sorting, fetch all and sort in JS
    if (sortBy === 'cardNumber') {
      const [allArticles, total] = await Promise.all([
        prisma.tarotArticle.findMany({
          where,
          select: articleListFields,
        }),
        prisma.tarotArticle.count({ where }),
      ]);

      const sorted = sortByCardNumber(allArticles);
      const paginated = sorted.slice((page - 1) * limit, page * limit);

      return res.json({
        articles: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Default date-based sorting
    const [articles, total] = await Promise.all([
      prisma.tarotArticle.findMany({
        where,
        select: articleListFields,
        orderBy: { datePublished: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tarotArticle.count({ where }),
    ]);

    res.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing tarot articles:', error);
    res.status(500).json({ error: 'Failed to list articles' });
  }
});

export default router;

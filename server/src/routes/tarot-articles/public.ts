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
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { NotFoundError } from '../../shared/errors/ApplicationError.js';
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
import { parsePaginationParams, createPaginationMeta } from '../../shared/pagination/pagination.js';

const router = Router();

/**
 * GET /api/tarot-articles/overview
 * Get overview of all published tarot articles grouped by card type
 */
router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
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

    // Fetch all articles in a single query and group by card type
    const allArticles = await prisma.blogPost.findMany({
      where: baseWhere,
      select: selectFields,
      orderBy: [{ cardType: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const grouped: Record<string, typeof allArticles> = {};
    for (const article of allArticles) {
      const key = article.cardType || 'unknown';
      (grouped[key] = grouped[key] || []).push(article);
    }

    const majorArcana = grouped['MAJOR_ARCANA'] || [];
    const wands = grouped['SUIT_OF_WANDS'] || [];
    const cups = grouped['SUIT_OF_CUPS'] || [];
    const swords = grouped['SUIT_OF_SWORDS'] || [];
    const pentacles = grouped['SUIT_OF_PENTACLES'] || [];

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
  })
);

/**
 * GET /api/tarot-articles/:slug
 * Fetch a single published tarot article by slug
 */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
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
      throw new NotFoundError('Article');
    }

    const response = transformArticleResponse(article);

    // Cache for 10 minutes
    await cacheService.set(cacheKey, response, CacheService.TTL.ARTICLE);

    res.json(response);
  })
);

/**
 * GET /api/tarot-articles
 * List published tarot articles with pagination and filters
 */
const listArticlesFilterSchema = z.object({
  cardType: z
    .enum(['MAJOR_ARCANA', 'SUIT_OF_WANDS', 'SUIT_OF_CUPS', 'SUIT_OF_SWORDS', 'SUIT_OF_PENTACLES'])
    .optional(),
  status: z
    .preprocess(
      v => (typeof v === 'string' ? v.toUpperCase() : v),
      z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
    )
    .optional(),
  search: z.string().optional(),
  deleted: z.coerce.boolean().optional(),
  sortBy: z.enum(['datePublished', 'cardNumber']).optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const paginationParams = parsePaginationParams(req.query as Record<string, unknown>, 20, 100);
    const { cardType, status } = listArticlesFilterSchema.parse(req.query);

    // Check cache first
    const cacheKey = `tarot:list:${paginationParams.page}:${paginationParams.limit}:${cardType || ''}:${status || ''}`;
    const cached = await cacheService.get<unknown>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

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
        skip: paginationParams.skip,
        take: paginationParams.take,
      }),
      prisma.blogPost.count({ where }),
    ]);

    const response = {
      articles: articles.map(transformListItem),
      pagination: createPaginationMeta(paginationParams, total),
      // Legacy response shape compatibility
      total,
    };

    // Cache for 5 minutes
    await cacheService.set(cacheKey, response, CacheService.TTL.ARTICLES);

    res.json(response);
  })
);

export default router;

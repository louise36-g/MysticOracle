/**
 * Internal Links Routes
 *
 * Provides link registry for SEO internal linking system.
 * Returns all linkable content (tarot articles, blog posts, spreads, horoscopes).
 */

import { Router } from 'express';
import prisma from '../db/prisma.js';
import { cacheService } from '../services/cache.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { SPREADS, ZODIAC_SIGNS } from '../shared/constants/index.js';

const router = Router();

/**
 * @openapi
 * /api/v1/internal-links/registry:
 *   get:
 *     tags:
 *       - Internal Links
 *     summary: Get link registry for internal linking
 *     description: |
 *       Returns all linkable content for the internal linking system.
 *       Used by content editors to insert contextual links.
 *       No authentication required - only returns public slugs/titles.
 *     responses:
 *       200:
 *         description: Link registry retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tarot:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       slug:
 *                         type: string
 *                       title:
 *                         type: string
 *                       cardType:
 *                         type: string
 *                 blog:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       slug:
 *                         type: string
 *                       title:
 *                         type: string
 *                 spread:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       slug:
 *                         type: string
 *                       title:
 *                         type: string
 *                       type:
 *                         type: string
 *                 horoscope:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       slug:
 *                         type: string
 *                       title:
 *                         type: string
 *                       sign:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get(
  '/registry',
  asyncHandler(async (_req, res) => {
    const cacheKey = 'internal-links:registry';
    const cached = await cacheService.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // Fetch tarot articles and blog posts in parallel
    // NOTE:
    // - We intentionally include DRAFT and PUBLISHED content here (exclude only soft-deleted / archived)
    // - This makes the registry useful while editors are still preparing content
    // - Public visibility is still controlled by the main content APIs
    const [tarotArticlesRaw, rawBlogPosts] = await Promise.all([
      prisma.blogPost.findMany({
        where: { contentType: 'TAROT_ARTICLE', deletedAt: null },
        select: { slug: true, titleEn: true, cardType: true },
        orderBy: { titleEn: 'asc' },
      }),
      prisma.blogPost.findMany({
        where: { contentType: 'BLOG_POST', deletedAt: null },
        select: { slug: true, titleEn: true },
        orderBy: { titleEn: 'asc' },
      }),
    ]);

    // Transform tarot articles to match existing API shape
    const tarotArticles = tarotArticlesRaw.map(a => ({
      slug: a.slug,
      title: a.titleEn,
      cardType: a.cardType,
    }));

    // Transform blog posts to use 'title' field
    const blogPosts = rawBlogPosts.map(post => ({
      slug: post.slug,
      title: post.titleEn,
    }));

    // Static spreads from constants
    const coreSpreads = SPREADS.map(s => ({
      slug: s.slug,
      title: s.title,
      type: s.type,
    }));

    // Static tarot guide/category links (suits, major/minor arcana)
    // These are treated as "spread" type for URL generation (/tarot/{slug})
    const tarotGuides = [
      { slug: 'wands', title: 'Suit of Wands', type: 'CATEGORY' },
      { slug: 'cups', title: 'Suit of Cups', type: 'CATEGORY' },
      { slug: 'swords', title: 'Suit of Swords', type: 'CATEGORY' },
      { slug: 'pentacles', title: 'Suit of Pentacles', type: 'CATEGORY' },
      { slug: 'major-arcana', title: 'Major Arcana', type: 'CATEGORY' },
      { slug: 'minor-arcana', title: 'Minor Arcana', type: 'CATEGORY' },
    ];

    const spreads = [...coreSpreads, ...tarotGuides];

    // Static horoscope signs from constants
    const horoscopes = ZODIAC_SIGNS.map(z => ({
      slug: z.slug,
      title: z.title,
      sign: z.sign,
    }));

    const response = {
      tarot: tarotArticles,
      blog: blogPosts,
      spread: spreads,
      horoscope: horoscopes,
    };

    await cacheService.set(cacheKey, response, 600); // 10 min
    res.json(response);
  })
);

export default router;

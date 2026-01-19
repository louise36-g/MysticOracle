/**
 * Internal Links Routes
 *
 * Provides link registry for SEO internal linking system.
 * Returns all linkable content (tarot articles, blog posts, spreads, horoscopes).
 */

import { Router } from 'express';
import prisma from '../db/prisma.js';
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
router.get('/registry', async (_req, res) => {
  try {
    // Fetch published tarot articles and blog posts in parallel
    const [tarotArticles, rawBlogPosts] = await Promise.all([
      prisma.tarotArticle.findMany({
        where: { status: 'PUBLISHED', deletedAt: null },
        select: { slug: true, title: true, cardType: true },
        orderBy: { title: 'asc' },
      }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', deletedAt: null },
        select: { slug: true, titleEn: true },
        orderBy: { titleEn: 'asc' },
      }),
    ]);

    // Transform blog posts to use 'title' field
    const blogPosts = rawBlogPosts.map(post => ({
      slug: post.slug,
      title: post.titleEn,
    }));

    // Static spreads from constants
    const spreads = SPREADS.map(s => ({
      slug: s.slug,
      title: s.title,
      type: s.type,
    }));

    // Static horoscope signs from constants
    const horoscopes = ZODIAC_SIGNS.map(z => ({
      slug: z.slug,
      title: z.title,
      sign: z.sign,
    }));

    res.json({
      tarot: tarotArticles,
      blog: blogPosts,
      spread: spreads,
      horoscope: horoscopes,
    });
  } catch (error) {
    console.error('[Internal Links] Error fetching registry:', error);
    res.status(500).json({ error: 'Failed to fetch link registry' });
  }
});

export default router;

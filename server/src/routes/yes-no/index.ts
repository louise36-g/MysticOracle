/**
 * Yes/No Tarot Reading Routes
 *
 * GET  /cards       — Public: returns all card yes/no data (cached 1hr)
 * POST /three-card  — Auth: deducts 1 credit for a 3-card spread
 */

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../db/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { cacheService, CacheService } from '../../services/cache.js';
import { CreditService, CREDIT_COSTS } from '../../services/CreditService.js';
import { TransactionType } from '../../generated/prisma/client.js';
import { logger } from '../../lib/logger.js';
import { parseKeyTakeaways } from './parser.js';

const router = Router();

// Cache key and TTL (1 hour)
const CACHE_KEY = 'yesno:cards';
const CACHE_TTL = CacheService.TTL.HOROSCOPE;

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

interface YesNoCardData {
  cardNumber: string;
  cardType: string;
  slug: string;
  coverImage: string;
  yesNoEn: string;
  yesNoFr: string;
  verdict: 'YES' | 'NO' | 'UNCLEAR' | 'WAIT';
  coreMeaningEn: string;
  coreMeaningFr: string;
  uprightEn: string;
  uprightFr: string;
  reversedEn: string;
  reversedFr: string;
  bestAdviceEn: string;
  bestAdviceFr: string;
}

type YesNoCardMap = Record<string, YesNoCardData>;

// ───────────────────────────────────────────────
// Helper: build the full card map
// ───────────────────────────────────────────────

async function buildYesNoCardMap(): Promise<YesNoCardMap> {
  const articles = await prisma.blogPost.findMany({
    where: {
      contentType: 'TAROT_ARTICLE',
      status: 'PUBLISHED',
      deletedAt: null,
    },
    select: {
      cardType: true,
      cardNumber: true,
      contentEn: true,
      contentFr: true,
      slug: true,
      coverImage: true,
    },
    orderBy: [{ cardType: 'asc' }, { sortOrder: 'asc' }],
  });

  const map: YesNoCardMap = {};

  for (const article of articles) {
    if (!article.cardType || article.cardNumber == null) continue;

    const en = article.contentEn ? parseKeyTakeaways(article.contentEn) : null;
    const fr = article.contentFr ? parseKeyTakeaways(article.contentFr) : null;

    // Skip if neither language has yes/no data
    if (!en && !fr) continue;

    const key = `${article.cardType}:${article.cardNumber}`;

    map[key] = {
      cardNumber: String(article.cardNumber),
      cardType: article.cardType,
      slug: article.slug,
      coverImage: article.coverImage || '',
      yesNoEn: en?.yesNo || '',
      yesNoFr: fr?.yesNo || en?.yesNo || '',
      verdict: en?.verdict || fr?.verdict || 'UNCLEAR',
      coreMeaningEn: en?.coreMeaning || '',
      coreMeaningFr: fr?.coreMeaning || en?.coreMeaning || '',
      uprightEn: en?.upright || '',
      uprightFr: fr?.upright || en?.upright || '',
      reversedEn: en?.reversed || '',
      reversedFr: fr?.reversed || en?.reversed || '',
      bestAdviceEn: en?.bestAdvice || '',
      bestAdviceFr: fr?.bestAdvice || en?.bestAdvice || '',
    };
  }

  return map;
}

// ───────────────────────────────────────────────
// GET /cards — public, no auth
// ───────────────────────────────────────────────

router.get(
  '/cards',
  asyncHandler(async (_req, res) => {
    // Check cache
    const cached = await cacheService.get<YesNoCardMap>(CACHE_KEY);
    if (cached) {
      return res.json(cached);
    }

    const map = await buildYesNoCardMap();

    await cacheService.set(CACHE_KEY, map, CACHE_TTL);
    logger.info(`[YesNo] Built card map with ${Object.keys(map).length} entries`);

    res.json(map);
  })
);

// ───────────────────────────────────────────────
// POST /three-card — auth required, 1 credit
// ───────────────────────────────────────────────

const threeCardSchema = z.object({
  cardKeys: z.array(z.string()).length(3),
});

router.post(
  '/three-card',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = threeCardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request: must provide exactly 3 card keys' });
    }

    const { cardKeys } = parsed.data;
    const userId = req.auth.userId;

    // Deduct 1 credit
    const creditService = new CreditService(prisma);
    const result = await creditService.deductCredits({
      userId,
      amount: CREDIT_COSTS.YES_NO_THREE_CARD,
      type: TransactionType.READING,
      description: 'Yes/No 3-card spread',
    });

    if (!result.success) {
      return res.status(402).json({
        error: result.error || 'Insufficient credits',
        newBalance: result.newBalance,
      });
    }

    // Get the card data (use cache if available)
    const cached = await cacheService.get<YesNoCardMap>(CACHE_KEY);
    const map =
      cached ??
      (await (async () => {
        const built = await buildYesNoCardMap();
        await cacheService.set(CACHE_KEY, built, CACHE_TTL);
        return built;
      })());

    const cards = cardKeys.map(key => map[key] || null);

    // If any card is missing, refund
    if (cards.some(c => c === null)) {
      await creditService.refundCredits(
        userId,
        CREDIT_COSTS.YES_NO_THREE_CARD,
        'Yes/No 3-card spread — invalid card key'
      );
      return res.status(400).json({ error: 'One or more card keys not found' });
    }

    res.json({
      cards,
      newBalance: result.newBalance,
    });
  })
);

export default router;

/**
 * Yes/No Tarot Reading Routes
 *
 * GET  /cards       — Public: returns all card yes/no data (cached 1hr)
 * POST /interpret   — Public: AI interpretation for single card (rate limited)
 * POST /three-card  — Auth: deducts 1 credit for a 3-card spread + AI interpretation
 */

import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import prisma from '../../db/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { cacheService, CacheService } from '../../services/cache.js';
import { CreditService, CREDIT_COSTS } from '../../services/CreditService.js';
import { TransactionType, CardType } from '../../generated/prisma/client.js';
import { logger } from '../../lib/logger.js';
import { parseKeyTakeaways, extractArticleContext } from './parser.js';
import { openRouterService } from '../../services/openRouterService.js';
import { getYesNoSinglePrompt, getYesNoThreeCardPrompt } from '../../services/promptService.js';

const router = Router();

// Cache key and TTL (1 hour)
const CACHE_KEY = 'yesno:cards';
const CACHE_TTL = CacheService.TTL.HOROSCOPE;

// Rate limiter for /interpret endpoint (20 requests per hour per IP)
const interpretLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Too many interpretation requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
  validate: { xForwardedForHeader: false },
});

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

// Position labels for the 3-card spread
const THREE_CARD_POSITIONS = ['Energy Around You', 'Obstacle or Opportunity', 'Likely Outcome'];

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

/**
 * Get or build the card map (uses cache when available)
 */
async function getCardMap(): Promise<YesNoCardMap> {
  const cached = await cacheService.get<YesNoCardMap>(CACHE_KEY);
  if (cached) return cached;

  const built = await buildYesNoCardMap();
  await cacheService.set(CACHE_KEY, built, CACHE_TTL);
  return built;
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
// POST /interpret — public, rate limited, AI single card
// ───────────────────────────────────────────────

const interpretSchema = z.object({
  question: z.string().min(1).max(500),
  cardKey: z.string(),
  isReversed: z.boolean(),
  language: z.enum(['en', 'fr']),
});

router.post(
  '/interpret',
  interpretLimiter,
  asyncHandler(async (req, res) => {
    const parsed = interpretSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    }

    const { question, cardKey, isReversed, language } = parsed.data;

    // Parse cardType and cardNumber from cardKey (format: "SUIT_OF_WANDS:11")
    const colonIndex = cardKey.lastIndexOf(':');
    if (colonIndex === -1) {
      return res
        .status(400)
        .json({ error: 'Invalid cardKey format. Expected "CARD_TYPE:NUMBER".' });
    }
    const cardTypeRaw = cardKey.substring(0, colonIndex);
    const cardNumber = cardKey.substring(colonIndex + 1);

    if (!cardTypeRaw || !cardNumber || isNaN(parseInt(cardNumber))) {
      return res
        .status(400)
        .json({ error: 'Invalid cardKey format. Expected "CARD_TYPE:NUMBER".' });
    }

    // Validate that the cardType is a valid enum value
    const validCardTypes = Object.values(CardType);
    if (!validCardTypes.includes(cardTypeRaw as CardType)) {
      return res.status(400).json({ error: 'Invalid card type.' });
    }
    const cardType = cardTypeRaw as CardType;

    // Fetch the article from DB
    const article = await prisma.blogPost.findFirst({
      where: {
        contentType: 'TAROT_ARTICLE',
        status: 'PUBLISHED',
        deletedAt: null,
        cardType,
        cardNumber,
      },
      select: {
        contentEn: true,
        contentFr: true,
        titleEn: true,
        titleFr: true,
      },
    });

    // Get the card map for the static verdict
    const map = await getCardMap();
    const cardData = map[cardKey];
    const verdict = cardData?.verdict || 'UNCLEAR';
    const cardTitle = article
      ? (language === 'fr' ? article.titleFr || article.titleEn : article.titleEn) || cardKey
      : cardKey;

    // Extract article context for the AI
    const articleContent = article
      ? (language === 'fr' ? article.contentFr || article.contentEn : article.contentEn) || ''
      : '';
    const articleContext = extractArticleContext(articleContent, isReversed);

    // Generate AI interpretation (graceful degradation on failure)
    let interpretation: string | null = null;
    try {
      const prompt = await getYesNoSinglePrompt({
        question,
        cardName: cardTitle,
        isReversed,
        verdict,
        articleContext,
        language,
      });

      interpretation = await openRouterService.generateTarotReading(prompt, {
        temperature: 0.7,
        maxTokens: 400,
      });
    } catch (error) {
      logger.error('[YesNo] AI interpretation failed for single card:', error);
      // Graceful degradation: return verdict without interpretation
    }

    res.json({
      interpretation,
      verdict,
    });
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
    const map = await getCardMap();

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

// ───────────────────────────────────────────────
// POST /interpret-three-card — auth required, no credit (AI interpretation only)
// ───────────────────────────────────────────────

const interpretThreeCardSchema = z.object({
  question: z.string().min(1).max(500),
  cardKeys: z.array(z.string()).length(3),
  isReversed: z.array(z.boolean()).length(3),
  language: z.enum(['en', 'fr']),
});

router.post(
  '/interpret-three-card',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = interpretThreeCardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    }

    const { question, cardKeys, isReversed: reversedFlags, language } = parsed.data;

    // Get the card map for names/data
    const map = await getCardMap();

    // Fetch full article content for all 3 cards
    const articlePromises = cardKeys.map(key => {
      const colonIdx = key.lastIndexOf(':');
      const ct = key.substring(0, colonIdx) as CardType;
      const cn = key.substring(colonIdx + 1);
      return prisma.blogPost.findFirst({
        where: {
          contentType: 'TAROT_ARTICLE',
          status: 'PUBLISHED',
          deletedAt: null,
          cardType: ct,
          cardNumber: cn,
        },
        select: {
          contentEn: true,
          contentFr: true,
          titleEn: true,
          titleFr: true,
        },
      });
    });

    const articles = await Promise.all(articlePromises);

    // Build cardDescriptions and articleContext
    const cardDescParts: string[] = [];
    const contextParts: string[] = [];

    for (let i = 0; i < 3; i++) {
      const card = map[cardKeys[i]];
      const art = articles[i];
      const cardTitle = art
        ? (language === 'fr' ? art.titleFr || art.titleEn : art.titleEn) || cardKeys[i]
        : cardKeys[i];
      const orientation = reversedFlags[i] ? 'Reversed' : 'Upright';

      cardDescParts.push(
        `Position ${i + 1} (${THREE_CARD_POSITIONS[i]}): ${cardTitle} (${orientation})`
      );

      const articleContent = art
        ? (language === 'fr' ? art.contentFr || art.contentEn : art.contentEn) || ''
        : '';
      const context = extractArticleContext(articleContent, reversedFlags[i]);
      if (context) {
        contextParts.push(`--- ${cardTitle} (${orientation}) ---\n${context}`);
      }

      // Suppress unused variable warning
      void card;
    }

    const cardDescriptions = cardDescParts.join('\n');
    const articleContext = contextParts.join('\n\n');

    try {
      const prompt = await getYesNoThreeCardPrompt({
        question,
        cardDescriptions,
        articleContext,
        language,
      });

      const interpretation = await openRouterService.generateTarotReading(prompt, {
        temperature: 0.7,
        maxTokens: 600,
      });

      res.json({ interpretation });
    } catch (error) {
      logger.error('[YesNo] AI interpretation failed for three-card spread:', error);
      res.json({ interpretation: null });
    }
  })
);

export default router;

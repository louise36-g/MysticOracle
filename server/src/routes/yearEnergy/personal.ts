/**
 * Year Energy Routes - Personal Year Endpoints
 *
 * Endpoints:
 * - GET /cached - Get cached personal year reading
 * - POST / - Generate personalized year energy reading
 *
 * NOTE: The POST / route keeps its try/catch because the catch block
 * implements credit refund logic that must run when generation fails.
 */

import {
  Router,
  requireAuth,
  prisma,
  openRouterService,
  getYearEnergyReadingPrompt,
  debug,
  personalYearSchema,
  calculatePersonalYear,
  MAJOR_ARCANA,
  creditService,
  YEAR_ENERGY_CREDIT_COST,
} from './shared.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { logger } from '../../lib/logger.js';

const router = Router();

// ============================================
// CACHED PERSONAL READING
// ============================================

/**
 * GET /api/v1/year-energy/personal/cached
 * Get cached personal year reading for current user
 * Returns null if no cached reading exists
 */
router.get(
  '/cached',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.auth.userId;
    const language = (req.query.language as string) || 'en';
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();

    const cached = await prisma.personalYearReading.findUnique({
      where: {
        userId_year: { userId, year },
      },
      include: {
        yearEnergy: true,
      },
    });

    if (!cached) {
      return res.json({ cached: null });
    }

    const personalYearCard = MAJOR_ARCANA[cached.personalYearCardId];
    const yearCard = MAJOR_ARCANA[cached.yearEnergy.yearCardId];

    res.json({
      cached: {
        year: cached.year,
        synthesis: language === 'en' ? cached.synthesisEn : cached.synthesisFr,
        personalYearNumber: cached.personalYearNumber,
        personalYearCard: {
          id: cached.personalYearCardId,
          name: language === 'en' ? personalYearCard?.name : personalYearCard?.nameFr,
          element: language === 'en' ? cached.personalYearElement : personalYearCard?.elementFr,
        },
        universalYearCard: {
          id: cached.yearEnergy.yearCardId,
          name: language === 'en' ? yearCard?.name : yearCard?.nameFr,
        },
        createdAt: cached.createdAt,
      },
    });
  })
);

// ============================================
// GENERATE PERSONAL READING
// ============================================

/**
 * POST /api/v1/year-energy/personal
 * Generate personalized year energy reading
 * Weaves universal year energy with user's birth cards
 */
router.post('/', requireAuth, async (req, res) => {
  let transactionId: string | undefined;

  try {
    const userId = req.auth.userId;
    const validation = personalYearSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { personalityCard, soulCard, zodiac, birthDate, language } = validation.data;
    const year = validation.data.year || new Date().getFullYear();

    // Always charge credits for Year Energy readings
    // Users can view past readings in their history instead of regenerating

    // Check if user has enough credits
    const balanceCheck = await creditService.checkSufficientCredits(
      userId,
      YEAR_ENERGY_CREDIT_COST
    );
    if (balanceCheck.balance === 0 && !balanceCheck.sufficient) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!balanceCheck.sufficient) {
      return res.status(400).json({
        error: 'Insufficient credits',
        required: YEAR_ENERGY_CREDIT_COST,
        available: balanceCheck.balance,
      });
    }

    // Deduct credits BEFORE generating (will refund if generation fails)
    const deductResult = await creditService.deductCredits({
      userId,
      amount: YEAR_ENERGY_CREDIT_COST,
      type: 'READING',
      description: `Year Energy Reading ${year}`,
    });

    if (!deductResult.success) {
      return res.status(400).json({ error: 'Failed to process credits' });
    }

    transactionId = deductResult.transactionId;
    debug.log('[YearEnergy] Deducted', YEAR_ENERGY_CREDIT_COST, 'credits for user:', userId);

    // Fetch year energy
    const yearEnergy = await prisma.yearEnergy.findUnique({
      where: { year },
    });

    if (!yearEnergy) {
      return res.status(404).json({
        error: 'Year energy not available',
        message: `Please wait while year energy for ${year} is being generated`,
      });
    }

    // Calculate personal year
    const parsedBirthDate = new Date(birthDate);
    const personalYearNumber = calculatePersonalYear(parsedBirthDate, year);
    const personalYearCard = MAJOR_ARCANA[personalYearNumber];

    // Build year energy section for prompt - PERSONAL YEAR IS THE FOCUS
    const yearCard = MAJOR_ARCANA[yearEnergy.yearCardId];
    const yearEnergySection =
      language === 'en'
        ? `=== THEIR PERSONAL YEAR (MOST IMPORTANT) ===
Personal Year Number: ${personalYearNumber}
Personal Year Card: ${personalYearCard?.name}
Personal Year Element: ${personalYearCard?.element}

=== UNIVERSAL YEAR CONTEXT ===
Universal Year Number: ${yearEnergy.yearNumber}
Universal Year Card: ${yearCard?.name}
Universal Year Element: ${yearEnergy.yearElement}
Cycle Position: ${yearEnergy.cyclePosition} of 9

Note: The Personal Year is calculated from their birth date + current year. It represents THEIR personal energy for ${year}, while the Universal Year affects everyone collectively.`
        : `=== LEUR ANNEE PERSONNELLE (LE PLUS IMPORTANT) ===
Numero d'Annee Personnelle: ${personalYearNumber}
Carte d'Annee Personnelle: ${personalYearCard?.nameFr}
Element d'Annee Personnelle: ${personalYearCard?.elementFr}

=== CONTEXTE DE L'ANNEE UNIVERSELLE ===
Numero d'Annee Universelle: ${yearEnergy.yearNumber}
Carte d'Annee Universelle: ${yearCard?.nameFr}
Element d'Annee Universelle: ${yearEnergy.yearElement}
Position dans le Cycle: ${yearEnergy.cyclePosition} sur 9

Note: L'Annee Personnelle est calculee a partir de leur date de naissance + l'annee en cours. Elle represente LEUR energie personnelle pour ${year}.`;

    // Build birth cards section with clear element mapping
    const birthCardsSection =
      language === 'en'
        ? `=== BIRTH CARDS ===
Personality Card: ${personalityCard.cardName} (${personalityCard.element} element)
Soul Card: ${soulCard.cardName} (${soulCard.element} element)

=== ZODIAC ===
Sign: ${zodiac.name}
Zodiac Element: ${zodiac.element}

=== ELEMENT SUMMARY ===
- Personal Year Element: ${personalYearCard?.element}
- Universal Year Element: ${yearEnergy.yearElement}
- Personality Card Element: ${personalityCard.element}
- Soul Card Element: ${soulCard.element}
- Zodiac Element: ${zodiac.element}`
        : `=== CARTES DE NAISSANCE ===
Carte de Personnalite: ${personalityCard.cardNameFr} (element ${personalityCard.elementFr})
Carte de l'Ame: ${soulCard.cardNameFr} (element ${soulCard.elementFr})

=== ZODIAQUE ===
Signe: ${zodiac.nameFr}
Element du Zodiaque: ${zodiac.elementFr}

=== RESUME DES ELEMENTS ===
- Element Annee Personnelle: ${personalYearCard?.elementFr}
- Element Annee Universelle: ${yearCard?.elementFr}
- Element Carte Personnalite: ${personalityCard.elementFr}
- Element Carte Ame: ${soulCard.elementFr}
- Element Zodiaque: ${zodiac.elementFr}`;

    // Generate prompt
    const prompt = await getYearEnergyReadingPrompt({
      year,
      yearEnergySection,
      birthCardsSection,
      language,
    });

    debug.log('[YearEnergy] Generating personal year reading for user:', userId);

    // Generate with AI
    const synthesis = await openRouterService.generateTarotReading(prompt, {
      temperature: 0.7,
      maxTokens: 2500,
    });

    // Cache the result
    await prisma.personalYearReading.upsert({
      where: {
        userId_year: { userId, year },
      },
      create: {
        userId,
        yearEnergyId: yearEnergy.id,
        year,
        personalityCardId: personalityCard.cardId,
        soulCardId: soulCard.cardId,
        zodiacSign: zodiac.name,
        personalYearNumber,
        personalYearCardId: personalYearNumber,
        personalityElement: personalityCard.element,
        soulElement: soulCard.element,
        personalYearElement: personalYearCard?.element || 'Spirit',
        synthesisEn: language === 'en' ? synthesis : '',
        synthesisFr: language === 'fr' ? synthesis : '',
      },
      update: {
        personalityCardId: personalityCard.cardId,
        soulCardId: soulCard.cardId,
        zodiacSign: zodiac.name,
        personalYearNumber,
        personalYearCardId: personalYearNumber,
        personalityElement: personalityCard.element,
        soulElement: soulCard.element,
        personalYearElement: personalYearCard?.element || 'Spirit',
        ...(language === 'en' ? { synthesisEn: synthesis } : { synthesisFr: synthesis }),
      },
    });

    debug.log('[YearEnergy] Personal year reading cached for user:', userId);

    res.json({
      synthesis,
      cached: false,
      personalYearNumber,
      personalYearCardId: personalYearNumber,
      creditsUsed: YEAR_ENERGY_CREDIT_COST,
    });
  } catch (error) {
    // Refund credits if we deducted them but generation failed
    if (transactionId) {
      try {
        const refundResult = await creditService.refundCredits(
          req.auth.userId,
          YEAR_ENERGY_CREDIT_COST,
          'Year energy generation failed',
          transactionId
        );
        if (refundResult.success) {
          debug.log('[YearEnergy] Refunded credits after generation failure');
        } else {
          logger.error('[YearEnergy] CRITICAL: Failed to refund credits:', refundResult.error);
        }
      } catch (refundError) {
        logger.error('[YearEnergy] CRITICAL: Refund error:', refundError);
      }
    }

    const message = error instanceof Error ? error.message : 'Failed to generate reading';
    res.status(500).json({ error: message });
  }
});

export default router;

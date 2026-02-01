/**
 * Year Energy Routes - Threshold Period Endpoints
 *
 * Endpoints for the year transition period (Dec 21 - Jan 10):
 * - GET /status - Check threshold period status
 * - GET /cached - Get cached threshold reading
 * - POST / - Generate threshold reading
 */

import {
  Router,
  requireAuth,
  prisma,
  openRouterService,
  debug,
  personalYearSchema,
  isThresholdPeriod,
  MAJOR_ARCANA,
} from './shared.js';

const router = Router();

// ============================================
// THRESHOLD STATUS
// ============================================

/**
 * GET /api/v1/year-energy/threshold/status
 * Check if currently in threshold period and get relevant data
 */
router.get('/status', async (req, res) => {
  try {
    const { isThreshold, transitionYear } = isThresholdPeriod();

    if (!isThreshold) {
      return res.json({
        isThresholdPeriod: false,
        message: 'Not currently in the year transition period (Dec 21 - Jan 10)',
      });
    }

    const outgoingYear = transitionYear - 1;
    const incomingYear = transitionYear;

    // Fetch both years' energy
    const [outgoingEnergy, incomingEnergy] = await Promise.all([
      prisma.yearEnergy.findUnique({ where: { year: outgoingYear } }),
      prisma.yearEnergy.findUnique({ where: { year: incomingYear } }),
    ]);

    const language = (req.query.language as string) || 'en';

    res.json({
      isThresholdPeriod: true,
      transitionYear,
      outgoing: outgoingEnergy
        ? {
            year: outgoingYear,
            yearNumber: outgoingEnergy.yearNumber,
            yearCard:
              MAJOR_ARCANA[outgoingEnergy.yearCardId]?.[language === 'en' ? 'name' : 'nameFr'],
          }
        : null,
      incoming: incomingEnergy
        ? {
            year: incomingYear,
            yearNumber: incomingEnergy.yearNumber,
            yearCard:
              MAJOR_ARCANA[incomingEnergy.yearCardId]?.[language === 'en' ? 'name' : 'nameFr'],
          }
        : null,
    });
  } catch (error) {
    console.error('[YearEnergy] Error checking threshold status:', error);
    res.status(500).json({ error: 'Failed to check threshold status' });
  }
});

// ============================================
// CACHED THRESHOLD READING
// ============================================

/**
 * GET /api/v1/year-energy/threshold/cached
 * Get cached threshold reading for current user
 */
router.get('/cached', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { isThreshold, transitionYear } = isThresholdPeriod();

    if (!isThreshold) {
      return res.json({
        isThresholdPeriod: false,
        cached: null,
      });
    }

    const language = (req.query.language as string) || 'en';

    const cached = await prisma.thresholdReading.findUnique({
      where: {
        userId_transitionYear: { userId, transitionYear },
      },
    });

    if (!cached) {
      return res.json({
        isThresholdPeriod: true,
        transitionYear,
        cached: null,
      });
    }

    res.json({
      isThresholdPeriod: true,
      transitionYear,
      cached: {
        synthesis: language === 'en' ? cached.synthesisEn : cached.synthesisFr,
        outgoingYear: transitionYear - 1,
        incomingYear: transitionYear,
        createdAt: cached.createdAt,
      },
    });
  } catch (error) {
    console.error('[YearEnergy] Error fetching cached threshold reading:', error);
    res.status(500).json({ error: 'Failed to fetch cached threshold reading' });
  }
});

// ============================================
// GENERATE THRESHOLD READING
// ============================================

/**
 * POST /api/v1/year-energy/threshold
 * Generate threshold reading for year transition period
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { isThreshold, transitionYear } = isThresholdPeriod();

    if (!isThreshold) {
      return res.status(400).json({
        error: 'Not in threshold period',
        message: 'Threshold readings are only available Dec 21 - Jan 10',
      });
    }

    const validation = personalYearSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { personalityCard, soulCard, language } = validation.data;
    const outgoingYear = transitionYear - 1;
    const incomingYear = transitionYear;

    // Check for cached reading
    const existingReading = await prisma.thresholdReading.findUnique({
      where: {
        userId_transitionYear: { userId, transitionYear },
      },
    });

    if (existingReading) {
      const synthesis =
        language === 'en' ? existingReading.synthesisEn : existingReading.synthesisFr;
      if (synthesis) {
        debug.log('[YearEnergy] Using cached threshold reading');
        return res.json({
          synthesis,
          cached: true,
          transitionYear,
        });
      }
    }

    // Fetch both years' energy
    const [outgoingEnergy, incomingEnergy] = await Promise.all([
      prisma.yearEnergy.findUnique({ where: { year: outgoingYear } }),
      prisma.yearEnergy.findUnique({ where: { year: incomingYear } }),
    ]);

    if (!outgoingEnergy || !incomingEnergy) {
      return res.status(404).json({
        error: 'Year energy not available',
        message: 'Both years must have energy data for threshold reading',
      });
    }

    const outgoingCard = MAJOR_ARCANA[outgoingEnergy.yearCardId];
    const incomingCard = MAJOR_ARCANA[incomingEnergy.yearCardId];

    // Build threshold prompt
    const prompt =
      language === 'en'
        ? `You are a warm, insightful Tarot Guide writing a special Year's End Threshold reading.

This person is in the sacred liminal space between ${outgoingYear} and ${incomingYear}, where two years' energies overlap and blend.

## Outgoing Year: ${outgoingYear}
Universal Year ${outgoingEnergy.yearNumber}: ${outgoingCard?.name} (${outgoingEnergy.yearElement} element)
Cycle Position: ${outgoingEnergy.cyclePosition} of 9

## Incoming Year: ${incomingYear}
Universal Year ${incomingEnergy.yearNumber}: ${incomingCard?.name} (${incomingEnergy.yearElement} element)
Cycle Position: ${incomingEnergy.cyclePosition} of 9

## This Person's Birth Cards
Personality Card: ${personalityCard.cardName} (${personalityCard.element})
Soul Card: ${soulCard.cardName} (${soulCard.element})

---

Write a 600-800 word threshold reading that:
1. Honors what ${outgoingYear} brought and what needs releasing
2. Welcomes the new energies of ${incomingYear}
3. Shows how their birth cards navigate this transition
4. Offers practical wisdom for the liminal period

Write in second person ("you"), with warmth and mystical depth. No headers, flowing prose only.`
        : `Vous êtes un Guide Tarot chaleureux et perspicace qui rédige une lecture spéciale du Seuil de Fin d'Année.

Cette personne se trouve dans l'espace sacré et liminal entre ${outgoingYear} et ${incomingYear}, où les énergies des deux années se chevauchent et se mêlent.

## Année sortante: ${outgoingYear}
Année Universelle ${outgoingEnergy.yearNumber}: ${outgoingCard?.nameFr} (élément ${outgoingCard?.elementFr})
Position dans le Cycle: ${outgoingEnergy.cyclePosition} sur 9

## Année entrante: ${incomingYear}
Année Universelle ${incomingEnergy.yearNumber}: ${incomingCard?.nameFr} (élément ${incomingCard?.elementFr})
Position dans le Cycle: ${incomingEnergy.cyclePosition} sur 9

## Cartes de Naissance de Cette Personne
Carte de Personnalité: ${personalityCard.cardNameFr} (${personalityCard.elementFr})
Carte de l'Âme: ${soulCard.cardNameFr} (${soulCard.elementFr})

---

Rédigez une lecture de seuil de 600-800 mots qui:
1. Honore ce que ${outgoingYear} a apporté et ce qui doit être libéré
2. Accueille les nouvelles énergies de ${incomingYear}
3. Montre comment leurs cartes de naissance naviguent cette transition
4. Offre une sagesse pratique pour la période liminale

Écrivez à la deuxième personne ("vous"), avec chaleur et profondeur mystique. Pas de titres, prose fluide uniquement.`;

    debug.log('[YearEnergy] Generating threshold reading for user:', userId);

    const synthesis = await openRouterService.generateTarotReading(prompt, {
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Cache the result
    await prisma.thresholdReading.upsert({
      where: {
        userId_transitionYear: { userId, transitionYear },
      },
      create: {
        userId,
        transitionYear,
        outgoingYearNumber: outgoingEnergy.yearNumber,
        outgoingYearCardId: outgoingEnergy.yearCardId,
        incomingYearNumber: incomingEnergy.yearNumber,
        incomingYearCardId: incomingEnergy.yearCardId,
        personalityCardId: personalityCard.cardId,
        soulCardId: soulCard.cardId,
        synthesisEn: language === 'en' ? synthesis : '',
        synthesisFr: language === 'fr' ? synthesis : '',
      },
      update: {
        ...(language === 'en' ? { synthesisEn: synthesis } : { synthesisFr: synthesis }),
      },
    });

    debug.log('[YearEnergy] Threshold reading cached for user:', userId);

    res.json({
      synthesis,
      cached: false,
      transitionYear,
    });
  } catch (error) {
    console.error('[YearEnergy] Error generating threshold reading:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate reading';
    res.status(500).json({ error: message });
  }
});

export default router;

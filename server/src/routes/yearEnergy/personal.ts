/**
 * Year Energy Routes - Personal Year Endpoints
 *
 * Endpoints:
 * - GET /cached - Get cached personal year reading
 * - POST / - Generate personalized year energy reading
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
} from './shared.js';

const router = Router();

// ============================================
// CACHED PERSONAL READING
// ============================================

/**
 * GET /api/v1/year-energy/personal/cached
 * Get cached personal year reading for current user
 * Returns null if no cached reading exists
 */
router.get('/cached', requireAuth, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('[YearEnergy] Error fetching cached personal reading:', error);
    res.status(500).json({ error: 'Failed to fetch cached reading' });
  }
});

// ============================================
// GENERATE PERSONAL READING
// ============================================

/**
 * POST /api/v1/year-energy/personal
 * Generate personalized year energy reading
 * Weaves universal year energy with user's birth cards
 */
router.post('/', requireAuth, async (req, res) => {
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

    // Check for cached reading first
    const existingReading = await prisma.personalYearReading.findUnique({
      where: {
        userId_year: { userId, year },
      },
    });

    if (existingReading) {
      // Check if birth cards match (in case user changed birth date)
      if (
        existingReading.personalityCardId === personalityCard.cardId &&
        existingReading.soulCardId === soulCard.cardId
      ) {
        const synthesis =
          language === 'en' ? existingReading.synthesisEn : existingReading.synthesisFr;
        if (synthesis) {
          debug.log('[YearEnergy] Using cached personal year reading');
          return res.json({
            synthesis,
            cached: true,
            personalYearNumber: existingReading.personalYearNumber,
            personalYearCardId: existingReading.personalYearCardId,
          });
        }
      }
    }

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
        : `=== LEUR ANNÉE PERSONNELLE (LE PLUS IMPORTANT) ===
Numéro d'Année Personnelle: ${personalYearNumber}
Carte d'Année Personnelle: ${personalYearCard?.nameFr}
Élément d'Année Personnelle: ${personalYearCard?.elementFr}

=== CONTEXTE DE L'ANNÉE UNIVERSELLE ===
Numéro d'Année Universelle: ${yearEnergy.yearNumber}
Carte d'Année Universelle: ${yearCard?.nameFr}
Élément d'Année Universelle: ${yearEnergy.yearElement}
Position dans le Cycle: ${yearEnergy.cyclePosition} sur 9

Note: L'Année Personnelle est calculée à partir de leur date de naissance + l'année en cours. Elle représente LEUR énergie personnelle pour ${year}.`;

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
Carte de Personnalité: ${personalityCard.cardNameFr} (élément ${personalityCard.elementFr})
Carte de l'Âme: ${soulCard.cardNameFr} (élément ${soulCard.elementFr})

=== ZODIAQUE ===
Signe: ${zodiac.nameFr}
Élément du Zodiaque: ${zodiac.elementFr}

=== RÉSUMÉ DES ÉLÉMENTS ===
- Élément Année Personnelle: ${personalYearCard?.elementFr}
- Élément Année Universelle: ${yearCard?.elementFr}
- Élément Carte Personnalité: ${personalityCard.elementFr}
- Élément Carte Âme: ${soulCard.elementFr}
- Élément Zodiaque: ${zodiac.elementFr}`;

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
    });
  } catch (error) {
    console.error('[YearEnergy] Error generating personal reading:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate reading';
    res.status(500).json({ error: message });
  }
});

export default router;

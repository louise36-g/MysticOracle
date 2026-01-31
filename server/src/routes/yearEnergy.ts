/**
 * Year Energy Routes
 *
 * Endpoints for universal year energy and personalized year readings.
 * - Public: Get universal year energy
 * - Authenticated: Get/generate personal year readings
 * - Authenticated: Get threshold readings (Dec 21 - Jan 10)
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../db/prisma.js';
import { openRouterService } from '../services/openRouterService.js';
import { getYearEnergyReadingPrompt } from '../services/promptService.js';

const router = Router();

// Major Arcana card data
const MAJOR_ARCANA: Record<
  number,
  { name: string; nameFr: string; element: string; elementFr: string }
> = {
  0: { name: 'The Fool', nameFr: 'Le Mat', element: 'Air', elementFr: 'Air' },
  1: { name: 'The Magician', nameFr: 'Le Bateleur', element: 'Air', elementFr: 'Air' },
  2: { name: 'The High Priestess', nameFr: 'La Papesse', element: 'Water', elementFr: 'Eau' },
  3: { name: 'The Empress', nameFr: "L'Impératrice", element: 'Earth', elementFr: 'Terre' },
  4: { name: 'The Emperor', nameFr: "L'Empereur", element: 'Fire', elementFr: 'Feu' },
  5: { name: 'The Hierophant', nameFr: 'Le Pape', element: 'Earth', elementFr: 'Terre' },
  6: { name: 'The Lovers', nameFr: "L'Amoureux", element: 'Air', elementFr: 'Air' },
  7: { name: 'The Chariot', nameFr: 'Le Chariot', element: 'Water', elementFr: 'Eau' },
  8: { name: 'Strength', nameFr: 'La Force', element: 'Fire', elementFr: 'Feu' },
  9: { name: 'The Hermit', nameFr: "L'Hermite", element: 'Earth', elementFr: 'Terre' },
  10: { name: 'Wheel of Fortune', nameFr: 'La Roue de Fortune', element: 'Fire', elementFr: 'Feu' },
  11: { name: 'Justice', nameFr: 'La Justice', element: 'Air', elementFr: 'Air' },
  12: { name: 'The Hanged Man', nameFr: 'Le Pendu', element: 'Water', elementFr: 'Eau' },
  13: { name: 'Death', nameFr: "L'Arcane Sans Nom", element: 'Water', elementFr: 'Eau' },
  14: { name: 'Temperance', nameFr: 'La Tempérance', element: 'Fire', elementFr: 'Feu' },
  15: { name: 'The Devil', nameFr: 'Le Diable', element: 'Earth', elementFr: 'Terre' },
  16: { name: 'The Tower', nameFr: 'La Maison Dieu', element: 'Fire', elementFr: 'Feu' },
  17: { name: 'The Star', nameFr: "L'Étoile", element: 'Air', elementFr: 'Air' },
  18: { name: 'The Moon', nameFr: 'La Lune', element: 'Water', elementFr: 'Eau' },
  19: { name: 'The Sun', nameFr: 'Le Soleil', element: 'Fire', elementFr: 'Feu' },
  20: { name: 'Judgement', nameFr: 'Le Jugement', element: 'Fire', elementFr: 'Feu' },
  21: { name: 'The World', nameFr: 'Le Monde', element: 'Earth', elementFr: 'Terre' },
};

/**
 * Calculate personal year number from birth date and current year
 * Formula: (birth month + birth day + current year) reduced to single digit
 */
function calculatePersonalYear(birthDate: Date, year: number): number {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();

  let sum = month + day + year;

  // Reduce to single digit (1-9)
  while (sum > 9) {
    sum = sum
      .toString()
      .split('')
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }

  return sum;
}

/**
 * Check if current date is in threshold period (Dec 21 - Jan 10)
 */
function isThresholdPeriod(date: Date = new Date()): {
  isThreshold: boolean;
  transitionYear: number;
} {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  // Dec 21-31: transitioning into next year
  if (month === 12 && day >= 21) {
    return { isThreshold: true, transitionYear: year + 1 };
  }

  // Jan 1-10: transitioning from previous year
  if (month === 1 && day <= 10) {
    return { isThreshold: true, transitionYear: year };
  }

  return { isThreshold: false, transitionYear: year };
}

// Validation schemas
const yearParamSchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/)
    .transform(Number),
});

const personalYearSchema = z.object({
  personalityCard: z.object({
    cardId: z.number(),
    cardName: z.string(),
    cardNameFr: z.string(),
    element: z.string(),
    elementFr: z.string(),
  }),
  soulCard: z.object({
    cardId: z.number(),
    cardName: z.string(),
    cardNameFr: z.string(),
    element: z.string(),
    elementFr: z.string(),
  }),
  zodiac: z.object({
    name: z.string(),
    nameFr: z.string(),
    element: z.string(),
    elementFr: z.string(),
  }),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  language: z.enum(['en', 'fr']),
  year: z.number().optional(),
});

/**
 * GET /api/v1/year-energy/current
 * Convenience endpoint to get current year's energy
 * NOTE: Must be defined BEFORE /:year to avoid route conflict
 */
router.get('/current', async (req, res) => {
  const currentYear = new Date().getFullYear();
  const language = (req.query.language as string) || 'en';

  try {
    const yearEnergy = await prisma.yearEnergy.findUnique({
      where: { year: currentYear },
    });

    if (!yearEnergy) {
      return res.status(404).json({
        error: 'Year energy not found',
        message: `No energy data available for year ${currentYear}`,
      });
    }

    const card = MAJOR_ARCANA[yearEnergy.yearCardId];

    res.json({
      year: yearEnergy.year,
      yearNumber: yearEnergy.yearNumber,
      yearCard: {
        id: yearEnergy.yearCardId,
        name: language === 'en' ? card?.name : card?.nameFr,
        element: language === 'en' ? yearEnergy.yearElement : card?.elementFr,
      },
      cyclePosition: yearEnergy.cyclePosition,
      themes: language === 'en' ? yearEnergy.themesEn : yearEnergy.themesFr,
      challenges: language === 'en' ? yearEnergy.challengesEn : yearEnergy.challengesFr,
      opportunities: language === 'en' ? yearEnergy.opportunitiesEn : yearEnergy.opportunitiesFr,
    });
  } catch (error) {
    console.error('[YearEnergy] Error fetching current year energy:', error);
    res.status(500).json({ error: 'Failed to fetch year energy' });
  }
});

/**
 * GET /api/v1/year-energy/:year
 * Get universal year energy for a specific year
 * Public endpoint
 */
router.get('/:year', async (req, res) => {
  try {
    const validation = yearParamSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid year parameter' });
    }

    const { year } = validation.data;
    const language = (req.query.language as string) || 'en';

    const yearEnergy = await prisma.yearEnergy.findUnique({
      where: { year },
    });

    if (!yearEnergy) {
      return res.status(404).json({
        error: 'Year energy not found',
        message: `No energy data available for year ${year}`,
      });
    }

    const card = MAJOR_ARCANA[yearEnergy.yearCardId];

    res.json({
      year: yearEnergy.year,
      yearNumber: yearEnergy.yearNumber,
      yearCard: {
        id: yearEnergy.yearCardId,
        name: language === 'en' ? card?.name : card?.nameFr,
        element: language === 'en' ? yearEnergy.yearElement : card?.elementFr,
      },
      cyclePosition: yearEnergy.cyclePosition,
      themes: language === 'en' ? yearEnergy.themesEn : yearEnergy.themesFr,
      challenges: language === 'en' ? yearEnergy.challengesEn : yearEnergy.challengesFr,
      opportunities: language === 'en' ? yearEnergy.opportunitiesEn : yearEnergy.opportunitiesFr,
    });
  } catch (error) {
    console.error('[YearEnergy] Error fetching year energy:', error);
    res.status(500).json({ error: 'Failed to fetch year energy' });
  }
});

/**
 * GET /api/v1/year-energy/personal/cached
 * Get cached personal year reading for current user
 * Returns null if no cached reading exists
 */
router.get('/personal/cached', requireAuth, async (req, res) => {
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

/**
 * POST /api/v1/year-energy/personal
 * Generate personalized year energy reading
 * Weaves universal year energy with user's birth cards
 */
router.post('/personal', requireAuth, async (req, res) => {
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
          console.log('[YearEnergy] Using cached personal year reading');
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

    console.log('[YearEnergy] Generating personal year reading for user:', userId);

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

    console.log('[YearEnergy] Personal year reading cached for user:', userId);

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

/**
 * GET /api/v1/year-energy/threshold/status
 * Check if currently in threshold period and get relevant data
 */
router.get('/threshold/status', async (req, res) => {
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

/**
 * GET /api/v1/year-energy/threshold/cached
 * Get cached threshold reading for current user
 */
router.get('/threshold/cached', requireAuth, async (req, res) => {
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

/**
 * POST /api/v1/year-energy/threshold
 * Generate threshold reading for year transition period
 */
router.post('/threshold', requireAuth, async (req, res) => {
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
        console.log('[YearEnergy] Using cached threshold reading');
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

    console.log('[YearEnergy] Generating threshold reading for user:', userId);

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

    console.log('[YearEnergy] Threshold reading cached for user:', userId);

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

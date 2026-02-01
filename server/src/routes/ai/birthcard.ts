/**
 * AI Routes - Birth Card & Year Energy Readings
 *
 * Endpoints:
 * - POST /birthcard/year-energy - Generate year energy reading
 * - GET /birthcard/synthesis - Get cached birth card synthesis
 * - POST /birthcard/synthesis - Generate birth card synthesis
 */

import {
  Router,
  requireAuth,
  creditService,
  openRouterService,
  prisma,
  debug,
  getYearEnergyReadingPrompt,
  getBirthCardSynthesisPrompt,
  yearEnergySchema,
  birthCardSynthesisSchema,
} from './shared.js';

const router = Router();

// ============================================
// YEAR ENERGY READING
// ============================================

/**
 * POST /api/v1/ai/birthcard/year-energy
 * Generate a personalized year energy reading based on birth cards
 */
router.post('/year-energy', requireAuth, async (req, res) => {
  try {
    const validation = yearEnergySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { year, yearEnergy, personalityCard, soulCard, isUnifiedBirthCard, language } =
      validation.data;

    const userId = req.auth.userId;
    const creditCost = 3; // Year energy reading costs 3 credits

    debug.log('[Year Energy] Request:', {
      userId,
      year,
      personalityCard: personalityCard.cardName,
      soulCard: soulCard.cardName,
      isUnifiedBirthCard,
      language,
    });

    // Check if user has enough credits
    const balanceCheck = await creditService.checkSufficientCredits(userId, creditCost);
    if (balanceCheck.balance === 0 && !balanceCheck.sufficient) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!balanceCheck.sufficient) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Build year energy section
    let yearEnergySection: string;
    if (yearEnergy.isUnified) {
      yearEnergySection = `This year carries the unified energy of ${yearEnergy.primaryCardName} (${yearEnergy.primaryCardNameFr}).

${yearEnergy.description || 'Year energy description not yet available.'}`;
    } else {
      yearEnergySection = `This year carries dual energy: ${yearEnergy.primaryCardName} (${yearEnergy.primaryCardNameFr}) reducing to ${yearEnergy.reducedCardName} (${yearEnergy.reducedCardNameFr}).

${yearEnergy.description || 'Year energy description not yet available.'}`;
    }

    // Build birth cards section
    let birthCardsSection: string;
    if (isUnifiedBirthCard) {
      birthCardsSection = `This person has unified birth card energy: their Personality and Soul are both ${personalityCard.cardName} (${personalityCard.cardNameFr}).

${personalityCard.description || 'Birth card description not yet available.'}`;
    } else {
      birthCardsSection = `**Personality Card (Outer Expression):** ${personalityCard.cardName} (${personalityCard.cardNameFr})
${personalityCard.description || 'Personality card description not yet available.'}

**Soul Card (Inner Essence):** ${soulCard.cardName} (${soulCard.cardNameFr})
${soulCard.description || 'Soul card description not yet available.'}`;
    }

    // Get prompt from service
    const prompt = await getYearEnergyReadingPrompt({
      year,
      yearEnergySection,
      birthCardsSection,
      language,
    });

    debug.log('[Year Energy] Prompt built, length:', prompt.length);

    // Generate interpretation using OpenRouter service
    const startTime = Date.now();
    const interpretation = await openRouterService.generateTarotReading(prompt, {
      temperature: 0.7,
      maxTokens: 2000, // 800-1000 words ~= 1200-1500 tokens, need buffer for HTML
    });
    const elapsed = Date.now() - startTime;

    debug.log(
      '[Year Energy] ✅ Generated interpretation:',
      interpretation.length,
      'chars in',
      elapsed,
      'ms'
    );

    // Deduct credits after successful generation
    await creditService.deductCredits({
      userId,
      amount: creditCost,
      type: 'READING',
      description: `Year Energy Reading ${year}`,
    });

    res.json({
      interpretation,
      creditsUsed: creditCost,
    });
  } catch (error) {
    console.error('[Year Energy] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate year energy reading';
    res.status(500).json({ error: message });
  }
});

// ============================================
// BIRTH CARD SYNTHESIS - GET CACHED
// ============================================

/**
 * GET /api/v1/ai/birthcard/synthesis
 * Get cached birth card synthesis for the current user
 * Returns null if no cached synthesis exists
 */
router.get('/synthesis', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const language = (req.query.language as string) || 'en';

    debug.log(
      '[Birth Card Synthesis Cache] Checking cache for user:',
      userId,
      'language:',
      language
    );

    const cached = await prisma.birthCardSynthesis.findUnique({
      where: { userId },
    });

    if (!cached) {
      debug.log('[Birth Card Synthesis Cache] No cache found for user:', userId);
      return res.json({ cached: null });
    }

    // Normalize birthDate to YYYY-MM-DD string to avoid timezone issues
    // The @db.Date type stores just the date, but Prisma returns a Date object
    // which gets serialized with time component. We extract just the date part.
    const birthDateObj = new Date(cached.birthDate);
    const normalizedBirthDate = `${birthDateObj.getUTCFullYear()}-${String(birthDateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(birthDateObj.getUTCDate()).padStart(2, '0')}`;

    const interpretation = language === 'en' ? cached.synthesisEn : cached.synthesisFr;

    debug.log('[Birth Card Synthesis Cache] Found cache:', {
      userId,
      normalizedBirthDate,
      personalityCardId: cached.personalityCardId,
      soulCardId: cached.soulCardId,
      zodiacSign: cached.zodiacSign,
      hasEnglish: !!cached.synthesisEn && cached.synthesisEn.length > 0,
      hasFrench: !!cached.synthesisFr && cached.synthesisFr.length > 0,
      requestedLanguage: language,
      interpretationLength: interpretation?.length || 0,
    });

    // Return the synthesis in the requested language
    res.json({
      cached: {
        interpretation,
        birthDate: normalizedBirthDate, // Return as YYYY-MM-DD string
        personalityCardId: cached.personalityCardId,
        soulCardId: cached.soulCardId,
        zodiacSign: cached.zodiacSign,
        createdAt: cached.createdAt,
      },
    });
  } catch (error) {
    console.error('[Birth Card Synthesis Cache] Error:', error);
    res.status(500).json({ error: 'Failed to fetch cached synthesis' });
  }
});

// ============================================
// BIRTH CARD SYNTHESIS - GENERATE
// ============================================

/**
 * POST /api/v1/ai/birthcard/synthesis
 * Generate an AI-powered synthesis of Personality and Soul cards
 * Weaves together zodiac sign, elemental energies, spiritual and psychological insights
 * Also caches the result for future requests
 */
router.post('/synthesis', requireAuth, async (req, res) => {
  try {
    const validation = birthCardSynthesisSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { birthDate, personalityCard, soulCard, zodiac, isUnified, language } = validation.data;

    const userId = req.auth.userId;
    const creditCost = 2; // Birth card synthesis costs 2 credits

    debug.log('[Birth Card Synthesis] Request:', {
      userId,
      personalityCard: personalityCard.cardName,
      soulCard: soulCard.cardName,
      zodiac: zodiac.name,
      isUnified,
      language,
    });

    // Check if user has enough credits
    const balanceCheck = await creditService.checkSufficientCredits(userId, creditCost);
    if (balanceCheck.balance === 0 && !balanceCheck.sufficient) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!balanceCheck.sufficient) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Build sections for the prompt
    const personalitySection =
      language === 'en'
        ? `**${personalityCard.cardName}** (Element: ${personalityCard.element}, Planet: ${personalityCard.planet})
Keywords: ${personalityCard.keywords.join(', ')}

${personalityCard.description}`
        : `**${personalityCard.cardNameFr}** (Élément: ${personalityCard.elementFr}, Planète: ${personalityCard.planetFr})
Mots-clés: ${personalityCard.keywords.join(', ')}

${personalityCard.description}`;

    const soulSection = isUnified
      ? language === 'en'
        ? `This person has UNIFIED energy: their Personality and Soul are both ${soulCard.cardName}. This means their outer expression and inner essence are the same energy, creating a concentrated, powerful presence.`
        : `Cette personne a une énergie UNIFIÉE: sa Personnalité et son Âme sont toutes les deux ${soulCard.cardNameFr}. Cela signifie que leur expression extérieure et leur essence intérieure sont la même énergie, créant une présence concentrée et puissante.`
      : language === 'en'
        ? `**${soulCard.cardName}** (Element: ${soulCard.element}, Planet: ${soulCard.planet})
Keywords: ${soulCard.keywords.join(', ')}

${soulCard.description}`
        : `**${soulCard.cardNameFr}** (Élément: ${soulCard.elementFr}, Planète: ${soulCard.planetFr})
Mots-clés: ${soulCard.keywords.join(', ')}

${soulCard.description}`;

    const zodiacSection =
      language === 'en'
        ? `**${zodiac.name}** - ${zodiac.element} Sign, ${zodiac.quality} Quality
Ruling Planet: ${zodiac.rulingPlanet}

As a ${zodiac.name}, this person carries ${zodiac.element} energy with a ${zodiac.quality} approach to life. Their ruling planet ${zodiac.rulingPlanet} colours how they express their birth cards.`
        : `**${zodiac.nameFr}** - Signe de ${zodiac.elementFr}, Qualité ${zodiac.qualityFr}
Planète dominante: ${zodiac.rulingPlanetFr}

En tant que ${zodiac.nameFr}, cette personne porte l'énergie ${zodiac.elementFr} avec une approche ${zodiac.qualityFr} de la vie. Sa planète dominante ${zodiac.rulingPlanetFr} colore la façon dont elle exprime ses cartes de naissance.`;

    // Build elemental analysis
    const elements = [personalityCard.element, soulCard.element, zodiac.element];
    const elementCounts: Record<string, number> = {};
    elements.forEach(el => {
      elementCounts[el] = (elementCounts[el] || 0) + 1;
    });

    let elementalAnalysis: string;
    const dominantElement = Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0];

    if (language === 'en') {
      if (dominantElement[1] >= 2) {
        elementalAnalysis = `This person has a strong ${dominantElement[0]} signature, with ${dominantElement[1]} out of 3 key energies being ${dominantElement[0]}. `;
        if (dominantElement[0] === 'Fire') {
          elementalAnalysis +=
            'This creates passionate, action-oriented energy with strong drive and enthusiasm.';
        } else if (dominantElement[0] === 'Water') {
          elementalAnalysis +=
            'This creates deeply intuitive, emotionally attuned energy with strong empathy and sensitivity.';
        } else if (dominantElement[0] === 'Air') {
          elementalAnalysis +=
            'This creates mentally agile, communicative energy with strong intellectual and social gifts.';
        } else if (dominantElement[0] === 'Earth') {
          elementalAnalysis +=
            'This creates grounded, practical energy with strong building and manifesting abilities.';
        }
      } else {
        elementalAnalysis = `This person has a balanced elemental mix: ${personalityCard.element} (Personality), ${soulCard.element} (Soul), and ${zodiac.element} (Zodiac). This diversity creates versatility and the ability to adapt to different situations.`;
      }
    } else {
      if (dominantElement[1] >= 2) {
        const elFr =
          dominantElement[0] === 'Fire'
            ? 'Feu'
            : dominantElement[0] === 'Water'
              ? 'Eau'
              : dominantElement[0] === 'Air'
                ? 'Air'
                : 'Terre';
        elementalAnalysis = `Cette personne a une forte signature ${elFr}, avec ${dominantElement[1]} énergies clés sur 3 étant ${elFr}. `;
        if (dominantElement[0] === 'Fire') {
          elementalAnalysis +=
            "Cela crée une énergie passionnée et orientée vers l'action avec une forte motivation et enthousiasme.";
        } else if (dominantElement[0] === 'Water') {
          elementalAnalysis +=
            'Cela crée une énergie profondément intuitive et émotionnellement accordée avec une forte empathie et sensibilité.';
        } else if (dominantElement[0] === 'Air') {
          elementalAnalysis +=
            'Cela crée une énergie mentalement agile et communicative avec de forts dons intellectuels et sociaux.';
        } else if (dominantElement[0] === 'Earth') {
          elementalAnalysis +=
            'Cela crée une énergie ancrée et pratique avec de fortes capacités de construction et de manifestation.';
        }
      } else {
        elementalAnalysis = `Cette personne a un mélange élémentaire équilibré: ${personalityCard.elementFr} (Personnalité), ${soulCard.elementFr} (Âme), et ${zodiac.elementFr} (Zodiaque). Cette diversité crée de la polyvalence et la capacité de s'adapter à différentes situations.`;
      }
    }

    const elementalSection = `Elements present: ${personalityCard.element} (Personality Card), ${soulCard.element} (Soul Card), ${zodiac.element} (Zodiac Sign)

${elementalAnalysis}`;

    // Get prompt from service
    const prompt = await getBirthCardSynthesisPrompt({
      personalitySection,
      soulSection,
      zodiacSection,
      elementalSection,
      language,
    });

    debug.log('[Birth Card Synthesis] Prompt built, length:', prompt.length);

    // Generate interpretation using OpenRouter service
    const startTime = Date.now();
    const interpretation = await openRouterService.generateTarotReading(prompt, {
      temperature: 0.7,
      maxTokens: 2500, // 800-1000 words + HTML formatting
    });
    const elapsed = Date.now() - startTime;

    debug.log(
      '[Birth Card Synthesis] ✅ Generated interpretation:',
      interpretation.length,
      'chars in',
      elapsed,
      'ms'
    );

    // Deduct credits after successful generation
    await creditService.deductCredits({
      userId,
      amount: creditCost,
      type: 'READING',
      description: `Birth Card Synthesis: ${personalityCard.cardName} + ${soulCard.cardName}`,
    });

    // Cache the synthesis for future requests
    try {
      const parsedBirthDate = new Date(birthDate);
      await prisma.birthCardSynthesis.upsert({
        where: { userId },
        create: {
          userId,
          birthDate: parsedBirthDate,
          personalityCardId: personalityCard.cardId,
          soulCardId: soulCard.cardId,
          zodiacSign: zodiac.name,
          personalityElement: personalityCard.element,
          soulElement: soulCard.element,
          synthesisEn: language === 'en' ? interpretation : '',
          synthesisFr: language === 'fr' ? interpretation : '',
        },
        update: {
          birthDate: parsedBirthDate,
          personalityCardId: personalityCard.cardId,
          soulCardId: soulCard.cardId,
          zodiacSign: zodiac.name,
          personalityElement: personalityCard.element,
          soulElement: soulCard.element,
          // Only update the language that was generated
          ...(language === 'en'
            ? { synthesisEn: interpretation }
            : { synthesisFr: interpretation }),
        },
      });
      debug.log('[Birth Card Synthesis] ✅ Cached synthesis for user:', userId);
    } catch (cacheError) {
      // Don't fail the request if caching fails, just log it
      console.error('[Birth Card Synthesis] Failed to cache synthesis:', cacheError);
    }

    // Update user's birth date if not already set
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { birthDate: new Date(birthDate) },
      });
    } catch (updateError) {
      console.error('[Birth Card Synthesis] Failed to update user birth date:', updateError);
    }

    res.json({
      interpretation,
      creditsUsed: creditCost,
    });
  } catch (error) {
    console.error('[Birth Card Synthesis] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate birth card synthesis';
    res.status(500).json({ error: message });
  }
});

export default router;

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
  recordBirthCardSchema,
} from './shared.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { logger } from '../../lib/logger.js';

const router = Router();

// ============================================
// YEAR ENERGY READING
// ============================================

/**
 * POST /api/v1/ai/birthcard/year-energy
 * Generate a personalized year energy reading based on birth cards
 */
router.post(
  '/year-energy',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { year, yearEnergy, personalityCard, soulCard, isUnifiedBirthCard, language } =
      yearEnergySchema.parse(req.body);

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
      '[Year Energy] Generated interpretation:',
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
  })
);

// ============================================
// BIRTH CARD SYNTHESIS - GET CACHED
// ============================================

/**
 * GET /api/v1/ai/birthcard/synthesis
 * Get cached birth card synthesis for the current user
 * Returns null if no cached synthesis exists
 */
router.get(
  '/synthesis',
  requireAuth,
  asyncHandler(async (req, res) => {
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
  })
);

// ============================================
// BIRTH CARD SYNTHESIS - GENERATE
// ============================================

/**
 * POST /api/v1/ai/birthcard/synthesis
 * Generate an AI-powered synthesis of Personality and Soul cards
 * Weaves together zodiac sign, elemental energies, spiritual and psychological insights
 * Also caches the result for future requests
 */
router.post(
  '/synthesis',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { birthDate, personalityCard, soulCard, zodiac, isUnified, language } =
      birthCardSynthesisSchema.parse(req.body);

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
        : `**${personalityCard.cardNameFr}** (Element: ${personalityCard.elementFr}, Planete: ${personalityCard.planetFr})
Mots-cles: ${personalityCard.keywords.join(', ')}

${personalityCard.description}`;

    const soulSection = isUnified
      ? language === 'en'
        ? `This person has UNIFIED energy: their Personality and Soul are both ${soulCard.cardName}. This means their outer expression and inner essence are the same energy, creating a concentrated, powerful presence.`
        : `Cette personne a une energie UNIFIEE: sa Personnalite et son Ame sont toutes les deux ${soulCard.cardNameFr}. Cela signifie que leur expression exterieure et leur essence interieure sont la meme energie, creant une presence concentree et puissante.`
      : language === 'en'
        ? `**${soulCard.cardName}** (Element: ${soulCard.element}, Planet: ${soulCard.planet})
Keywords: ${soulCard.keywords.join(', ')}

${soulCard.description}`
        : `**${soulCard.cardNameFr}** (Element: ${soulCard.elementFr}, Planete: ${soulCard.planetFr})
Mots-cles: ${soulCard.keywords.join(', ')}

${soulCard.description}`;

    const zodiacSection =
      language === 'en'
        ? `**${zodiac.name}** - ${zodiac.element} Sign, ${zodiac.quality} Quality
Ruling Planet: ${zodiac.rulingPlanet}

As a ${zodiac.name}, this person carries ${zodiac.element} energy with a ${zodiac.quality} approach to life. Their ruling planet ${zodiac.rulingPlanet} colours how they express their birth cards.`
        : `**${zodiac.nameFr}** - Signe de ${zodiac.elementFr}, Qualite ${zodiac.qualityFr}
Planete dominante: ${zodiac.rulingPlanetFr}

En tant que ${zodiac.nameFr}, cette personne porte l'energie ${zodiac.elementFr} avec une approche ${zodiac.qualityFr} de la vie. Sa planete dominante ${zodiac.rulingPlanetFr} colore la facon dont elle exprime ses cartes de naissance.`;

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
        elementalAnalysis = `Cette personne a une forte signature ${elFr}, avec ${dominantElement[1]} energies cles sur 3 etant ${elFr}. `;
        if (dominantElement[0] === 'Fire') {
          elementalAnalysis +=
            "Cela cree une energie passionnee et orientee vers l'action avec une forte motivation et enthousiasme.";
        } else if (dominantElement[0] === 'Water') {
          elementalAnalysis +=
            'Cela cree une energie profondement intuitive et emotionnellement accordee avec une forte empathie et sensibilite.';
        } else if (dominantElement[0] === 'Air') {
          elementalAnalysis +=
            'Cela cree une energie mentalement agile et communicative avec de forts dons intellectuels et sociaux.';
        } else if (dominantElement[0] === 'Earth') {
          elementalAnalysis +=
            'Cela cree une energie ancree et pratique avec de fortes capacites de construction et de manifestation.';
        }
      } else {
        elementalAnalysis = `Cette personne a un melange elementaire equilibre: ${personalityCard.elementFr} (Personnalite), ${soulCard.elementFr} (Ame), et ${zodiac.elementFr} (Zodiaque). Cette diversite cree de la polyvalence et la capacite de s'adapter a differentes situations.`;
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
      '[Birth Card Synthesis] Generated interpretation:',
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
      debug.log('[Birth Card Synthesis] Cached synthesis for user:', userId);
    } catch (cacheError) {
      // Don't fail the request if caching fails, just log it
      logger.error('[Birth Card Synthesis] Failed to cache synthesis:', cacheError);
    }

    // Update user's birth date if not already set
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { birthDate: new Date(birthDate) },
      });
    } catch (updateError) {
      logger.error('[Birth Card Synthesis] Failed to update user birth date:', updateError);
    }

    res.json({
      interpretation,
      creditsUsed: creditCost,
    });
  })
);

// ============================================
// BIRTH CARD DEPTH 1 RECORDING
// ============================================

/**
 * POST /api/v1/ai/birthcard/record
 * Records a depth-1 birth card reading in history (personality card only).
 * Idempotent: if the user already has a BirthCardSynthesis, no credits are deducted.
 * On first call: deducts 1 credit and saves the static personality description.
 */
router.post(
  '/record',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { birthDate, personalityCard, zodiacSign } = recordBirthCardSchema.parse(req.body);
    const userId = req.auth.userId;
    const creditCost = 1;

    debug.log('[Birth Card Record] Request:', {
      userId,
      personalityCard: personalityCard.cardName,
      zodiacSign,
    });

    // Idempotent: if synthesis already exists, skip credit deduction
    const existing = await prisma.birthCardSynthesis.findUnique({ where: { userId } });
    if (existing) {
      debug.log('[Birth Card Record] Already recorded for user:', userId);
      return res.json({ recorded: true, creditsUsed: 0 });
    }

    // Check credits
    const balanceCheck = await creditService.checkSufficientCredits(userId, creditCost);
    if (balanceCheck.balance === 0 && !balanceCheck.sufficient) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!balanceCheck.sufficient) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Deduct credit
    await creditService.deductCredits({
      userId,
      amount: creditCost,
      type: 'READING',
      description: `Birth Card Reading: ${personalityCard.cardName}`,
    });

    // Save static description as synthesis so it appears in reading history
    const parsedBirthDate = new Date(birthDate);
    await prisma.birthCardSynthesis.create({
      data: {
        userId,
        birthDate: parsedBirthDate,
        personalityCardId: personalityCard.cardId,
        soulCardId: personalityCard.cardId, // same card for depth 1
        zodiacSign,
        personalityElement: personalityCard.element,
        soulElement: personalityCard.element,
        synthesisEn: personalityCard.descriptionEn,
        synthesisFr: personalityCard.descriptionFr,
      },
    });

    // Update user birth date
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { birthDate: parsedBirthDate },
      });
    } catch {
      // Non-fatal
    }

    debug.log('[Birth Card Record] Recorded depth-1 reading for user:', userId);
    res.json({ recorded: true, creditsUsed: creditCost });
  })
);

export default router;

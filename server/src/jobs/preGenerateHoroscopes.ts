import prisma from '../db/prisma.js';
import cacheService from '../services/cache.js';
import { PlanetaryCalculationService } from '../services/planetaryCalculationService.js';
import { getHoroscopePrompt } from '../services/promptService.js';
import { openRouterService } from '../services/openRouterService.js';
import { formatDateHeader } from '../routes/horoscopes/generate.js';

const SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

const LANGUAGES = ['en', 'fr'] as const;

const DELAY_BETWEEN_CALLS_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Pre-generate all 24 horoscope combinations (12 signs x 2 languages).
 * Computes planetary data once, then generates each sign/language sequentially.
 * Skips any combo already cached in the DB for today. Safe to re-run (idempotent).
 */
export async function preGenerateHoroscopes(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateKey = today.toISOString().split('T')[0];

  console.log(`[Horoscope Pre-Gen] Starting for ${dateKey}...`);

  // Calculate planetary data once (same for all signs on a given date)
  const planetaryService = new PlanetaryCalculationService();
  let formattedPlanetaryData: string;
  try {
    const planetaryData = await planetaryService.calculatePlanetaryData(new Date());
    formattedPlanetaryData = planetaryService.formatForPrompt(planetaryData);
  } catch (err) {
    console.error('[Horoscope Pre-Gen] Planetary calculation failed, aborting:', err);
    return;
  }

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const sign of SIGNS) {
    for (const language of LANGUAGES) {
      const memoryCacheKey = `horoscope:${sign}:${language}:${dateKey}`;

      try {
        // Check if already in DB (skip if so)
        const existing = await prisma.horoscopeCache.findUnique({
          where: {
            sign_language_date: {
              sign,
              language,
              date: today,
            },
          },
        });

        if (existing) {
          // Ensure memory cache is populated too
          const memoryCached = await cacheService.get(memoryCacheKey);
          if (!memoryCached) {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const secondsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);
            await cacheService.set(
              memoryCacheKey,
              { horoscope: existing.horoscope, createdAt: existing.createdAt },
              secondsUntilMidnight
            );
          }
          skipped++;
          continue;
        }

        // Generate horoscope
        const prompt = await getHoroscopePrompt({
          sign,
          today: todayStr,
          language,
          planetaryData: formattedPlanetaryData,
        });

        const rawHoroscope = await openRouterService.generateHoroscope(prompt, {
          temperature: 0.8,
          maxTokens: 2000,
        });

        // Prepend date header so users can see it's today's horoscope
        const header = formatDateHeader(language);
        const horoscope = `${header}\n\n${rawHoroscope}`;
        const createdAt = new Date();

        // Save to DB (upsert handles race with on-demand generation)
        await prisma.horoscopeCache.upsert({
          where: {
            sign_language_date: {
              sign,
              language,
              date: today,
            },
          },
          create: {
            sign,
            language,
            date: today,
            horoscope,
          },
          update: {
            horoscope,
          },
        });

        // Save to memory cache (expires at midnight)
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const secondsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);
        await cacheService.set(memoryCacheKey, { horoscope, createdAt }, secondsUntilMidnight);

        generated++;
        console.log(`[Horoscope Pre-Gen] ✓ ${sign} (${language})`);

        // Delay between API calls to avoid rate limits
        await sleep(DELAY_BETWEEN_CALLS_MS);
      } catch (err) {
        failed++;
        console.error(`[Horoscope Pre-Gen] ✗ ${sign} (${language}):`, err);
        // Continue with next combo — one failure shouldn't block others
        await sleep(DELAY_BETWEEN_CALLS_MS);
      }
    }
  }

  console.log(
    `[Horoscope Pre-Gen] Done: ${generated} generated, ${skipped} skipped, ${failed} failed`
  );
}

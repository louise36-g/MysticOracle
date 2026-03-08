/**
 * Horoscopes Routes - Generation Logic
 *
 * Functions:
 * - generateHoroscope() - Generate horoscope with planetary data
 */

import { getHoroscopePrompt, openRouterService, PlanetaryCalculationService } from './shared.js';
import { logger } from '../../lib/logger.js';

const planetaryService = new PlanetaryCalculationService();

// ============================================
// DATE HEADER
// ============================================

/**
 * Format a date header shown at the top of each horoscope so users
 * can see it's fresh content for the current day.
 * EN: "Today's Energy - Tuesday, 3 March 2026"
 * FR: "L'Énergie du Jour - mardi 3 mars 2026"
 */
export function formatDateHeader(language: 'en' | 'fr'): string {
  const now = new Date();
  if (language === 'fr') {
    const dateStr = now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `**L'Énergie du Jour - ${dateStr}**`;
  }
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `**Today's Energy - ${dateStr}**`;
}

// ============================================
// GENERATION
// ============================================

/**
 * Generate horoscope with real planetary data using unified OpenRouterService
 * Phase 3: Enhanced with astronomy-engine calculations
 */
export async function generateHoroscope(sign: string, language: 'en' | 'fr'): Promise<string> {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    // Note: year omitted - AI models may refuse dates beyond their training cutoff
  });

  try {
    // Calculate real planetary positions
    const planetaryData = await planetaryService.calculatePlanetaryData(new Date());
    const formattedData = planetaryService.formatForPrompt(planetaryData);

    // Get prompt with planetary data
    const prompt = await getHoroscopePrompt({
      sign,
      today,
      language,
      planetaryData: formattedData,
    });

    // Use unified service with retry logic and proper error handling
    const horoscope = await openRouterService.generateHoroscope(prompt, {
      temperature: 0.8,
      maxTokens: 2000,
    });

    // Prepend date header so users can see it's today's horoscope
    const header = formatDateHeader(language);
    return `${header}\n\n${horoscope}`;
  } catch (error) {
    // If planetary calculations fail, throw explicit error
    // Don't silently fallback to generating without data
    if (error instanceof Error && error.message.includes('planetary')) {
      logger.error('[Horoscope] Planetary calculation failed:', error.message);
      throw new Error('PLANETARY_CALCULATION_FAILED');
    }
    throw error;
  }
}

/**
 * Horoscopes Routes - Shared Utilities
 *
 * Constants, helpers, schemas, and re-exports
 */

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../db/prisma.js';
import { optionalAuth } from '../../middleware/auth.js';
import cacheService from '../../services/cache.js';
import { getHoroscopePrompt, getHoroscopeFollowUpPrompt } from '../../services/promptService.js';
import { openRouterService, type OpenRouterMessage } from '../../services/openRouterService.js';
import { PlanetaryCalculationService } from '../../services/planetaryCalculationService.js';

// Re-export for route modules
export {
  Router,
  z,
  prisma,
  optionalAuth,
  cacheService,
  getHoroscopePrompt,
  getHoroscopeFollowUpPrompt,
  openRouterService,
  type OpenRouterMessage,
  PlanetaryCalculationService,
};

// ============================================
// CONSTANTS
// ============================================

export const zodiacSigns = [
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
  // French names
  'Bélier',
  'Taureau',
  'Gémeaux',
  'Cancer',
  'Lion',
  'Vierge',
  'Balance',
  'Scorpion',
  'Sagittaire',
  'Capricorne',
  'Verseau',
  'Poissons',
];

// French to English mapping
const frToEn: Record<string, string> = {
  Bélier: 'Aries',
  Taureau: 'Taurus',
  Gémeaux: 'Gemini',
  Cancer: 'Cancer',
  Lion: 'Leo',
  Vierge: 'Virgo',
  Balance: 'Libra',
  Scorpion: 'Scorpio',
  Sagittaire: 'Sagittarius',
  Capricorne: 'Capricorn',
  Verseau: 'Aquarius',
  Poissons: 'Pisces',
};

// ============================================
// HELPERS
// ============================================

/**
 * Normalize sign to English for caching consistency
 */
export const normalizeSign = (sign: string): string => {
  return frToEn[sign] || sign;
};

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const getHoroscopeSchema = z.object({
  sign: z.string().refine(s => zodiacSigns.includes(s), 'Invalid zodiac sign'),
  language: z.enum(['en', 'fr']).default('en'),
});

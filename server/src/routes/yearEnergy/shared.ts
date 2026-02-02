/**
 * Year Energy Routes - Shared Utilities, Constants & Schemas
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import prisma from '../../db/prisma.js';
import { openRouterService } from '../../services/openRouterService.js';
import { getYearEnergyReadingPrompt } from '../../services/promptService.js';
import { debug } from '../../lib/logger.js';
import { creditService } from '../../services/CreditService.js';

// Re-export commonly used imports
export {
  Router,
  z,
  requireAuth,
  prisma,
  openRouterService,
  getYearEnergyReadingPrompt,
  debug,
  creditService,
};

// Credit cost for year energy reading
export const YEAR_ENERGY_CREDIT_COST = 3;

// ============================================
// MAJOR ARCANA DATA
// ============================================

export const MAJOR_ARCANA: Record<
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

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate personal year number from birth date and current year
 * Formula: (birth month + birth day + current year) reduced to single digit
 */
export function calculatePersonalYear(birthDate: Date, year: number): number {
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
export function isThresholdPeriod(date: Date = new Date()): {
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

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const yearParamSchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/)
    .transform(Number),
});

export const personalYearSchema = z.object({
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

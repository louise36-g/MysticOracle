/**
 * AI Routes - Shared Utilities, Schemas & Helpers
 */

import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { requireAuth } from '../../middleware/auth.js';
import { getAISettings } from '../../services/aiSettings.js';
import { creditService, CREDIT_COSTS } from '../../services/CreditService.js';
import { openRouterService } from '../../services/openRouterService.js';
import prisma from '../../db/prisma.js';
import { debug } from '../../lib/logger.js';
import {
  getTarotReadingPrompt,
  getTarotFollowUpPrompt,
  getSingleCardReadingPrompt,
  getYearEnergyReadingPrompt,
  getBirthCardSynthesisPrompt,
} from '../../services/promptService.js';

// Re-export commonly used imports
export {
  Router,
  z,
  requireAuth,
  creditService,
  CREDIT_COSTS,
  openRouterService,
  prisma,
  debug,
  getTarotReadingPrompt,
  getTarotFollowUpPrompt,
  getSingleCardReadingPrompt,
  getYearEnergyReadingPrompt,
  getBirthCardSynthesisPrompt,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Helper to get card element based on card ID
export function getCardElement(cardId: number): string {
  // Major Arcana (0-21) - varies by card, default to Spirit
  if (cardId <= 21) return 'Spirit';

  // Minor Arcana: Wands (22-35), Cups (36-49), Swords (50-63), Pentacles (64-77)
  if (cardId <= 35) return 'Fire';
  if (cardId <= 49) return 'Water';
  if (cardId <= 63) return 'Air';
  return 'Earth';
}

// Helper to get card number for numerology
export function getCardNumber(cardId: number): string {
  // Major Arcana
  if (cardId <= 21) return String(cardId);

  // Minor Arcana - extract the number (Ace=1 through 10, then Page=11, Knight=12, Queen=13, King=14)
  const suitPosition = (cardId - 22) % 14;
  return String(suitPosition + 1);
}

// Initialize OpenAI client for OpenRouter with dynamic settings
export const getOpenAIClient = async () => {
  const settings = await getAISettings();
  if (!settings.apiKey) {
    throw new Error('OpenRouter API key not configured');
  }
  return {
    client: new OpenAI({
      apiKey: settings.apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
    model: settings.model,
  };
};

// ============================================
// VALIDATION SCHEMAS
// ============================================

// Schema for question summarization
export const summarizeQuestionSchema = z.object({
  question: z.string().min(1).max(2000),
  language: z.enum(['en', 'fr']),
});

// Schema for tarot reading generation
export const generateTarotSchema = z.object({
  spread: z.object({
    id: z.string(),
    nameEn: z.string(),
    nameFr: z.string(),
    positions: z.number(),
    positionMeaningsEn: z.array(z.string()).optional(),
    positionMeaningsFr: z.array(z.string()).optional(),
    creditCost: z.number(),
  }),
  style: z.array(z.string()),
  cards: z.array(
    z.object({
      card: z.object({
        id: z.string(),
        nameEn: z.string(),
        nameFr: z.string(),
        suit: z.string().optional(),
        rank: z.string().optional(),
        arcana: z.string().optional(),
      }),
      positionIndex: z.number(),
      isReversed: z.boolean(),
    })
  ),
  question: z.string(),
  language: z.enum(['en', 'fr']),
  category: z.string().optional(),
  layoutId: z.string().optional(),
});

// Schema for tarot follow-up questions
export const tarotFollowUpSchema = z.object({
  reading: z.string().min(1),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
  question: z.string().min(1).max(500),
  language: z.enum(['en', 'fr']),
});

// Schema for year energy reading request
export const yearEnergySchema = z.object({
  year: z.number().int().min(2020).max(2100),
  yearEnergy: z.object({
    primaryCardName: z.string(),
    primaryCardNameFr: z.string(),
    reducedCardName: z.string().optional(),
    reducedCardNameFr: z.string().optional(),
    isUnified: z.boolean(),
    description: z.string(), // Already in correct language
  }),
  personalityCard: z.object({
    cardName: z.string(),
    cardNameFr: z.string(),
    description: z.string(), // Already in correct language
  }),
  soulCard: z.object({
    cardName: z.string(),
    cardNameFr: z.string(),
    description: z.string(), // Already in correct language
  }),
  isUnifiedBirthCard: z.boolean(),
  language: z.enum(['en', 'fr']),
});

// Schema for birth card synthesis request (depth 2 - Personality + Soul)
export const birthCardSynthesisSchema = z.object({
  birthDate: z.string(), // ISO date string (YYYY-MM-DD)
  personalityCard: z.object({
    cardId: z.number(),
    cardName: z.string(),
    cardNameFr: z.string(),
    description: z.string(),
    element: z.string(),
    elementFr: z.string(),
    planet: z.string(),
    planetFr: z.string(),
    keywords: z.array(z.string()),
  }),
  soulCard: z.object({
    cardId: z.number(),
    cardName: z.string(),
    cardNameFr: z.string(),
    description: z.string(),
    element: z.string(),
    elementFr: z.string(),
    planet: z.string(),
    planetFr: z.string(),
    keywords: z.array(z.string()),
  }),
  zodiac: z.object({
    name: z.string(),
    nameFr: z.string(),
    element: z.string(),
    elementFr: z.string(),
    quality: z.string(),
    qualityFr: z.string(),
    rulingPlanet: z.string(),
    rulingPlanetFr: z.string(),
  }),
  isUnified: z.boolean(),
  language: z.enum(['en', 'fr']),
});

// ============================================
// LAYOUT POSITION MAPPINGS
// ============================================

// Layout-specific position meanings for THREE_CARD and FIVE_CARD
export const layoutPositions: Record<string, { en: string[]; fr: string[] }> = {
  // Three-card layouts
  past_present_future: {
    en: ['Past', 'Present', 'Future'],
    fr: ['Passé', 'Présent', 'Futur'],
  },
  you_them_connection: {
    en: ['You', 'Them', 'The Connection'],
    fr: ['Vous', 'Eux', 'La Connexion'],
  },
  situation_action_outcome: {
    en: ['Situation', 'Action', 'Outcome'],
    fr: ['Situation', 'Action', 'Résultat'],
  },
  option_a_b_guidance: {
    en: ['Option A', 'Option B', 'Guidance'],
    fr: ['Option A', 'Option B', 'Conseil'],
  },
  situation_obstacle_path: {
    en: ['Situation', 'Obstacle', 'Path Forward'],
    fr: ['Situation', 'Obstacle', 'Voie à Suivre'],
  },
  mind_body_spirit: { en: ['Mind', 'Body', 'Spirit'], fr: ['Esprit', 'Corps', 'Âme'] },
  challenge_support_growth: {
    en: ['Challenge', 'Support', 'Growth'],
    fr: ['Défi', 'Soutien', 'Croissance'],
  },
  // Five-card layouts
  iceberg: {
    en: [
      "What's visible",
      "What's beneath",
      'Root cause',
      'How it serves you',
      'Path to integration',
    ],
    fr: [
      'Ce qui est visible',
      'Ce qui est caché',
      'Cause profonde',
      'Comment cela vous sert',
      "Chemin vers l'intégration",
    ],
  },
  mirror: {
    en: [
      'How you see yourself',
      'How others see you',
      'What you refuse to see',
      'The truth beneath',
      'Acceptance message',
    ],
    fr: [
      'Comment vous vous voyez',
      'Comment les autres vous voient',
      'Ce que vous refusez de voir',
      'La vérité profonde',
      "Message d'acceptation",
    ],
  },
  inner_child: {
    en: [
      'Your inner child now',
      'What they need',
      'What wounded them',
      'How to nurture them',
      'The gift they hold',
    ],
    fr: [
      'Votre enfant intérieur',
      'Ce dont il a besoin',
      "Ce qui l'a blessé",
      'Comment le nourrir',
      "Le cadeau qu'il porte",
    ],
  },
  safe_space: {
    en: [
      'Where you feel unsafe',
      'What safety means to you',
      'What blocks safety',
      'Creating internal safety',
      'Your protector energy',
    ],
    fr: [
      'Où vous vous sentez vulnérable',
      'Ce que la sécurité signifie',
      'Ce qui bloque la sécurité',
      'Créer la sécurité intérieure',
      'Votre énergie protectrice',
    ],
  },
  authentic_self: {
    en: [
      'Who you were taught to be',
      'Who you pretend to be',
      'Who you fear being',
      'Who you truly are',
      'How to embody your truth',
    ],
    fr: [
      'Qui on vous a appris à être',
      'Qui vous prétendez être',
      "Qui vous craignez d'être",
      'Qui vous êtes vraiment',
      'Comment incarner votre vérité',
    ],
  },
  values: {
    en: [
      'What you say you value',
      'What your actions reveal',
      'A value abandoned',
      'A value calling you',
      'Alignment message',
    ],
    fr: [
      'Ce que vous dites valoriser',
      'Ce que vos actions révèlent',
      'Une valeur abandonnée',
      'Une valeur qui vous appelle',
      "Message d'alignement",
    ],
  },
  alchemy: {
    en: [
      'The lead (what feels heavy)',
      'The fire (transformation needed)',
      'The process',
      "The gold (what you're becoming)",
      "The philosopher's stone",
    ],
    fr: [
      'Le plomb (ce qui pèse)',
      'Le feu (transformation)',
      'Le processus',
      "L'or (ce que vous devenez)",
      'La pierre philosophale',
    ],
  },
  seasons: {
    en: [
      'What needs to die (autumn)',
      'What needs rest (winter)',
      'Ready to sprout (spring)',
      'Ready to bloom (summer)',
      "The cycle's wisdom",
    ],
    fr: [
      'Ce qui doit mourir (automne)',
      'Ce qui a besoin de repos (hiver)',
      'Prêt à germer (printemps)',
      'Prêt à fleurir (été)',
      'La sagesse du cycle',
    ],
  },
  love_relationships: {
    en: ['Your Heart', 'Their Heart', 'The Connection', 'Challenges', 'Potential'],
    fr: ['Votre Cœur', 'Son Cœur', 'La Connexion', 'Défis', 'Potentiel'],
  },
  career_purpose: {
    en: ['Current Position', 'Obstacles', 'Hidden Factors', 'Action to Take', 'Outcome'],
    fr: ['Position Actuelle', 'Obstacles', 'Facteurs Cachés', 'Action à Prendre', 'Résultat'],
  },
};

// Style descriptions for multi-card readings
export const styleDescriptions: Record<string, { inline: string; synthesis: string }> = {
  spiritual: {
    inline:
      'Weave spiritual insights into each card: soul lessons, higher purpose, karma, and spiritual growth.',
    synthesis: `**Spiritual Synthesis** (100-150 words): After the card interpretations, add a dedicated section exploring the collective spiritual message. What soul lesson emerges from these cards together? What is the higher purpose or spiritual invitation? How do the cards' spiritual themes interweave?`,
  },
  psycho_emotional: {
    inline:
      'Weave psychological insights into each card: inner patterns, emotional themes, shadow work, and self-awareness.',
    synthesis: `**Emotional Landscape** (100-150 words): After the card interpretations, add a dedicated section on the psychological narrative. What emotional patterns or inner dynamics are revealed across all cards? How do they inform each other psychologically?`,
  },
  numerology: {
    inline:
      'Reference the numerological significance of each card number: cycles, timing, and numerical symbolism.',
    synthesis: `**Numerological Pattern** (100-150 words): After the card interpretations, add a dedicated section analyzing the numbers. What is the combined numerological energy? Are there repeated numbers or a progression? What timing or cyclical message emerges from the numbers together?`,
  },
  elemental: {
    inline:
      'Connect each card to its elemental quality: Fire (Wands/action), Water (Cups/emotion), Air (Swords/thought), Earth (Pentacles/material).',
    synthesis: `**Elemental Interplay** (100-150 words): After the card interpretations, add a dedicated section on elemental dynamics. What elements are present? If the same element repeats, what does that concentrated energy signify? If elements differ, how do they interact - do they support, challenge, or balance each other? What is the overriding elemental energy of this reading?`,
  },
  // Handle uppercase enum values
  SPIRITUAL: {
    inline:
      'Weave spiritual insights into each card: soul lessons, higher purpose, karma, and spiritual growth.',
    synthesis: `**Spiritual Synthesis** (100-150 words): After the card interpretations, add a dedicated section exploring the collective spiritual message. What soul lesson emerges from these cards together? What is the higher purpose or spiritual invitation? How do the cards' spiritual themes interweave?`,
  },
  PSYCHO_EMOTIONAL: {
    inline:
      'Weave psychological insights into each card: inner patterns, emotional themes, shadow work, and self-awareness.',
    synthesis: `**Emotional Landscape** (100-150 words): After the card interpretations, add a dedicated section on the psychological narrative. What emotional patterns or inner dynamics are revealed across all cards? How do they inform each other psychologically?`,
  },
  NUMEROLOGY: {
    inline:
      'Reference the numerological significance of each card number: cycles, timing, and numerical symbolism.',
    synthesis: `**Numerological Pattern** (100-150 words): After the card interpretations, add a dedicated section analyzing the numbers. What is the combined numerological energy? Are there repeated numbers or a progression? What timing or cyclical message emerges from the numbers together?`,
  },
  ELEMENTAL: {
    inline:
      'Connect each card to its elemental quality: Fire (Wands/action), Water (Cups/emotion), Air (Swords/thought), Earth (Pentacles/material).',
    synthesis: `**Elemental Interplay** (100-150 words): After the card interpretations, add a dedicated section on elemental dynamics. What elements are present? If the same element repeats, what does that concentrated energy signify? If elements differ, how do they interact - do they support, challenge, or balance each other? What is the overriding elemental energy of this reading?`,
  },
};

// Style mapping for single card readings (handles EN and FR names)
export const styleMap: Record<string, string> = {
  // English
  spiritual: 'spiritual',
  psycho_emotional: 'psycho_emotional',
  numerology: 'numerology',
  elemental: 'elemental',
  // French
  spirituel: 'spiritual',
  'psycho-émotionnel': 'psycho_emotional',
  'psycho-emotionnel': 'psycho_emotional',
  psycho_emotionnel: 'psycho_emotional',
  numérologie: 'numerology',
  numerologie: 'numerology',
  élémentaire: 'elemental',
  elementaire: 'elemental',
};

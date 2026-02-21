// constants/categoryConfig.ts
// Category-first UX configuration for tarot readings

import React, { createElement } from 'react';
import { Heart, Briefcase, MessageCircle, Sun, Sprout, Sparkles } from 'lucide-react';
import type { ReadingCategory, ReadingDepth, BirthCardDepth } from '../types';
import type { TwoCardLayoutId } from './twoCardLayouts';
import type { ThreeCardLayoutId, THREE_CARD_LAYOUTS } from './threeCardLayouts';
import type { FiveCardLayoutId, FIVE_CARD_LAYOUTS } from './fiveCardLayouts';

// Color theme configuration for category styling
export interface ColorTheme {
  gradient: string;    // Tailwind gradient classes (e.g., 'from-rose-500 to-pink-600')
  accent: string;      // Accent color class (e.g., 'rose-500')
  glow: string;        // Glow/shadow color (e.g., 'rose-500/30')
  border: string;      // Border color class (e.g., 'border-rose-500/50')
}

// Category configuration interface
export interface CategoryConfig {
  id: ReadingCategory;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  icon: React.ReactNode;
  colorTheme: ColorTheme;
  depths: ReadingDepth[] | BirthCardDepth[];
  /** Default layout to pre-select */
  defaultLayouts?: {
    2?: TwoCardLayoutId;
    3?: ThreeCardLayoutId;
    5?: FiveCardLayoutId;
  };
  /** Available layouts for this category (2-3 options per depth) */
  availableLayouts?: {
    2?: TwoCardLayoutId[];
    3?: ThreeCardLayoutId[];
    5?: FiveCardLayoutId[];
  };
}

// Depth option configuration
export interface DepthOption {
  cards: number;
  labelEn: string;
  labelFr: string;
  cost: number;
}

// Regular depth options (for most categories) - cost = number of cards
export const REGULAR_DEPTHS: DepthOption[] = [
  { cards: 1, labelEn: 'Quick Insight', labelFr: 'Aperçu Rapide', cost: 1 },
  { cards: 2, labelEn: 'Quick Pair', labelFr: 'Paire Rapide', cost: 2 },
  { cards: 3, labelEn: 'Past Present Future', labelFr: 'Passé Présent Futur', cost: 3 },
  { cards: 5, labelEn: 'Deep Dive', labelFr: 'Exploration Profonde', cost: 5 },
  { cards: 7, labelEn: 'Horseshoe', labelFr: 'Fer à Cheval', cost: 7 },
  { cards: 10, labelEn: 'Celtic Cross', labelFr: 'Croix Celtique', cost: 10 },
];

// Birth card depth options (special category)
export const BIRTH_CARD_DEPTHS: DepthOption[] = [
  { cards: 1, labelEn: 'Personality Card', labelFr: 'Carte de Personnalite', cost: 1 },
  { cards: 2, labelEn: 'Personality + Soul', labelFr: 'Personnalite + Ame', cost: 2 },
  { cards: 3, labelEn: 'Year Energy', labelFr: 'Energie de l\'Annee', cost: 3 },
];

// Unified color theme - consistent purple/amber for all categories
const UNIFIED_COLOR_THEME: ColorTheme = {
  gradient: 'from-violet-600/25 via-purple-600/20 to-fuchsia-600/25',
  accent: '#a78bfa',  // Purple-400
  glow: '#8b5cf6',    // Purple-500
  border: 'border-amber-500/40',
};

// Category configurations
export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'general',
    labelEn: 'General Guidance',
    labelFr: 'Guidance Générale',
    taglineEn: 'Ask about anything on your mind',
    taglineFr: 'Posez toute question qui vous tient à cœur',
    icon: createElement(MessageCircle, { className: 'w-6 h-6' }),
    colorTheme: UNIFIED_COLOR_THEME,
    depths: [1, 2, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      2: 'situation_guidance',
      3: 'past_present_future',
      5: 'iceberg',
    },
    availableLayouts: {
      2: ['situation_guidance', 'question_answer', 'light_shadow'],
      3: ['past_present_future', 'situation_action_outcome', 'mind_body_spirit'],
      5: ['iceberg', 'alchemy', 'seasons'],
    },
  },
  {
    id: 'love',
    labelEn: 'Love & Relationships',
    labelFr: 'Amour & Relations',
    taglineEn: 'Explore the patterns shaping your connections',
    taglineFr: 'Explorez les schémas qui façonnent vos liens',
    icon: createElement(Heart, { className: 'w-6 h-6' }),
    colorTheme: UNIFIED_COLOR_THEME,
    depths: [1, 2, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      2: 'inner_outer',
      3: 'you_them_connection',
      5: 'love_relationships',
    },
    availableLayouts: {
      2: ['inner_outer', 'light_shadow', 'challenge_strength'],
      3: ['you_them_connection', 'mind_body_spirit', 'inner_child_love'],
      5: ['love_relationships', 'inner_child'],
    },
  },
  {
    id: 'career',
    labelEn: 'Career & Calling',
    labelFr: 'Carrière & Vocation',
    taglineEn: 'Clarify your next professional step',
    taglineFr: 'Clarifiez votre prochaine étape professionnelle',
    icon: createElement(Briefcase, { className: 'w-6 h-6' }),
    colorTheme: UNIFIED_COLOR_THEME,
    depths: [1, 2, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      2: 'challenge_strength',
      3: 'situation_action_outcome',
      5: 'career_purpose',
    },
    availableLayouts: {
      2: ['challenge_strength', 'situation_guidance', 'question_answer'],
      3: ['situation_action_outcome', 'situation_obstacle_path', 'inner_child_career'],
      5: ['career_purpose', 'values', 'inner_child_career'],
    },
  },
  {
    id: 'life_path',
    labelEn: 'Spiritual / Wellbeing',
    labelFr: 'Spirituel / Bien-être',
    taglineEn: 'Inner peace, soul purpose, and spiritual growth',
    taglineFr: 'Paix intérieure, mission de vie et croissance spirituelle',
    icon: createElement(Sun, { className: 'w-6 h-6' }),
    colorTheme: UNIFIED_COLOR_THEME,
    depths: [1, 2, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      2: 'light_shadow',
      3: 'past_present_future',
      5: 'authentic_self',
    },
    availableLayouts: {
      2: ['light_shadow', 'inner_outer', 'question_answer'],
      3: ['past_present_future', 'challenge_support_growth', 'inner_child_life_path'],
      5: ['authentic_self', 'alchemy', 'inner_child_life_path'],
    },
  },
  {
    id: 'growth',
    labelEn: 'Personal Growth',
    labelFr: 'Développement Personnel',
    taglineEn: 'Self-development, habits, and transformation',
    taglineFr: 'Développement de soi, habitudes et transformation',
    icon: createElement(Sprout, { className: 'w-6 h-6' }),
    colorTheme: UNIFIED_COLOR_THEME,
    depths: [1, 2, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      2: 'challenge_strength',
      3: 'challenge_support_growth',
      5: 'authentic_self',
    },
    availableLayouts: {
      2: ['challenge_strength', 'light_shadow', 'inner_outer'],
      3: ['challenge_support_growth', 'mind_body_spirit', 'inner_child_growth'],
      5: ['authentic_self', 'alchemy', 'values'],
    },
  },
  {
    id: 'birth_cards',
    labelEn: 'Birth Cards',
    labelFr: 'Cartes de Naissance',
    taglineEn: 'Explore the archetypes that influence you',
    taglineFr: 'Explorez les archétypes qui vous influencent',
    icon: createElement(Sparkles, { className: 'w-6 h-6' }),
    colorTheme: UNIFIED_COLOR_THEME,
    depths: [1, 2, 3] as BirthCardDepth[],
    // No default layouts for birth cards - they use a special calculation
  },
];

/**
 * Get a category configuration by its ID
 */
export function getCategory(id: ReadingCategory): CategoryConfig | undefined {
  return CATEGORIES.find(c => c.id === id);
}

/**
 * Get the depth options for a category
 * Returns BIRTH_CARD_DEPTHS for birth_cards, REGULAR_DEPTHS for all others
 */
export function getDepthsForCategory(categoryId: ReadingCategory): DepthOption[] {
  if (categoryId === 'birth_cards') {
    return BIRTH_CARD_DEPTHS;
  }
  return REGULAR_DEPTHS;
}

/**
 * Get a specific depth option by card count
 */
export function getDepthOption(categoryId: ReadingCategory, cards: number): DepthOption | undefined {
  const depths = getDepthsForCategory(categoryId);
  return depths.find(d => d.cards === cards);
}

/**
 * Check if a category is the special birth cards category
 */
export function isBirthCardsCategory(categoryId: ReadingCategory): boolean {
  return categoryId === 'birth_cards';
}

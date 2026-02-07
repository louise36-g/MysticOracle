// constants/categoryConfig.ts
// Category-first UX configuration for tarot readings

import React, { createElement } from 'react';
import { Heart, Briefcase, Coins, Compass, Users, Sparkles } from 'lucide-react';
import type { ReadingCategory, ReadingDepth, BirthCardDepth } from '../types';
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
    3?: ThreeCardLayoutId;
    5?: FiveCardLayoutId;
  };
  /** Available layouts for this category (2 options per depth) */
  availableLayouts?: {
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
  { cards: 1, labelEn: 'Quick Insight', labelFr: 'Apercu Rapide', cost: 1 },
  { cards: 3, labelEn: 'Past Present Future', labelFr: 'Passe Present Futur', cost: 3 },
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
    id: 'love',
    labelEn: 'Love & Relationships',
    labelFr: 'Amour & Relations',
    taglineEn: 'Explore the patterns shaping your connections',
    taglineFr: 'Explorez les schémas qui façonnent vos liens',
    icon: createElement(Heart, { className: 'w-6 h-6' }),
    colorTheme: UNIFIED_COLOR_THEME,
    depths: [1, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      3: 'you_them_connection',
      5: 'love_relationships',
    },
    availableLayouts: {
      3: ['you_them_connection', 'mind_body_spirit'],
      5: ['love_relationships', 'inner_child'],
    },
  },
  {
    id: 'career',
    labelEn: 'Career & Purpose',
    labelFr: 'Carrière & Vocation',
    taglineEn: 'Clarify your next professional step',
    taglineFr: 'Clarifiez votre prochaine étape professionnelle',
    icon: createElement(Briefcase, { className: 'w-6 h-6' }),
    colorTheme: UNIFIED_COLOR_THEME,
    depths: [1, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      3: 'situation_action_outcome',
      5: 'career_purpose',
    },
    availableLayouts: {
      3: ['situation_action_outcome', 'situation_obstacle_path'],
      5: ['career_purpose', 'values'],
    },
  },
  {
    id: 'money',
    labelEn: 'Money & Abundance',
    labelFr: 'Argent & Abondance',
    taglineEn: 'Understand your relationship with resources',
    taglineFr: 'Comprenez votre relation avec les ressources',
    icon: createElement(Coins, { className: 'w-6 h-6' }),
    colorTheme: UNIFIED_COLOR_THEME,
    depths: [1, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      3: 'situation_action_outcome',
      5: 'alchemy',
    },
    availableLayouts: {
      3: ['situation_action_outcome', 'option_a_b_guidance'],
      5: ['alchemy', 'values'],
    },
  },
  {
    id: 'life_path',
    labelEn: 'Life Path & Calling',
    labelFr: 'Chemin de Vie & Appel',
    taglineEn: 'Reflect on what feels aligned now',
    taglineFr: 'Réfléchissez à ce qui vous semble aligné maintenant',
    icon: createElement(Compass, { className: 'w-6 h-6' }),
    colorTheme: UNIFIED_COLOR_THEME,
    depths: [1, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      3: 'past_present_future',
      5: 'authentic_self',
    },
    availableLayouts: {
      3: ['past_present_future', 'challenge_support_growth'],
      5: ['authentic_self', 'alchemy'],
    },
  },
  {
    id: 'family',
    labelEn: 'Family & Home',
    labelFr: 'Famille & Foyer',
    taglineEn: 'Strengthen the foundations that support you',
    taglineFr: 'Renforcez les fondations qui vous soutiennent',
    icon: createElement(Users, { className: 'w-6 h-6' }),
    colorTheme: UNIFIED_COLOR_THEME,
    depths: [1, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      3: 'you_them_connection',
      5: 'inner_child',
    },
    availableLayouts: {
      3: ['you_them_connection', 'mind_body_spirit'],
      5: ['inner_child', 'safe_space'],
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

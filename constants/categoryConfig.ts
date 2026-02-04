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
  { cards: 7, labelEn: "Fortune's Arc", labelFr: 'Arc du Destin', cost: 7 },
  { cards: 10, labelEn: 'Complete Picture', labelFr: 'Croix Celtique', cost: 10 },
];

// Birth card depth options (special category)
export const BIRTH_CARD_DEPTHS: DepthOption[] = [
  { cards: 1, labelEn: 'Personality Card', labelFr: 'Carte de Personnalite', cost: 1 },
  { cards: 2, labelEn: 'Personality + Soul', labelFr: 'Personnalite + Ame', cost: 2 },
  { cards: 3, labelEn: 'Year Energy', labelFr: 'Energie de l\'Annee', cost: 3 },
];

// Category configurations
export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'love',
    labelEn: 'Love & Relationships',
    labelFr: 'Amour & Relations',
    taglineEn: 'Understand your heart\'s journey',
    taglineFr: 'Comprenez le voyage de votre coeur',
    icon: createElement(Heart, { className: 'w-6 h-6' }),
    colorTheme: {
      gradient: 'from-rose-950/90 via-pink-900/80 to-rose-950/90',
      accent: 'rose-400',
      glow: 'rose-500/20',
      border: 'border-rose-500/30',
    },
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
    labelFr: 'Carriere & Vocation',
    taglineEn: 'Navigate your professional path',
    taglineFr: 'Naviguez votre parcours professionnel',
    icon: createElement(Briefcase, { className: 'w-6 h-6' }),
    colorTheme: {
      gradient: 'from-amber-950/90 via-orange-900/80 to-amber-950/90',
      accent: 'amber-400',
      glow: 'amber-500/20',
      border: 'border-amber-500/30',
    },
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
    taglineEn: 'Unlock your financial flow',
    taglineFr: 'Debloquez votre flux financier',
    icon: createElement(Coins, { className: 'w-6 h-6' }),
    colorTheme: {
      gradient: 'from-emerald-950/90 via-green-900/80 to-emerald-950/90',
      accent: 'emerald-400',
      glow: 'emerald-500/20',
      border: 'border-emerald-500/30',
    },
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
    labelEn: 'Life Path & Purpose',
    labelFr: 'Chemin de Vie & But',
    taglineEn: 'Discover your true direction',
    taglineFr: 'Decouvrez votre vraie direction',
    icon: createElement(Compass, { className: 'w-6 h-6' }),
    colorTheme: {
      gradient: 'from-indigo-950/90 via-purple-900/80 to-indigo-950/90',
      accent: 'indigo-400',
      glow: 'indigo-500/20',
      border: 'border-indigo-500/30',
    },
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
    taglineEn: 'Strengthen your roots',
    taglineFr: 'Renforcez vos racines',
    icon: createElement(Users, { className: 'w-6 h-6' }),
    colorTheme: {
      gradient: 'from-teal-950/90 via-cyan-900/80 to-teal-950/90',
      accent: 'teal-400',
      glow: 'teal-500/20',
      border: 'border-teal-500/30',
    },
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
    taglineEn: 'Reveal your soul\'s blueprint',
    taglineFr: 'Revelez le plan de votre ame',
    icon: createElement(Sparkles, { className: 'w-6 h-6' }),
    colorTheme: {
      gradient: 'from-violet-950/90 via-purple-900/80 to-violet-950/90',
      accent: 'violet-400',
      glow: 'violet-500/20',
      border: 'border-violet-500/30',
    },
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

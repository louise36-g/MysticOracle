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
  { cards: 10, labelEn: 'Celtic Cross', labelFr: 'Croix Celtique', cost: 10 },
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
      gradient: 'from-[#E8607A]/30 via-[#D94D68]/20 to-[#E8607A]/30',
      accent: '#E8607A',
      glow: '#E8607A',
      border: 'border-[#E8607A]/40',
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
      gradient: 'from-[#D4A24C]/30 via-[#C4923C]/20 to-[#D4A24C]/30',
      accent: '#D4A24C',
      glow: '#D4A24C',
      border: 'border-[#D4A24C]/40',
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
      gradient: 'from-[#50C878]/30 via-[#40B868]/20 to-[#50C878]/30',
      accent: '#50C878',
      glow: '#50C878',
      border: 'border-[#50C878]/40',
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
      gradient: 'from-[#5BA8D9]/30 via-[#4B98C9]/20 to-[#5BA8D9]/30',
      accent: '#5BA8D9',
      glow: '#5BA8D9',
      border: 'border-[#5BA8D9]/40',
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
      gradient: 'from-[#45B5AA]/30 via-[#35A59A]/20 to-[#45B5AA]/30',
      accent: '#45B5AA',
      glow: '#45B5AA',
      border: 'border-[#45B5AA]/40',
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
      gradient: 'from-[#B88ED6]/30 via-[#A87EC6]/20 to-[#B88ED6]/30',
      accent: '#B88ED6',
      glow: '#B88ED6',
      border: 'border-[#B88ED6]/40',
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

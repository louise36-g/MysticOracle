/**
 * Type definitions for Birth Card components
 */

import { BirthCardDepth } from '../../types';

export interface BirthDate {
  day: string;
  month: string;
  year: string;
}

export interface LocationState {
  birthDate: BirthDate;
  depth: BirthCardDepth;
}

// Type definitions for JSON data
export interface PersonalityCardData {
  cardId: number;
  cardName: string;
  cardNameFr: string;
  image: string;
  descriptionEn: string;
  descriptionFr: string;
  keyThemesEn: string[];
  keyThemesFr: string[];
}

export interface SoulCardData {
  cardId: number;
  cardName: string;
  cardNameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  keyThemesEn: string[];
  keyThemesFr: string[];
}

export interface PairData {
  pairId: number;
  personalityCardId: number;
  personalityName: string;
  personalityNameFr: string;
  soulCardId: number;
  soulName: string;
  soulNameFr: string;
  dynamicEn: string;
  dynamicFr: string;
}

export interface UnifiedCardData {
  cardId: number;
  cardName: string;
  cardNameFr: string;
  image: string;
  descriptionEn: string;
  descriptionFr: string;
  keyThemesEn: string[];
  keyThemesFr: string[];
}

export interface YearEnergyData {
  year: number;
  primaryCardId: number;
  primaryCardName: string;
  primaryCardNameFr: string;
  reducedCardId: number;
  reducedCardName: string;
  reducedCardNameFr: string;
  isUnified: boolean;
  descriptionEn: string;
  descriptionFr: string;
  keywordsEn: string[];
  keywordsFr: string[];
}

export type TabId = 'personality' | 'soul' | 'dynamic' | 'year';

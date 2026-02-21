/**
 * AI API - Tarot reading generation, summaries, birth card synthesis
 */

import { apiRequest } from './client';

// ============================================
// QUESTION SUMMARY
// ============================================

export async function summarizeQuestion(
  token: string,
  question: string,
  language: 'en' | 'fr'
): Promise<{ summary: string; creditsUsed: number }> {
  return apiRequest('/api/ai/summarize-question', {
    method: 'POST',
    body: { question, language },
    token,
  });
}

// ============================================
// TAROT READING GENERATION
// ============================================

export async function generateTarotReading(
  token: string,
  params: {
    spread: {
      id: string;
      nameEn: string;
      nameFr: string;
      positions: number;
      positionMeaningsEn: string[];
      positionMeaningsFr: string[];
      creditCost: number;
    };
    style: string[];
    cards: Array<{
      card: {
        id: string;
        nameEn: string;
        nameFr: string;
        suit?: string;
        rank?: string;
        arcana?: string;
      };
      positionIndex: number;
      isReversed: boolean;
    }>;
    question: string;
    language: 'en' | 'fr';
    category?: string; // For single card readings: general, love, career, decision, healing
    layoutId?: string; // For 3-card and 5-card readings with specific layouts
  }
): Promise<{ interpretation: string; creditsRequired: number }> {
  return apiRequest('/api/v1/ai/tarot/generate', {
    method: 'POST',
    body: params,
    token,
  });
}

// ============================================
// CLARIFICATION CARD
// ============================================

export async function generateClarificationCard(
  token: string,
  params: {
    readingId: string;
    card: {
      id: number;
      nameEn: string;
      nameFr: string;
    };
    isReversed: boolean;
    language: 'en' | 'fr';
  }
): Promise<{
  interpretation: string;
  card: { id: number; nameEn: string; nameFr: string };
  isReversed: boolean;
  creditsUsed: number;
}> {
  return apiRequest('/api/v1/ai/tarot/clarification', {
    method: 'POST',
    body: params,
    token,
  });
}

// ============================================
// TAROT FOLLOW-UP
// ============================================

export async function generateTarotFollowUp(
  token: string,
  params: {
    reading: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    question: string;
    language: 'en' | 'fr';
  }
): Promise<{ answer: string; creditsRequired: number }> {
  return apiRequest('/api/v1/ai/tarot/followup', {
    method: 'POST',
    body: params,
    token,
  });
}

// ============================================
// YEAR ENERGY READING
// ============================================

export async function generateYearEnergyReading(
  token: string,
  params: {
    year: number;
    yearEnergy: {
      primaryCardName: string;
      primaryCardNameFr: string;
      reducedCardName?: string;
      reducedCardNameFr?: string;
      isUnified: boolean;
      description: string;
    };
    personalityCard: {
      cardName: string;
      cardNameFr: string;
      description: string;
    };
    soulCard: {
      cardName: string;
      cardNameFr: string;
      description: string;
    };
    isUnifiedBirthCard: boolean;
    language: 'en' | 'fr';
  }
): Promise<{ interpretation: string; creditsRequired: number }> {
  return apiRequest('/api/v1/ai/birthcard/year-energy', {
    method: 'POST',
    body: params,
    token,
  });
}

// ============================================
// BIRTH CARD SYNTHESIS
// ============================================

export interface CachedBirthCardSynthesis {
  interpretation: string;
  birthDate: string;
  personalityCardId: number;
  soulCardId: number;
  zodiacSign: string;
  createdAt: string;
}

export async function getCachedBirthCardSynthesis(
  token: string,
  language: 'en' | 'fr'
): Promise<{ cached: CachedBirthCardSynthesis | null }> {
  return apiRequest(`/api/v1/ai/birthcard/synthesis?language=${language}`, {
    method: 'GET',
    token,
  });
}

export async function generateBirthCardSynthesis(
  token: string,
  params: {
    birthDate: string; // ISO date string (YYYY-MM-DD)
    personalityCard: {
      cardId: number;
      cardName: string;
      cardNameFr: string;
      description: string;
      element: string;
      elementFr: string;
      planet: string;
      planetFr: string;
      keywords: string[];
    };
    soulCard: {
      cardId: number;
      cardName: string;
      cardNameFr: string;
      description: string;
      element: string;
      elementFr: string;
      planet: string;
      planetFr: string;
      keywords: string[];
    };
    zodiac: {
      name: string;
      nameFr: string;
      element: string;
      elementFr: string;
      quality: string;
      qualityFr: string;
      rulingPlanet: string;
      rulingPlanetFr: string;
    };
    isUnified: boolean;
    language: 'en' | 'fr';
  }
): Promise<{ interpretation: string; creditsUsed: number }> {
  return apiRequest('/api/v1/ai/birthcard/synthesis', {
    method: 'POST',
    body: params,
    token,
  });
}

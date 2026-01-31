/**
 * Year Energy API - Universal year, personal year, and threshold readings
 */

import { apiRequest } from './client';

// ============================================
// TYPES
// ============================================

export interface YearEnergyResponse {
  year: number;
  yearNumber: number;
  yearCard: {
    id: number;
    name: string;
    element: string;
  };
  cyclePosition: number;
  themes: string;
  challenges: string;
  opportunities: string;
}

export interface PersonalYearReadingResponse {
  synthesis: string;
  cached: boolean;
  personalYearNumber: number;
  personalYearCardId: number;
}

export interface CachedPersonalYearReading {
  year: number;
  synthesis: string;
  personalYearNumber: number;
  personalYearCard: {
    id: number;
    name: string;
    element: string;
  };
  universalYearCard: {
    id: number;
    name: string;
  };
  createdAt: string;
}

export interface ThresholdStatusResponse {
  isThresholdPeriod: boolean;
  message?: string;
  transitionYear?: number;
  outgoing?: {
    year: number;
    yearNumber: number;
    yearCard: string;
  } | null;
  incoming?: {
    year: number;
    yearNumber: number;
    yearCard: string;
  } | null;
}

export interface ThresholdReadingResponse {
  synthesis: string;
  cached: boolean;
  transitionYear: number;
}

// ============================================
// UNIVERSAL YEAR ENERGY
// ============================================

/**
 * Get universal year energy for a specific year
 */
export async function getYearEnergy(
  year: number,
  language: 'en' | 'fr' = 'en'
): Promise<YearEnergyResponse> {
  return apiRequest(`/api/v1/year-energy/${year}?language=${language}`, {
    method: 'GET',
  });
}

/**
 * Get current year's energy
 */
export async function getCurrentYearEnergy(
  language: 'en' | 'fr' = 'en'
): Promise<YearEnergyResponse> {
  return apiRequest(`/api/v1/year-energy/current?language=${language}`, {
    method: 'GET',
  });
}

// ============================================
// PERSONAL YEAR READING
// ============================================

/**
 * Get cached personal year reading
 */
export async function getCachedPersonalYearReading(
  token: string,
  year: number,
  language: 'en' | 'fr' = 'en'
): Promise<{ cached: CachedPersonalYearReading | null }> {
  return apiRequest(`/api/v1/year-energy/personal/cached?year=${year}&language=${language}`, {
    method: 'GET',
    token,
  });
}

/**
 * Generate personal year reading
 */
export async function generatePersonalYearReading(
  token: string,
  params: {
    personalityCard: {
      cardId: number;
      cardName: string;
      cardNameFr: string;
      element: string;
      elementFr: string;
    };
    soulCard: {
      cardId: number;
      cardName: string;
      cardNameFr: string;
      element: string;
      elementFr: string;
    };
    zodiac: {
      name: string;
      nameFr: string;
      element: string;
      elementFr: string;
    };
    birthDate: string;
    language: 'en' | 'fr';
    year?: number;
  }
): Promise<PersonalYearReadingResponse> {
  return apiRequest('/api/v1/year-energy/personal', {
    method: 'POST',
    body: params,
    token,
  });
}

// ============================================
// THRESHOLD READINGS (Dec 21 - Jan 10)
// ============================================

/**
 * Check if currently in threshold period (Dec 21 - Jan 10)
 */
export async function getThresholdStatus(
  language: 'en' | 'fr' = 'en'
): Promise<ThresholdStatusResponse> {
  return apiRequest(`/api/v1/year-energy/threshold/status?language=${language}`, {
    method: 'GET',
  });
}

/**
 * Get cached threshold reading
 */
export async function getCachedThresholdReading(
  token: string,
  language: 'en' | 'fr' = 'en'
): Promise<{
  isThresholdPeriod: boolean;
  transitionYear?: number;
  cached: {
    synthesis: string;
    outgoingYear: number;
    incomingYear: number;
    createdAt: string;
  } | null;
}> {
  return apiRequest(`/api/v1/year-energy/threshold/cached?language=${language}`, {
    method: 'GET',
    token,
  });
}

/**
 * Generate threshold reading (Dec 21 - Jan 10 only)
 */
export async function generateThresholdReading(
  token: string,
  params: {
    personalityCard: {
      cardId: number;
      cardName: string;
      cardNameFr: string;
      element: string;
      elementFr: string;
    };
    soulCard: {
      cardId: number;
      cardName: string;
      cardNameFr: string;
      element: string;
      elementFr: string;
    };
    zodiac: {
      name: string;
      nameFr: string;
      element: string;
      elementFr: string;
    };
    birthDate: string;
    language: 'en' | 'fr';
  }
): Promise<ThresholdReadingResponse> {
  return apiRequest('/api/v1/year-energy/threshold', {
    method: 'POST',
    body: params,
    token,
  });
}

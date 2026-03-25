/**
 * Yes/No Tarot Reading API
 */

import { apiRequest, generateIdempotencyKey } from './client';

export interface YesNoCardData {
  cardNumber: string;
  cardType: string;
  slug: string;
  coverImage: string;
  yesNoEn: string;
  yesNoFr: string;
  verdict: 'YES' | 'NO' | 'UNCLEAR' | 'WAIT';
  coreMeaningEn: string;
  coreMeaningFr: string;
  uprightEn: string;
  uprightFr: string;
  reversedEn: string;
  reversedFr: string;
  bestAdviceEn: string;
  bestAdviceFr: string;
}

export type YesNoCardMap = Record<string, YesNoCardData>;

export interface ThreeCardResponse {
  cards: YesNoCardData[];
  newBalance: number;
}

export interface InterpretResponse {
  interpretation: string | null;
  verdict: string;
}

export interface ThreeCardInterpretResponse {
  interpretation: string | null;
}

/**
 * Fetch the full yes/no card data map (public, no auth)
 */
export async function fetchYesNoCards(): Promise<YesNoCardMap> {
  return apiRequest<YesNoCardMap>('/api/v1/yes-no/cards');
}

/**
 * Purchase a 3-card yes/no spread (1 credit, fast — no AI)
 */
export async function purchaseThreeCardSpread(
  token: string,
  cardKeys: [string, string, string]
): Promise<ThreeCardResponse> {
  return apiRequest<ThreeCardResponse>('/api/v1/yes-no/three-card', {
    method: 'POST',
    token,
    body: { cardKeys },
    idempotencyKey: generateIdempotencyKey(),
  });
}

/**
 * Get AI interpretation for a single yes/no card (free, rate limited)
 */
export async function interpretYesNoCard(params: {
  question: string;
  cardKey: string;
  isReversed: boolean;
  language: 'en' | 'fr';
}): Promise<InterpretResponse> {
  return apiRequest<InterpretResponse>('/api/v1/yes-no/interpret', {
    method: 'POST',
    body: params,
  });
}

/**
 * Get AI interpretation for a 3-card yes/no spread (auth required, no extra credit)
 */
export async function interpretThreeCardSpread(
  token: string,
  params: {
    question: string;
    cardKeys: string[];
    isReversed: boolean[];
    language: 'en' | 'fr';
  }
): Promise<ThreeCardInterpretResponse> {
  return apiRequest<ThreeCardInterpretResponse>('/api/v1/yes-no/interpret-three-card', {
    method: 'POST',
    token,
    body: params,
  });
}

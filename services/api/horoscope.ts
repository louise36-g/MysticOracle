/**
 * Horoscope API - Daily horoscope and follow-up questions
 */

import { apiRequest } from './client';

export async function fetchHoroscope(
  sign: string,
  language: 'en' | 'fr' = 'en',
  token?: string | null
): Promise<{ horoscope: string; cached: boolean; generatedAt: string }> {
  return apiRequest(`/api/v1/horoscopes/${encodeURIComponent(sign)}?language=${language}`, {
    token: token || undefined,
  });
}

export async function askHoroscopeQuestion(
  sign: string,
  question: string,
  horoscope: string,
  history: Array<{ role: string; content: string }>,
  language: 'en' | 'fr' = 'en',
  token?: string | null
): Promise<{ answer: string; cached: boolean }> {
  return apiRequest(`/api/v1/horoscopes/${encodeURIComponent(sign)}/followup?language=${language}`, {
    method: 'POST',
    body: { question, horoscope, history },
    token: token || undefined,
  });
}

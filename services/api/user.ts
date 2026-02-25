/**
 * User API - User profile, credits, readings, and transactions
 */

import { apiRequest, generateIdempotencyKey, API_URL } from './client';

// ============================================
// USER PROFILE
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  language: string;
  credits: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  totalReadings: number;
  totalQuestions: number;
  loginStreak: number;
  lastLoginDate: string;
  welcomeCompleted: boolean;
  referralCode: string;
  referredById: string | null;
  isAdmin: boolean;
  accountStatus: string;
  createdAt: string;
  achievements: { achievementId: string; unlockedAt: string }[];
  _count?: {
    readings: number;
    referrals: number;
  };
}

export async function fetchUserProfile(token: string): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/v1/users/me', { token });
}

export async function updateUserProfile(
  token: string,
  data: { language?: string; welcomeCompleted?: boolean }
): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/v1/users/me', {
    method: 'PATCH',
    body: data,
    token,
  });
}

export async function markWelcomeCompleted(token: string): Promise<UserProfile> {
  return updateUserProfile(token, { welcomeCompleted: true });
}

export async function fetchUserCredits(token: string): Promise<{
  credits: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
}> {
  return apiRequest('/api/v1/users/me/credits', { token });
}

export async function claimDailyBonus(token: string): Promise<{
  success: boolean;
  creditsAwarded: number;
  newBalance: number;
  streak: number;
}> {
  return apiRequest('/api/v1/users/me/daily-bonus', {
    method: 'POST',
    token,
  });
}

/**
 * Get invoice HTML for a transaction
 * Returns HTML string that can be opened in new window for printing
 */
export async function getInvoiceHtml(
  token: string,
  transactionId: string,
  language: 'en' | 'fr' = 'fr'
): Promise<string> {
  const response = await fetch(
    `${API_URL}/api/v1/users/me/transactions/${transactionId}/invoice?language=${language}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch invoice');
  }

  return response.text();
}

/**
 * Open invoice in new window for viewing/printing
 * Uses blob URL for security
 */
export async function openInvoice(
  token: string,
  transactionId: string,
  language: 'en' | 'fr' = 'fr'
): Promise<void> {
  const html = await getInvoiceHtml(token, transactionId, language);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Clean up blob URL after a delay to allow the window to load
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================
// READINGS
// ============================================

export interface ReadingCard {
  cardId: string;
  position: number;
  isReversed?: boolean;
}

export interface ReadingData {
  id: string;
  spreadType: string;
  interpretationStyle: string;
  question?: string;
  cards: ReadingCard[] | unknown; // Array of { cardId, position, isReversed } - flexible for legacy data
  interpretation: string;
  userReflection?: string;
  creditCost: number;
  createdAt: string;
  followUps: {
    id: string;
    question: string;
    answer: string;
    creditCost: number;
    createdAt: string;
  }[];
}

// Standardized pagination response from backend
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}

export async function fetchUserReadings(
  token: string,
  limit = 20,
  offset = 0
): Promise<PaginatedResponse<ReadingData>> {
  return apiRequest(`/api/v1/users/me/readings?limit=${limit}&offset=${offset}`, { token });
}

// ============================================
// UNIFIED READING HISTORY (All Types)
// ============================================

export type ReadingType = 'tarot' | 'birth_synthesis' | 'personal_year' | 'threshold';

export interface UnifiedReadingData {
  id: string;
  readingType: ReadingType;
  createdAt: string;
  creditCost: number;
  // Tarot-specific
  spreadType?: string;
  interpretationStyle?: string;
  question?: string;
  cards?: ReadingCard[] | unknown;
  interpretation?: string;
  userReflection?: string;
  followUps?: Array<{
    id: string;
    question: string;
    answer: string;
    creditCost: number;
    createdAt: string;
  }>;
  // Birth card specific
  personalityCardId?: number;
  soulCardId?: number;
  zodiacSign?: string;
  synthesisEn?: string;
  synthesisFr?: string;
  // Personal year specific
  year?: number;
  personalYearNumber?: number;
  personalYearCardId?: number;
  // Threshold specific
  transitionYear?: number;
  outgoingYearNumber?: number;
  outgoingYearCardId?: number;
  incomingYearNumber?: number;
  incomingYearCardId?: number;
}

export type ReadingTypeFilter = 'all' | 'tarot' | 'birth_cards';

/**
 * Fetch unified reading history (all types: tarot, birth cards, year energy, threshold)
 */
export async function fetchUnifiedReadings(
  token: string,
  options: {
    limit?: number;
    offset?: number;
    type?: ReadingTypeFilter;
    language?: 'en' | 'fr';
  } = {}
): Promise<PaginatedResponse<UnifiedReadingData>> {
  const { limit = 50, offset = 0, type = 'all', language = 'en' } = options;
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    type,
    language,
  });
  return apiRequest(`/api/v1/users/me/readings/all?${params}`, { token });
}

export async function createReading(
  token: string,
  data: {
    spreadType: string;
    interpretationStyle: string;
    question?: string;
    cards: Array<{ cardId: string; position: number; isReversed?: boolean }>;
    interpretation: string;
    hasExtendedQuestion?: boolean;
  }
): Promise<ReadingData> {
  // Use idempotency key to prevent duplicate charges on network retries
  const idempotencyKey = generateIdempotencyKey();
  return apiRequest('/api/readings', {
    method: 'POST',
    body: data,
    token,
    idempotencyKey,
  });
}

export async function addFollowUpQuestion(
  token: string,
  readingId: string,
  question: string,
  answer: string
): Promise<{ id: string; question: string; answer: string; creditCost: number; createdAt: string }> {
  // Use idempotency key to prevent duplicate charges on network retries
  const idempotencyKey = generateIdempotencyKey();
  return apiRequest(`/api/readings/${readingId}/follow-up`, {
    method: 'POST',
    body: { question, answer },
    token,
    idempotencyKey,
  });
}

export async function updateReadingReflection(
  token: string,
  readingId: string,
  userReflection: string
): Promise<{ success: boolean; reading: ReadingData }> {
  return apiRequest(`/api/readings/${readingId}`, {
    method: 'PATCH',
    body: { userReflection },
    token,
  });
}

// ============================================
// TRANSACTIONS
// ============================================

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  paymentProvider?: string;
  paymentStatus?: string;
  createdAt: string;
}

export async function fetchUserTransactions(
  token: string,
  limit = 50,
  offset = 0
): Promise<PaginatedResponse<Transaction>> {
  return apiRequest(`/api/v1/users/me/transactions?limit=${limit}&offset=${offset}`, { token });
}

// ============================================
// USERNAME
// ============================================

export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean; reason?: string; message?: string }> {
  return apiRequest(`/api/v1/users/check-username?username=${encodeURIComponent(username)}`);
}

export async function updateUsername(
  token: string,
  username: string
): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/v1/users/me', {
    method: 'PATCH',
    body: { username },
    token,
  });
}

// ============================================
// REFERRAL SYSTEM
// ============================================

export async function redeemReferralCode(
  token: string,
  code: string
): Promise<{
  success: boolean;
  message: string;
  creditsAwarded: number;
  newBalance: number;
}> {
  return apiRequest('/api/v1/users/me/redeem-referral', {
    method: 'POST',
    body: { code },
    token,
  });
}

export async function sendReferralInvite(
  token: string,
  email: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest('/api/v1/users/me/referral-invite', {
    method: 'POST',
    body: { email },
    token,
  });
}

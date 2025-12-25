/**
 * API Service - Handles all backend communication
 * Uses Clerk for authentication tokens
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  token?: string | null;
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

// ============================================
// USER ENDPOINTS
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
  referralCode: string;
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
  return apiRequest<UserProfile>('/api/users/me', { token });
}

export async function updateUserProfile(
  token: string,
  data: { language?: string }
): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/users/me', {
    method: 'PATCH',
    body: data,
    token,
  });
}

export async function fetchUserCredits(token: string): Promise<{
  credits: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
}> {
  return apiRequest('/api/users/me/credits', { token });
}

export async function claimDailyBonus(token: string): Promise<{
  success: boolean;
  creditsAwarded: number;
  newBalance: number;
  streak: number;
}> {
  return apiRequest('/api/users/me/daily-bonus', {
    method: 'POST',
    token,
  });
}

// ============================================
// READINGS ENDPOINTS
// ============================================

export interface ReadingData {
  id: string;
  spreadType: string;
  interpretationStyle: string;
  question?: string;
  cards: any;
  interpretation: string;
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

export async function fetchUserReadings(
  token: string,
  limit = 20,
  offset = 0
): Promise<{ readings: ReadingData[]; total: number }> {
  return apiRequest(`/api/users/me/readings?limit=${limit}&offset=${offset}`, { token });
}

export async function createReading(
  token: string,
  data: {
    spreadType: string;
    interpretationStyle: string;
    question?: string;
    cards: any;
    interpretation: string;
    creditCost: number;
  }
): Promise<ReadingData> {
  return apiRequest('/api/readings', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function addFollowUpQuestion(
  token: string,
  readingId: string,
  question: string,
  answer: string,
  creditCost: number
): Promise<void> {
  return apiRequest(`/api/readings/${readingId}/followup`, {
    method: 'POST',
    body: { question, answer, creditCost },
    token,
  });
}

export async function deductCredits(
  token: string,
  amount: number,
  description: string
): Promise<{ success: boolean; newBalance: number }> {
  return apiRequest('/api/readings/deduct-credits', {
    method: 'POST',
    body: { amount, description },
    token,
  });
}

// ============================================
// TRANSACTIONS ENDPOINTS
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
): Promise<{ transactions: Transaction[]; total: number }> {
  return apiRequest(`/api/users/me/transactions?limit=${limit}&offset=${offset}`, { token });
}

// ============================================
// PAYMENTS ENDPOINTS
// ============================================

export interface CreditPackage {
  id: string;
  credits: number;
  priceEur: number;
  name: string;
  nameEn: string;
  nameFr: string;
  labelEn: string;
  labelFr: string;
  discount: number;
  badge: string | null;
}

export async function fetchCreditPackages(): Promise<CreditPackage[]> {
  return apiRequest('/api/payments/packages');
}

export async function createStripeCheckout(
  token: string,
  packageId: string,
  useStripeLink = false
): Promise<{ sessionId: string; url: string }> {
  return apiRequest('/api/payments/stripe/checkout', {
    method: 'POST',
    body: { packageId, useStripeLink },
    token,
  });
}

export async function verifyStripePayment(
  token: string,
  sessionId: string
): Promise<{ success: boolean; credits?: number; status?: string }> {
  return apiRequest(`/api/payments/stripe/verify/${sessionId}`, { token });
}

export async function createPayPalOrder(
  token: string,
  packageId: string
): Promise<{ orderId: string; approvalUrl: string }> {
  return apiRequest('/api/payments/paypal/order', {
    method: 'POST',
    body: { packageId },
    token,
  });
}

export async function capturePayPalOrder(
  token: string,
  orderId: string
): Promise<{ success: boolean; credits?: number; captureId?: string; status?: string }> {
  return apiRequest('/api/payments/paypal/capture', {
    method: 'POST',
    body: { orderId },
    token,
  });
}

export async function fetchPurchaseHistory(token: string): Promise<Transaction[]> {
  return apiRequest('/api/payments/history', { token });
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  return apiRequest('/api/health');
}

export default {
  fetchUserProfile,
  updateUserProfile,
  fetchUserCredits,
  claimDailyBonus,
  fetchUserReadings,
  createReading,
  addFollowUpQuestion,
  deductCredits,
  fetchUserTransactions,
  fetchCreditPackages,
  createStripeCheckout,
  verifyStripePayment,
  createPayPalOrder,
  capturePayPalOrder,
  fetchPurchaseHistory,
  checkHealth,
};

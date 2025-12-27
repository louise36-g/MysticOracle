/**
 * API Service - Handles all backend communication
 * Uses Clerk for authentication tokens
 */

// VITE_API_URL should be base URL (e.g., http://localhost:3001)
// Remove trailing /api if present to avoid duplication with endpoint paths
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = rawUrl.replace(/\/api$/, '');

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

// ============================================
// HOROSCOPE ENDPOINTS
// ============================================

export async function fetchHoroscope(
  sign: string,
  language: 'en' | 'fr' = 'en',
  token?: string | null
): Promise<{ horoscope: string; cached: boolean; generatedAt: string }> {
  return apiRequest(`/api/horoscopes/${encodeURIComponent(sign)}?language=${language}`, {
    token: token || undefined
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
  return apiRequest(`/api/horoscopes/${encodeURIComponent(sign)}/followup?language=${language}`, {
    method: 'POST',
    body: { question, horoscope, history },
    token: token || undefined
  });
}

// ============================================
// ADMIN ENDPOINTS
// ============================================

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalReadings: number;
  totalRevenue: number;
  todayReadings: number;
  todaySignups: number;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  credits: number;
  totalReadings: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  loginStreak: number;
  lastLoginDate: string;
  accountStatus: 'ACTIVE' | 'FLAGGED' | 'SUSPENDED';
  isAdmin: boolean;
  createdAt: string;
  _count: {
    achievements: number;
    readings: number;
  };
}

export interface AdminUserList {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminRevenue {
  totalRevenue: number;
  totalTransactions: number;
  last30Days: {
    revenue: number;
    transactions: number;
  };
  byProvider: Array<{
    paymentProvider: string;
    _sum: { paymentAmount: number };
    _count: number;
  }>;
}

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  return apiRequest('/api/admin/stats', { token });
}

export async function fetchAdminUsers(
  token: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'ACTIVE' | 'FLAGGED' | 'SUSPENDED';
    sortBy?: 'createdAt' | 'credits' | 'totalReadings' | 'username';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<AdminUserList> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.status) queryParams.set('status', params.status);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  return apiRequest(`/api/admin/users?${queryParams.toString()}`, { token });
}

export async function fetchAdminUserDetail(token: string, userId: string): Promise<any> {
  return apiRequest(`/api/admin/users/${userId}`, { token });
}

export async function updateUserStatus(
  token: string,
  userId: string,
  status: 'ACTIVE' | 'FLAGGED' | 'SUSPENDED'
): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: { status },
    token,
  });
}

export async function adjustUserCredits(
  token: string,
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; newBalance: number }> {
  return apiRequest(`/api/admin/users/${userId}/credits`, {
    method: 'POST',
    body: { amount, reason },
    token,
  });
}

export async function toggleUserAdmin(
  token: string,
  userId: string
): Promise<{ success: boolean; isAdmin: boolean }> {
  return apiRequest(`/api/admin/users/${userId}/admin`, {
    method: 'PATCH',
    token,
  });
}

export async function fetchAdminTransactions(
  token: string,
  params: { page?: number; limit?: number; type?: string } = {}
): Promise<{
  transactions: Array<Transaction & { user: { username: string; email: string } }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.type) queryParams.set('type', params.type);

  return apiRequest(`/api/admin/transactions?${queryParams.toString()}`, { token });
}

export async function fetchAdminRevenue(token: string): Promise<AdminRevenue> {
  return apiRequest('/api/admin/revenue', { token });
}

export async function fetchAdminReadingStats(token: string): Promise<{
  bySpreadType: Array<{ spreadType: string; _count: number }>;
  recentReadings: Array<{
    id: string;
    spreadType: string;
    creditCost: number;
    createdAt: string;
    user: { username: string };
  }>;
}> {
  return apiRequest('/api/admin/readings/stats', { token });
}

export async function fetchAdminAIConfig(token: string): Promise<{
  model: string;
  provider: string;
  hasApiKey: boolean;
}> {
  return apiRequest('/api/admin/config/ai', { token });
}

export interface AdminAnalytics {
  readingsByDay: Array<{ date: string; count: number }>;
  topUsers: Array<{ id: string; username: string; count: number }>;
  topCreditUsers: Array<{ username: string; credits: number }>;
  topStreakUsers: Array<{ username: string; streak: number }>;
}

export async function fetchAdminAnalytics(token: string): Promise<AdminAnalytics> {
  return apiRequest('/api/admin/analytics', { token });
}

export interface EmailTemplate {
  id: string;
  nameEn: string;
  nameFr: string;
  subjectEn: string;
  subjectFr: string;
}

export async function fetchAdminEmailTemplates(token: string): Promise<{
  templates: EmailTemplate[];
  brevoConfigured: boolean;
}> {
  return apiRequest('/api/admin/config/email-templates', { token });
}

// ============================================
// ADMIN CREDIT PACKAGES CRUD
// ============================================

export interface AdminCreditPackage {
  id: string;
  credits: number;
  priceEur: number;
  nameEn: string;
  nameFr: string;
  labelEn: string;
  labelFr: string;
  discount: number;
  badge: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAdminPackages(token: string): Promise<{ packages: AdminCreditPackage[] }> {
  return apiRequest('/api/admin/packages', { token });
}

export async function createAdminPackage(
  token: string,
  data: Omit<AdminCreditPackage, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; package: AdminCreditPackage }> {
  return apiRequest('/api/admin/packages', { method: 'POST', body: data, token });
}

export async function updateAdminPackage(
  token: string,
  id: string,
  data: Partial<Omit<AdminCreditPackage, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean; package: AdminCreditPackage }> {
  return apiRequest(`/api/admin/packages/${id}`, { method: 'PATCH', body: data, token });
}

export async function deleteAdminPackage(
  token: string,
  id: string
): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/packages/${id}`, { method: 'DELETE', token });
}

// ============================================
// ADMIN EMAIL TEMPLATES CRUD
// ============================================

export interface AdminEmailTemplate {
  id: string;
  slug: string;
  subjectEn: string;
  bodyEn: string;
  subjectFr: string;
  bodyFr: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAdminEmailTemplatesCRUD(token: string): Promise<{
  templates: AdminEmailTemplate[];
  brevoConfigured: boolean;
}> {
  return apiRequest('/api/admin/email-templates', { token });
}

export async function createAdminEmailTemplate(
  token: string,
  data: Omit<AdminEmailTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; template: AdminEmailTemplate }> {
  return apiRequest('/api/admin/email-templates', { method: 'POST', body: data, token });
}

export async function updateAdminEmailTemplate(
  token: string,
  id: string,
  data: Partial<Omit<AdminEmailTemplate, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean; template: AdminEmailTemplate }> {
  return apiRequest(`/api/admin/email-templates/${id}`, { method: 'PATCH', body: data, token });
}

export async function deleteAdminEmailTemplate(
  token: string,
  id: string
): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/email-templates/${id}`, { method: 'DELETE', token });
}

// ============================================
// ADMIN SYSTEM HEALTH
// ============================================

export interface SystemHealth {
  status: 'healthy' | 'partial' | 'degraded';
  services: Record<string, { status: string; message?: string }>;
  timestamp: string;
}

export async function fetchAdminHealth(token: string): Promise<SystemHealth> {
  return apiRequest('/api/admin/health', { token });
}

export async function seedAdminPackages(token: string): Promise<{ success: boolean; packages: AdminCreditPackage[]; count: number }> {
  return apiRequest('/api/admin/seed/packages', { method: 'POST', token });
}

export async function seedAdminEmailTemplates(token: string): Promise<{ success: boolean; templates: AdminEmailTemplate[]; count: number }> {
  return apiRequest('/api/admin/seed/email-templates', { method: 'POST', token });
}

export interface ServiceConfig {
  id: string;
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  envVars: string[];
  configured: boolean;
  dashboardUrl: string;
  docsUrl: string;
}

export async function fetchAdminServices(token: string): Promise<{ services: ServiceConfig[] }> {
  return apiRequest('/api/admin/services', { token });
}

// ============================================
// ADMIN SYSTEM SETTINGS
// ============================================

export interface SystemSetting {
  key: string;
  value: string;
  hasValue: boolean;
  isSecret: boolean;
  source: 'database' | 'environment' | 'none';
  descriptionEn: string;
  descriptionFr: string;
}

export async function fetchAdminSettings(token: string): Promise<{ settings: SystemSetting[] }> {
  return apiRequest('/api/admin/settings', { token });
}

export async function updateAdminSetting(
  token: string,
  key: string,
  value: string
): Promise<{ success: boolean }> {
  return apiRequest('/api/admin/settings', { method: 'POST', body: { key, value }, token });
}

// ============================================
// ADMIN REVENUE EXPORT
// ============================================

export interface RevenueMonth {
  year: number;
  month: number;
  label: string;
}

export async function fetchRevenueMonths(token: string): Promise<{ months: RevenueMonth[] }> {
  return apiRequest('/api/admin/revenue/months', { token });
}

export function getRevenueExportUrl(token: string, year: number, month: number): string {
  return `${API_URL}/api/admin/revenue/export?year=${year}&month=${month}`;
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
  // Admin
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminUserDetail,
  updateUserStatus,
  adjustUserCredits,
  toggleUserAdmin,
  fetchAdminTransactions,
  fetchAdminRevenue,
  fetchAdminReadingStats,
  fetchAdminAIConfig,
  fetchAdminAnalytics,
  fetchAdminEmailTemplates,
};

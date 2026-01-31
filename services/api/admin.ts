/**
 * Admin API - Dashboard stats, user management, packages, templates, prompts, settings
 */

import { apiRequest, apiEndpoint, API_URL, type ParamValue } from './client';
import type { Transaction } from './user';

// ============================================
// TYPES
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

export interface AdminAnalytics {
  readingsByDay: Array<{ date: string; count: number }>;
  topUsers: Array<{ id: string; username: string; count: number }>;
  topCreditUsers: Array<{ username: string; credits: number }>;
  topStreakUsers: Array<{ username: string; streak: number }>;
}

export interface EmailTemplate {
  id: string;
  nameEn: string;
  nameFr: string;
  subjectEn: string;
  subjectFr: string;
}

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

export interface SystemHealth {
  status: 'healthy' | 'partial' | 'degraded';
  services: Record<string, { status: string; message?: string }>;
  timestamp: string;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  source: string;
  message: string;
  details?: string;
  userId?: string;
  path?: string;
}

export interface ErrorLogsResponse {
  logs: ErrorLogEntry[];
  total: number;
  maxSize: number;
}

export interface AdminPrompt {
  key: string;
  value: string;
  description: string;
  category: 'tarot' | 'horoscope';
  isBase?: boolean;
  variables: string[];
  characterCount: number;
  updatedAt: string | null;
  isCustom?: boolean;
  defaultValue?: string;
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

export interface SystemSetting {
  key: string;
  value: string;
  hasValue: boolean;
  isSecret: boolean;
  source: 'database' | 'environment' | 'none';
  descriptionEn: string;
  descriptionFr: string;
}

export interface RevenueMonth {
  year: number;
  month: number;
  label: string;
}

// ============================================
// ADMIN STATS & OVERVIEW
// ============================================

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  return apiRequest('/api/admin/stats', { token });
}

export async function fetchAdminRevenue(token: string): Promise<AdminRevenue> {
  return apiRequest('/api/admin/revenue', { token });
}

export async function fetchAdminAnalytics(token: string): Promise<AdminAnalytics> {
  return apiRequest('/api/admin/analytics', { token });
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

// ============================================
// USER MANAGEMENT
// ============================================

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
  return apiRequest(apiEndpoint('/api/admin/users', params as Record<string, ParamValue>), { token });
}

export async function fetchAdminUserDetail(token: string, userId: string): Promise<AdminUser> {
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

// ============================================
// TRANSACTIONS
// ============================================

export async function fetchAdminTransactions(
  token: string,
  params: { page?: number; limit?: number; type?: string } = {}
): Promise<{
  transactions: Array<Transaction & { user: { username: string; email: string } }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  return apiRequest(apiEndpoint('/api/admin/transactions', params as Record<string, ParamValue>), { token });
}

// ============================================
// CREDIT PACKAGES CRUD
// ============================================

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

export async function seedAdminPackages(token: string): Promise<{ success: boolean; packages: AdminCreditPackage[]; count: number }> {
  return apiRequest('/api/admin/seed/packages', { method: 'POST', token });
}

// ============================================
// EMAIL TEMPLATES CRUD
// ============================================

export async function fetchAdminEmailTemplates(token: string): Promise<{
  templates: EmailTemplate[];
  brevoConfigured: boolean;
}> {
  return apiRequest('/api/admin/config/email-templates', { token });
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

export async function seedAdminEmailTemplates(token: string): Promise<{ success: boolean; templates: AdminEmailTemplate[]; count: number }> {
  return apiRequest('/api/admin/seed/email-templates', { method: 'POST', token });
}

// ============================================
// SYSTEM HEALTH
// ============================================

export async function fetchAdminHealth(token: string): Promise<SystemHealth> {
  return apiRequest('/api/admin/health', { token });
}

// ============================================
// ERROR LOGS
// ============================================

export async function fetchAdminErrorLogs(
  token: string,
  params: { limit?: number; level?: string; source?: string } = {}
): Promise<ErrorLogsResponse> {
  return apiRequest(apiEndpoint('/api/admin/error-logs', params as Record<string, ParamValue>), { token });
}

export async function clearAdminErrorLogs(token: string): Promise<{ success: boolean }> {
  return apiRequest('/api/admin/error-logs', { method: 'DELETE', token });
}

// ============================================
// AI PROMPTS
// ============================================

export async function fetchAdminPrompts(token: string): Promise<{
  prompts: AdminPrompt[];
}> {
  return apiRequest('/api/admin/prompts', { token });
}

export async function fetchAdminPrompt(
  token: string,
  key: string
): Promise<AdminPrompt> {
  return apiRequest(`/api/admin/prompts/${encodeURIComponent(key)}`, { token });
}

export async function updateAdminPrompt(
  token: string,
  key: string,
  data: { value: string }
): Promise<{ success: boolean; prompt: AdminPrompt }> {
  return apiRequest(`/api/admin/prompts/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: data,
    token,
  });
}

export async function resetAdminPrompt(
  token: string,
  key: string
): Promise<{ success: boolean; prompt: AdminPrompt }> {
  return apiRequest(`/api/admin/prompts/${encodeURIComponent(key)}/reset`, {
    method: 'POST',
    token,
  });
}

export async function seedAdminPrompts(token: string): Promise<{
  success: boolean;
  seeded: Array<{ key: string; created: boolean }>;
  count: number;
}> {
  return apiRequest('/api/admin/prompts/seed', { method: 'POST', token });
}

// ============================================
// SERVICES CONFIG
// ============================================

export async function fetchAdminServices(token: string): Promise<{ services: ServiceConfig[] }> {
  return apiRequest('/api/admin/services', { token });
}

// ============================================
// SYSTEM SETTINGS
// ============================================

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
// REVENUE EXPORT
// ============================================

export async function fetchRevenueMonths(token: string): Promise<{ months: RevenueMonth[] }> {
  return apiRequest('/api/admin/revenue/months', { token });
}

export function getRevenueExportUrl(token: string, year: number, month: number): string {
  return `${API_URL}/api/admin/revenue/export?year=${year}&month=${month}`;
}

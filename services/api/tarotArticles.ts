/**
 * Tarot Articles API - Public and admin endpoints for tarot card articles
 */

import { apiRequest, apiEndpoint, type ParamValue } from './client';

// ============================================
// TYPES
// ============================================

export interface FAQItem {
  question: string;
  answer: string;
}

export interface CTAItem {
  heading: string;
  text: string;
  buttonText: string;
  buttonUrl: string;
}

export interface TarotArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  readTime: string;
  datePublished: string;
  dateModified: string;
  featuredImage: string;
  featuredImageAlt: string;
  cardType: string;
  cardNumber: string;
  astrologicalCorrespondence: string;
  element: string;
  categories: string[];
  tags: string[];
  seoFocusKeyword: string;
  seoMetaTitle: string;
  seoMetaDescription: string;
  faq: FAQItem[];
  breadcrumbCategory: string;
  breadcrumbCategoryUrl?: string;
  relatedCards: string[];
  isCourtCard: boolean;
  isChallengeCard: boolean;
  schemaJson: object;
  schemaHtml: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  deletedAt?: string;
  originalSlug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TarotArticlesListResponse {
  articles: TarotArticle[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminTarotArticlesListResponse {
  articles: TarotArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TarotOverviewCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  featuredImageAlt: string;
  cardType: string;
  cardNumber: string;
  readTime: string;
}

export interface TarotOverviewData {
  majorArcana: TarotOverviewCard[];
  wands: TarotOverviewCard[];
  cups: TarotOverviewCard[];
  swords: TarotOverviewCard[];
  pentacles: TarotOverviewCard[];
  counts: {
    majorArcana: number;
    wands: number;
    cups: number;
    swords: number;
    pentacles: number;
  };
}

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * Fetch a single tarot article by slug
 */
export async function fetchTarotArticle(slug: string): Promise<TarotArticle> {
  return apiRequest(`/api/v1/tarot-articles/${slug}`);
}

/**
 * Fetch list of tarot articles with pagination
 */
export async function fetchTarotArticles(params: {
  page?: number;
  limit?: number;
  cardType?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  sortBy?: 'datePublished' | 'cardNumber';
} = {}): Promise<TarotArticlesListResponse> {
  return apiRequest(apiEndpoint('/api/v1/tarot-articles', params as Record<string, ParamValue>));
}

/**
 * Fetch tarot overview data (batch)
 */
export async function fetchTarotOverview(): Promise<TarotOverviewData> {
  return apiRequest('/api/v1/tarot-articles/overview');
}

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * Create new tarot article
 */
export async function createTarotArticle(
  token: string,
  data: Partial<TarotArticle>
): Promise<TarotArticle> {
  return apiRequest('/api/v1/tarot-articles/admin/import', {
    method: 'POST',
    body: data,
    token,
  });
}

/**
 * Update tarot article
 */
export async function updateTarotArticle(
  token: string,
  id: string,
  data: Partial<TarotArticle>
): Promise<TarotArticle> {
  return apiRequest(`/api/v1/tarot-articles/admin/${id}`, {
    method: 'PATCH',
    body: data,
    token,
  });
}

/**
 * Delete tarot article (soft delete)
 */
export async function deleteTarotArticle(
  token: string,
  id: string
): Promise<{ success: boolean }> {
  return apiRequest(`/api/v1/tarot-articles/admin/${id}`, {
    method: 'DELETE',
    token,
  });
}

/**
 * Fetch admin tarot articles list with filters
 */
export async function fetchAdminTarotArticles(
  token: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    cardType?: string;
    status?: string;
    deleted?: boolean;
  }
): Promise<AdminTarotArticlesListResponse> {
  return apiRequest(apiEndpoint('/api/v1/tarot-articles/admin/list', params as Record<string, ParamValue>), { token });
}

/**
 * Fetch single admin tarot article for editing
 */
export async function fetchAdminTarotArticle(
  token: string,
  id: string
): Promise<TarotArticle> {
  return apiRequest(`/api/v1/tarot-articles/admin/${id}`, {
    token,
  });
}

/**
 * Preview a tarot article
 */
export async function previewTarotArticle(
  token: string,
  id: string
): Promise<TarotArticle> {
  return apiRequest(`/api/v1/tarot-articles/admin/preview/${id}`, {
    token,
  });
}

/**
 * Update tarot article status
 */
export async function updateTarotArticleStatus(
  token: string,
  id: string,
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
): Promise<TarotArticle> {
  return apiRequest(`/api/v1/tarot-articles/admin/${id}`, {
    method: 'PATCH',
    body: { status },
    token,
  });
}

/**
 * Restore a deleted tarot article
 */
export async function restoreTarotArticle(
  token: string,
  id: string
): Promise<{ success: boolean; slug: string; message: string }> {
  return apiRequest(`/api/v1/tarot-articles/admin/${id}/restore`, {
    method: 'POST',
    token,
  });
}

/**
 * Permanently delete a tarot article
 */
export async function permanentlyDeleteTarotArticle(
  token: string,
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/api/v1/tarot-articles/admin/${id}/permanent`, {
    method: 'DELETE',
    token,
  });
}

/**
 * Empty the tarot articles trash
 */
export async function emptyTarotArticlesTrash(
  token: string
): Promise<{ success: boolean; deleted: number; message: string }> {
  return apiRequest('/api/v1/tarot-articles/admin/trash/empty', {
    method: 'DELETE',
    token,
  });
}

/**
 * Reorder a tarot article within its card type
 */
export async function reorderTarotArticle(
  token: string,
  params: {
    articleId: string;
    cardType: string;
    newPosition: number;
  }
): Promise<{ success: boolean; message: string }> {
  return apiRequest('/api/v1/tarot-articles/admin/reorder', {
    method: 'PATCH',
    body: params,
    token,
  });
}

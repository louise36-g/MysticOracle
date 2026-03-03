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
  titleFr?: string;
  slug: string;
  excerpt: string;
  excerptFr?: string;
  content: string;
  contentFr?: string;
  author: string;
  readTime: string;
  datePublished: string;
  dateModified: string;
  featuredImage: string;
  featuredImageAlt: string;
  featuredImageAltFr?: string;
  cardType: string;
  cardNumber: string;
  astrologicalCorrespondence: string;
  element: string;
  categories: string[];
  tags: string[];
  seoFocusKeyword: string;
  seoMetaTitle: string;
  seoMetaDescription: string;
  seoFocusKeywordFr?: string;
  seoMetaTitleFr?: string;
  seoMetaDescriptionFr?: string;
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

export interface TarotOverviewCard {
  id: string;
  title: string;
  titleFr?: string;
  slug: string;
  excerpt: string;
  excerptFr?: string;
  featuredImage: string;
  featuredImageAlt: string;
  featuredImageAltFr?: string;
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


/**
 * Unified Taxonomy API - Categories and tags shared between blog and tarot articles
 */

import { apiRequest } from './client';

// ============================================
// TYPES
// ============================================

/**
 * Unified Category - shared between blog posts and tarot articles
 */
export interface UnifiedCategory {
  id: string;
  name: string;
  nameFr: string;
  slug: string;
  description?: string | null;
  descriptionFr?: string | null;
  color?: string | null;
  icon?: string | null;
  sortOrder: number;
  blogPostCount: number;
  tarotArticleCount: number;
}

/**
 * Unified Tag - shared between blog posts and tarot articles
 */
export interface UnifiedTag {
  id: string;
  name: string;
  nameFr: string;
  slug: string;
  blogPostCount: number;
  tarotArticleCount: number;
}

export interface CategoryInput {
  name: string;
  nameFr?: string;
  slug: string;
  description?: string;
  descriptionFr?: string;
  color?: string;
  icon?: string;
}

export interface TagInput {
  name: string;
  nameFr?: string;
  slug: string;
}

// ============================================
// CATEGORY ENDPOINTS
// ============================================

/**
 * Fetch all categories with counts for both content types
 */
export async function fetchUnifiedCategories(token: string): Promise<{ categories: UnifiedCategory[] }> {
  return apiRequest('/api/v1/taxonomy/categories', { token });
}

/**
 * Create a new category (shared)
 */
export async function createUnifiedCategory(
  token: string,
  data: CategoryInput
): Promise<{ category: UnifiedCategory }> {
  return apiRequest('/api/v1/taxonomy/categories', {
    method: 'POST',
    token,
    body: data,
  });
}

/**
 * Update a category
 */
export async function updateUnifiedCategory(
  token: string,
  id: string,
  data: Partial<CategoryInput>
): Promise<{ category: UnifiedCategory }> {
  return apiRequest(`/api/v1/taxonomy/categories/${id}`, {
    method: 'PATCH',
    token,
    body: data,
  });
}

/**
 * Delete a category (will fail if used by blog posts)
 */
export async function deleteUnifiedCategory(token: string, id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/v1/taxonomy/categories/${id}`, {
    method: 'DELETE',
    token,
  });
}

// ============================================
// TAG ENDPOINTS
// ============================================

/**
 * Fetch all tags with counts for both content types
 */
export async function fetchUnifiedTags(token: string): Promise<{ tags: UnifiedTag[] }> {
  return apiRequest('/api/v1/taxonomy/tags', { token });
}

/**
 * Create a new tag (shared)
 */
export async function createUnifiedTag(
  token: string,
  data: TagInput
): Promise<{ tag: UnifiedTag }> {
  return apiRequest('/api/v1/taxonomy/tags', {
    method: 'POST',
    token,
    body: data,
  });
}

/**
 * Update a tag
 */
export async function updateUnifiedTag(
  token: string,
  id: string,
  data: Partial<TagInput>
): Promise<{ tag: UnifiedTag }> {
  return apiRequest(`/api/v1/taxonomy/tags/${id}`, {
    method: 'PATCH',
    token,
    body: data,
  });
}

/**
 * Delete a tag (will fail if used by blog posts)
 */
export async function deleteUnifiedTag(token: string, id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/v1/taxonomy/tags/${id}`, {
    method: 'DELETE',
    token,
  });
}

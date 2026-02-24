/**
 * Blog API - Posts, categories, tags, media, and import
 */

import { apiRequest, apiEndpoint, API_URL, type ParamValue } from './client';
import type { FAQItem, CTAItem } from './tarotArticles';

// Re-export shared types
export type { FAQItem, CTAItem };

// ============================================
// TYPES
// ============================================

export interface BlogCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  descEn?: string;
  descFr?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
  postCount?: number;
  _count?: { posts: number };
}

export interface BlogTag {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  postCount?: number;
  _count?: { posts: number };
}

export interface BlogPost {
  id: string;
  slug: string;
  titleEn: string;
  titleFr: string;
  excerptEn: string;
  excerptFr: string;
  contentEn: string;
  contentFr: string;
  coverImage?: string;
  coverImageAlt?: string;
  metaTitleEn?: string;
  metaTitleFr?: string;
  metaDescEn?: string;
  metaDescFr?: string;
  ogImage?: string;
  authorName: string;
  authorId?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featured: boolean;
  viewCount: number;
  readTimeMinutes: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  originalSlug?: string;
  faq?: FAQItem[];
  cta?: CTAItem;
  categories: BlogCategory[];
  tags: BlogTag[];
  categoryIds?: string[];
  tagIds?: string[];
}

export type CreateBlogPostData = {
  slug: string;
  titleEn: string;
  titleFr?: string;
  excerptEn?: string;
  excerptFr?: string;
  contentEn?: string;
  contentFr?: string;
  coverImage?: string;
  coverImageAlt?: string;
  metaTitleEn?: string;
  metaTitleFr?: string;
  metaDescEn?: string;
  metaDescFr?: string;
  ogImage?: string;
  authorName: string;
  authorId?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featured: boolean;
  readTimeMinutes: number;
  categoryIds: string[];
  tagIds: string[];
  faq?: FAQItem[];
  cta?: CTAItem | null;
};

export type UpdateBlogPostData = Partial<CreateBlogPostData>;

export interface BlogMedia {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  altText?: string;
  caption?: string;
  folder: string;
  createdAt: string;
}

export interface BlogPostListResponse {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ImportArticle {
  title: string;
  excerpt?: string;
  content?: string;
  slug: string;
  author?: string;
  read_time?: string | number;
  image_alt_text?: string;
  categories?: string[];
  tags?: string[];
  seo_meta?: {
    focus_keyword?: string;
    meta_title?: string;
    meta_description?: string;
    og_title?: string;
    og_description?: string;
  };
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  createMissingTaxonomies?: boolean;
}

export interface ImportResult {
  success: boolean;
  results: {
    imported: number;
    skipped: number;
    skippedSlugs: string[];
    errors: { slug: string; error: string }[];
    createdCategories: string[];
    createdTags: string[];
  };
}

// ============================================
// PUBLIC ENDPOINTS
// ============================================

export async function fetchBlogPosts(params: {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  featured?: boolean;
} = {}): Promise<BlogPostListResponse> {
  return apiRequest(apiEndpoint('/api/blog/posts', params as Record<string, ParamValue>));
}

export async function fetchBlogPost(slug: string): Promise<{ post: BlogPost; relatedPosts: BlogPost[] }> {
  return apiRequest(`/api/blog/posts/${encodeURIComponent(slug)}`);
}

export async function fetchBlogCategories(): Promise<{ categories: BlogCategory[] }> {
  return apiRequest('/api/blog/categories');
}

export async function fetchBlogTags(): Promise<{ tags: BlogTag[] }> {
  return apiRequest('/api/blog/tags');
}

// ============================================
// ADMIN POST ENDPOINTS
// ============================================

export async function fetchBlogPostPreview(token: string, id: string): Promise<{ post: BlogPost; relatedPosts: BlogPost[] }> {
  return apiRequest(`/api/blog/admin/preview/${encodeURIComponent(id)}`, { token });
}

export async function fetchAdminBlogPosts(
  token: string,
  params: { page?: number; limit?: number; status?: string; search?: string; deleted?: boolean; category?: string } = {}
): Promise<BlogPostListResponse> {
  return apiRequest(apiEndpoint('/api/blog/admin/posts', params as Record<string, ParamValue>), { token });
}

export async function fetchAdminBlogPost(token: string, id: string): Promise<{ post: BlogPost }> {
  return apiRequest(`/api/blog/admin/posts/${id}`, { token });
}

export async function createBlogPost(
  token: string,
  data: CreateBlogPostData
): Promise<{ success: boolean; post: BlogPost }> {
  return apiRequest('/api/blog/admin/posts', { method: 'POST', body: data, token });
}

export async function updateBlogPost(
  token: string,
  id: string,
  data: UpdateBlogPostData
): Promise<{ success: boolean; post: BlogPost }> {
  return apiRequest(`/api/blog/admin/posts/${id}`, { method: 'PATCH', body: data, token });
}

export async function deleteBlogPost(token: string, id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/blog/admin/posts/${id}`, { method: 'DELETE', token });
}

export async function reorderBlogPost(
  token: string,
  postId: string,
  categorySlug: string | null,
  status: string | null,
  newPosition: number
): Promise<{ success: boolean; message: string }> {
  return apiRequest('/api/blog/admin/posts/reorder', {
    method: 'PATCH',
    body: { postId, categorySlug, status, newPosition },
    token,
  });
}

// ============================================
// ADMIN MEDIA
// ============================================

export async function fetchAdminBlogMedia(
  token: string,
  folder?: string
): Promise<{ media: BlogMedia[] }> {
  const params = folder ? `?folder=${encodeURIComponent(folder)}` : '';
  return apiRequest(`/api/blog/admin/media${params}`, { token });
}

export async function uploadBlogMedia(
  token: string,
  file: File,
  altText?: string,
  caption?: string,
  folder?: string
): Promise<{ success: boolean; media: BlogMedia }> {
  const formData = new FormData();
  // IMPORTANT: folder must come before image for multer to access it during file processing
  if (folder) formData.append('folder', folder);
  formData.append('image', file);
  if (altText) formData.append('altText', altText);
  if (caption) formData.append('caption', caption);

  const response = await fetch(`${API_URL}/api/blog/admin/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

export async function deleteBlogMedia(token: string, id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/blog/admin/media/${id}`, { method: 'DELETE', token });
}

// ============================================
// TRASH MANAGEMENT
// ============================================

export async function restoreBlogPost(token: string, id: string): Promise<{ success: boolean; slug: string }> {
  return apiRequest(`/api/blog/admin/posts/${id}/restore`, { method: 'POST', token });
}

export async function permanentlyDeleteBlogPost(token: string, id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/blog/admin/posts/${id}/permanent`, { method: 'DELETE', token });
}

export async function emptyBlogTrash(token: string): Promise<{ success: boolean; deleted: number }> {
  return apiRequest('/api/blog/admin/posts/trash/empty', { method: 'DELETE', token });
}

// ============================================
// SEEDING & IMPORT
// ============================================

export async function seedBlogData(token: string): Promise<{ success: boolean; categories: number; tags: number }> {
  return apiRequest('/api/blog/admin/seed', { method: 'POST', token });
}

export async function importBlogArticles(
  token: string,
  articles: ImportArticle | ImportArticle[],
  options?: ImportOptions
): Promise<ImportResult> {
  return apiRequest('/api/blog/admin/import', {
    method: 'POST',
    token,
    body: { articles, options },
  });
}

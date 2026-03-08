/**
 * API Helper utilities for building query strings, URLs, and generic CRUD operations
 */

export type ParamValue = string | number | boolean | null | undefined;

// ============================================
// TYPES
// ============================================

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  retry?: boolean;
  idempotencyKey?: string;
}

/**
 * Build a URL query string from a params object
 * Filters out undefined, null, and empty string values
 */
export function buildQueryParams(params: Record<string, ParamValue>): string {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value));
    }
  });

  return qs.toString();
}

/**
 * Build a full API endpoint URL with optional query parameters
 */
export function apiEndpoint(base: string, params?: Record<string, ParamValue>): string {
  if (!params) return base;

  const query = buildQueryParams(params);
  return query ? `${base}?${query}` : base;
}

/**
 * Build pagination params object
 */
export function paginationParams(page?: number, limit?: number): Record<string, ParamValue> {
  return {
    page: page,
    limit: limit,
  };
}

/**
 * Build search params with optional pagination
 */
export function searchParams(
  search?: string,
  page?: number,
  limit?: number
): Record<string, ParamValue> {
  return {
    search: search,
    ...paginationParams(page, limit),
  };
}

/**
 * Merge multiple param objects, filtering out undefined values
 */
export function mergeParams(
  ...paramObjects: Array<Record<string, ParamValue> | undefined>
): Record<string, ParamValue> {
  return Object.assign({}, ...paramObjects.filter(Boolean));
}

export default {
  buildQueryParams,
  apiEndpoint,
  paginationParams,
  searchParams,
  mergeParams,
};

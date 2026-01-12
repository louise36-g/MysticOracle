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

export type ApiRequestFn = <T>(endpoint: string, options?: ApiOptions) => Promise<T>;

/**
 * Configuration for creating CRUD operations for a resource
 */
export interface CrudConfig<
  TResource,
  TCreateData = Partial<TResource>,
  TUpdateData = Partial<TResource>,
  TListParams extends Record<string, ParamValue> = Record<string, ParamValue>
> {
  /** Base API endpoint path (e.g., '/api/admin/packages') */
  basePath: string;
  /** Singular resource key in responses (e.g., 'package') */
  singularKey: string;
  /** Plural resource key in responses (e.g., 'packages') */
  pluralKey: string;
  /** The apiRequest function to use */
  apiRequest: ApiRequestFn;
  /** Whether list response has pagination (default: false) */
  paginated?: boolean;
  /** Extra keys to include in list response (e.g., 'brevoConfigured') */
  listExtraKeys?: string[];
}

/**
 * Result of createCrudOperations - typed CRUD functions
 */
export interface CrudOperations<
  TResource,
  TCreateData,
  TUpdateData,
  TListParams extends Record<string, ParamValue>,
  TListResponse
> {
  list: (token: string, params?: TListParams) => Promise<TListResponse>;
  get: (token: string, id: string) => Promise<TResource>;
  create: (token: string, data: TCreateData) => Promise<{ success: boolean; resource: TResource }>;
  update: (token: string, id: string, data: TUpdateData) => Promise<{ success: boolean; resource: TResource }>;
  remove: (token: string, id: string) => Promise<{ success: boolean }>;
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

// ============================================
// GENERIC CRUD OPERATIONS FACTORY
// ============================================

/**
 * Create a set of CRUD operations for a resource
 *
 * @example
 * const packagesCrud = createCrudOperations<AdminCreditPackage>({
 *   basePath: '/api/admin/packages',
 *   singularKey: 'package',
 *   pluralKey: 'packages',
 *   apiRequest,
 * });
 *
 * // Use the operations
 * const { packages } = await packagesCrud.list(token);
 * const pkg = await packagesCrud.get(token, id);
 * const { resource } = await packagesCrud.create(token, data);
 */
export function createCrudOperations<
  TResource,
  TCreateData = Partial<TResource>,
  TUpdateData = Partial<TResource>,
  TListParams extends Record<string, ParamValue> = Record<string, ParamValue>,
  TListResponse = Record<string, unknown>
>(
  config: CrudConfig<TResource, TCreateData, TUpdateData, TListParams>
): CrudOperations<TResource, TCreateData, TUpdateData, TListParams, TListResponse> {
  const { basePath, singularKey, pluralKey, apiRequest } = config;

  return {
    /**
     * List resources with optional query parameters
     */
    list: async (token: string, params?: TListParams): Promise<TListResponse> => {
      const endpoint = apiEndpoint(basePath, params as Record<string, ParamValue>);
      return apiRequest<TListResponse>(endpoint, { token });
    },

    /**
     * Get a single resource by ID
     */
    get: async (token: string, id: string): Promise<TResource> => {
      const response = await apiRequest<Record<string, TResource>>(`${basePath}/${id}`, { token });
      // Handle both { resource: T } and direct T responses
      return response[singularKey] ?? (response as unknown as TResource);
    },

    /**
     * Create a new resource
     */
    create: async (token: string, data: TCreateData): Promise<{ success: boolean; resource: TResource }> => {
      const response = await apiRequest<Record<string, unknown>>(basePath, {
        method: 'POST',
        body: data,
        token,
      });
      return {
        success: response.success !== false,
        resource: (response[singularKey] as TResource) ?? (response as unknown as TResource),
      };
    },

    /**
     * Update an existing resource
     */
    update: async (token: string, id: string, data: TUpdateData): Promise<{ success: boolean; resource: TResource }> => {
      const response = await apiRequest<Record<string, unknown>>(`${basePath}/${id}`, {
        method: 'PATCH',
        body: data,
        token,
      });
      return {
        success: response.success !== false,
        resource: (response[singularKey] as TResource) ?? (response as unknown as TResource),
      };
    },

    /**
     * Delete a resource
     */
    remove: async (token: string, id: string): Promise<{ success: boolean }> => {
      return apiRequest<{ success: boolean }>(`${basePath}/${id}`, {
        method: 'DELETE',
        token,
      });
    },
  };
}

/**
 * Helper to create typed list response type
 */
export type ListResponse<TResource, TKey extends string> = {
  [K in TKey]: TResource[];
};

/**
 * Helper to create typed paginated list response
 */
export type PaginatedListResponse<TResource, TKey extends string> = ListResponse<TResource, TKey> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default {
  buildQueryParams,
  apiEndpoint,
  paginationParams,
  searchParams,
  mergeParams,
  createCrudOperations,
};

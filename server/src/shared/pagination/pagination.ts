/**
 * Pagination Utilities
 * Provides standardized pagination parameter parsing and response formatting
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Parse pagination query parameters (supports both page-based and offset-based)
 * @param query - Express request query object
 * @param defaultLimit - Default items per page (default: 20)
 * @param maxLimit - Maximum allowed limit (default: 100)
 */
export function parsePaginationParams(
  query: Record<string, unknown>,
  defaultLimit: number = 20,
  maxLimit: number = 100
): PaginationParams {
  // Parse limit
  const limit = Math.min(Math.max(1, parseInt(query.limit as string) || defaultLimit), maxLimit);

  // Support both offset-based and page-based pagination
  if (query.offset !== undefined) {
    // Offset-based: ?limit=20&offset=40
    const offset = Math.max(0, parseInt(query.offset as string) || 0);
    const page = Math.floor(offset / limit) + 1;

    return {
      page,
      limit,
      skip: offset,
      take: limit,
    };
  } else {
    // Page-based: ?limit=20&page=3
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const skip = (page - 1) * limit;

    return {
      page,
      limit,
      skip,
      take: limit,
    };
  }
}

/**
 * Create standardized pagination metadata
 * @param params - Parsed pagination parameters
 * @param total - Total number of items
 */
export function createPaginationMeta(params: PaginationParams, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / params.limit);
  const hasMore = params.page < totalPages;
  const hasPrevious = params.page > 1;

  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasMore,
    hasPrevious,
  };
}

/**
 * Create a standardized paginated response
 * @param data - Array of items
 * @param params - Parsed pagination parameters
 * @param total - Total number of items
 */
export function createPaginatedResponse<T>(
  data: T[],
  params: PaginationParams,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: createPaginationMeta(params, total),
  };
}

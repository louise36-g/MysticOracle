/**
 * ContentService - Abstract Base Class
 *
 * Defines common CRUD operations for content types (BlogPost, TarotArticle).
 * Provides shared functionality for caching, soft delete, and pagination.
 */

import { cacheService } from '../cache.js';

/**
 * Pagination parameters for list operations
 */
export interface ListParams {
  page: number;
  limit: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  search?: string;
  deleted?: boolean;
}

/**
 * Paginated result structure
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Soft delete info for content items
 */
export interface SoftDeleteInfo {
  deletedAt: Date | null;
  originalSlug: string | null;
}

/**
 * Abstract base class for content services
 * Subclasses must implement the abstract methods for their specific content type
 *
 * @template T - Full content type (e.g., TarotArticle)
 * @template ListItem - List item type (can be same as T or a subset)
 * @template CreateInput - Input type for creating content
 * @template UpdateInput - Input type for updating content
 */
export abstract class ContentService<T, ListItem, CreateInput, UpdateInput> {
  /** Cache key prefix for this content type */
  protected abstract cachePrefix: string;

  /** Cache TTL for list operations (seconds) */
  protected abstract listCacheTTL: number;

  /** Cache TTL for single item operations (seconds) */
  protected abstract itemCacheTTL: number;

  /**
   * Find a single item by ID
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Find a single item by slug
   */
  abstract findBySlug(slug: string): Promise<T | null>;

  /**
   * List items with pagination and filters
   */
  abstract list(params: ListParams): Promise<PaginatedResult<ListItem>>;

  /**
   * Create a new item
   */
  abstract create(data: CreateInput): Promise<T>;

  /**
   * Update an existing item
   */
  abstract update(id: string, data: UpdateInput): Promise<T>;

  /**
   * Soft delete an item (move to trash)
   */
  abstract softDelete(id: string): Promise<void>;

  /**
   * Restore a soft-deleted item
   */
  abstract restore(id: string): Promise<{ slug: string }>;

  /**
   * Permanently delete an item
   */
  abstract permanentDelete(id: string): Promise<void>;

  /**
   * Check if a slug is available
   */
  abstract isSlugAvailable(slug: string, excludeId?: string): Promise<boolean>;

  // ============================================
  // Shared cache helpers
  // ============================================

  /**
   * Get cache key for a single item
   */
  protected getItemCacheKey(slug: string): string {
    return `${this.cachePrefix}:item:${slug}`;
  }

  /**
   * Get cache key for list operations
   */
  protected getListCacheKey(params: ListParams): string {
    const key = `${this.cachePrefix}:list:${JSON.stringify(params)}`;
    return key;
  }

  /**
   * Get cached item by slug
   */
  protected async getCachedItem(slug: string): Promise<T | undefined> {
    return cacheService.get<T>(this.getItemCacheKey(slug));
  }

  /**
   * Cache a single item
   */
  protected async cacheItem(slug: string, item: T): Promise<void> {
    await cacheService.set(this.getItemCacheKey(slug), item, this.itemCacheTTL);
  }

  /**
   * Invalidate cache for a single item
   */
  protected async invalidateItemCache(slug: string): Promise<void> {
    await cacheService.del(this.getItemCacheKey(slug));
  }

  /**
   * Invalidate all list caches for this content type
   */
  protected async invalidateListCache(): Promise<void> {
    await cacheService.flushPattern(`${this.cachePrefix}:list:`);
  }

  /**
   * Invalidate all caches for this content type
   */
  protected async invalidateAllCache(): Promise<void> {
    await cacheService.flushPattern(`${this.cachePrefix}:`);
  }

  /**
   * Invalidate cache after an item is modified
   * @param oldSlug - The slug before modification
   * @param newSlug - The slug after modification (if changed)
   */
  protected async invalidateOnUpdate(oldSlug: string, newSlug?: string): Promise<void> {
    await this.invalidateItemCache(oldSlug);
    if (newSlug && newSlug !== oldSlug) {
      await this.invalidateItemCache(newSlug);
    }
    await this.invalidateListCache();
  }
}

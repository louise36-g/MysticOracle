/**
 * ICacheVersionRepository - Cache version tracking interface
 * Used for client-side cache invalidation via version checking
 */

import type { CacheVersion } from '@prisma/client';

/**
 * Cache Version Repository Interface
 * Defines operations for tracking cache versions by entity
 */
export interface ICacheVersionRepository {
  /**
   * Get the current version for an entity
   */
  getVersion(entity: string): Promise<number>;

  /**
   * Increment the version for an entity (creates if not exists)
   * Returns the new version number
   */
  incrementVersion(entity: string): Promise<number>;

  /**
   * Get all cache versions
   */
  findAll(): Promise<CacheVersion[]>;

  /**
   * Find by entity name
   */
  findByEntity(entity: string): Promise<CacheVersion | null>;
}

export default ICacheVersionRepository;

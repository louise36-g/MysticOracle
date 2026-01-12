/**
 * IdempotencyService - Prevents duplicate operations from retried requests
 *
 * When a client retries a request (due to network timeout, etc.), this service
 * ensures the operation only executes once by tracking idempotency keys.
 *
 * Flow:
 * 1. Client sends request with X-Idempotency-Key header
 * 2. Server checks if key exists:
 *    - If key exists with result: return cached result (no re-execution)
 *    - If key exists as "pending": return 409 Conflict (request in progress)
 *    - If key doesn't exist: mark as pending, execute operation, cache result
 *
 * Keys are stored in cache with 24-hour TTL to handle delayed retries.
 */

import cacheService from './cache.js';

// Idempotency key states
export type IdempotencyState = 'pending' | 'completed' | 'failed';

export interface IdempotencyRecord {
  state: IdempotencyState;
  result?: unknown;
  statusCode?: number;
  createdAt: string;
  completedAt?: string;
  endpoint: string;
  userId: string;
}

// TTL for idempotency keys (24 hours)
const IDEMPOTENCY_TTL = 86400;

class IdempotencyService {
  private readonly keyPrefix = 'idempotency:';

  /**
   * Generate a cache key from the idempotency key
   */
  private getCacheKey(idempotencyKey: string): string {
    return `${this.keyPrefix}${idempotencyKey}`;
  }

  /**
   * Check if an idempotency key exists and get its record
   */
  async getRecord(idempotencyKey: string): Promise<IdempotencyRecord | null> {
    const cacheKey = this.getCacheKey(idempotencyKey);
    const record = await cacheService.get<IdempotencyRecord>(cacheKey);
    return record || null;
  }

  /**
   * Mark an idempotency key as pending (operation started)
   * Returns false if key already exists
   */
  async markPending(
    idempotencyKey: string,
    endpoint: string,
    userId: string
  ): Promise<{ success: boolean; existingRecord?: IdempotencyRecord }> {
    const cacheKey = this.getCacheKey(idempotencyKey);

    // Check if key already exists
    const existing = await cacheService.get<IdempotencyRecord>(cacheKey);
    if (existing) {
      return { success: false, existingRecord: existing };
    }

    // Create pending record
    const record: IdempotencyRecord = {
      state: 'pending',
      createdAt: new Date().toISOString(),
      endpoint,
      userId,
    };

    await cacheService.set(cacheKey, record, IDEMPOTENCY_TTL);
    return { success: true };
  }

  /**
   * Mark an idempotency key as completed with result
   */
  async markCompleted(
    idempotencyKey: string,
    result: unknown,
    statusCode: number
  ): Promise<void> {
    const cacheKey = this.getCacheKey(idempotencyKey);
    const existing = await cacheService.get<IdempotencyRecord>(cacheKey);

    if (!existing) {
      console.warn(`[Idempotency] Attempted to complete unknown key: ${idempotencyKey}`);
      return;
    }

    const record: IdempotencyRecord = {
      ...existing,
      state: 'completed',
      result,
      statusCode,
      completedAt: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, record, IDEMPOTENCY_TTL);
  }

  /**
   * Mark an idempotency key as failed
   * Failed keys can be retried (key is removed)
   */
  async markFailed(idempotencyKey: string): Promise<void> {
    const cacheKey = this.getCacheKey(idempotencyKey);
    await cacheService.del(cacheKey);
  }

  /**
   * Remove an idempotency key (for cleanup or allowing retry)
   */
  async remove(idempotencyKey: string): Promise<void> {
    const cacheKey = this.getCacheKey(idempotencyKey);
    await cacheService.del(cacheKey);
  }

  /**
   * Generate a unique idempotency key
   * Format: {userId}-{timestamp}-{random}
   */
  generateKey(userId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${userId}-${timestamp}-${random}`;
  }
}

// Singleton instance
export const idempotencyService = new IdempotencyService();
export { IdempotencyService };
export default idempotencyService;

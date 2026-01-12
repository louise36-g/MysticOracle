/**
 * IdempotencyService Tests
 * Tests for idempotency key management and state transitions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { IdempotencyService, idempotencyService } from '../../services/IdempotencyService.js';
import cacheService from '../../services/cache.js';

// Mock the cache service
vi.mock('../../services/cache.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

describe('IdempotencyService', () => {
  let service: IdempotencyService;

  beforeEach(() => {
    service = new IdempotencyService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getRecord', () => {
    it('should return null when key does not exist', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(undefined);

      const result = await service.getRecord('non-existent-key');

      expect(result).toBeNull();
      expect(cacheService.get).toHaveBeenCalledWith('idempotency:non-existent-key');
    });

    it('should return record when key exists', async () => {
      const mockRecord = {
        state: 'completed' as const,
        result: { success: true },
        statusCode: 200,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        endpoint: 'POST /api/readings',
        userId: 'user-123',
      };
      vi.mocked(cacheService.get).mockResolvedValue(mockRecord);

      const result = await service.getRecord('existing-key');

      expect(result).toEqual(mockRecord);
    });
  });

  describe('markPending', () => {
    it('should mark new key as pending', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(undefined);
      vi.mocked(cacheService.set).mockResolvedValue(undefined);

      const result = await service.markPending(
        'new-key',
        'POST /api/readings',
        'user-123'
      );

      expect(result.success).toBe(true);
      expect(result.existingRecord).toBeUndefined();
      expect(cacheService.set).toHaveBeenCalledWith(
        'idempotency:new-key',
        expect.objectContaining({
          state: 'pending',
          endpoint: 'POST /api/readings',
          userId: 'user-123',
        }),
        86400 // TTL
      );
    });

    it('should reject if key already pending', async () => {
      const existingRecord = {
        state: 'pending' as const,
        createdAt: new Date().toISOString(),
        endpoint: 'POST /api/readings',
        userId: 'user-123',
      };
      vi.mocked(cacheService.get).mockResolvedValue(existingRecord);

      const result = await service.markPending(
        'pending-key',
        'POST /api/readings',
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.existingRecord).toEqual(existingRecord);
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should reject if key already completed', async () => {
      const existingRecord = {
        state: 'completed' as const,
        result: { success: true },
        statusCode: 200,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        endpoint: 'POST /api/readings',
        userId: 'user-123',
      };
      vi.mocked(cacheService.get).mockResolvedValue(existingRecord);

      const result = await service.markPending(
        'completed-key',
        'POST /api/readings',
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.existingRecord).toEqual(existingRecord);
    });
  });

  describe('markCompleted', () => {
    it('should cache result with status code', async () => {
      const existingRecord = {
        state: 'pending' as const,
        createdAt: new Date().toISOString(),
        endpoint: 'POST /api/readings',
        userId: 'user-123',
      };
      vi.mocked(cacheService.get).mockResolvedValue(existingRecord);
      vi.mocked(cacheService.set).mockResolvedValue(undefined);

      await service.markCompleted('pending-key', { credits: 10 }, 200);

      expect(cacheService.set).toHaveBeenCalledWith(
        'idempotency:pending-key',
        expect.objectContaining({
          state: 'completed',
          result: { credits: 10 },
          statusCode: 200,
          endpoint: 'POST /api/readings',
          userId: 'user-123',
        }),
        86400
      );
    });

    it('should return cached result on duplicate request', async () => {
      const completedRecord = {
        state: 'completed' as const,
        result: { credits: 10, success: true },
        statusCode: 200,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        endpoint: 'POST /api/readings',
        userId: 'user-123',
      };
      vi.mocked(cacheService.get).mockResolvedValue(completedRecord);

      const record = await service.getRecord('completed-key');

      expect(record).toEqual(completedRecord);
      expect(record?.result).toEqual({ credits: 10, success: true });
    });

    it('should handle missing record gracefully', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(undefined);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service.markCompleted('unknown-key', { success: true }, 200);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Idempotency] Attempted to complete unknown key: unknown-key'
      );
      expect(cacheService.set).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('markFailed', () => {
    it('should remove key to allow retry', async () => {
      vi.mocked(cacheService.del).mockResolvedValue(undefined);

      await service.markFailed('failed-key');

      expect(cacheService.del).toHaveBeenCalledWith('idempotency:failed-key');
    });

    it('should allow retry after failure', async () => {
      // First: mark as failed (removes key)
      vi.mocked(cacheService.del).mockResolvedValue(undefined);
      await service.markFailed('retry-key');

      // Then: should be able to mark as pending again
      vi.mocked(cacheService.get).mockResolvedValue(undefined);
      vi.mocked(cacheService.set).mockResolvedValue(undefined);

      const result = await service.markPending(
        'retry-key',
        'POST /api/readings',
        'user-123'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('remove', () => {
    it('should delete key from cache', async () => {
      vi.mocked(cacheService.del).mockResolvedValue(undefined);

      await service.remove('key-to-remove');

      expect(cacheService.del).toHaveBeenCalledWith('idempotency:key-to-remove');
    });
  });

  describe('generateKey', () => {
    it('should generate unique key with user prefix', () => {
      const key1 = service.generateKey('user-123');
      const key2 = service.generateKey('user-123');

      expect(key1).toMatch(/^user-123-/);
      expect(key2).toMatch(/^user-123-/);
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different users', () => {
      const key1 = service.generateKey('user-1');
      const key2 = service.generateKey('user-2');

      expect(key1).toMatch(/^user-1-/);
      expect(key2).toMatch(/^user-2-/);
    });
  });

  describe('TTL Expiration', () => {
    it('should set 24-hour TTL on new records', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(undefined);
      vi.mocked(cacheService.set).mockResolvedValue(undefined);

      await service.markPending('ttl-test-key', 'POST /test', 'user-123');

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        86400 // 24 hours in seconds
      );
    });
  });
});

describe('idempotencyService singleton', () => {
  it('should be the same instance', () => {
    expect(idempotencyService).toBeInstanceOf(IdempotencyService);
  });
});

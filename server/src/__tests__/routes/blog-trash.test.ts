/**
 * Blog Trash Routes Tests
 * Tests for soft delete, restore, permanent delete, and empty trash
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock fs before shared.ts side-effect
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

// Mock Prisma (needed by shared.ts imports even though trash routes use TrashUtils)
vi.mock('../../db/prisma.js', () => ({
  default: {
    blogPost: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Mock cache service
vi.mock('../../services/cache.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    flushPattern: vi.fn(),
  },
  CacheService: {
    TTL: {
      BLOG_POSTS: 300,
    },
  },
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  debug: vi.fn(),
}));

// Mock TrashUtils directly for isolated testing
vi.mock('../../services/content/TrashUtils.js', () => ({
  softDeleteItem: vi.fn(),
  restoreItem: vi.fn(),
  permanentDeleteItem: vi.fn(),
  emptyTrash: vi.fn(),
}));

// Import after mocks
import trashRouter from '../../routes/blog/trash.js';
import {
  softDeleteItem,
  restoreItem,
  permanentDeleteItem,
  emptyTrash,
} from '../../services/content/TrashUtils.js';

const mockedSoftDelete = softDeleteItem as Mock;
const mockedRestore = restoreItem as Mock;
const mockedPermanentDelete = permanentDeleteItem as Mock;
const mockedEmptyTrash = emptyTrash as Mock;

const app = express();
app.use(express.json());
app.use('/', trashRouter);

describe('Blog Trash Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DELETE /posts/:id (soft delete)', () => {
    it('should call softDeleteItem and return its result', async () => {
      mockedSoftDelete.mockResolvedValue({
        status: 200,
        body: { success: true, message: 'Post moved to trash' },
      });

      const res = await request(app).delete('/posts/post-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Post moved to trash');
      expect(mockedSoftDelete).toHaveBeenCalledWith(
        expect.objectContaining({ entityName: 'Post' }),
        'post-1'
      );
    });

    it('should return 404 when post not found', async () => {
      mockedSoftDelete.mockResolvedValue({
        status: 404,
        body: { error: 'Post not found' },
      });

      const res = await request(app).delete('/posts/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Post not found');
    });

    it('should return 500 when softDeleteItem throws', async () => {
      mockedSoftDelete.mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/posts/post-1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to delete post');
    });
  });

  describe('POST /posts/:id/restore', () => {
    it('should call restoreItem and return its result', async () => {
      mockedRestore.mockResolvedValue({
        status: 200,
        body: { success: true, slug: 'restored-post', message: 'Post restored' },
      });

      const res = await request(app).post('/posts/post-1/restore');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.slug).toBe('restored-post');
      expect(mockedRestore).toHaveBeenCalledWith(
        expect.objectContaining({ entityName: 'Post' }),
        'post-1'
      );
    });

    it('should return 400 when post is not in trash', async () => {
      mockedRestore.mockResolvedValue({
        status: 400,
        body: { error: 'Post is not in trash' },
      });

      const res = await request(app).post('/posts/post-1/restore');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Post is not in trash');
    });

    it('should return 500 when restoreItem throws', async () => {
      mockedRestore.mockRejectedValue(new Error('DB error'));

      const res = await request(app).post('/posts/post-1/restore');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to restore post');
    });
  });

  describe('DELETE /posts/:id/permanent', () => {
    it('should call permanentDeleteItem and return its result', async () => {
      mockedPermanentDelete.mockResolvedValue({
        status: 200,
        body: { success: true, message: 'Post permanently deleted' },
      });

      const res = await request(app).delete('/posts/post-1/permanent');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockedPermanentDelete).toHaveBeenCalledWith(
        expect.objectContaining({ entityName: 'Post' }),
        'post-1'
      );
    });

    it('should return 500 when permanentDeleteItem throws', async () => {
      mockedPermanentDelete.mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/posts/post-1/permanent');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to permanently delete post');
    });
  });

  describe('DELETE /trash/empty', () => {
    it('should call emptyTrash and return its result', async () => {
      mockedEmptyTrash.mockResolvedValue({
        status: 200,
        body: { success: true, deleted: 3, message: '3 post(s) permanently deleted' },
      });

      const res = await request(app).delete('/trash/empty');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deleted).toBe(3);
      expect(mockedEmptyTrash).toHaveBeenCalledWith(
        expect.objectContaining({ entityName: 'Post' })
      );
    });

    it('should return 500 when emptyTrash throws', async () => {
      mockedEmptyTrash.mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/trash/empty');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to empty trash');
    });
  });
});

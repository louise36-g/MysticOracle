// server/src/services/cache.ts
import NodeCache from 'node-cache';

interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: string;
  breakdown: Record<string, number>;
}

class CacheService {
  private cache: NodeCache;
  private hits: number = 0;
  private misses: number = 0;
  private lastPurge: Date | null = null;

  // Default TTLs in seconds
  static TTL = {
    MEDIA: 300, // 5 minutes
    ARTICLES: 300, // 5 minutes
    ARTICLE: 600, // 10 minutes
    HOROSCOPE: 3600, // 1 hour
    TAGS: 600, // 10 minutes
    CATEGORIES: 600, // 10 minutes
    TRANSLATIONS: 3600, // 1 hour
    CREDIT_PACKAGES: 3600, // 1 hour
    BLOG_POSTS: 300, // 5 minutes
    BLOG_POST: 300, // 5 minutes
  };

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // Default 5 minutes
      checkperiod: 60, // Check for expired keys every minute
      useClones: false, // Better performance
    });
  }

  async get<T>(key: string): Promise<T | undefined> {
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      this.hits++;
      return value;
    }
    this.misses++;
    return undefined;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    return this.cache.set(key, value, ttlSeconds ?? 300);
  }

  async del(key: string): Promise<number> {
    return this.cache.del(key);
  }

  async flush(): Promise<void> {
    this.cache.flushAll();
    this.lastPurge = new Date();
  }

  async flushPattern(pattern: string): Promise<number> {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(k => k.startsWith(pattern));
    return this.cache.del(matchingKeys);
  }

  getStats(): CacheStats {
    const keys = this.cache.keys();

    // Calculate breakdown by prefix
    const breakdown: Record<string, number> = {};
    keys.forEach(key => {
      const prefix = key.split(':')[0] || 'other';
      breakdown[prefix] = (breakdown[prefix] || 0) + 1;
    });

    // Estimate memory usage
    const memBytes = keys.reduce((acc, key) => {
      const val = this.cache.get(key);
      return acc + (JSON.stringify(val)?.length || 0);
    }, 0);
    const memoryUsage =
      memBytes > 1024 * 1024
        ? `${(memBytes / 1024 / 1024).toFixed(1)} MB`
        : `${(memBytes / 1024).toFixed(1)} KB`;

    const total = this.hits + this.misses;
    const hitRate = total > 0 ? Math.round((this.hits / total) * 100) : 0;

    return {
      keys: keys.length,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      memoryUsage,
      breakdown,
    };
  }

  getLastPurge(): Date | null {
    return this.lastPurge;
  }

  // ============================================
  // Content-specific invalidation helpers
  // ============================================

  /**
   * Invalidate tarot article cache
   * @param slug - Optional specific article slug to invalidate
   */
  async invalidateTarot(slug?: string): Promise<void> {
    await this.del('tarot:overview');
    if (slug) {
      await this.del(`tarot:article:${slug}`);
    }
  }

  /**
   * Invalidate tarot article cache for multiple slugs
   * @param oldSlug - Previous slug (before update)
   * @param newSlug - New slug (after update, if changed)
   */
  async invalidateTarotArticle(oldSlug: string, newSlug?: string): Promise<void> {
    await this.del('tarot:overview');
    await this.del(`tarot:article:${oldSlug}`);
    if (newSlug && newSlug !== oldSlug) {
      await this.del(`tarot:article:${newSlug}`);
    }
  }

  /**
   * Invalidate blog post cache
   * @param slug - Optional specific post slug to invalidate
   */
  async invalidateBlog(slug?: string): Promise<void> {
    await this.flushPattern('blog:');
    if (slug) {
      await this.del(`blog:post:${slug}`);
    }
  }

  /**
   * Invalidate blog post cache for multiple slugs
   * @param oldSlug - Previous slug (before update)
   * @param newSlug - New slug (after update, if changed)
   */
  async invalidateBlogPost(oldSlug: string, newSlug?: string): Promise<void> {
    await this.flushPattern('blog:');
    await this.del(`blog:post:${oldSlug}`);
    if (newSlug && newSlug !== oldSlug) {
      await this.del(`blog:post:${newSlug}`);
    }
  }

  /**
   * Invalidate taxonomy cache (categories and tags)
   */
  async invalidateTaxonomy(): Promise<void> {
    await this.flushPattern('categories:');
    await this.flushPattern('tags:');
  }
}

// Singleton instance
export const cacheService = new CacheService();
export { CacheService };
export default cacheService;

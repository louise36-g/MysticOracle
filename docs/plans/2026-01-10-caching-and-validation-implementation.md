# Caching System & Validation Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add in-memory caching to reduce database load and refactor validation to show SEO/quality issues as warnings instead of errors.

**Architecture:** Two-tier Zod validation (CoreSchema for errors, QualitySchema for warnings) + CacheService abstraction using node-cache with future Redis upgrade path.

**Tech Stack:** node-cache, Zod, Express, React, TypeScript

---

## Task 1: Install node-cache dependency

**Files:**
- Modify: `server/package.json`

**Step 1: Install node-cache**

Run:
```bash
cd server && npm install node-cache
```

**Step 2: Verify installation**

Run:
```bash
cd server && npm list node-cache
```
Expected: Shows node-cache version installed

**Step 3: Commit**

```bash
git add server/package.json server/package-lock.json
git commit -m "chore: install node-cache for in-memory caching"
```

---

## Task 2: Create CacheService abstraction

**Files:**
- Create: `server/src/services/cache.ts`

**Step 1: Create cache service**

```typescript
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
    MEDIA: 300,      // 5 minutes
    ARTICLES: 300,   // 5 minutes
    ARTICLE: 600,    // 10 minutes
    HOROSCOPE: 3600, // 1 hour
    TAGS: 600,       // 10 minutes
    CATEGORIES: 600, // 10 minutes
  };

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // Default 5 minutes
      checkperiod: 60, // Check for expired keys every minute
      useClones: false, // Better performance, be careful with mutations
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
    const stats = this.cache.getStats();

    // Calculate breakdown by prefix
    const breakdown: Record<string, number> = {};
    keys.forEach(key => {
      const prefix = key.split(':')[0] || 'other';
      breakdown[prefix] = (breakdown[prefix] || 0) + 1;
    });

    // Estimate memory usage (rough approximation)
    const memBytes = keys.reduce((acc, key) => {
      const val = this.cache.get(key);
      return acc + (JSON.stringify(val)?.length || 0);
    }, 0);
    const memoryUsage = memBytes > 1024 * 1024
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
}

// Singleton instance
export const cacheService = new CacheService();
export default cacheService;
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd server && npx tsc --noEmit
```
Expected: No errors related to cache.ts

**Step 3: Commit**

```bash
git add server/src/services/cache.ts
git commit -m "feat: add CacheService abstraction with node-cache"
```

---

## Task 3: Refactor validation into Core + Quality schemas

**Files:**
- Modify: `server/src/lib/validation.ts`

**Step 1: Update validation.ts with two-tier validation**

Replace the schemas section with split Core (errors) and Quality (warnings) schemas:

```typescript
// ============================================
// CORE SCHEMA (blocking errors)
// ============================================

// Core fields that MUST be valid to save
export const TarotArticleCoreSchema = z.object({
  // Required content fields
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long'),
  content: z
    .string()
    .min(100, 'Content is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase with hyphens only'
    )
    .optional(), // Will be generated from title if not provided
  author: z.string().min(1, 'Author is required').max(100),

  // Required card metadata
  cardType: CardTypeEnum,
  cardNumber: z.string().min(1, 'Card number is required').max(20),
  element: ElementEnum,

  // Optional fields (no validation needed for core)
  excerpt: z.string().optional(),
  readTime: z.string().optional(),
  datePublished: z.string().optional(),
  dateModified: z.string().optional(),
  featuredImage: z.string().optional(),
  featuredImageAlt: z.string().optional(),
  astrologicalCorrespondence: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  seo: z.object({
    focusKeyword: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }).optional(),
  seoFocusKeyword: z.string().optional(),
  seoMetaTitle: z.string().optional(),
  seoMetaDescription: z.string().optional(),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
  breadcrumbCategory: z.string().optional(),
  breadcrumbCategoryUrl: z.string().optional(),
  relatedCards: z.array(z.string()).optional(),
  isCourtCard: z.boolean().optional(),
  isChallengeCard: z.boolean().optional(),
  status: ArticleStatusEnum.optional(),
});

// ============================================
// QUALITY CHECKS (warnings, non-blocking)
// ============================================

export interface QualityWarning {
  field: string;
  message: string;
  value?: string | number;
}

export function checkArticleQuality(data: any): QualityWarning[] {
  const warnings: QualityWarning[] = [];

  // SEO checks
  const seoTitle = data.seo?.metaTitle || data.seoMetaTitle;
  if (seoTitle && seoTitle.length > 60) {
    warnings.push({
      field: 'seoMetaTitle',
      message: `Meta title is ${seoTitle.length} chars (recommended: 60 max)`,
      value: seoTitle.length,
    });
  }
  if (!seoTitle || seoTitle.length < 20) {
    warnings.push({
      field: 'seoMetaTitle',
      message: 'Meta title is missing or too short (recommended: 20-60 chars)',
    });
  }

  const seoDesc = data.seo?.metaDescription || data.seoMetaDescription;
  if (seoDesc && seoDesc.length > 155) {
    warnings.push({
      field: 'seoMetaDescription',
      message: `Meta description is ${seoDesc.length} chars (recommended: 155 max)`,
      value: seoDesc.length,
    });
  }
  if (!seoDesc || seoDesc.length < 50) {
    warnings.push({
      field: 'seoMetaDescription',
      message: 'Meta description is missing or too short (recommended: 50-155 chars)',
    });
  }

  const focusKeyword = data.seo?.focusKeyword || data.seoFocusKeyword;
  if (!focusKeyword || focusKeyword.length < 3) {
    warnings.push({
      field: 'seoFocusKeyword',
      message: 'Focus keyword is missing or too short',
    });
  }

  // Excerpt check
  if (data.excerpt) {
    if (data.excerpt.length < 50) {
      warnings.push({
        field: 'excerpt',
        message: 'Excerpt is short (recommended: 50-300 chars)',
        value: data.excerpt.length,
      });
    }
    if (data.excerpt.length > 300) {
      warnings.push({
        field: 'excerpt',
        message: `Excerpt is ${data.excerpt.length} chars (recommended: 300 max)`,
        value: data.excerpt.length,
      });
    }
  } else {
    warnings.push({
      field: 'excerpt',
      message: 'Excerpt is missing',
    });
  }

  // Content length check
  if (data.content && data.content.length < 5000) {
    warnings.push({
      field: 'content',
      message: `Content is ${data.content.length} chars (recommended: 5000+ for SEO)`,
      value: data.content.length,
    });
  }

  // FAQ checks
  const faq = data.faq || [];
  if (faq.length < 5) {
    warnings.push({
      field: 'faq',
      message: `Only ${faq.length} FAQ items (recommended: 5-10)`,
      value: faq.length,
    });
  }
  if (faq.length > 10) {
    warnings.push({
      field: 'faq',
      message: `${faq.length} FAQ items (recommended: 10 max)`,
      value: faq.length,
    });
  }

  // Check individual FAQ items
  faq.forEach((item: any, index: number) => {
    if (item.question && item.question.length < 10) {
      warnings.push({
        field: `faq[${index}].question`,
        message: `FAQ question ${index + 1} is too short`,
      });
    }
    if (item.answer && item.answer.length < 20) {
      warnings.push({
        field: `faq[${index}].answer`,
        message: `FAQ answer ${index + 1} is too short`,
      });
    }
  });

  // Featured image alt text
  if (data.featuredImageAlt) {
    if (data.featuredImageAlt.length < 20) {
      warnings.push({
        field: 'featuredImageAlt',
        message: 'Featured image alt text is short (recommended: 20+ chars)',
      });
    }
    if (data.featuredImageAlt.toLowerCase().startsWith('image of')) {
      warnings.push({
        field: 'featuredImageAlt',
        message: 'Alt text should not start with "image of"',
      });
    }
  }

  // Tags check
  const tags = data.tags || [];
  if (tags.length < 3) {
    warnings.push({
      field: 'tags',
      message: `Only ${tags.length} tags (recommended: 3-10)`,
      value: tags.length,
    });
  }
  if (tags.length > 10) {
    warnings.push({
      field: 'tags',
      message: `${tags.length} tags (recommended: 10 max)`,
      value: tags.length,
    });
  }

  // Categories check
  const categories = data.categories || [];
  if (categories.length < 1) {
    warnings.push({
      field: 'categories',
      message: 'No categories assigned',
    });
  }
  if (categories.length > 5) {
    warnings.push({
      field: 'categories',
      message: `${categories.length} categories (recommended: 5 max)`,
      value: categories.length,
    });
  }

  return warnings;
}

// ============================================
// COMBINED VALIDATION FUNCTION
// ============================================

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  data?: z.infer<typeof TarotArticleCoreSchema>;
  stats?: {
    wordCount: number;
    faqCount: number;
    hasAnswerFirstOpening: boolean;
  };
}

export function validateTarotArticle(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Validate core schema (blocking errors)
  const coreResult = TarotArticleCoreSchema.safeParse(input);

  if (!coreResult.success) {
    coreResult.error.errors.forEach(err => {
      errors.push(`${err.path.join('.')}: ${err.message}`);
    });
  }

  // Step 2: Check quality (non-blocking warnings)
  if (typeof input === 'object' && input !== null) {
    const qualityWarnings = checkArticleQuality(input);
    qualityWarnings.forEach(w => {
      warnings.push(w.message);
    });
  }

  // Step 3: Calculate stats
  const data = input as any;
  const contentText = (data?.content || '').replace(/<[^>]*>/g, '');
  const wordCount = contentText.split(/\s+/).filter(Boolean).length;
  const faqCount = (data?.faq || []).length;
  const hasAnswerFirstOpening = contentText.length > 100 &&
    !contentText.substring(0, 200).toLowerCase().includes('in this article');

  return {
    success: errors.length === 0,
    errors,
    warnings,
    data: coreResult.success ? coreResult.data : undefined,
    stats: {
      wordCount,
      faqCount,
      hasAnswerFirstOpening,
    },
  };
}
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd server && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add server/src/lib/validation.ts
git commit -m "refactor: split validation into core errors and quality warnings"
```

---

## Task 4: Update tarot-articles routes to use new validation

**Files:**
- Modify: `server/src/routes/tarot-articles.ts`

**Step 1: Update imports and validation endpoint**

Update the validation endpoint to use the new two-tier validation:

```typescript
// Add import at top
import { validateTarotArticle, TarotArticleCoreSchema, checkArticleQuality } from '../lib/validation.js';

// Update the /validate endpoint
router.post('/admin/validate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = validateTarotArticle(req.body);

    res.json({
      success: result.success,
      errors: result.errors,
      warnings: result.warnings,
      stats: result.stats,
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});
```

**Step 2: Update import endpoint to always accept (with warnings)**

The import endpoint should now always succeed if core validation passes, returning warnings:

```typescript
// Update the /import endpoint
router.post('/admin/import', requireAuth, requireAdmin, async (req, res) => {
  try {
    const validation = validateTarotArticle(req.body);

    // Only block on core errors (not quality warnings)
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Proceed with import, include warnings in response
    // ... existing import logic ...

    res.json({
      success: true,
      article: { id, slug, title, status },
      warnings: validation.warnings,
      stats: validation.stats,
    });
  } catch (error) {
    // ... error handling
  }
});
```

**Step 3: Verify server compiles and starts**

Run:
```bash
cd server && npm run build
```

**Step 4: Commit**

```bash
git add server/src/routes/tarot-articles.ts
git commit -m "feat: update tarot-articles to use two-tier validation"
```

---

## Task 5: Add caching to media endpoints

**Files:**
- Modify: `server/src/routes/blog.ts`

**Step 1: Add cache import and implement caching**

```typescript
// Add import at top of file
import cacheService, { CacheService } from '../services/cache.js';

// Update GET /admin/media endpoint
router.get('/admin/media', requireAuth, requireAdmin, async (req, res) => {
  try {
    const folder = req.query.folder as string | undefined;
    const cacheKey = folder ? `media:list:${folder}` : 'media:list';

    // Check cache first
    const cached = await cacheService.get<any[]>(cacheKey);
    if (cached) {
      return res.json({ media: cached });
    }

    // Query database
    const whereClause = folder ? { folder } : {};
    const media = await prisma.mediaUpload.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Cache result
    await cacheService.set(cacheKey, media, CacheService.TTL.MEDIA);

    res.json({ media });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Update POST /admin/upload to invalidate cache
// After successful upload, add:
await cacheService.flushPattern('media:');

// Update DELETE /admin/media/:id to invalidate cache
// After successful delete, add:
await cacheService.flushPattern('media:');
```

**Step 2: Verify server compiles**

Run:
```bash
cd server && npm run build
```

**Step 3: Commit**

```bash
git add server/src/routes/blog.ts
git commit -m "feat: add caching to media endpoints"
```

---

## Task 6: Add cache admin endpoints

**Files:**
- Modify: `server/src/routes/admin.ts`

**Step 1: Add cache stats and purge endpoints**

```typescript
// Add import
import cacheService from '../services/cache.js';

// GET /api/admin/cache/stats
router.get('/cache/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = cacheService.getStats();
    const lastPurge = cacheService.getLastPurge();

    res.json({
      ...stats,
      lastPurge: lastPurge?.toISOString() || null,
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

// POST /api/admin/cache/purge
router.post('/cache/purge', requireAuth, requireAdmin, async (req, res) => {
  try {
    await cacheService.flush();
    res.json({ success: true, message: 'Cache purged successfully' });
  } catch (error) {
    console.error('Error purging cache:', error);
    res.status(500).json({ error: 'Failed to purge cache' });
  }
});
```

**Step 2: Verify server compiles**

Run:
```bash
cd server && npm run build
```

**Step 3: Commit**

```bash
git add server/src/routes/admin.ts
git commit -m "feat: add cache stats and purge admin endpoints"
```

---

## Task 7: Add Cache-Control headers middleware

**Files:**
- Modify: `server/src/index.ts`

**Step 1: Add Cache-Control headers for static files and API**

```typescript
// After existing static file middleware, update to add cache headers:
app.use('/uploads', (req, res, next) => {
  // Static uploads are immutable (filename includes hash/timestamp)
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
}, express.static(path.join(process.cwd(), 'public', 'uploads')));

// Add middleware for API cache headers (for public endpoints)
app.use('/api', (req, res, next) => {
  // Only cache GET requests to public endpoints
  if (req.method === 'GET' && !req.path.includes('/admin')) {
    res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});
```

**Step 2: Verify server starts**

Run:
```bash
cd server && npm run dev
```

**Step 3: Commit**

```bash
git add server/src/index.ts
git commit -m "feat: add Cache-Control headers for static files and API"
```

---

## Task 8: Create AdminCache component

**Files:**
- Create: `components/admin/AdminCache.tsx`

**Step 1: Create the admin cache management UI**

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { Database, Trash2, RefreshCw, Loader } from 'lucide-react';

interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: string;
  breakdown: Record<string, number>;
  lastPurge: string | null;
}

const AdminCache: React.FC = () => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cache/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurge = async () => {
    if (!confirm(language === 'en' ? 'Purge all cache?' : 'Vider tout le cache?')) return;

    try {
      setPurging(true);
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cache/purge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: language === 'en' ? 'Cache purged successfully' : 'Cache vidé avec succès' });
        fetchStats();
      } else {
        setMessage({ type: 'error', text: language === 'en' ? 'Failed to purge cache' : 'Échec du vidage du cache' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: language === 'en' ? 'Failed to purge cache' : 'Échec du vidage du cache' });
    } finally {
      setPurging(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatLastPurge = (dateStr: string | null) => {
    if (!dateStr) return language === 'en' ? 'Never' : 'Jamais';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return language === 'en' ? 'Just now' : 'À l\'instant';
    if (diffMins < 60) return language === 'en' ? `${diffMins} min ago` : `Il y a ${diffMins} min`;
    if (diffHours < 24) return language === 'en' ? `${diffHours} hours ago` : `Il y a ${diffHours} heures`;
    return language === 'en' ? `${diffDays} days ago` : `Il y a ${diffDays} jours`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading text-amber-400 flex items-center gap-2">
          <Database className="w-5 h-5" />
          {language === 'en' ? 'Cache Management' : 'Gestion du Cache'}
        </h2>
        <button
          onClick={fetchStats}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title={language === 'en' ? 'Refresh' : 'Actualiser'}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-500/20">
          <div className="text-3xl font-bold text-purple-300">{stats?.keys || 0}</div>
          <div className="text-sm text-slate-400">{language === 'en' ? 'Cached Items' : 'Éléments en cache'}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-500/20">
          <div className="text-3xl font-bold text-green-400">{stats?.hitRate || 0}%</div>
          <div className="text-sm text-slate-400">{language === 'en' ? 'Hit Rate' : 'Taux de succès'}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-500/20">
          <div className="text-3xl font-bold text-amber-400">{stats?.memoryUsage || '0 KB'}</div>
          <div className="text-sm text-slate-400">{language === 'en' ? 'Memory Usage' : 'Utilisation mémoire'}</div>
        </div>
      </div>

      {/* Cache Breakdown */}
      {stats?.breakdown && Object.keys(stats.breakdown).length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-500/20">
          <h3 className="text-lg font-medium text-purple-300 mb-4">
            {language === 'en' ? 'Cache Breakdown' : 'Répartition du cache'}
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.breakdown).map(([key, count]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-slate-300">{key}:</span>
                <span className="text-purple-300 font-mono">{count} {language === 'en' ? 'items' : 'éléments'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purge Button */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-500/20">
        <button
          onClick={handlePurge}
          disabled={purging}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {purging ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
          {language === 'en' ? 'Purge All Cache' : 'Vider tout le cache'}
        </button>
        <p className="text-sm text-slate-500 text-center mt-3">
          {language === 'en' ? 'Last purged:' : 'Dernier vidage:'} {formatLastPurge(stats?.lastPurge || null)}
        </p>
      </div>
    </div>
  );
};

export default AdminCache;
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/admin/AdminCache.tsx
git commit -m "feat: add AdminCache component for cache management"
```

---

## Task 9: Add Cache tab to AdminDashboard

**Files:**
- Modify: `components/admin/AdminDashboard.tsx`

**Step 1: Import AdminCache and add to tabs**

```typescript
// Add import
import AdminCache from './AdminCache';

// Add to TABS array (after existing tabs)
{ id: 'cache', labelEn: 'Cache', labelFr: 'Cache', icon: Database },

// Add to tab content switch
case 'cache':
  return <AdminCache />;
```

**Step 2: Verify frontend compiles**

Run:
```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/admin/AdminDashboard.tsx
git commit -m "feat: add Cache tab to admin dashboard"
```

---

## Task 10: Final testing and verification

**Step 1: Build backend**

Run:
```bash
cd server && npm run build
```
Expected: No errors

**Step 2: Build frontend**

Run:
```bash
npm run build
```
Expected: No errors

**Step 3: Manual testing checklist**

- [ ] Import article with SEO warnings shows orange warnings, not red errors
- [ ] Import article with missing title shows red error
- [ ] Media library loads (and caches on second load)
- [ ] Admin Cache tab shows stats
- [ ] Purge All clears cache
- [ ] After purge, next media load repopulates cache

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final verification of caching and validation system"
```

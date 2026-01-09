# AdminTarotArticles Management Interface - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a comprehensive admin interface for managing tarot articles with list view, filters, search, and quick actions, all integrated with the validated Import Article editing flow.

**Architecture:** The component follows the AdminBlog pattern with a single-view list instead of tabs. All create/edit operations flow through the ImportArticle interface to maintain content quality via validation pipeline. The AdminDashboard orchestrates navigation between the list and import views using state management.

**Tech Stack:** React, TypeScript, Clerk auth, Prisma ORM, Express API, Framer Motion, Tailwind CSS, Lucide icons

---

## Task 1: Add Backend GET Single Article Endpoint

**Files:**
- Modify: `server/src/routes/tarot-articles.ts:320` (add before exports)

**Step 1: Add GET endpoint for single article**

Add this endpoint after the `/admin/list` route and before the PATCH route:

```typescript
/**
 * GET /api/tarot-articles/admin/:id
 * Get single article for editing - admin only
 */
router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const article = await prisma.tarotArticle.findUnique({
      where: { id },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Error fetching single tarot article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});
```

**Step 2: Build and verify TypeScript compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add server/src/routes/tarot-articles.ts
git commit -m "feat(api): add GET endpoint for single tarot article by ID"
```

---

## Task 2: Add Search Support to Admin List Endpoint

**Files:**
- Modify: `server/src/routes/tarot-articles.ts:112-120` (update list endpoint where clause)

**Step 1: Update listArticlesSchema to include search**

Find the `listArticlesSchema` definition around line 45 and update it:

```typescript
const listArticlesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  cardType: z.enum(['MAJOR_ARCANA', 'SUIT_OF_WANDS', 'SUIT_OF_CUPS', 'SUIT_OF_SWORDS', 'SUIT_OF_PENTACLES']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
});
```

**Step 2: Add search to admin list endpoint where clause**

Find the `/admin/list` route around line 112 and update the where clause logic:

```typescript
router.get('/admin/list', async (req, res) => {
  try {
    const params = listArticlesSchema.parse(req.query);
    const { page, limit, cardType, status, search } = params;

    const where: any = {};

    if (cardType) {
      where.cardType = cardType;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.tarotArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true, // Add content for word count
          featuredImage: true,
          cardType: true,
          cardNumber: true,
          datePublished: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.tarotArticle.count({ where }),
    ]);

    res.json({
      articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error listing tarot articles (admin):', error);
    res.status(500).json({ error: 'Failed to list articles' });
  }
});
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add server/src/routes/tarot-articles.ts
git commit -m "feat(api): add search support to admin tarot articles list"
```

---

## Task 3: Add API Service Functions

**Files:**
- Modify: `services/apiService.ts:904` (add after existing tarot article functions)

**Step 1: Add fetchAdminTarotArticles function**

Add after the existing tarot article functions:

```typescript
// ============================================
// ADMIN TAROT ARTICLES
// ============================================

export interface AdminTarotArticlesListResponse {
  articles: TarotArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchAdminTarotArticles(
  token: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    cardType?: string;
    status?: string;
  }
): Promise<AdminTarotArticlesListResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.cardType) queryParams.set('cardType', params.cardType);
  if (params.status) queryParams.set('status', params.status);

  return apiRequest(`/api/tarot-articles/admin/list?${queryParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchAdminTarotArticle(
  token: string,
  id: string
): Promise<TarotArticle> {
  return apiRequest(`/api/tarot-articles/admin/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateTarotArticleStatus(
  token: string,
  id: string,
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
): Promise<TarotArticle> {
  return apiRequest(`/api/tarot-articles/admin/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
}
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors in apiService.ts

**Step 3: Commit**

```bash
git add services/apiService.ts
git commit -m "feat(api): add admin tarot articles API service functions"
```

---

## Task 4: Create AdminTarotArticles Component (Part 1 - Structure)

**Files:**
- Create: `components/admin/AdminTarotArticles.tsx`

**Step 1: Create component file with imports and types**

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminTarotArticles,
  updateTarotArticleStatus,
  deleteTarotArticle,
  TarotArticle,
} from '../../services/apiService';
import {
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  Archive,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CardType = 'MAJOR_ARCANA' | 'SUIT_OF_WANDS' | 'SUIT_OF_CUPS' | 'SUIT_OF_SWORDS' | 'SUIT_OF_PENTACLES';
type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface AdminTarotArticlesProps {
  onNavigateToImport: (articleId: string | null) => void;
}

interface ConfirmModal {
  show: boolean;
  title: string;
  message: string;
  isDangerous?: boolean;
  onConfirm: () => void;
}

const AdminTarotArticles: React.FC<AdminTarotArticlesProps> = ({ onNavigateToImport }) => {
  const { language } = useApp();
  const { getToken } = useAuth();

  // State
  const [articles, setArticles] = useState<TarotArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | ''>('');
  const [cardTypeFilter, setCardTypeFilter] = useState<CardType | ''>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Placeholder for rest of component
  return <div>AdminTarotArticles Component</div>;
};

export default AdminTarotArticles;
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/AdminTarotArticles.tsx
git commit -m "feat(admin): create AdminTarotArticles component structure"
```

---

## Task 5: Create AdminTarotArticles Component (Part 2 - Utility Functions)

**Files:**
- Modify: `components/admin/AdminTarotArticles.tsx` (add before return statement)

**Step 1: Add utility functions and badge configurations**

Add after state declarations and before the return statement:

```typescript
  // Utility functions
  const getWordCount = (htmlContent: string): number => {
    const text = htmlContent.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/);
    return words.filter(word => word.length > 0).length;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Badge configurations
  const cardTypeBadges: Record<CardType, { bg: string; text: string; label: string }> = {
    MAJOR_ARCANA: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Major Arcana' },
    SUIT_OF_WANDS: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Wands' },
    SUIT_OF_CUPS: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Cups' },
    SUIT_OF_SWORDS: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Swords' },
    SUIT_OF_PENTACLES: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Pentacles' },
  };

  const getStatusBadge = (status: ArticleStatus) => {
    const badges = {
      DRAFT: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: language === 'en' ? 'Draft' : 'Brouillon', Icon: FileText },
      PUBLISHED: { bg: 'bg-green-500/20', text: 'text-green-400', label: language === 'en' ? 'Published' : 'Publié', Icon: CheckCircle },
      ARCHIVED: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: language === 'en' ? 'Archived' : 'Archivé', Icon: Archive },
    };
    const badge = badges[status];
    const Icon = badge.Icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/AdminTarotArticles.tsx
git commit -m "feat(admin): add utility functions and badge configs"
```

---

## Task 6: Create AdminTarotArticles Component (Part 3 - Data Loading)

**Files:**
- Modify: `components/admin/AdminTarotArticles.tsx` (add after utility functions)

**Step 1: Add loadArticles function**

Add after the badge configurations:

```typescript
  // Load articles
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) return;

      const response = await fetchAdminTarotArticles(token, {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        cardType: cardTypeFilter || undefined,
        status: statusFilter || undefined,
      });

      setArticles(response.articles);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load articles';
      setError(message);
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, searchQuery, cardTypeFilter, statusFilter]);

  // Load on mount and when filters change
  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/AdminTarotArticles.tsx
git commit -m "feat(admin): add data loading with filters and debounced search"
```

---

## Task 7: Create AdminTarotArticles Component (Part 4 - Action Handlers)

**Files:**
- Modify: `components/admin/AdminTarotArticles.tsx` (add after loadArticles)

**Step 1: Add action handler functions**

Add after the loadArticles function:

```typescript
  // Action handlers
  const handleTogglePublish = async (article: TarotArticle) => {
    try {
      setActionLoading(article.id);
      const token = await getToken();
      if (!token) return;

      const newStatus: ArticleStatus = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await updateTarotArticleStatus(token, article.id, newStatus);

      // Update local state
      setArticles(prev => prev.map(a =>
        a.id === article.id ? { ...a, status: newStatus } : a
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      setError(message);
      console.error('Error updating status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (article: TarotArticle) => {
    setConfirmModal({
      show: true,
      title: language === 'en' ? 'Delete Article?' : 'Supprimer l\'article?',
      message: language === 'en'
        ? `Delete "${article.title}"? This action cannot be undone.`
        : `Supprimer "${article.title}"? Cette action est irréversible.`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          setActionLoading(article.id);
          const token = await getToken();
          if (!token) return;

          await deleteTarotArticle(token, article.id);

          // Remove from local state
          setArticles(prev => prev.filter(a => a.id !== article.id));
          setPagination(prev => ({ ...prev, total: prev.total - 1 }));

          setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to delete article';
          setError(message);
          console.error('Error deleting article:', err);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/AdminTarotArticles.tsx
git commit -m "feat(admin): add action handlers for publish and delete"
```

---

## Task 8: Create AdminTarotArticles Component (Part 5 - UI Render)

**Files:**
- Modify: `components/admin/AdminTarotArticles.tsx` (replace return statement)

**Step 1: Replace return statement with full UI**

Replace the placeholder return statement with:

```typescript
  return (
    <div>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center justify-between">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search by title or slug...' : 'Rechercher par titre ou slug...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={cardTypeFilter}
          onChange={(e) => setCardTypeFilter(e.target.value as CardType | '')}
          className="px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
        >
          <option value="">{language === 'en' ? 'All Types' : 'Tous les types'}</option>
          <option value="MAJOR_ARCANA">Major Arcana</option>
          <option value="SUIT_OF_WANDS">Wands</option>
          <option value="SUIT_OF_CUPS">Cups</option>
          <option value="SUIT_OF_SWORDS">Swords</option>
          <option value="SUIT_OF_PENTACLES">Pentacles</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ArticleStatus | '')}
          className="px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
        >
          <option value="">{language === 'en' ? 'All Status' : 'Tous les statuts'}</option>
          <option value="DRAFT">{language === 'en' ? 'Draft' : 'Brouillon'}</option>
          <option value="PUBLISHED">{language === 'en' ? 'Published' : 'Publié'}</option>
          <option value="ARCHIVED">{language === 'en' ? 'Archived' : 'Archivé'}</option>
        </select>

        <button
          onClick={() => onNavigateToImport(null)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          <Upload className="w-4 h-4" />
          {language === 'en' ? 'Go to Import' : 'Aller à Import'}
        </button>
      </div>

      {/* Articles Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20 bg-slate-800/50">
                  <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Article' : 'Article'}</th>
                  <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Status' : 'Statut'}</th>
                  <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Stats' : 'Stats'}</th>
                  <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Actions' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      {language === 'en' ? 'No articles yet. Import your first article!' : 'Aucun article. Importez votre premier article!'}
                    </td>
                  </tr>
                ) : (
                  articles.map((article) => (
                    <tr key={article.id} className="border-b border-purple-500/10 hover:bg-slate-800/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={article.featuredImage || '/placeholder-card.png'}
                            alt={article.featuredImageAlt || article.title}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-card.png';
                            }}
                          />
                          <div>
                            <button
                              onClick={() => onNavigateToImport(article.id)}
                              className="text-slate-200 font-medium hover:text-purple-400 transition-colors text-left"
                            >
                              {article.title}
                            </button>
                            <p className="text-slate-500 text-sm">{article.slug}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-1 ${cardTypeBadges[article.cardType as CardType].bg} ${cardTypeBadges[article.cardType as CardType].text}`}>
                              {cardTypeBadges[article.cardType as CardType].label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(article.status as ArticleStatus)}</td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p className="text-slate-400">{getWordCount(article.content).toLocaleString()} words</p>
                          {article.datePublished && (
                            <p className="text-slate-500 text-xs mt-1">
                              {formatDate(article.datePublished)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {article.status === 'PUBLISHED' && (
                            <a
                              href={`/tarot/articles/${article.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg"
                              title={language === 'en' ? 'Preview' : 'Aperçu'}
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => onNavigateToImport(article.id)}
                            className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/20 rounded-lg"
                            title={language === 'en' ? 'Edit' : 'Modifier'}
                            disabled={actionLoading === article.id}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleTogglePublish(article)}
                            className={`p-2 rounded-lg ${
                              article.status === 'PUBLISHED'
                                ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/20'
                                : 'text-slate-400 hover:text-green-400 hover:bg-green-500/20'
                            }`}
                            title={article.status === 'PUBLISHED'
                              ? (language === 'en' ? 'Unpublish' : 'Dépublier')
                              : (language === 'en' ? 'Publish' : 'Publier')}
                            disabled={actionLoading === article.id}
                          >
                            {actionLoading === article.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : article.status === 'PUBLISHED' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(article)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg"
                            title={language === 'en' ? 'Delete' : 'Supprimer'}
                            disabled={actionLoading === article.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-400 text-sm">
            {language === 'en'
              ? `Showing ${articles.length} of ${pagination.total} articles`
              : `Affichage de ${articles.length} sur ${pagination.total} articles`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-300 px-4">{pagination.page} / {pagination.totalPages}</span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-xl border border-purple-500/20 p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-heading text-amber-400 mb-4">{confirmModal.title}</h3>
              <p className="text-slate-300 mb-6">{confirmModal.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })}
                  className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600"
                >
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`px-4 py-2 rounded-lg ${
                    confirmModal.isDangerous
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : 'bg-purple-600 text-white hover:bg-purple-500'
                  }`}
                >
                  {language === 'en' ? 'Confirm' : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/AdminTarotArticles.tsx
git commit -m "feat(admin): complete AdminTarotArticles UI with table and modals"
```

---

## Task 9: Update AdminDashboard Integration

**Files:**
- Modify: `components/admin/AdminDashboard.tsx:13,16,20,36,89`

**Step 1: Add imports and state**

Update imports to include AdminTarotArticles:

```typescript
import AdminTarotArticles from './AdminTarotArticles';
```

Update the AdminTab type:

```typescript
type AdminTab = 'overview' | 'users' | 'transactions' | 'analytics' | 'packages' | 'emails' | 'blog' | 'import-article' | 'tarot-articles' | 'health' | 'translations' | 'settings';
```

Add state for editing article ID after the activeTab state:

```typescript
const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
```

**Step 2: Add tab configuration**

Add the new tab to the tabs array (after 'blog' tab):

```typescript
{ id: 'tarot-articles', labelEn: 'Tarot Articles', labelFr: 'Articles Tarot', icon: <FileText className="w-4 h-4" /> },
```

**Step 3: Add render logic**

Add after the import-article render and before analytics:

```typescript
{activeTab === 'tarot-articles' && (
  <AdminTarotArticles
    onNavigateToImport={(articleId) => {
      setEditingArticleId(articleId);
      setActiveTab('import-article');
    }}
  />
)}
```

**Step 4: Update ImportArticle props**

Update the import-article render to pass props:

```typescript
{activeTab === 'import-article' && (
  <ImportArticle
    editingArticleId={editingArticleId}
    onCancelEdit={() => {
      setEditingArticleId(null);
      setActiveTab('tarot-articles');
    }}
  />
)}
```

**Step 5: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add components/admin/AdminDashboard.tsx
git commit -m "feat(admin): integrate AdminTarotArticles into dashboard"
```

---

## Task 10: Enhance ImportArticle for Edit Mode (Part 1)

**Files:**
- Modify: `components/admin/ImportArticle.tsx:1,15`

**Step 1: Update imports**

Add to imports:

```typescript
import { fetchAdminTarotArticle, updateTarotArticle } from '../../services/apiService';
```

**Step 2: Update interface and add props**

Update the component signature to accept props:

```typescript
interface ImportArticleProps {
  editingArticleId?: string | null;
  onCancelEdit?: () => void;
}

const ImportArticle: React.FC<ImportArticleProps> = ({ editingArticleId, onCancelEdit }) => {
```

**Step 3: Add edit mode state**

Add after existing state declarations:

```typescript
const [isEditMode, setIsEditMode] = useState(false);
const [editingArticleTitle, setEditingArticleTitle] = useState<string>('');
```

**Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors (may have warnings about unused vars)

**Step 5: Commit**

```bash
git add components/admin/ImportArticle.tsx
git commit -m "feat(admin): add edit mode props to ImportArticle"
```

---

## Task 11: Enhance ImportArticle for Edit Mode (Part 2)

**Files:**
- Modify: `components/admin/ImportArticle.tsx` (add useEffect after state)

**Step 1: Add effect to load article data**

Add this useEffect after state declarations:

```typescript
// Load article data when editing
useEffect(() => {
  if (editingArticleId) {
    loadArticleForEditing(editingArticleId);
  } else {
    setIsEditMode(false);
    setEditingArticleTitle('');
    setJsonInput('');
    setValidationResult(null);
    setResult(null);
  }
}, [editingArticleId]);

const loadArticleForEditing = async (articleId: string) => {
  try {
    const token = await getToken();
    if (!token) return;

    const article = await fetchAdminTarotArticle(token, articleId);

    // Convert article to editable JSON format
    const editableData = {
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      author: article.author,
      categories: article.categories,
      tags: article.tags,
      readTime: article.readTime,
      datePublished: article.datePublished,
      dateModified: article.dateModified,
      featuredImage: article.featuredImage,
      featuredImageAlt: article.featuredImageAlt,
      cardType: convertEnumToDisplay(article.cardType),
      cardNumber: article.cardNumber,
      astrologicalCorrespondence: article.astrologicalCorrespondence,
      element: article.element,
      seoFocusKeyword: article.seoFocusKeyword,
      seoMetaTitle: article.seoMetaTitle,
      seoMetaDescription: article.seoMetaDescription,
      faq: article.faq,
      breadcrumbCategory: article.breadcrumbCategory,
      breadcrumbCategoryUrl: article.breadcrumbCategoryUrl,
      relatedCards: article.relatedCards,
      isCourtCard: article.isCourtCard,
      isChallengeCard: article.isChallengeCard,
    };

    setJsonInput(JSON.stringify(editableData, null, 2));
    setIsEditMode(true);
    setEditingArticleTitle(article.title);
  } catch (err) {
    console.error('Error loading article:', err);
    alert(language === 'en'
      ? 'Failed to load article for editing'
      : 'Échec du chargement de l\'article');
  }
};

// Convert database enum to display name
const convertEnumToDisplay = (enumValue: string): string => {
  const mapping: Record<string, string> = {
    'MAJOR_ARCANA': 'Major Arcana',
    'SUIT_OF_WANDS': 'Suit of Wands',
    'SUIT_OF_CUPS': 'Suit of Cups',
    'SUIT_OF_SWORDS': 'Suit of Swords',
    'SUIT_OF_PENTACLES': 'Suit of Pentacles',
  };
  return mapping[enumValue] || enumValue;
};
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/ImportArticle.tsx
git commit -m "feat(admin): add article loading for edit mode"
```

---

## Task 12: Enhance ImportArticle for Edit Mode (Part 3)

**Files:**
- Modify: `components/admin/ImportArticle.tsx` (update handleImport function)

**Step 1: Update handleImport to support update**

Find the handleImport function and update it to handle both import and update:

```typescript
async function handleImport() {
  if (!jsonInput.trim()) {
    alert(language === 'en' ? 'Please enter article JSON' : 'Veuillez entrer le JSON de l\'article');
    return;
  }

  try {
    setImporting(true);
    setResult(null);

    const parsed = JSON.parse(jsonInput);
    const token = await getToken();
    if (!token) return;

    let response;
    if (isEditMode && editingArticleId) {
      // Update existing article
      response = await fetch(`${import.meta.env.VITE_API_URL}/api/tarot-articles/admin/${editingArticleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });
    } else {
      // Import new article
      response = await fetch(`${import.meta.env.VITE_API_URL}/api/tarot-articles/admin/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });
    }

    const data = await response.json();

    if (response.ok) {
      setResult({
        success: true,
        message: isEditMode
          ? (language === 'en' ? 'Article updated successfully!' : 'Article mis à jour avec succès!')
          : (language === 'en' ? 'Article imported successfully!' : 'Article importé avec succès!'),
        article: data.article,
        warnings: data.warnings || [],
      });

      // If editing, call onCancelEdit after success
      if (isEditMode && onCancelEdit) {
        setTimeout(() => {
          onCancelEdit();
        }, 2000);
      }
    } else {
      setResult({
        success: false,
        message: data.error || (language === 'en' ? 'Import failed' : 'Échec de l\'importation'),
        errors: data.errors || [data.error],
        warnings: [],
      });
    }
  } catch (err) {
    setResult({
      success: false,
      message: language === 'en' ? 'Import failed' : 'Échec de l\'importation',
      errors: [err instanceof Error ? err.message : 'Unknown error'],
      warnings: [],
    });
  } finally {
    setImporting(false);
  }
}
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/ImportArticle.tsx
git commit -m "feat(admin): support article updates in ImportArticle"
```

---

## Task 13: Enhance ImportArticle for Edit Mode (Part 4 - UI)

**Files:**
- Modify: `components/admin/ImportArticle.tsx` (update return JSX)

**Step 1: Add edit mode banner**

Add after the opening div and before the main content grid:

```typescript
{/* Edit Mode Banner */}
{isEditMode && (
  <div className="mb-4 p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg">
    <p className="text-purple-300">
      {language === 'en' ? 'Editing: ' : 'Modification: '}
      <span className="font-medium text-purple-200">{editingArticleTitle}</span>
    </p>
  </div>
)}
```

**Step 2: Update button text**

Find the import button and update it to show different text in edit mode:

```typescript
<button
  onClick={handleImport}
  disabled={importing || !jsonInput.trim()}
  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
>
  {importing ? (
    <>
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      {isEditMode
        ? (language === 'en' ? 'Updating...' : 'Mise à jour...')
        : (language === 'en' ? 'Importing...' : 'Importation...')}
    </>
  ) : (
    <>
      <Upload className="w-4 h-4" />
      {isEditMode
        ? (language === 'en' ? 'Update Article' : 'Mettre à jour l\'article')
        : (language === 'en' ? 'Import to Database' : 'Importer dans la base')}
    </>
  )}
</button>
```

**Step 3: Add cancel button**

Add after the import/update button:

```typescript
{isEditMode && onCancelEdit && (
  <button
    onClick={onCancelEdit}
    className="w-full py-3 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 font-medium"
  >
    {language === 'en' ? 'Cancel' : 'Annuler'}
  </button>
)}
```

**Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add components/admin/ImportArticle.tsx
git commit -m "feat(admin): add edit mode UI to ImportArticle"
```

---

## Task 14: Add updateTarotArticle API Function

**Files:**
- Modify: `services/apiService.ts` (add after updateTarotArticleStatus)

**Step 1: Add updateTarotArticle function**

```typescript
export async function updateTarotArticle(
  token: string,
  id: string,
  data: Partial<TarotArticle>
): Promise<TarotArticle> {
  return apiRequest(`/api/tarot-articles/admin/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add services/apiService.ts
git commit -m "feat(api): add updateTarotArticle function"
```

---

## Task 15: Fix Backend PATCH Endpoint for Full Updates

**Files:**
- Modify: `server/src/routes/tarot-articles.ts` (update PATCH endpoint around line 290)

**Step 1: Update PATCH endpoint to handle full article updates**

Replace the existing PATCH endpoint with this enhanced version:

```typescript
/**
 * PATCH /api/tarot-articles/admin/:id
 * Update a tarot article - admin only
 */
router.patch('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if article exists
    const existingArticle = await prisma.tarotArticle.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // If this is a full article update (from edit mode), process it
    if (updates.title && updates.content && updates.slug) {
      // Import validation and schema functions
      const { validateArticleExtended, convertToPrismaFormat } = await import('../lib/validation.js');
      const { processArticleSchema } = await import('../lib/schema-builder.js');

      // Validate the updated article data
      const validationResult = validateArticleExtended(updates);

      if (!validationResult.success || !validationResult.data) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: validationResult.errors,
        });
      }

      // Convert to Prisma format
      const prismaData = convertToPrismaFormat(validationResult.data);

      // Regenerate schema
      const { schema, schemaHtml } = processArticleSchema(validationResult.data);

      // Update with validated data
      const updatedArticle = await prisma.tarotArticle.update({
        where: { id },
        data: {
          ...prismaData,
          schemaJson: schema as any,
          schemaHtml,
          updatedAt: new Date(),
        },
      });

      return res.json(updatedArticle);
    }

    // Otherwise, simple field update (status, etc.)
    if (updates.status === 'PUBLISHED' && existingArticle.status !== 'PUBLISHED') {
      updates.publishedAt = new Date();
    }

    const updatedArticle = await prisma.tarotArticle.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    res.json(updatedArticle);
  } catch (error) {
    console.error('Error updating tarot article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add server/src/routes/tarot-articles.ts
git commit -m "feat(api): enhance PATCH endpoint for full article updates"
```

---

## Task 16: Final Testing and Documentation

**Files:**
- Update: `TAROT_API_SETUP.md`

**Step 1: Test the complete workflow**

Manual testing checklist:
1. Start backend: `npm run dev`
2. Open admin dashboard → Tarot Articles tab
3. Verify empty state shows
4. Click "Go to Import"
5. Paste sample article JSON
6. Click "Import to Database"
7. Verify success and article appears in list
8. Test search filter
9. Test card type filter
10. Test status filter
11. Test pagination (if >20 articles)
12. Click "Preview" on published article
13. Click "Edit" on article
14. Verify article loads in Import interface
15. Modify title in JSON
16. Click "Update Article"
17. Verify changes saved
18. Click "Cancel" in edit mode
19. Verify returns to list
20. Click "Publish" on draft article
21. Verify status changes
22. Click "Delete" on article
23. Confirm deletion
24. Verify article removed

**Step 2: Update documentation**

Add to `TAROT_API_SETUP.md` under "Testing Workflow":

```markdown
## Complete Workflow Test

### Import New Article
1. Navigate to Admin Dashboard → Tarot Articles
2. Click "Go to Import"
3. Paste article JSON
4. Click "Validate" to check quality
5. Click "Import to Database"
6. Article appears in list as DRAFT

### Edit Existing Article
1. Navigate to Admin Dashboard → Tarot Articles
2. Find article in list
3. Click "Edit" button (pencil icon)
4. Modify JSON in Import interface
5. Click "Validate" to check changes
6. Click "Update Article"
7. Returns to list with updated data

### Quick Actions
- **Preview**: Opens published article in new tab
- **Publish/Unpublish**: Toggle between DRAFT and PUBLISHED
- **Delete**: Remove article (with confirmation)

### Filters
- **Search**: Type title or slug (debounced 500ms)
- **Card Type**: Filter by Major Arcana, Wands, Cups, Swords, Pentacles
- **Status**: Filter by Draft, Published, Archived
```

**Step 3: Commit documentation**

```bash
git add TAROT_API_SETUP.md
git commit -m "docs: add complete workflow testing guide"
```

---

## Task 17: Final Cleanup and Build Verification

**Files:**
- All modified files

**Step 1: Run full TypeScript check**

Frontend:
```bash
npx tsc --noEmit
```
Expected: No errors (existing errors in other files are okay)

Backend:
```bash
npm run build
```
Expected: Successful compilation

**Step 2: Check git status**

```bash
git status
```
Expected: Working tree clean (all changes committed)

**Step 3: Create final summary commit**

```bash
git log --oneline -20
```

Verify all commits are present with clear messages.

**Step 4: Push to remote (optional)**

If working with remote repository:
```bash
git push origin main
```

---

## Implementation Complete! 🎉

**What We Built:**
- ✅ AdminTarotArticles component with full list, filters, and quick actions
- ✅ Backend endpoints for fetching single article and search
- ✅ API service functions for admin operations
- ✅ AdminDashboard integration with navigation flow
- ✅ ImportArticle editing mode with validation
- ✅ Complete CRUD workflow for tarot articles

**Key Features:**
- Search by title/slug with debouncing
- Filter by card type and status
- Quick publish/unpublish toggle
- Delete with confirmation
- Edit through validated import flow
- Pagination support
- Bilingual (EN/FR)
- Loading and error states
- Responsive design

**Next Steps:**
- Import your tarot card articles
- Publish them through the interface
- Test SEO with Google Rich Results
- Consider adding bulk operations (future enhancement)

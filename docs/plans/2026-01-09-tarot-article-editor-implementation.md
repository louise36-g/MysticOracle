# TarotArticleEditor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a visual editor for tarot articles matching the BlogPostEditor pattern with categories, tags, media, and FAQ management.

**Architecture:** Port AdminBlog's sub-tab structure to AdminTarotArticles. Create TarotArticleEditor modeled on BlogPostEditor. Add Prisma models for TarotCategory, TarotTag, TarotMedia. Keep JSON import as modal.

**Tech Stack:** React, TypeScript, Prisma, Express, Zod, Framer Motion, Lucide React

---

## Task 1: Add Prisma Models for Categories, Tags, Media

**Files:**
- Modify: `server/prisma/schema.prisma`

**Step 1: Add TarotCategory, TarotTag, TarotMedia models to schema**

Add after TarotCard model (around line 658):

```prisma
// ============================================
// TAROT ARTICLE TAXONOMY (for editor management)
// ============================================

model TarotCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("tarot_categories")
}

model TarotTag {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("tarot_tags")
}

model TarotMedia {
  id          String    @id @default(cuid())
  filename    String
  originalName String
  url         String
  mimeType    String
  size        Int
  altText     String?
  caption     String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([deletedAt])
  @@map("tarot_media")
}
```

**Step 2: Generate Prisma client and push to database**

```bash
cd server && npx prisma db push
```

**Step 3: Commit**

```bash
git add server/prisma/schema.prisma
git commit -m "feat(tarot): add TarotCategory, TarotTag, TarotMedia models"
```

---

## Task 2: Create Backend Routes for Categories

**Files:**
- Modify: `server/src/routes/tarot-articles.ts`

**Step 1: Add category CRUD endpoints after existing admin routes**

Add before `export default router;`:

```typescript
// ============================================
// CATEGORY MANAGEMENT
// ============================================

/**
 * GET /api/tarot-articles/admin/categories
 * List all tarot categories
 */
router.get('/admin/categories', async (req, res) => {
  try {
    const categories = await prisma.tarotCategory.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching tarot categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * POST /api/tarot-articles/admin/categories
 * Create a new tarot category
 */
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
});

router.post('/admin/categories', async (req, res) => {
  try {
    const data = createCategorySchema.parse(req.body);
    const category = await prisma.tarotCategory.create({ data });
    res.status(201).json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating tarot category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

/**
 * PATCH /api/tarot-articles/admin/categories/:id
 * Update a tarot category
 */
router.patch('/admin/categories/:id', async (req, res) => {
  try {
    const data = createCategorySchema.partial().parse(req.body);
    const category = await prisma.tarotCategory.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating tarot category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

/**
 * DELETE /api/tarot-articles/admin/categories/:id
 * Delete a tarot category
 */
router.delete('/admin/categories/:id', async (req, res) => {
  try {
    await prisma.tarotCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tarot category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});
```

**Step 2: Commit**

```bash
git add server/src/routes/tarot-articles.ts
git commit -m "feat(tarot): add category CRUD endpoints"
```

---

## Task 3: Create Backend Routes for Tags

**Files:**
- Modify: `server/src/routes/tarot-articles.ts`

**Step 1: Add tag CRUD endpoints after category endpoints**

```typescript
// ============================================
// TAG MANAGEMENT
// ============================================

/**
 * GET /api/tarot-articles/admin/tags
 * List all tarot tags
 */
router.get('/admin/tags', async (req, res) => {
  try {
    const tags = await prisma.tarotTag.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tarot tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

/**
 * POST /api/tarot-articles/admin/tags
 * Create a new tarot tag
 */
const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

router.post('/admin/tags', async (req, res) => {
  try {
    const data = createTagSchema.parse(req.body);
    const tag = await prisma.tarotTag.create({ data });
    res.status(201).json({ tag });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating tarot tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

/**
 * PATCH /api/tarot-articles/admin/tags/:id
 * Update a tarot tag
 */
router.patch('/admin/tags/:id', async (req, res) => {
  try {
    const data = createTagSchema.partial().parse(req.body);
    const tag = await prisma.tarotTag.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ tag });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating tarot tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

/**
 * DELETE /api/tarot-articles/admin/tags/:id
 * Delete a tarot tag
 */
router.delete('/admin/tags/:id', async (req, res) => {
  try {
    await prisma.tarotTag.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tarot tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});
```

**Step 2: Commit**

```bash
git add server/src/routes/tarot-articles.ts
git commit -m "feat(tarot): add tag CRUD endpoints"
```

---

## Task 4: Create Backend Routes for Media

**Files:**
- Modify: `server/src/routes/tarot-articles.ts`

**Step 1: Add media CRUD endpoints with file upload handling**

First, add multer import at top of file:
```typescript
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for tarot media uploads
const tarotMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'tarot');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const tarotMediaUpload = multer({
  storage: tarotMediaStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

Then add endpoints:
```typescript
// ============================================
// MEDIA MANAGEMENT
// ============================================

const listMediaSchema = z.object({
  deleted: z.coerce.boolean().optional(),
});

/**
 * GET /api/tarot-articles/admin/media
 * List all tarot media (with trash filter)
 */
router.get('/admin/media', async (req, res) => {
  try {
    const params = listMediaSchema.parse(req.query);
    const where = params.deleted
      ? { deletedAt: { not: null } }
      : { deletedAt: null };

    const media = await prisma.tarotMedia.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ media });
  } catch (error) {
    console.error('Error fetching tarot media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

/**
 * POST /api/tarot-articles/admin/media/upload
 * Upload a new media file
 */
router.post('/admin/media/upload', tarotMediaUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    const url = `${baseUrl}/uploads/tarot/${req.file.filename}`;

    const media = await prisma.tarotMedia.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });

    res.status(201).json({ media });
  } catch (error) {
    console.error('Error uploading tarot media:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

/**
 * PATCH /api/tarot-articles/admin/media/:id
 * Update media metadata
 */
const updateMediaSchema = z.object({
  altText: z.string().max(500).optional(),
  caption: z.string().max(500).optional(),
});

router.patch('/admin/media/:id', async (req, res) => {
  try {
    const data = updateMediaSchema.parse(req.body);
    const media = await prisma.tarotMedia.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ media });
  } catch (error) {
    console.error('Error updating tarot media:', error);
    res.status(500).json({ error: 'Failed to update media' });
  }
});

/**
 * DELETE /api/tarot-articles/admin/media/:id
 * Soft delete media (move to trash)
 */
router.delete('/admin/media/:id', async (req, res) => {
  try {
    await prisma.tarotMedia.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tarot media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

/**
 * POST /api/tarot-articles/admin/media/:id/restore
 * Restore media from trash
 */
router.post('/admin/media/:id/restore', async (req, res) => {
  try {
    await prisma.tarotMedia.update({
      where: { id: req.params.id },
      data: { deletedAt: null },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error restoring tarot media:', error);
    res.status(500).json({ error: 'Failed to restore media' });
  }
});

/**
 * DELETE /api/tarot-articles/admin/media/:id/permanent
 * Permanently delete media (from trash only)
 */
router.delete('/admin/media/:id/permanent', async (req, res) => {
  try {
    const media = await prisma.tarotMedia.findUnique({
      where: { id: req.params.id },
    });

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    if (!media.deletedAt) {
      return res.status(400).json({ error: 'Media must be in trash first' });
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'uploads', 'tarot', media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.tarotMedia.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error permanently deleting tarot media:', error);
    res.status(500).json({ error: 'Failed to permanently delete media' });
  }
});
```

**Step 2: Ensure uploads directory is served statically**

Check that `server/src/index.ts` has static serving for uploads (should already exist for blog).

**Step 3: Commit**

```bash
git add server/src/routes/tarot-articles.ts
git commit -m "feat(tarot): add media CRUD endpoints with upload handling"
```

---

## Task 5: Add API Service Functions for Categories, Tags, Media

**Files:**
- Modify: `services/apiService.ts`

**Step 1: Add TypeScript interfaces**

Add after existing TarotArticle interfaces (around line 850):

```typescript
// Tarot Categories
export interface TarotCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Tarot Tags
export interface TarotTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// Tarot Media
export interface TarotMedia {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  altText?: string;
  caption?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
```

**Step 2: Add API functions for categories**

```typescript
// ============================================
// TAROT CATEGORIES
// ============================================

export async function fetchTarotCategories(token: string): Promise<{ categories: TarotCategory[] }> {
  return fetchWithRetry(`${API_URL}/tarot-articles/admin/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createTarotCategory(
  token: string,
  data: { name: string; slug: string; description?: string }
): Promise<{ category: TarotCategory }> {
  return fetchWithRetry(`${API_URL}/tarot-articles/admin/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function updateTarotCategory(
  token: string,
  id: string,
  data: Partial<{ name: string; slug: string; description?: string }>
): Promise<{ category: TarotCategory }> {
  return fetchWithRetry(`${API_URL}/tarot-articles/admin/categories/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function deleteTarotCategory(token: string, id: string): Promise<{ success: boolean }> {
  return fetchWithRetry(`${API_URL}/tarot-articles/admin/categories/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

**Step 3: Add API functions for tags**

```typescript
// ============================================
// TAROT TAGS
// ============================================

export async function fetchTarotTags(token: string): Promise<{ tags: TarotTag[] }> {
  return fetchWithRetry(`${API_URL}/tarot-articles/admin/tags`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createTarotTag(
  token: string,
  data: { name: string; slug: string }
): Promise<{ tag: TarotTag }> {
  return fetchWithRetry(`${API_URL}/tarot-articles/admin/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function updateTarotTag(
  token: string,
  id: string,
  data: Partial<{ name: string; slug: string }>
): Promise<{ tag: TarotTag }> {
  return fetchWithRetry(`${API_URL}/tarot-articles/admin/tags/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function deleteTarotTag(token: string, id: string): Promise<{ success: boolean }> {
  return fetchWithRetry(`${API_URL}/tarot-articles/admin/tags/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

**Step 4: Add API functions for media**

```typescript
// ============================================
// TAROT MEDIA
// ============================================

export async function fetchTarotMedia(
  token: string,
  params: { deleted?: boolean } = {}
): Promise<{ media: TarotMedia[] }> {
  const searchParams = new URLSearchParams();
  if (params.deleted !== undefined) searchParams.append('deleted', String(params.deleted));
  const query = searchParams.toString();
  return fetchWithRetry(`${API_URL}/tarot-articles/admin/media${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function uploadTarotMedia(token: string, file: File): Promise<{ media: TarotMedia }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/tarot-articles/admin/media/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to upload media');
  }

  return response.json();
}

export async function updateTarotMedia(
  token: string,
  id: string,
  data: { altText?: string; caption?: string }
): Promise<{ media: TarotMedia }> {
  return fetchWithRetry(`${API_URL}/tarot-articles/admin/media/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function deleteTarotMedia(token: string, id: string): Promise<{ success: boolean }> {
  return fetchWithRetry(`${API_URL}/tarot-articles/admin/media/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function restoreTarotMedia(token: string, id: string): Promise<{ success: boolean }> {
  return fetchWithRetry(`${API_URL}/tarot-articles/admin/media/${id}/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function permanentlyDeleteTarotMedia(token: string, id: string): Promise<{ success: boolean }> {
  return fetchWithRetry(`${API_URL}/tarot-articles/admin/media/${id}/permanent`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

**Step 5: Commit**

```bash
git add services/apiService.ts
git commit -m "feat(tarot): add API service functions for categories, tags, media"
```

---

## Task 6: Create TarotCategoriesManager Component

**Files:**
- Create: `components/admin/TarotCategoriesManager.tsx`

**Step 1: Create the component**

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchTarotCategories,
  createTarotCategory,
  updateTarotCategory,
  deleteTarotCategory,
  TarotCategory,
} from '../../services/apiService';
import { Plus, Edit2, Trash2, Folder, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TarotCategoriesManagerProps {
  onCategoriesChange?: () => void;
}

const TarotCategoriesManager: React.FC<TarotCategoriesManagerProps> = ({ onCategoriesChange }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<TarotCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TarotCategory | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const result = await fetchTarotCategories(token);
      setCategories(result.categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNew = () => {
    setEditingCategory({ id: '', name: '', slug: '', description: '', createdAt: '', updatedAt: '' });
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!editingCategory || !editingCategory.name || !editingCategory.slug) return;

    try {
      setSaving(true);
      const token = await getToken();
      if (!token) return;

      const data = {
        name: editingCategory.name,
        slug: editingCategory.slug,
        description: editingCategory.description || undefined,
      };

      if (isNew) {
        await createTarotCategory(token, data);
      } else {
        await updateTarotCategory(token, editingCategory.id, data);
      }

      setEditingCategory(null);
      setIsNew(false);
      loadCategories();
      onCategoriesChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this category?' : 'Supprimer cette catégorie?')) return;

    try {
      const token = await getToken();
      if (!token) return;
      await deleteTarotCategory(token, id);
      loadCategories();
      onCategoriesChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          <Plus className="w-4 h-4" />
          {language === 'en' ? 'New Category' : 'Nouvelle catégorie'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Folder className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-slate-200 font-medium">{cat.name}</h4>
                <p className="text-slate-500 text-sm">{cat.slug}</p>
              </div>
            </div>
            {cat.description && (
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">{cat.description}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingCategory(cat); setIsNew(false); }}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm"
              >
                {language === 'en' ? 'Edit' : 'Modifier'}
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            {language === 'en' ? 'No categories yet' : 'Aucune catégorie'}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingCategory && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading text-purple-200">
                  {isNew ? (language === 'en' ? 'New Category' : 'Nouvelle catégorie') : (language === 'en' ? 'Edit Category' : 'Modifier catégorie')}
                </h3>
                <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">{language === 'en' ? 'Name' : 'Nom'}</label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setEditingCategory({
                        ...editingCategory,
                        name,
                        slug: editingCategory.slug || generateSlug(name),
                      });
                    }}
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Slug</label>
                  <input
                    type="text"
                    value={editingCategory.slug}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Description</label>
                  <textarea
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                  >
                    {language === 'en' ? 'Cancel' : 'Annuler'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editingCategory.name || !editingCategory.slug}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                  >
                    {saving ? '...' : (language === 'en' ? 'Save' : 'Enregistrer')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TarotCategoriesManager;
```

**Step 2: Commit**

```bash
git add components/admin/TarotCategoriesManager.tsx
git commit -m "feat(tarot): add TarotCategoriesManager component"
```

---

## Task 7: Create TarotTagsManager Component

**Files:**
- Create: `components/admin/TarotTagsManager.tsx`

**Step 1: Create the component (similar pattern to categories but simpler UI)**

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchTarotTags,
  createTarotTag,
  updateTarotTag,
  deleteTarotTag,
  TarotTag,
} from '../../services/apiService';
import { Plus, Edit2, Trash2, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TarotTagsManagerProps {
  onTagsChange?: () => void;
}

const TarotTagsManager: React.FC<TarotTagsManagerProps> = ({ onTagsChange }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [tags, setTags] = useState<TarotTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTag, setEditingTag] = useState<TarotTag | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const result = await fetchTarotTags(token);
      setTags(result.tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNew = () => {
    setEditingTag({ id: '', name: '', slug: '', createdAt: '', updatedAt: '' });
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!editingTag || !editingTag.name || !editingTag.slug) return;

    try {
      setSaving(true);
      const token = await getToken();
      if (!token) return;

      const data = { name: editingTag.name, slug: editingTag.slug };

      if (isNew) {
        await createTarotTag(token, data);
      } else {
        await updateTarotTag(token, editingTag.id, data);
      }

      setEditingTag(null);
      setIsNew(false);
      loadTags();
      onTagsChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save tag');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this tag?' : 'Supprimer ce tag?')) return;

    try {
      const token = await getToken();
      if (!token) return;
      await deleteTarotTag(token, id);
      loadTags();
      onTagsChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete tag');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          <Plus className="w-4 h-4" />
          {language === 'en' ? 'New Tag' : 'Nouveau tag'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="group flex items-center gap-2 bg-slate-900/60 border border-purple-500/20 rounded-full px-4 py-2"
          >
            <Tag className="w-4 h-4 text-purple-400" />
            <span className="text-slate-200">{tag.name}</span>
            <div className="hidden group-hover:flex gap-1 ml-2">
              <button
                onClick={() => { setEditingTag(tag); setIsNew(false); }}
                className="p-1 text-slate-400 hover:text-purple-400"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDelete(tag.id)}
                className="p-1 text-slate-400 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {tags.length === 0 && (
          <div className="w-full text-center py-12 text-slate-400">
            {language === 'en' ? 'No tags yet' : 'Aucun tag'}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTag && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading text-purple-200">
                  {isNew ? (language === 'en' ? 'New Tag' : 'Nouveau tag') : (language === 'en' ? 'Edit Tag' : 'Modifier tag')}
                </h3>
                <button onClick={() => setEditingTag(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">{language === 'en' ? 'Name' : 'Nom'}</label>
                  <input
                    type="text"
                    value={editingTag.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setEditingTag({
                        ...editingTag,
                        name,
                        slug: editingTag.slug || generateSlug(name),
                      });
                    }}
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Slug</label>
                  <input
                    type="text"
                    value={editingTag.slug}
                    onChange={(e) => setEditingTag({ ...editingTag, slug: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditingTag(null)}
                    className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                  >
                    {language === 'en' ? 'Cancel' : 'Annuler'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editingTag.name || !editingTag.slug}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                  >
                    {saving ? '...' : (language === 'en' ? 'Save' : 'Enregistrer')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TarotTagsManager;
```

**Step 2: Commit**

```bash
git add components/admin/TarotTagsManager.tsx
git commit -m "feat(tarot): add TarotTagsManager component"
```

---

## Task 8: Create TarotMediaManager Component

**Files:**
- Create: `components/admin/TarotMediaManager.tsx`

**Step 1: Create the component with upload, grid view, and trash functionality**

```tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchTarotMedia,
  uploadTarotMedia,
  deleteTarotMedia,
  restoreTarotMedia,
  permanentlyDeleteTarotMedia,
  TarotMedia,
} from '../../services/apiService';
import { Upload, Trash2, Copy, Check, RotateCcw, Image as ImageIcon } from 'lucide-react';

interface TarotMediaManagerProps {
  showTrash?: boolean;
  onMediaChange?: () => void;
}

const TarotMediaManager: React.FC<TarotMediaManagerProps> = ({ showTrash = false, onMediaChange }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [media, setMedia] = useState<TarotMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const result = await fetchTarotMedia(token, { deleted: showTrash });
      setMedia(result.media);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, showTrash]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const token = await getToken();
      if (!token) return;

      for (const file of Array.from(files)) {
        await uploadTarotMedia(token, file);
      }

      loadMedia();
      onMediaChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'en' ? 'Move to trash?' : 'Mettre à la corbeille?')) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deleteTarotMedia(token, id);
      loadMedia();
      onMediaChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await restoreTarotMedia(token, id);
      loadMedia();
      onMediaChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to restore');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm(language === 'en' ? 'Permanently delete?' : 'Supprimer définitivement?')) return;
    try {
      const token = await getToken();
      if (!token) return;
      await permanentlyDeleteTarotMedia(token, id);
      loadMedia();
      onMediaChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const copyToClipboard = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {!showTrash && (
        <div className="flex justify-end mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {language === 'en' ? 'Upload Images' : 'Télécharger images'}
          </button>
        </div>
      )}

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        {media.map((item) => (
          <div
            key={item.id}
            className="group relative bg-slate-900/60 rounded-lg border border-purple-500/20 overflow-hidden"
          >
            <img
              src={item.url}
              alt={item.altText || item.originalName}
              className="w-full aspect-square object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {showTrash ? (
                <>
                  <button
                    onClick={() => handleRestore(item.id)}
                    className="p-2 bg-green-500/50 rounded-lg text-white hover:bg-green-500/70"
                    title={language === 'en' ? 'Restore' : 'Restaurer'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(item.id)}
                    className="p-2 bg-red-500/50 rounded-lg text-white hover:bg-red-500/70"
                    title={language === 'en' ? 'Delete permanently' : 'Supprimer définitivement'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => copyToClipboard(item.url)}
                    className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30"
                    title={language === 'en' ? 'Copy URL' : 'Copier URL'}
                  >
                    {copiedUrl === item.url ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-red-500/50 rounded-lg text-white hover:bg-red-500/70"
                    title={language === 'en' ? 'Delete' : 'Supprimer'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <div className="p-2">
              <p className="text-slate-400 text-xs truncate">{item.originalName}</p>
            </div>
          </div>
        ))}
        {media.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            {showTrash
              ? (language === 'en' ? 'Trash is empty' : 'Corbeille vide')
              : (language === 'en' ? 'No images uploaded yet' : 'Aucune image')}
          </div>
        )}
      </div>
    </div>
  );
};

export default TarotMediaManager;
```

**Step 2: Commit**

```bash
git add components/admin/TarotMediaManager.tsx
git commit -m "feat(tarot): add TarotMediaManager component"
```

---

## Task 9: Create TarotFAQManager Component

**Files:**
- Create: `components/admin/TarotFAQManager.tsx`

**Step 1: Create inline FAQ editor component**

```tsx
import React from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
}

interface TarotFAQManagerProps {
  faq: FAQItem[];
  onChange: (faq: FAQItem[]) => void;
}

const TarotFAQManager: React.FC<TarotFAQManagerProps> = ({ faq, onChange }) => {
  const { language } = useApp();

  const handleAdd = () => {
    onChange([...faq, { question: '', answer: '' }]);
  };

  const handleRemove = (index: number) => {
    onChange(faq.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faq];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {faq.map((item, index) => (
        <div
          key={index}
          className="bg-slate-800/50 rounded-lg p-3 border border-slate-700"
        >
          <div className="flex items-start gap-2 mb-2">
            <GripVertical className="w-4 h-4 text-slate-500 mt-2 cursor-grab" />
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">
                {language === 'en' ? 'Question' : 'Question'} #{index + 1}
              </label>
              <input
                type="text"
                value={item.question}
                onChange={(e) => handleChange(index, 'question', e.target.value)}
                placeholder={language === 'en' ? 'Enter question...' : 'Entrez la question...'}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
              />
            </div>
            <button
              onClick={() => handleRemove(index)}
              className="p-1.5 text-red-400 hover:bg-red-500/20 rounded mt-5"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="ml-6">
            <label className="block text-xs text-slate-500 mb-1">
              {language === 'en' ? 'Answer' : 'Réponse'}
            </label>
            <textarea
              value={item.answer}
              onChange={(e) => handleChange(index, 'answer', e.target.value)}
              placeholder={language === 'en' ? 'Enter answer...' : 'Entrez la réponse...'}
              rows={2}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 resize-none"
            />
          </div>
        </div>
      ))}

      <button
        onClick={handleAdd}
        className="w-full py-2 border border-dashed border-slate-600 text-slate-400 rounded-lg hover:border-purple-500 hover:text-purple-400 text-sm flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        {language === 'en' ? 'Add FAQ' : 'Ajouter FAQ'}
      </button>

      {faq.length === 0 && (
        <p className="text-center text-slate-500 text-sm py-4">
          {language === 'en' ? 'No FAQ items yet' : 'Aucune FAQ'}
        </p>
      )}
    </div>
  );
};

export default TarotFAQManager;
```

**Step 2: Commit**

```bash
git add components/admin/TarotFAQManager.tsx
git commit -m "feat(tarot): add TarotFAQManager component"
```

---

## Task 10: Create TarotArticleEditor Component

**Files:**
- Create: `components/admin/TarotArticleEditor.tsx`

**Step 1: Create the full editor component**

This is the main editor, modeled on BlogPostEditor but adapted for tarot articles:

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminTarotArticle,
  updateTarotArticle,
  fetchTarotCategories,
  fetchTarotTags,
  fetchTarotMedia,
  uploadTarotMedia,
  deleteTarotMedia,
  TarotArticle,
  TarotCategory,
  TarotTag,
  TarotMedia,
} from '../../services/apiService';
import {
  ArrowLeft,
  Save,
  Eye,
  ExternalLink,
  Settings,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  HelpCircle,
  Link as LinkIcon,
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import TarotFAQManager, { FAQItem } from './TarotFAQManager';

interface TarotArticleEditorProps {
  articleId: string;
  onSave: () => void;
  onCancel: () => void;
}

const TarotArticleEditor: React.FC<TarotArticleEditorProps> = ({
  articleId,
  onSave,
  onCancel,
}) => {
  const { language } = useApp();
  const { getToken } = useAuth();

  const [article, setArticle] = useState<TarotArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Sidebar data
  const [categories, setCategories] = useState<TarotCategory[]>([]);
  const [tags, setTags] = useState<TarotTag[]>([]);
  const [media, setMedia] = useState<TarotMedia[]>([]);

  // Collapsible sections
  const [showCoverImage, setShowCoverImage] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showFAQ, setShowFAQ] = useState(true);
  const [showRelated, setShowRelated] = useState(false);

  useEffect(() => {
    loadArticle();
    loadSidebarData();
  }, [articleId]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await fetchAdminTarotArticle(token, articleId);
      setArticle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const loadSidebarData = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [catResult, tagResult, mediaResult] = await Promise.all([
        fetchTarotCategories(token),
        fetchTarotTags(token),
        fetchTarotMedia(token),
      ]);
      setCategories(catResult.categories);
      setTags(tagResult.tags);
      setMedia(mediaResult.media);
    } catch (err) {
      console.error('Failed to load sidebar data:', err);
    }
  };

  const loadMedia = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const result = await fetchTarotMedia(token);
      setMedia(result.media);
    } catch (err) {
      console.error('Failed to load media:', err);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!article) return;

    try {
      setSaving(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('No token');

      const updateData = {
        ...article,
        status: publish ? 'PUBLISHED' : article.status,
      };

      await updateTarotArticle(token, article.id, updateData);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!article) return;
    const newStatus = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setArticle({ ...article, status: newStatus });
  };

  const handleMediaUpload = async (file: File): Promise<string> => {
    const token = await getToken();
    if (!token) throw new Error('No token');
    const result = await uploadTarotMedia(token, file);
    await loadMedia();
    return result.media.url;
  };

  const handleMediaDelete = async (id: string): Promise<void> => {
    const token = await getToken();
    if (!token) throw new Error('No token');
    await deleteTarotMedia(token, id);
    await loadMedia();
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!article) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const url = await handleMediaUpload(file);
      setArticle({ ...article, featuredImage: url, featuredImageAlt: file.name.replace(/\.[^/.]+$/, '') });
    } catch (err) {
      setError('Failed to upload cover image');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const SidebarSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }> = ({ title, icon, isOpen, onToggle, children }) => (
    <div className="border-b border-slate-700/50 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-300">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-red-400">Article not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-purple-500/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{language === 'en' ? 'Back' : 'Retour'}</span>
            </button>
            <div className="h-6 w-px bg-slate-700" />
            <h1 className="text-lg font-heading text-purple-200 truncate max-w-md">
              {article.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Preview button */}
            <a
              href={article.status === 'PUBLISHED'
                ? `/tarot/articles/${article.slug}`
                : `/admin/tarot/preview/${article.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm"
            >
              {article.status === 'PUBLISHED' ? <ExternalLink className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {article.status === 'PUBLISHED' ? (language === 'en' ? 'View' : 'Voir') : (language === 'en' ? 'Preview' : 'Aperçu')}
              </span>
            </a>

            {/* Save button */}
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 text-sm font-medium"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {language === 'en' ? 'Save' : 'Enregistrer'}
            </button>

            {/* Publish/Unpublish toggle */}
            <button
              onClick={handleTogglePublish}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                article.status === 'PUBLISHED'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {article.status === 'PUBLISHED'
                ? (language === 'en' ? 'Unpublish' : 'Dépublier')
                : (language === 'en' ? 'Publish' : 'Publier')}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Editor Area */}
        <div className="flex-1 p-4 lg:p-6 max-w-4xl">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">{language === 'en' ? 'Title' : 'Titre'}</label>
            <input
              type="text"
              value={article.title}
              onChange={(e) => setArticle({ ...article, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 text-xl font-medium placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Excerpt */}
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">{language === 'en' ? 'Excerpt' : 'Extrait'}</label>
            <textarea
              value={article.excerpt}
              onChange={(e) => setArticle({ ...article, excerpt: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">{language === 'en' ? 'Content' : 'Contenu'}</label>
            <RichTextEditor
              content={article.content}
              onChange={(html) => setArticle({ ...article, content: html })}
              placeholder="Write your article content..."
              mediaLibrary={media}
              onMediaUpload={handleMediaUpload}
              onMediaDelete={handleMediaDelete}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-80 border-l border-slate-800 bg-slate-900/50">
          <div className="sticky top-[57px] max-h-[calc(100vh-57px)] overflow-y-auto">
            {/* Featured Image */}
            <SidebarSection
              title={language === 'en' ? 'Featured Image' : 'Image principale'}
              icon={<ImageIcon className="w-4 h-4" />}
              isOpen={showCoverImage}
              onToggle={() => setShowCoverImage(!showCoverImage)}
            >
              <div className="space-y-3">
                {article.featuredImage && (
                  <img
                    src={article.featuredImage}
                    alt={article.featuredImageAlt || 'Cover'}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm rounded-lg"
                >
                  {uploadingCover ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                  {language === 'en' ? 'Upload' : 'Télécharger'}
                </button>
                <input
                  type="text"
                  value={article.featuredImage}
                  onChange={(e) => setArticle({ ...article, featuredImage: e.target.value })}
                  placeholder="Image URL"
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
                />
                <input
                  type="text"
                  value={article.featuredImageAlt}
                  onChange={(e) => setArticle({ ...article, featuredImageAlt: e.target.value })}
                  placeholder="Alt text"
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
                />
              </div>
            </SidebarSection>

            {/* Categories */}
            <SidebarSection
              title={language === 'en' ? 'Categories' : 'Catégories'}
              icon={<Settings className="w-4 h-4" />}
              isOpen={showCategories}
              onToggle={() => setShowCategories(!showCategories)}
            >
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      const current = article.categories || [];
                      const updated = current.includes(cat.name)
                        ? current.filter((c) => c !== cat.name)
                        : [...current, cat.name];
                      setArticle({ ...article, categories: updated });
                    }}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      (article.categories || []).includes(cat.name)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
                {categories.length === 0 && <p className="text-xs text-slate-500">No categories</p>}
              </div>
            </SidebarSection>

            {/* Tags */}
            <SidebarSection
              title="Tags"
              icon={<Settings className="w-4 h-4" />}
              isOpen={showTags}
              onToggle={() => setShowTags(!showTags)}
            >
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      const current = article.tags || [];
                      const updated = current.includes(tag.name)
                        ? current.filter((t) => t !== tag.name)
                        : [...current, tag.name];
                      setArticle({ ...article, tags: updated });
                    }}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      (article.tags || []).includes(tag.name)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
                {tags.length === 0 && <p className="text-xs text-slate-500">No tags</p>}
              </div>
            </SidebarSection>

            {/* FAQ */}
            <SidebarSection
              title="FAQ"
              icon={<HelpCircle className="w-4 h-4" />}
              isOpen={showFAQ}
              onToggle={() => setShowFAQ(!showFAQ)}
            >
              <TarotFAQManager
                faq={(article.faq as FAQItem[]) || []}
                onChange={(faq) => setArticle({ ...article, faq })}
              />
            </SidebarSection>

            {/* Related Cards */}
            <SidebarSection
              title={language === 'en' ? 'Related Cards' : 'Cartes liées'}
              icon={<LinkIcon className="w-4 h-4" />}
              isOpen={showRelated}
              onToggle={() => setShowRelated(!showRelated)}
            >
              <textarea
                value={(article.relatedCards || []).join('\n')}
                onChange={(e) => setArticle({
                  ...article,
                  relatedCards: e.target.value.split('\n').filter(Boolean),
                })}
                placeholder={language === 'en' ? 'One slug per line...' : 'Un slug par ligne...'}
                rows={4}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 resize-none"
              />
            </SidebarSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarotArticleEditor;
```

**Step 2: Commit**

```bash
git add components/admin/TarotArticleEditor.tsx
git commit -m "feat(tarot): add TarotArticleEditor component"
```

---

## Task 11: Refactor AdminTarotArticles with Sub-Tabs

**Files:**
- Modify: `components/admin/AdminTarotArticles.tsx`

**Step 1: Refactor to add sub-tabs and integrate all new components**

The component should:
- Have tabs: Articles | Categories | Tags | Media | Trash
- Have "Import JSON" button that opens ImportArticle modal
- Click article row → open TarotArticleEditor
- Keep existing trash functionality

See `components/admin/AdminBlog.tsx` for pattern reference.

Key structure:
```tsx
type TabType = 'articles' | 'categories' | 'tags' | 'media' | 'trash';
const [activeTab, setActiveTab] = useState<TabType>('articles');
const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
const [showImportModal, setShowImportModal] = useState(false);

// If editing, show TarotArticleEditor
if (editingArticleId) {
  return (
    <TarotArticleEditor
      articleId={editingArticleId}
      onSave={() => { setEditingArticleId(null); loadArticles(); }}
      onCancel={() => setEditingArticleId(null)}
    />
  );
}

// Otherwise show tabs with content
```

**Step 2: Commit**

```bash
git add components/admin/AdminTarotArticles.tsx
git commit -m "feat(tarot): refactor AdminTarotArticles with sub-tabs and editor integration"
```

---

## Task 12: Wire Up ImportArticle as Modal

**Files:**
- Modify: `components/admin/ImportArticle.tsx`

**Step 1: Add modal wrapper props**

The ImportArticle component should accept:
```tsx
interface ImportArticleProps {
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}
```

When `isModal` is true, render with modal wrapper styling. When `onSuccess` is called, close modal and refresh list.

**Step 2: Commit**

```bash
git add components/admin/ImportArticle.tsx
git commit -m "feat(tarot): add modal mode to ImportArticle component"
```

---

## Task 13: Test Full Workflow

**Step 1: Start dev servers**

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev
```

**Step 2: Test the workflow**

1. Navigate to Admin > Tarot Articles
2. Verify sub-tabs appear: Articles | Categories | Tags | Media | Trash
3. Click "Import JSON" button → modal should open
4. Import a test article
5. Click on imported article → TarotArticleEditor should open
6. Edit title, content, categories, tags, FAQ
7. Click Save → verify changes saved
8. Click Publish/Unpublish toggle → verify status changes
9. Go to Categories tab → create/edit/delete categories
10. Go to Tags tab → create/edit/delete tags
11. Go to Media tab → upload/delete images
12. Delete an article → verify it appears in Trash
13. Restore from Trash → verify it returns to Articles

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(tarot): complete tarot article editor implementation"
```

---

## Summary

This plan implements:
1. **Database**: TarotCategory, TarotTag, TarotMedia models
2. **Backend**: Full CRUD endpoints for categories, tags, media with upload handling
3. **Frontend API**: Service functions for all new endpoints
4. **Components**:
   - TarotCategoriesManager
   - TarotTagsManager
   - TarotMediaManager
   - TarotFAQManager
   - TarotArticleEditor
5. **Integration**: AdminTarotArticles refactored with sub-tabs, ImportArticle as modal

Total: 13 tasks covering database, backend, frontend infrastructure, and integration.

# Tarot Article Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve tarot article workflow with warnings-only validation, original filenames for media, and folder organization.

**Architecture:** Three independent changes: (1) Convert all validation errors to warnings with force-save option, (2) Keep original filenames on upload with auto-rename on conflict, (3) Add folder selection and filtering for media uploads.

**Tech Stack:** React, Express, Multer, Prisma, TypeScript

---

## Task 1: Backend - Make All Validation Warnings-Only

**Files:**
- Modify: `server/src/lib/validation.ts`
- Modify: `server/src/routes/tarot-articles.ts`

**Step 1: Create lenient schema in validation.ts**

Add a lenient version of the schema that makes all fields optional or removes strict constraints. Add after line 134:

```typescript
// Lenient schema for force-save mode - validates structure but doesn't block
export const TarotArticleLenientSchema = z.object({
  title: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  slug: z.string().optional(),
  author: z.string().optional(),
  readTime: z.string().optional(),
  datePublished: z.string().optional(),
  dateModified: z.string().optional(),
  featuredImage: z.string().optional(),
  featuredImageAlt: z.string().optional(),
  cardType: CardTypeEnum.optional(),
  cardNumber: z.string().optional(),
  astrologicalCorrespondence: z.string().optional(),
  element: ElementEnum.optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  seo: z.object({
    focusKeyword: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }).optional(),
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
```

**Step 2: Add validateArticleWithWarnings function**

Add after `validateArticleExtended` function (around line 341):

```typescript
/**
 * Validate article and return all issues as warnings (non-blocking)
 * Used for force-save mode where user wants to save despite issues
 */
export function validateArticleWithWarnings(
  input: unknown,
  cardName?: string
): ExtendedValidationResult {
  const normalized = normalizeKeys(input);
  const warnings: string[] = [];

  // Run strict validation to collect all issues as warnings
  const strictResult = TarotArticleSchema.safeParse(normalized);
  if (!strictResult.success) {
    strictResult.error.errors.forEach((err) => {
      warnings.push(`${err.path.join('.')}: ${err.message}`);
    });
  }

  // Run lenient validation to get parseable data
  const lenientResult = TarotArticleLenientSchema.safeParse(normalized);
  if (!lenientResult.success) {
    // If even lenient fails, return error
    return {
      success: false,
      errorMessages: ['Invalid data structure'],
    };
  }

  const data = lenientResult.data;

  // Add content quality warnings
  if (data.content) {
    const wordCount = getWordCount(data.content);
    if (wordCount < 2500) {
      warnings.push(`Word count is ${wordCount}, target is 2500-3000`);
    }
    if (wordCount > 3500) {
      warnings.push(`Word count is ${wordCount}, may be too long`);
    }

    const forbiddenFound = checkForbiddenWords(data.content);
    if (forbiddenFound.length > 0) {
      warnings.push(`Forbidden words found: ${forbiddenFound.join(', ')}`);
    }

    if (data.content.includes('—')) {
      const contentWithoutBlockquotes = data.content.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '');
      if (contentWithoutBlockquotes.includes('—')) {
        warnings.push('Content contains em dashes (—) which may affect readability');
      }
    }

    const name = cardName || (data.title?.split(':')[0].trim() ?? 'Card');
    if (!validateAnswerFirstOpening(data.content, name)) {
      warnings.push('Opening may not follow answer-first pattern');
    }
  }

  // SEO warnings
  if (data.seo) {
    if (data.seo.metaTitle && data.seo.metaTitle.length > 60) {
      warnings.push(`SEO: Meta title is ${data.seo.metaTitle.length} chars (max 60)`);
    }
    if (data.seo.metaDescription && data.seo.metaDescription.length > 155) {
      warnings.push(`SEO: Meta description is ${data.seo.metaDescription.length} chars (max 155)`);
    }
  }

  // FAQ count warning
  if (data.faq) {
    if (data.faq.length < 5) {
      warnings.push(`FAQ: Only ${data.faq.length} items (minimum 5 recommended)`);
    }
  }

  // Tag count warning
  if (data.tags) {
    if (data.tags.length < 3) {
      warnings.push(`Tags: Only ${data.tags.length} tags (minimum 3 recommended)`);
    }
  }

  return {
    success: true,
    data: normalized as TarotArticleInput,
    warnings: warnings.length > 0 ? warnings : undefined,
    stats: {
      wordCount: data.content ? getWordCount(data.content) : 0,
      faqCount: data.faq?.length ?? 0,
      hasAnswerFirstOpening: data.content && data.title
        ? validateAnswerFirstOpening(data.content, data.title.split(':')[0].trim())
        : false,
    },
  };
}
```

**Step 3: Update import endpoint to support force save**

In `server/src/routes/tarot-articles.ts`, modify the `/admin/import` endpoint (around line 168) to accept a `forceImport` flag:

```typescript
router.post('/admin/import', async (req, res) => {
  try {
    const articleData = req.body;
    const forceImport = req.query.force === 'true';

    // Validate the article data
    const validationResult = forceImport
      ? validateArticleWithWarnings(articleData)
      : validateArticleExtended(articleData);

    if (!validationResult.success || !validationResult.data) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validationResult.errorMessages || [],
        warnings: validationResult.warnings || [],
      });
    }
    // ... rest of function unchanged
```

**Step 4: Run type check**

Run: `cd /Users/louisegriffin/Development/MysticOracle/server && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add server/src/lib/validation.ts server/src/routes/tarot-articles.ts
git commit -m "$(cat <<'EOF'
feat: Add warnings-only validation mode for tarot articles

Add lenient schema and validateArticleWithWarnings function that
collects all validation issues as warnings instead of blocking errors.
Import endpoint now accepts ?force=true to use warnings-only mode.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Frontend - Add Force Save Button

**Files:**
- Modify: `components/admin/ImportArticle.tsx`
- Modify: `services/apiService.ts`

**Step 1: Update apiService to support force import**

In `services/apiService.ts`, find `importTarotArticle` function (if it exists) or add support in the ImportArticle component directly. We'll modify the component to pass the force flag.

**Step 2: Add Force Import button to ImportArticle.tsx**

Add state for tracking validation errors around line 55:

```typescript
const [hasValidationErrors, setHasValidationErrors] = useState(false);
```

Update the `handleValidate` function to track if there are errors (around line 210):

```typescript
setValidationResult({
  valid: data.success,
  errors: data.errors || [],
  warnings: data.warnings || [],
  stats: data.stats,
  schemaPreview: data.schema,
});

// Track if there are blocking errors
setHasValidationErrors(!data.success && data.errors && data.errors.length > 0);
```

Update `handleImport` to support force mode. Add a parameter and modify the fetch calls (around line 233):

```typescript
async function handleImport(force: boolean = false) {
  if (!jsonInput.trim()) return;

  setLoading(true);
  setResult(null);

  try {
    const parsed = JSON.parse(jsonInput);
    const token = await getToken();

    if (!token) {
      setResult({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    let response;
    const forceParam = force ? '?force=true' : '';

    if (isEditMode && editingArticleId) {
      response = await fetch(`${import.meta.env.VITE_API_URL}/tarot-articles/admin/${editingArticleId}${forceParam}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });
    } else {
      response = await fetch(`${import.meta.env.VITE_API_URL}/tarot-articles/admin/import${forceParam}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });
    }
    // ... rest unchanged
```

**Step 3: Add Force Save button in the UI**

After the Import button (around line 408), add the Force Save button:

```tsx
{/* Force Save button - shown when validation has errors */}
{hasValidationErrors && (
  <button
    onClick={() => handleImport(true)}
    disabled={!jsonInput.trim() || loading}
    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg
      hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed
      transition-all shadow-lg shadow-amber-500/20"
    title={language === 'en' ? 'Save despite validation errors' : 'Enregistrer malgré les erreurs'}
  >
    {loading ? (
      <>
        <Loader className="w-4 h-4 animate-spin" />
        {language === 'en' ? 'Forcing...' : 'Forçage...'}
      </>
    ) : (
      <>
        <AlertTriangle className="w-4 h-4" />
        {language === 'en' ? 'Force Save' : 'Forcer'}
      </>
    )}
  </button>
)}
```

**Step 4: Run type check**

Run: `cd /Users/louisegriffin/Development/MysticOracle && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add components/admin/ImportArticle.tsx
git commit -m "$(cat <<'EOF'
feat: Add Force Save button for tarot article import

Shows amber Force Save button when validation has errors, allowing
users to save articles despite validation issues. All issues become
warnings displayed for user awareness.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Backend - Original Filenames with Auto-Rename

**Files:**
- Modify: `server/src/routes/blog.ts`

**Step 1: Create filename sanitizer function**

Add after the imports (around line 10):

```typescript
/**
 * Sanitize filename for safe storage
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove special characters except hyphens and dots
 * - Preserve extension
 */
function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, path.extname(filename));

  const sanitized = base
    .toLowerCase()
    .replace(/\s+/g, '-')           // spaces to hyphens
    .replace(/[^a-z0-9-]/g, '')     // remove special chars
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-|-$/g, '');         // trim hyphens from ends

  return `${sanitized || 'image'}${ext}`;
}

/**
 * Get unique filename by appending number suffix if needed
 */
function getUniqueFilename(dir: string, filename: string): string {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);

  let finalName = filename;
  let counter = 1;

  while (fs.existsSync(path.join(dir, finalName))) {
    finalName = `${base}-${counter}${ext}`;
    counter++;
  }

  return finalName;
}
```

**Step 2: Update multer storage configuration**

Replace the current storage config (lines 18-24) with:

```typescript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get folder from request body (default to 'blog')
    const folder = (req.body?.folder as string) || 'blog';
    const folderDir = path.join(process.cwd(), 'public', 'uploads', folder);

    // Create folder if it doesn't exist
    if (!fs.existsSync(folderDir)) {
      fs.mkdirSync(folderDir, { recursive: true });
    }

    cb(null, folderDir);
  },
  filename: (req, file, cb) => {
    const folder = (req.body?.folder as string) || 'blog';
    const folderDir = path.join(process.cwd(), 'public', 'uploads', folder);

    // Sanitize original filename
    const sanitized = sanitizeFilename(file.originalname);

    // Get unique name (auto-rename if exists)
    const uniqueName = getUniqueFilename(folderDir, sanitized);

    cb(null, uniqueName);
  }
});
```

**Step 3: Update upload endpoint to use folder**

Modify the upload endpoint (around line 840) to use the folder from request:

```typescript
router.post('/admin/upload', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = (req.body?.folder as string) || 'blog';
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    const url = `${baseUrl}/uploads/${folder}/${req.file.filename}`;

    const media = await prisma.mediaUpload.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url,
        altText: req.body.altText || null,
        caption: req.body.caption || null,
        folder: folder,
      }
    });

    res.json({ success: true, media });
  } catch (error) {
    console.error('Error uploading file:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to upload file' });
  }
});
```

**Step 4: Update delete endpoint to use folder from DB**

Modify the delete endpoint (around line 880) to get folder from the media record:

```typescript
router.delete('/admin/media/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const media = await prisma.mediaUpload.findUnique({ where: { id: req.params.id } });
    if (media) {
      // Use folder from DB record
      const folder = media.folder || 'blog';
      const filePath = path.join(process.cwd(), 'public', 'uploads', folder, media.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await prisma.mediaUpload.delete({ where: { id: req.params.id } });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to delete media' });
  }
});
```

**Step 5: Add endpoint to list media by folder**

Add a query param to the GET endpoint (around line 865):

```typescript
router.get('/admin/media', requireAuth, requireAdmin, async (req, res) => {
  try {
    const folder = req.query.folder as string | undefined;

    const where = folder ? { folder } : {};

    const media = await prisma.mediaUpload.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ media });
  } catch (error) {
    console.error('Error fetching media:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});
```

**Step 6: Run server and test**

Run: `cd /Users/louisegriffin/Development/MysticOracle/server && npm run build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add server/src/routes/blog.ts
git commit -m "$(cat <<'EOF'
feat: Keep original filenames and add folder support for media

- Sanitize original filenames (lowercase, hyphens, no special chars)
- Auto-rename with number suffix on filename conflict
- Support folder parameter on upload (blog, tarot, etc.)
- Create folder subdirectories automatically
- Filter media by folder in GET endpoint

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Frontend - Add Folder Selection to Media Upload

**Files:**
- Modify: `services/apiService.ts`
- Modify: `components/admin/TarotMediaManager.tsx`

**Step 1: Update uploadBlogMedia to accept folder**

In `services/apiService.ts`, find `uploadBlogMedia` (around line 1347) and add folder param:

```typescript
export async function uploadBlogMedia(
  token: string,
  file: File,
  altText?: string,
  caption?: string,
  folder?: string
): Promise<{ success: boolean; media: BlogMedia }> {
  const formData = new FormData();
  formData.append('image', file);
  if (altText) formData.append('altText', altText);
  if (caption) formData.append('caption', caption);
  if (folder) formData.append('folder', folder);

  const response = await fetch(`${API_BASE_URL}/blog/admin/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}
```

**Step 2: Update fetchAdminBlogMedia to accept folder filter**

Find `fetchAdminBlogMedia` and add folder param:

```typescript
export async function fetchAdminBlogMedia(
  token: string,
  folder?: string
): Promise<{ media: BlogMedia[] }> {
  const params = folder ? `?folder=${encodeURIComponent(folder)}` : '';
  return apiRequest(`/api/blog/admin/media${params}`, { token });
}
```

**Step 3: Update TarotMediaManager with folder tabs**

Replace the entire component:

```tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminBlogMedia,
  uploadBlogMedia,
  deleteBlogMedia,
  BlogMedia,
} from '../../services/apiService';
import { Upload, Trash2, Copy, Check, Image as ImageIcon, Folder } from 'lucide-react';

interface TarotMediaManagerProps {
  onMediaChange?: () => void;
  defaultFolder?: string;
}

const FOLDERS = [
  { id: 'all', label: 'All', labelFr: 'Tous' },
  { id: 'blog', label: 'Blog', labelFr: 'Blog' },
  { id: 'tarot', label: 'Tarot', labelFr: 'Tarot' },
];

const TarotMediaManager: React.FC<TarotMediaManagerProps> = ({
  onMediaChange,
  defaultFolder = 'tarot'
}) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [uploadFolder, setUploadFolder] = useState<string>(defaultFolder);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const folderFilter = activeFolder === 'all' ? undefined : activeFolder;
      const result = await fetchAdminBlogMedia(token, folderFilter);
      setMedia(result.media);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, activeFolder]);

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

      for (const file of Array.from(files as FileList)) {
        await uploadBlogMedia(token, file, undefined, undefined, uploadFolder);
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
    if (!confirm(language === 'en' ? 'Delete this image?' : 'Supprimer cette image?')) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deleteBlogMedia(token, id);
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
      {/* Folder tabs and upload controls */}
      <div className="flex items-center justify-between mb-4 gap-4">
        {/* Folder filter tabs */}
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
          {FOLDERS.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeFolder === folder.id
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {language === 'en' ? folder.label : folder.labelFr}
            </button>
          ))}
        </div>

        {/* Upload controls */}
        <div className="flex items-center gap-3">
          {/* Folder selector for upload */}
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-slate-400" />
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-300"
            >
              {FOLDERS.filter(f => f.id !== 'all').map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {language === 'en' ? folder.label : folder.labelFr}
                </option>
              ))}
            </select>
          </div>

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
            {language === 'en' ? 'Upload' : 'Télécharger'}
          </button>
        </div>
      </div>

      {/* Media grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        {media.map((item) => (
          <div
            key={item.id}
            className="group relative bg-slate-900/60 rounded-lg border border-purple-500/20 overflow-hidden"
          >
            <img
              src={item.url}
              alt={item.altText || 'Media'}
              className="w-full aspect-square object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
            </div>
            <div className="p-2">
              <p className="text-slate-400 text-xs truncate" title={item.originalName}>
                {item.originalName || item.filename}
              </p>
              {item.folder && (
                <span className="text-xs text-purple-400/60">{item.folder}</span>
              )}
            </div>
          </div>
        ))}
        {media.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            {language === 'en' ? 'No images in this folder' : 'Aucune image dans ce dossier'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TarotMediaManager;
```

**Step 4: Run type check**

Run: `cd /Users/louisegriffin/Development/MysticOracle && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add services/apiService.ts components/admin/TarotMediaManager.tsx
git commit -m "$(cat <<'EOF'
feat: Add folder selection and filtering for media uploads

- uploadBlogMedia now accepts folder parameter
- fetchAdminBlogMedia now supports folder filter
- TarotMediaManager shows folder tabs (All, Blog, Tarot)
- Dropdown to select upload target folder
- Shows original filename and folder badge on media items

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Update PATCH endpoint for force save

**Files:**
- Modify: `server/src/routes/tarot-articles.ts`

**Step 1: Import validateArticleWithWarnings**

Update the import at the top of the file:

```typescript
import { validateArticleExtended, validateArticleWithWarnings, convertToPrismaFormat } from '../lib/validation.js';
```

**Step 2: Update PATCH endpoint for force mode**

In the PATCH handler (around line 365), add support for force query param in the full validation branch:

```typescript
router.patch('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const isVisualEditorMode = updates._visualEditorMode === true;
    const forceUpdate = req.query.force === 'true';

    // ... existing code until line 420 (full validation mode)

    // Full validation mode: If this is a full article update (from JSON import edit)
    if (updates.title && updates.content && updates.slug) {
      // Validate the updated article data
      const validationResult = forceUpdate
        ? validateArticleWithWarnings(updates)
        : validateArticleExtended(updates);

      if (!validationResult.success || !validationResult.data) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: validationResult.errorMessages || [],
          warnings: validationResult.warnings || [],
        });
      }
      // ... rest unchanged
```

**Step 3: Run type check**

Run: `cd /Users/louisegriffin/Development/MysticOracle/server && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add server/src/routes/tarot-articles.ts
git commit -m "$(cat <<'EOF'
feat: Support force mode in PATCH endpoint for tarot articles

Allow updating articles with ?force=true to bypass strict validation
and collect all issues as warnings instead.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Final Testing

**Step 1: Start backend**

Run: `cd /Users/louisegriffin/Development/MysticOracle/server && npm run dev`
Expected: Server starts on port 3001

**Step 2: Start frontend**

Run: `cd /Users/louisegriffin/Development/MysticOracle && npm run dev`
Expected: Vite dev server starts on port 5173

**Step 3: Manual test checklist**

- [ ] Upload image to tarot folder - verify original filename kept
- [ ] Upload duplicate filename - verify auto-renamed with suffix
- [ ] Filter media by folder - verify only matching items shown
- [ ] Import article with validation errors - verify Force Save button appears
- [ ] Click Force Save - verify article imports with warnings shown
- [ ] Edit article and publish - verify status changes immediately

**Step 4: Final commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: Implementation complete - tarot article improvements

- Warnings-only validation with Force Save option
- Original filenames preserved on media upload
- Auto-rename on filename conflict
- Folder organization for media (blog, tarot)
- Folder tabs and filtering in media manager

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Backend warnings-only validation | validation.ts, tarot-articles.ts |
| 2 | Frontend Force Save button | ImportArticle.tsx |
| 3 | Backend original filenames + folders | blog.ts |
| 4 | Frontend folder selection | apiService.ts, TarotMediaManager.tsx |
| 5 | PATCH endpoint force mode | tarot-articles.ts |
| 6 | Final testing | - |

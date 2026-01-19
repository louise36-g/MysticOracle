# Content System Refactoring Design

**Date:** 2026-01-19
**Status:** Approved
**Scope:** Blog + Tarot Articles unified backend refactoring

## Executive Summary

Refactor the Blog and Tarot Article systems to share a unified backend engine while maintaining separate frontend experiences. This addresses accumulated technical debt, fixes critical bugs, and establishes a maintainable architecture for future development.

### Key Outcomes
- Fix broken save button in Tarot Article editor (critical bug)
- Reduce code duplication by ~40% through shared services
- Unify taxonomy (categories/tags) across both content types
- Split large route files (1,749 + 1,278 lines) into focused modules
- Add client-side validation for better UX
- Normalize tarot article taxonomy from JSON arrays to proper relations

## Current State Analysis

### File Inventory

| System | File | Lines | Issues |
|--------|------|-------|--------|
| Blog Backend | `server/src/routes/blog.ts` | 1,749 | Monolithic, inline validation |
| Tarot Backend | `server/src/routes/tarot-articles.ts` | 1,278 | Missing `});` breaks routes, complex update handler |
| Blog Admin | `components/admin/blog/*` | 2,600 | Well-structured (model to follow) |
| Tarot Admin | `components/admin/AdminTarotArticles.tsx` | 1,045 | 5 features in one file |
| Shared | `components/admin/RichTextEditor.tsx` | 986 | Used by both systems |

### Critical Bugs

1. **Save Button Broken** (tarot-articles.ts:717)
   - Missing `});` after reorder route's catch block
   - Causes `PATCH /admin/:id` route to be malformed
   - **Priority: Fix immediately**

2. **Scattered Cache Invalidation**
   - Cache.del() calls throughout route handlers
   - Easy to miss when adding new operations
   - Causes stale data issues

3. **Duplicate Card Sorting Logic**
   - Same JavaScript sort in 3+ locations
   - Will drift and cause inconsistent ordering

### Architecture Debt

| Issue | Blog | Tarot | Impact |
|-------|------|-------|--------|
| Large route files | 1,749 lines | 1,278 lines | Hard to maintain |
| No service layer | Yes | Yes | Logic mixed with routes |
| Duplicate taxonomy CRUD | Yes | Yes | Same code twice |
| Inline validation | Yes | Extracted | Inconsistent patterns |
| Taxonomy storage | Many-to-many | JSON arrays | Different query patterns |

## Target Architecture

### Unified Backend, Separate Frontends

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
├────────────────────────┬────────────────────────────────┤
│   Admin: /admin/blog   │   Admin: /admin/tarot-articles │
│   Public: /blog/*      │   Public: /tarot/articles/*    │
└────────────────────────┴────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  UNIFIED BACKEND                        │
├─────────────────────────────────────────────────────────┤
│  Routes (thin):                                         │
│  ├── /api/blog/*           → calls BlogService          │
│  └── /api/tarot-articles/* → calls TarotArticleService  │
│                                                         │
│  Shared Services:                                       │
│  ├── ContentService<T>     (base CRUD, cache, delete)   │
│  ├── TaxonomyService       (unified categories/tags)    │
│  ├── MediaService          (file uploads)               │
│  └── CacheService          (invalidation helpers)       │
│                                                         │
│  Type-Specific Services:                                │
│  ├── BlogService extends ContentService<BlogPost>       │
│  └── TarotService extends ContentService<TarotArticle>  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     DATABASE                            │
├──────────────────┬──────────────────────────────────────┤
│  BlogPost        │  TarotArticle                        │
│  (standard)      │  (+ cardType, cardNumber, element)   │
├──────────────────┴──────────────────────────────────────┤
│  Shared: Category, Tag (unified taxonomy)               │
│  Junction: BlogPostCategory, BlogPostTag,               │
│            TarotArticleCategory, TarotArticleTag        │
└─────────────────────────────────────────────────────────┘
```

### New File Structure

```
server/src/
├── routes/
│   ├── blog/
│   │   ├── index.ts           # Router combining all (slim)
│   │   ├── posts.ts           # Blog post CRUD
│   │   ├── media.ts           # Media upload/management
│   │   └── public.ts          # Public endpoints
│   │
│   ├── tarot-articles/
│   │   ├── index.ts           # Router combining all (slim)
│   │   ├── admin.ts           # Tarot CRUD operations
│   │   ├── public.ts          # Public endpoints
│   │   └── trash.ts           # Soft delete operations
│   │
│   └── taxonomy.ts            # Shared category/tag endpoints
│
├── services/
│   ├── content/
│   │   ├── ContentService.ts  # Abstract base class
│   │   ├── BlogService.ts     # Blog-specific implementation
│   │   └── TarotService.ts    # Tarot-specific implementation
│   │
│   ├── TaxonomyService.ts     # Unified category/tag service
│   ├── MediaService.ts        # File upload service
│   └── CacheService.ts        # Cache invalidation helpers
│
└── lib/
    ├── validation/
    │   ├── blog.ts            # Blog validation schemas
    │   └── tarot.ts           # Tarot validation (errors + warnings)
    │
    └── tarot/
        ├── sorting.ts         # Card number parsing
        └── schema.ts          # JSON-LD generation

components/admin/
├── blog/                      # (existing - already modular)
│   ├── BlogPostsTab.tsx
│   ├── BlogTaxonomyTab.tsx
│   ├── BlogMediaTab.tsx
│   └── BlogTrashTab.tsx
│
└── tarot-articles/            # (new - extract from monolith)
    ├── AdminTarotArticles.tsx # Slim container with tabs
    ├── ArticlesTab.tsx        # Article list + table
    ├── TarotImportTab.tsx     # JSON import feature
    ├── TrashTab.tsx           # Deleted articles
    └── hooks/
        ├── useArticleList.ts  # Data fetching + pagination
        ├── useArticleForm.ts  # Form state + client validation
        └── useReorder.ts      # Drag-drop logic
```

## Database Schema Changes

### Unified Taxonomy

```prisma
# Rename from BlogCategory/BlogTag to shared tables
model Category {
  id            String    @id @default(uuid())
  name          String
  slug          String    @unique
  description   String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  blogPosts     BlogPostCategory[]
  tarotArticles TarotArticleCategory[]
}

model Tag {
  id            String    @id @default(uuid())
  name          String
  slug          String    @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  blogPosts     BlogPostTag[]
  tarotArticles TarotArticleTag[]
}

# Junction tables
model BlogPostCategory {
  postId      String
  categoryId  String
  post        BlogPost  @relation(fields: [postId], references: [id], onDelete: Cascade)
  category    Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([postId, categoryId])
}

model BlogPostTag {
  postId    String
  tagId     String
  post      BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
}

model TarotArticleCategory {
  articleId   String
  categoryId  String
  article     TarotArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)
  category    Category     @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([articleId, categoryId])
}

model TarotArticleTag {
  articleId String
  tagId     String
  article   TarotArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag       Tag          @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([articleId, tagId])
}

# Remove from TarotArticle model:
# - categories Json?  (replaced by relation)
# - tags Json?        (replaced by relation)

# Remove models entirely:
# - TarotCategory (merged into Category)
# - TarotTag (merged into Tag)
```

### Migration Strategy

1. Create new unified `Category` and `Tag` tables
2. Create junction tables for both content types
3. Migrate existing BlogCategory → Category
4. Migrate existing BlogTag → Tag
5. Parse TarotArticle JSON arrays → insert relations
6. Migrate TarotCategory entries → Category (dedupe by slug)
7. Migrate TarotTag entries → Tag (dedupe by slug)
8. Update foreign keys in junction tables
9. Drop old tables and JSON columns

## Implementation Phases

### Phase 1: Critical Bug Fix (Day 1)

**Objective:** Fix broken save button immediately

**Tasks:**
- [ ] Add missing `});` at line 717 in `tarot-articles.ts`
- [ ] Test save functionality works
- [ ] Deploy fix

**Files Changed:** 1
**Risk:** Low

---

### Phase 2: Extract Shared Utilities (Day 2-3)

**Objective:** Create shared service layer foundation

**Tasks:**
- [ ] Create `server/src/services/CacheService.ts`
  ```typescript
  export class CacheService {
    async invalidateContent(type: 'blog' | 'tarot', slug?: string): Promise<void>
    async invalidateTaxonomy(): Promise<void>
  }
  ```

- [ ] Create `server/src/lib/tarot/sorting.ts`
  ```typescript
  export function parseCardNumber(num: string | null): number
  export function sortByCardNumber<T>(items: T[]): T[]
  ```

- [ ] Create `server/src/lib/tarot/schema.ts`
  ```typescript
  export function generateTarotSchema(article: TarotArticle): { json: object, html: string }
  ```

- [ ] Create `server/src/lib/validation/tarot.ts`
  ```typescript
  export interface ValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
    data: ValidatedArticle
  }
  export function validateTarotArticle(input: unknown): ValidationResult
  ```

- [ ] Update tarot-articles.ts to use extracted utilities
- [ ] Test all tarot article operations

**Files Changed:** 5 new, 1 modified
**Risk:** Low

---

### Phase 3: Database Migration - Unified Taxonomy (Day 4-5)

**Objective:** Merge category/tag tables, normalize tarot taxonomy

**Tasks:**
- [ ] Create migration script `server/prisma/migrations/xxx_unified_taxonomy.sql`
- [ ] Create data migration script `server/scripts/migrate-taxonomy.ts`
- [ ] Update Prisma schema with new models
- [ ] Run migration on development database
- [ ] Verify data integrity
- [ ] Update API responses to include full category/tag objects

**Migration Script Pseudocode:**
```typescript
async function migrateTaxonomy() {
  // 1. Create unified tables (Prisma migrate)

  // 2. Copy BlogCategory → Category
  const blogCategories = await prisma.blogCategory.findMany()
  for (const cat of blogCategories) {
    await prisma.category.create({ data: { name: cat.name, slug: cat.slug } })
  }

  // 3. Copy BlogTag → Tag (similar)

  // 4. Migrate TarotCategory → Category (dedupe)
  const tarotCategories = await prisma.tarotCategory.findMany()
  for (const cat of tarotCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: { name: cat.name, slug: cat.slug },
      update: {}
    })
  }

  // 5. Parse TarotArticle JSON → relations
  const articles = await prisma.tarotArticle.findMany()
  for (const article of articles) {
    const categoryNames = article.categories as string[] || []
    for (const name of categoryNames) {
      const category = await prisma.category.findFirst({ where: { name } })
      if (category) {
        await prisma.tarotArticleCategory.create({
          data: { articleId: article.id, categoryId: category.id }
        })
      }
    }
    // Similar for tags
  }

  // 6. Drop old columns and tables (separate migration)
}
```

**Files Changed:** 3 new, 1 modified (schema.prisma)
**Risk:** Medium (requires careful data migration)

---

### Phase 4: Split Backend Routes (Day 6-8)

**Objective:** Break monolithic route files into focused modules

**Tasks:**

**Blog Routes:**
- [ ] Create `server/src/routes/blog/index.ts` (router combiner)
- [ ] Create `server/src/routes/blog/posts.ts` (CRUD operations)
- [ ] Create `server/src/routes/blog/media.ts` (upload/management)
- [ ] Create `server/src/routes/blog/public.ts` (public endpoints)
- [ ] Delete old `server/src/routes/blog.ts`

**Tarot Routes:**
- [ ] Create `server/src/routes/tarot-articles/index.ts`
- [ ] Create `server/src/routes/tarot-articles/admin.ts`
- [ ] Create `server/src/routes/tarot-articles/public.ts`
- [ ] Create `server/src/routes/tarot-articles/trash.ts`
- [ ] Delete old `server/src/routes/tarot-articles.ts`

**Shared Taxonomy:**
- [ ] Create `server/src/routes/taxonomy.ts`
  ```typescript
  // Unified endpoints for both content types
  GET    /api/taxonomy/categories
  POST   /api/taxonomy/categories
  PATCH  /api/taxonomy/categories/:id
  DELETE /api/taxonomy/categories/:id
  GET    /api/taxonomy/tags
  POST   /api/taxonomy/tags
  PATCH  /api/taxonomy/tags/:id
  DELETE /api/taxonomy/tags/:id
  ```

- [ ] Update blog and tarot routes to use shared taxonomy endpoints
- [ ] Test all endpoints

**Files Changed:** 10 new, 2 deleted
**Risk:** Medium (many files, but logic unchanged)

---

### Phase 5: Create Service Layer (Day 9-11)

**Objective:** Extract business logic from routes into services

**Tasks:**
- [ ] Create `server/src/services/content/ContentService.ts`
  ```typescript
  export abstract class ContentService<T> {
    protected abstract tableName: string
    protected abstract cachePrefix: string

    async findById(id: string): Promise<T | null>
    async findBySlug(slug: string): Promise<T | null>
    async list(params: ListParams): Promise<PaginatedResult<T>>
    async create(data: CreateInput): Promise<T>
    async update(id: string, data: UpdateInput): Promise<T>
    async softDelete(id: string): Promise<void>
    async restore(id: string): Promise<void>
    async permanentDelete(id: string): Promise<void>
    protected async invalidateCache(slug?: string): Promise<void>
  }
  ```

- [ ] Create `server/src/services/content/BlogService.ts`
- [ ] Create `server/src/services/content/TarotService.ts`
- [ ] Create `server/src/services/TaxonomyService.ts`
- [ ] Create `server/src/services/MediaService.ts`
- [ ] Update routes to use services
- [ ] Test all operations

**Files Changed:** 5 new, 4 modified
**Risk:** Medium

---

### Phase 6: Split Frontend Components (Day 12-14)

**Objective:** Make AdminTarotArticles modular like AdminBlog

**Tasks:**
- [ ] Create `components/admin/tarot-articles/` directory
- [ ] Extract `ArticlesTab.tsx` from AdminTarotArticles
- [ ] Extract `TarotImportTab.tsx` (JSON import feature)
- [ ] Extract `TrashTab.tsx`
- [ ] Create `hooks/useArticleList.ts`
- [ ] Create `hooks/useArticleForm.ts` (with client validation)
- [ ] Create `hooks/useReorder.ts`
- [ ] Slim down `AdminTarotArticles.tsx` to tab container only
- [ ] Test all admin functionality

**Files Changed:** 8 new, 1 modified
**Risk:** Low

---

### Phase 7: Add Client-Side Validation (Day 15)

**Objective:** Provide instant feedback on form errors

**Tasks:**
- [ ] Implement validation in `useArticleForm.ts` hook
  ```typescript
  export function useArticleForm(article: TarotArticle) {
    const [errors, setErrors] = useState<Record<string, string>>({})

    const validate = (): boolean => {
      const newErrors: Record<string, string> = {}
      if (!article.title?.trim()) newErrors.title = 'Title is required'
      if (!article.slug?.trim()) newErrors.slug = 'Slug is required'
      if (!article.content?.trim()) newErrors.content = 'Content is required'
      // ... more validations
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    return { errors, validate, clearError }
  }
  ```

- [ ] Add visual error indicators to form fields
- [ ] Prevent save if validation fails
- [ ] Show toast with error summary
- [ ] Test validation UX

**Files Changed:** 3 modified
**Risk:** Low

---

### Phase 8: Update Frontend API Calls (Day 16)

**Objective:** Update apiService.ts for new taxonomy endpoints

**Tasks:**
- [ ] Add unified taxonomy functions
  ```typescript
  // Replace separate blog/tarot taxonomy calls
  export async function fetchCategories(token: string): Promise<Category[]>
  export async function createCategory(token: string, data: CategoryInput): Promise<Category>
  export async function updateCategory(token: string, id: string, data: CategoryInput): Promise<Category>
  export async function deleteCategory(token: string, id: string): Promise<void>
  // Same for tags
  ```

- [ ] Update admin components to use new endpoints
- [ ] Deprecate old `fetchTarotCategories`, `fetchBlogCategories`, etc.
- [ ] Test category/tag management in both admin UIs

**Files Changed:** 2 modified
**Risk:** Low

---

### Phase 9: Testing & Cleanup (Day 17-18)

**Objective:** Verify all functionality and remove dead code

**Tasks:**
- [ ] Test blog post CRUD (create, read, update, delete, restore)
- [ ] Test tarot article CRUD
- [ ] Test taxonomy management (shared)
- [ ] Test media upload
- [ ] Test public endpoints
- [ ] Test caching (verify invalidation works)
- [ ] Test reordering
- [ ] Remove deprecated code
- [ ] Update CLAUDE.md with new architecture
- [ ] Update docs/Tech_debt.md

**Files Changed:** Variable
**Risk:** Low

## API Changes Summary

### New Endpoints

```
# Unified Taxonomy
GET    /api/taxonomy/categories
POST   /api/taxonomy/categories
PATCH  /api/taxonomy/categories/:id
DELETE /api/taxonomy/categories/:id
GET    /api/taxonomy/tags
POST   /api/taxonomy/tags
PATCH  /api/taxonomy/tags/:id
DELETE /api/taxonomy/tags/:id
```

### Deprecated Endpoints (to remove after migration)

```
# Blog-specific taxonomy (replaced by /api/taxonomy/*)
GET    /api/blog/categories
POST   /api/blog/admin/categories
...

# Tarot-specific taxonomy (replaced by /api/taxonomy/*)
GET    /api/tarot-articles/admin/categories
POST   /api/tarot-articles/admin/categories
...
```

### Response Changes

Categories and tags in responses will include full objects instead of names:

```typescript
// Before
{
  categories: ["Major Arcana", "Love"],
  tags: ["relationships"]
}

// After
{
  categories: [
    { id: "uuid", name: "Major Arcana", slug: "major-arcana" },
    { id: "uuid", name: "Love", slug: "love" }
  ],
  tags: [
    { id: "uuid", name: "relationships", slug: "relationships" }
  ]
}
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Database migration fails | Run on staging first, prepare rollback script |
| Breaking API changes | Keep old endpoints working during transition |
| Frontend breaks | Test each admin feature after backend changes |
| Cache inconsistency | Clear all caches after deployment |
| Lost tarot taxonomy data | Backup before migration, verify counts match |

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Blog route file lines | 1,749 | ~400 per file |
| Tarot route file lines | 1,278 | ~300 per file |
| AdminTarotArticles lines | 1,045 | ~100 (container only) |
| Duplicate taxonomy CRUD | 2 implementations | 1 shared |
| Client-side validation | None | Required fields validated |
| Cache invalidation | Scattered | Centralized helper |

## Rollback Plan

If critical issues arise:
1. Revert Prisma schema to previous version
2. Restore database from pre-migration backup
3. Revert route files to old monolithic versions
4. Redeploy previous frontend build

## Timeline Summary

| Phase | Days | Cumulative |
|-------|------|------------|
| 1. Bug fix | 1 | 1 |
| 2. Extract utilities | 2 | 3 |
| 3. Database migration | 2 | 5 |
| 4. Split routes | 3 | 8 |
| 5. Service layer | 3 | 11 |
| 6. Split frontend | 3 | 14 |
| 7. Client validation | 1 | 15 |
| 8. Update API calls | 1 | 16 |
| 9. Testing & cleanup | 2 | 18 |

**Total estimated effort: 18 days**

## Appendix: File Checklist

### Files to Create
- [ ] `server/src/services/CacheService.ts`
- [ ] `server/src/services/content/ContentService.ts`
- [ ] `server/src/services/content/BlogService.ts`
- [ ] `server/src/services/content/TarotService.ts`
- [ ] `server/src/services/TaxonomyService.ts`
- [ ] `server/src/services/MediaService.ts`
- [ ] `server/src/lib/validation/blog.ts`
- [ ] `server/src/lib/validation/tarot.ts`
- [ ] `server/src/lib/tarot/sorting.ts`
- [ ] `server/src/lib/tarot/schema.ts`
- [ ] `server/src/routes/blog/index.ts`
- [ ] `server/src/routes/blog/posts.ts`
- [ ] `server/src/routes/blog/media.ts`
- [ ] `server/src/routes/blog/public.ts`
- [ ] `server/src/routes/tarot-articles/index.ts`
- [ ] `server/src/routes/tarot-articles/admin.ts`
- [ ] `server/src/routes/tarot-articles/public.ts`
- [ ] `server/src/routes/tarot-articles/trash.ts`
- [ ] `server/src/routes/taxonomy.ts`
- [ ] `server/scripts/migrate-taxonomy.ts`
- [ ] `components/admin/tarot-articles/AdminTarotArticles.tsx`
- [ ] `components/admin/tarot-articles/ArticlesTab.tsx`
- [ ] `components/admin/tarot-articles/TarotImportTab.tsx`
- [ ] `components/admin/tarot-articles/TrashTab.tsx`
- [ ] `components/admin/tarot-articles/hooks/useArticleList.ts`
- [ ] `components/admin/tarot-articles/hooks/useArticleForm.ts`
- [ ] `components/admin/tarot-articles/hooks/useReorder.ts`

### Files to Delete
- [ ] `server/src/routes/blog.ts` (after split complete)
- [ ] `server/src/routes/tarot-articles.ts` (after split complete)

### Files to Modify
- [ ] `server/prisma/schema.prisma`
- [ ] `services/apiService.ts`
- [ ] `CLAUDE.md`
- [ ] `docs/Tech_debt.md`

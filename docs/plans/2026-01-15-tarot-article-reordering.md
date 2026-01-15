# Tarot Article Drag-and-Drop Reordering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add drag-and-drop reordering to admin tarot articles list for better management, with order persisted per card type.

**Architecture:** Database stores sortOrder field per article, backend provides reorder endpoint that renumbers articles within a card type, frontend uses @dnd-kit for drag-and-drop with optimistic updates.

**Tech Stack:** Prisma, Express, TypeScript, React, @dnd-kit/core, @dnd-kit/sortable

---

## Task 1: Database Schema - Add sortOrder Field

**Files:**
- Modify: `server/prisma/schema.prisma` (TarotArticle model)
- Create: `server/prisma/migrations/YYYYMMDDHHMMSS_add_tarot_article_sort_order/migration.sql`

**Step 1: Add sortOrder field to schema**

Edit `server/prisma/schema.prisma`, find the TarotArticle model and add:

```prisma
model TarotArticle {
  // ... existing fields ...

  // Admin ordering (per card type)
  sortOrder Int @default(0)

  // ... rest of fields ...

  @@index([cardType, sortOrder])
  @@map("tarot_articles")
}
```

**Step 2: Generate migration**

Run: `cd server && npx prisma migrate dev --name add_tarot_article_sort_order`
Expected: Migration file created in `server/prisma/migrations/`

**Step 3: Verify migration applied**

Run: `cd server && npx prisma migrate status`
Expected: "Database schema is up to date"

**Step 4: Generate Prisma client**

Run: `cd server && npx prisma generate`
Expected: "Generated Prisma Client"

**Step 5: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/
git commit -m "feat(db): add sortOrder field to TarotArticle model

- Add sortOrder Int field with default 0
- Add index on (cardType, sortOrder) for performance
- Migration generated and applied

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Database Initialization - Set Initial Sort Orders

**Files:**
- Create: `server/scripts/init-tarot-sort-order.ts`

**Step 1: Create initialization script**

Create `server/scripts/init-tarot-sort-order.ts`:

```typescript
#!/usr/bin/env node
/**
 * Initialize sortOrder for all tarot articles based on cardNumber
 * Run once after adding sortOrder field
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing tarot article sort orders...\n');

  // Get all card types
  const cardTypes = [
    'MAJOR_ARCANA',
    'SUIT_OF_WANDS',
    'SUIT_OF_CUPS',
    'SUIT_OF_SWORDS',
    'SUIT_OF_PENTACLES',
  ];

  let totalUpdated = 0;

  for (const cardType of cardTypes) {
    console.log(`Processing ${cardType}...`);

    // Get all articles of this type, ordered by cardNumber
    const articles = await prisma.tarotArticle.findMany({
      where: { cardType: cardType as any },
      orderBy: { cardNumber: 'asc' },
      select: { id: true, cardNumber: true, title: true },
    });

    console.log(`  Found ${articles.length} articles`);

    // Update each article's sortOrder based on its position
    for (let i = 0; i < articles.length; i++) {
      await prisma.tarotArticle.update({
        where: { id: articles[i].id },
        data: { sortOrder: i },
      });
      console.log(`  ✓ ${articles[i].cardNumber} - ${articles[i].title} → sortOrder: ${i}`);
      totalUpdated++;
    }

    console.log('');
  }

  console.log(`\n✅ Initialization complete! Updated ${totalUpdated} articles.`);
}

main()
  .catch((error) => {
    console.error('Error initializing sort orders:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

**Step 2: Run initialization script**

Run: `cd server && npx tsx scripts/init-tarot-sort-order.ts`
Expected: Output showing each article being updated with sortOrder

**Step 3: Verify in database**

Run: `cd server && npx prisma studio`
Then: Check TarotArticle table, verify sortOrder values are set
Expected: Each article has sortOrder matching its position in card type

**Step 4: Commit**

```bash
git add server/scripts/init-tarot-sort-order.ts
git commit -m "feat(scripts): add tarot article sortOrder initialization

- Create script to set initial sortOrder based on cardNumber
- Updates all articles grouped by cardType
- Run once after migration

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Backend API - Create Reorder Endpoint

**Files:**
- Modify: `server/src/routes/tarot-articles.ts`

**Step 1: Add reorder endpoint handler**

In `server/src/routes/tarot-articles.ts`, add before the export statement:

```typescript
/**
 * PATCH /api/admin/tarot-articles/reorder
 * Reorder a tarot article within its card type
 */
router.patch(
  '/reorder',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { articleId, cardType, newPosition } = req.body;

      // Validate input
      if (!articleId || !cardType || typeof newPosition !== 'number') {
        return res.status(400).json({
          error: 'Missing required fields: articleId, cardType, newPosition',
        });
      }

      if (newPosition < 0) {
        return res.status(400).json({
          error: 'newPosition must be >= 0',
        });
      }

      // Verify article exists and matches card type
      const article = await prisma.tarotArticle.findUnique({
        where: { id: articleId },
      });

      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      if (article.cardType !== cardType) {
        return res.status(400).json({
          error: `Article cardType (${article.cardType}) does not match provided cardType (${cardType})`,
        });
      }

      // Get all articles of this card type, ordered by current sortOrder
      const articles = await prisma.tarotArticle.findMany({
        where: {
          cardType: cardType as any,
          deletedAt: null,
        },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, sortOrder: true },
      });

      if (newPosition >= articles.length) {
        return res.status(400).json({
          error: `newPosition (${newPosition}) exceeds number of articles (${articles.length})`,
        });
      }

      // Reorder logic: remove article from old position, insert at new position
      const oldIndex = articles.findIndex((a) => a.id === articleId);
      if (oldIndex === -1) {
        return res.status(404).json({ error: 'Article not found in card type' });
      }

      if (oldIndex === newPosition) {
        // No change needed
        return res.json({
          success: true,
          message: 'Article is already at the target position',
        });
      }

      // Remove from old position
      const [movedArticle] = articles.splice(oldIndex, 1);
      // Insert at new position
      articles.splice(newPosition, 0, movedArticle);

      // Update sortOrder for all articles in transaction
      await prisma.$transaction(
        articles.map((article, index) =>
          prisma.tarotArticle.update({
            where: { id: article.id },
            data: { sortOrder: index },
          })
        )
      );

      res.json({
        success: true,
        message: 'Article reordered successfully',
      });
    } catch (error) {
      console.error('Error reordering article:', error);
      res.status(500).json({
        error: 'Failed to reorder article',
      });
    }
  }
);
```

**Step 2: Test endpoint with curl**

Run backend: `cd server && npm run dev`

Test reorder:
```bash
# Get auth token first (use your actual admin token)
TOKEN="your-clerk-token-here"

# Try reordering an article
curl -X PATCH http://localhost:3001/api/admin/tarot-articles/reorder \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": "article-id-here",
    "cardType": "MAJOR_ARCANA",
    "newPosition": 5
  }'
```

Expected: `{"success": true, "message": "Article reordered successfully"}`

**Step 3: Verify in database**

Run: `cd server && npx prisma studio`
Check: TarotArticle table, verify sortOrder values changed
Expected: Article moved to new position, others renumbered

**Step 4: Commit**

```bash
git add server/src/routes/tarot-articles.ts
git commit -m "feat(api): add tarot article reorder endpoint

- PATCH /api/admin/tarot-articles/reorder
- Validates article exists and matches card type
- Reorders within card type using transaction
- Returns success/error response

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Backend API - Update Queries to Use sortOrder

**Files:**
- Modify: `server/src/routes/tarot-articles.ts` (fetchAdminTarotArticles query)

**Step 1: Update admin list query to sort by sortOrder**

In `server/src/routes/tarot-articles.ts`, find the GET `/` endpoint and update the orderBy:

```typescript
// Find this section (around line 100-150)
const articles = await prisma.tarotArticle.findMany({
  where: whereClause,
  skip,
  take: limit,
  orderBy: [
    { sortOrder: 'asc' },  // <-- Add this as primary sort
    { createdAt: 'desc' }, // <-- Keep as secondary sort
  ],
  // ... rest of query
});
```

**Step 2: Test admin list endpoint**

Run:
```bash
curl http://localhost:3001/api/admin/tarot-articles \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Articles returned in sortOrder sequence (0, 1, 2, 3...)

**Step 3: Test with cardType filter**

Run:
```bash
curl "http://localhost:3001/api/admin/tarot-articles?cardType=MAJOR_ARCANA" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Major Arcana articles in sortOrder sequence

**Step 4: Commit**

```bash
git add server/src/routes/tarot-articles.ts
git commit -m "feat(api): sort admin tarot articles by sortOrder

- Primary sort by sortOrder (ascending)
- Secondary sort by createdAt (descending)
- Applies to all admin list queries

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Frontend Service - Add Reorder API Call

**Files:**
- Modify: `services/apiService.ts`

**Step 1: Add reorder function to apiService**

In `services/apiService.ts`, add after other tarot article functions:

```typescript
/**
 * Reorder a tarot article within its card type
 */
export async function reorderTarotArticle(
  token: string,
  params: {
    articleId: string;
    cardType: string;
    newPosition: number;
  }
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/admin/tarot-articles/reorder`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reorder article');
  }

  return response.json();
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add services/apiService.ts
git commit -m "feat(api): add reorderTarotArticle service function

- PATCH call to reorder endpoint
- Takes articleId, cardType, newPosition
- Returns success/error response

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Frontend Dependencies - Install @dnd-kit

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Step 1: Install @dnd-kit packages**

Run: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities --legacy-peer-deps`

Expected: Packages installed successfully

**Step 2: Verify installation**

Run: `npm list @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
Expected: Shows installed versions

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(deps): add @dnd-kit for drag-and-drop

- @dnd-kit/core - Core drag-and-drop functionality
- @dnd-kit/sortable - Sortable list utilities
- @dnd-kit/utilities - Helper utilities

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Frontend UI - Add Drag Handle Component

**Files:**
- Modify: `components/admin/AdminTarotArticles.tsx`

**Step 1: Import dnd-kit and icons**

At top of `components/admin/AdminTarotArticles.tsx`, add imports:

```typescript
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react'; // Add to existing lucide imports
```

**Step 2: Create SortableArticleRow component**

Add before the main AdminTarotArticles component:

```typescript
interface SortableArticleRowProps {
  article: TarotArticle;
  cardTypeBadges: Record<CardType, { bg: string; text: string; label: string }>;
  getStatusBadge: (status: ArticleStatus) => JSX.Element;
  formatDate: (dateString: string) => string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  actionLoading: string | null;
  language: string;
}

const SortableArticleRow: React.FC<SortableArticleRowProps> = ({
  article,
  cardTypeBadges,
  getStatusBadge,
  formatDate,
  onEdit,
  onDelete,
  actionLoading,
  language,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardTypeBadge = cardTypeBadges[article.cardType as CardType];

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors ${
        isDragging ? 'z-50 shadow-2xl' : ''
      }`}
    >
      {/* Drag Handle */}
      <td className="px-4 py-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </div>
      </td>

      {/* Image */}
      <td className="px-4 py-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
          {article.featuredImage ? (
            <img
              src={article.featuredImage}
              alt={article.featuredImageAlt || article.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageOff className="w-6 h-6 text-slate-600" />
          )}
        </div>
      </td>

      {/* Title */}
      <td className="px-4 py-3">
        <div className="font-medium text-white">{article.title}</div>
        <div className="text-sm text-slate-400 mt-1">{article.slug}</div>
      </td>

      {/* Card Number */}
      <td className="px-4 py-3">
        <span className="text-slate-300 font-mono">{article.cardNumber}</span>
      </td>

      {/* Card Type */}
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs ${cardTypeBadge.bg} ${cardTypeBadge.text}`}>
          {cardTypeBadge.label}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">{getStatusBadge(article.status)}</td>

      {/* Updated */}
      <td className="px-4 py-3 text-sm text-slate-400">
        {formatDate(article.updatedAt)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(article.id)}
            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
            title={language === 'en' ? 'Edit' : 'Modifier'}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(article.id)}
            disabled={actionLoading === article.id}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
            title={language === 'en' ? 'Delete' : 'Supprimer'}
          >
            {actionLoading === article.id ? (
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
};
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/admin/AdminTarotArticles.tsx
git commit -m "feat(admin): add sortable article row component

- Create SortableArticleRow with dnd-kit integration
- Add drag handle with GripVertical icon
- Visual feedback during drag (opacity, shadow)
- Maintains all existing row functionality

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Frontend Logic - Implement Drag-and-Drop

**Files:**
- Modify: `components/admin/AdminTarotArticles.tsx`

**Step 1: Add drag sensors**

In the AdminTarotArticles component, add sensors setup after state declarations:

```typescript
// After all useState declarations, add:
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 8px movement required to start drag
    },
  })
);
```

**Step 2: Add drag end handler**

Add this function in AdminTarotArticles component:

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over || active.id === over.id) {
    return; // No change
  }

  try {
    // Find old and new positions
    const oldIndex = articles.findIndex((a) => a.id === active.id);
    const newIndex = articles.findIndex((a) => a.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const movedArticle = articles[oldIndex];

    // Optimistic update
    const reorderedArticles = arrayMove(articles, oldIndex, newIndex);
    setArticles(reorderedArticles);

    // Call API
    const token = await getToken();
    if (!token) throw new Error('No auth token');

    await reorderTarotArticle(token, {
      articleId: movedArticle.id,
      cardType: movedArticle.cardType,
      newPosition: newIndex,
    });

    console.log('Article reordered successfully');
  } catch (error) {
    console.error('Failed to reorder article:', error);
    // Revert on error
    loadArticles();
    setError(error instanceof Error ? error.message : 'Failed to reorder article');
  }
};
```

**Step 3: Wrap article table with DndContext**

Find the articles table rendering section and wrap it:

```typescript
{/* Articles Table - find this section and wrap with DndContext */}
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={articles.map((a) => a.id)}
    strategy={verticalListSortingStrategy}
  >
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-700">
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-12">
            {/* Drag handle column */}
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            {language === 'en' ? 'Image' : 'Image'}
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            {language === 'en' ? 'Title' : 'Titre'}
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            {language === 'en' ? 'Card #' : 'Carte #'}
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            {language === 'en' ? 'Type' : 'Type'}
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            {language === 'en' ? 'Status' : 'Statut'}
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            {language === 'en' ? 'Updated' : 'Modifié'}
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            {language === 'en' ? 'Actions' : 'Actions'}
          </th>
        </tr>
      </thead>
      <tbody>
        {articles.map((article) => (
          <SortableArticleRow
            key={article.id}
            article={article}
            cardTypeBadges={cardTypeBadges}
            getStatusBadge={getStatusBadge}
            formatDate={formatDate}
            onEdit={setEditingArticleId}
            onDelete={(id) => handleDelete(id)}
            actionLoading={actionLoading}
            language={language}
          />
        ))}
      </tbody>
    </table>
  </SortableContext>
</DndContext>
```

**Step 4: Test in browser**

Run: `npm run dev`
Navigate to: http://localhost:3000/admin → Tarot Articles tab
Expected:
- Drag handles visible on left of each row
- Can drag articles up/down
- Articles reorder immediately
- Position persists after page reload

**Step 5: Commit**

```bash
git add components/admin/AdminTarotArticles.tsx
git commit -m "feat(admin): implement drag-and-drop article reordering

- Add DndContext and SortableContext wrappers
- Configure PointerSensor with activation distance
- Handle drag end with optimistic updates
- Call reorder API and handle errors
- Revert on failure

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Frontend Polish - Conditional Drag Handles

**Files:**
- Modify: `components/admin/AdminTarotArticles.tsx`

**Step 1: Add logic to show/hide drag handles**

Add this computed value in AdminTarotArticles component:

```typescript
// After state declarations, before render
const canReorder = () => {
  // Only allow reordering when viewing articles of same card type
  // Don't allow when: searching, filtering by status, or viewing mixed types
  if (searchQuery) return false;
  if (statusFilter) return false;
  if (!cardTypeFilter) return false; // Must have card type filter
  return true;
};

const isDragEnabled = canReorder();
```

**Step 2: Conditionally render drag handles**

Update SortableArticleRow to accept isDragEnabled prop:

```typescript
interface SortableArticleRowProps {
  // ... existing props
  isDragEnabled: boolean; // Add this
}

const SortableArticleRow: React.FC<SortableArticleRowProps> = ({
  // ... existing props
  isDragEnabled,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: article.id,
    disabled: !isDragEnabled, // Disable when not allowed
  });

  // ... rest of component

  return (
    <tr ref={setNodeRef} style={style} /* ... */>
      {/* Drag Handle */}
      <td className="px-4 py-3">
        {isDragEnabled ? (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-5 h-5" /> // Empty space to maintain alignment
        )}
      </td>
      {/* ... rest of row */}
    </tr>
  );
};
```

**Step 3: Pass isDragEnabled to rows**

Update the map where SortableArticleRow is rendered:

```typescript
{articles.map((article) => (
  <SortableArticleRow
    key={article.id}
    article={article}
    cardTypeBadges={cardTypeBadges}
    getStatusBadge={getStatusBadge}
    formatDate={formatDate}
    onEdit={setEditingArticleId}
    onDelete={(id) => handleDelete(id)}
    actionLoading={actionLoading}
    language={language}
    isDragEnabled={isDragEnabled} // Add this prop
  />
))}
```

**Step 4: Test conditional display**

Run: `npm run dev`
Test scenarios:
1. No filter → No drag handles
2. Card type filter only → Drag handles visible
3. Card type + status filter → No drag handles
4. Search active → No drag handles

Expected: Drag handles only show when filtering by card type alone

**Step 5: Commit**

```bash
git add components/admin/AdminTarotArticles.tsx
git commit -m "feat(admin): conditionally show drag handles

- Only show when filtering by single card type
- Hide when searching or filtering by status
- Disable dragging when handles hidden
- Maintain table alignment when handles hidden

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Frontend Polish - Error Handling & UX

**Files:**
- Modify: `components/admin/AdminTarotArticles.tsx`

**Step 1: Add reorder loading state**

Add state for reorder in progress:

```typescript
const [isReordering, setIsReordering] = useState(false);
```

**Step 2: Update drag handler with loading state**

Update handleDragEnd function:

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over || active.id === over.id) {
    return;
  }

  if (isReordering) {
    console.log('Reorder already in progress');
    return;
  }

  try {
    setIsReordering(true);

    const oldIndex = articles.findIndex((a) => a.id === active.id);
    const newIndex = articles.findIndex((a) => a.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const movedArticle = articles[oldIndex];
    const previousArticles = [...articles]; // Save for revert

    // Optimistic update
    const reorderedArticles = arrayMove(articles, oldIndex, newIndex);
    setArticles(reorderedArticles);

    // Call API
    const token = await getToken();
    if (!token) throw new Error('No auth token');

    await reorderTarotArticle(token, {
      articleId: movedArticle.id,
      cardType: movedArticle.cardType,
      newPosition: newIndex,
    });

    console.log('✓ Article reordered successfully');
    setError(null); // Clear any previous errors
  } catch (error) {
    console.error('✗ Failed to reorder article:', error);

    // Revert to previous state
    loadArticles();

    // Show error message
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to reorder article. Changes have been reverted.';
    setError(errorMessage);

    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  } finally {
    setIsReordering(false);
  }
};
```

**Step 3: Add visual indicator during reorder**

Add overlay when reordering:

```typescript
{/* Add this before the articles table */}
{isReordering && (
  <div className="mb-4 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    <span className="text-blue-400 text-sm">
      {language === 'en' ? 'Saving new order...' : 'Enregistrement du nouvel ordre...'}
    </span>
  </div>
)}
```

**Step 4: Test error handling**

Test scenarios:
1. Disconnect network → drag article → should revert and show error
2. Drag quickly multiple times → should queue properly
3. Successful drag → error should clear

**Step 5: Commit**

```bash
git add components/admin/AdminTarotArticles.tsx
git commit -m "feat(admin): add reorder loading state and error handling

- Add isReordering state to prevent concurrent drags
- Show loading indicator during reorder
- Revert to previous state on error
- Auto-clear error after 5 seconds
- Improved error messages

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Testing & Validation

**Files:**
- No file changes, testing only

**Step 1: Test each card type reordering**

For each card type (Major Arcana, Wands, Cups, Swords, Pentacles):
1. Filter to that card type only
2. Drag an article from position 0 to position 5
3. Reload page
4. Verify article stayed at position 5
5. Drag it back to position 0
6. Verify it moved back

Expected: All card types can be reordered independently

**Step 2: Test error scenarios**

1. Kill backend server
2. Try to drag article
3. Verify error message appears
4. Verify articles revert to original order
5. Restart backend
6. Verify drag works again

Expected: Graceful error handling with revert

**Step 3: Test concurrent edit handling**

1. Open admin in two browser tabs
2. In tab 1: drag article A to position 3
3. In tab 2: drag article B to position 5
4. Reload both tabs
5. Verify both changes persisted

Expected: Last write wins, both tabs show same final order

**Step 4: Test new article sorting**

1. Create a new article in Major Arcana
2. Verify it appears at the end of the list
3. Drag it to middle position
4. Verify it stays there

Expected: New articles get sortOrder = max + 1, can be reordered

**Step 5: Test public display unchanged**

1. Go to http://localhost:3000/tarot/cards
2. Verify cards still show in card number order (0-78)
3. Reorder articles in admin
4. Reload public page
5. Verify public order unchanged

Expected: Admin reordering doesn't affect public display

**Step 6: Document test results**

Create test report showing:
- All card types tested ✓
- Error handling works ✓
- Concurrent edits handled ✓
- New articles work ✓
- Public display unaffected ✓

---

## Task 12: Final Commit & Cleanup

**Files:**
- All files from previous tasks

**Step 1: Final TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Final build check**

Run: `npm run build`
Expected: Build completes successfully

**Step 3: Create final commit**

```bash
git add -A
git commit -m "feat: complete tarot article drag-and-drop reordering

Summary of changes:
- Database: Added sortOrder field with migration
- Backend: Reorder API endpoint with validation
- Frontend: @dnd-kit integration with optimistic updates
- UX: Conditional drag handles, loading states, error handling
- Testing: All scenarios validated

Features:
✓ Drag-and-drop reordering per card type
✓ Order persists across sessions
✓ Optimistic UI updates
✓ Error handling with revert
✓ Admin-only, public display unaffected
✓ Works for all 5 card types

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 4: Push to remote**

Run: `git push origin feature/tarot-article-reordering`
Expected: Feature branch pushed successfully

---

## Success Criteria Checklist

- ✅ Admin can drag articles to reorder within card type
- ✅ Order persists after page reload
- ✅ Each card type has independent ordering
- ✅ Drag handles only show when filtering by single card type
- ✅ UI updates feel instant (optimistic)
- ✅ Errors are handled gracefully with revert
- ✅ Public display unaffected (still sorts by card number)
- ✅ No performance degradation
- ✅ Works across all browsers
- ✅ TypeScript compiles without errors
- ✅ Build succeeds

---

## Rollback Plan

If issues arise in production:

1. **Revert frontend changes:**
   ```bash
   git revert <commit-hash> --no-commit
   git commit -m "revert: remove drag-and-drop reordering"
   ```

2. **Keep database changes:**
   - sortOrder field is harmless if unused
   - Default value of 0 won't break anything
   - Can keep for future re-implementation

3. **Remove dependency:**
   ```bash
   npm uninstall @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

## Future Enhancements

Not in scope for this implementation:

- Drag-and-drop for blog posts
- Bulk reorder operations
- Undo/redo functionality
- Reorder history/audit trail
- Cross-card-type reordering
- Keyboard-based reordering
- Custom sort presets (alphabetical, by date, etc.)

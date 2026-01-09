# Admin Tarot Articles Management - Design Document

**Date:** 2026-01-09
**Status:** Approved
**Author:** Claude Code

## Overview

Create a comprehensive admin interface for managing tarot articles with list view, filters, search, and quick actions. All article creation and editing flows through the validated Import Article interface to maintain content quality standards.

## Requirements

- List all tarot articles (draft and published) with pagination
- Filter by card type and status
- Search by title or slug
- Quick actions: Preview, Edit, Publish/Unpublish, Delete
- Display article thumbnails, metadata, and stats
- Integrate with existing Import Article interface for editing
- Match AdminBlog component patterns and styling

## Component Structure

### AdminTarotArticles Component

**Location:** `components/admin/AdminTarotArticles.tsx`

**Props:**
```typescript
interface AdminTarotArticlesProps {
  onNavigateToImport: (articleId: string) => void;
}
```

**State Management:**
```typescript
// Articles list
const [articles, setArticles] = useState<TarotArticle[]>([]);
const [loading, setLoading] = useState(true);
const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
});

// Filters
const [searchQuery, setSearchQuery] = useState('');
const [statusFilter, setStatusFilter] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | ''>('');
const [cardTypeFilter, setCardTypeFilter] = useState<CardType | ''>('');

// Actions
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
const [actionLoading, setActionLoading] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);
```

**Key Features:**
- Single main view (no tabs - simpler than AdminBlog)
- Debounced search (500ms delay)
- Filter by card type and status
- Pagination with Previous/Next buttons
- Quick actions on each row
- Confirmation modal for delete

## Visual Design

### Table Layout

**Columns:**
1. **Thumbnail** (80x80px)
   - Featured image rounded-lg
   - Fallback to card type icon if no image

2. **Article Info**
   - Title (slate-200, font-medium, clickable)
   - Slug (slate-500, text-sm)
   - Card type badge (inline)

3. **Status**
   - Badge with icon and color
   - DRAFT (amber), PUBLISHED (green), ARCHIVED (slate)

4. **Stats**
   - Word count (extracted from content)
   - Published date (if published)

5. **Actions**
   - Icon buttons with hover states
   - Preview, Edit, Publish/Unpublish, Delete

### Card Type Badges

```typescript
const cardTypeBadges = {
  MAJOR_ARCANA: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    label: 'Major Arcana'
  },
  SUIT_OF_WANDS: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    label: 'Wands'
  },
  SUIT_OF_CUPS: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    label: 'Cups'
  },
  SUIT_OF_SWORDS: {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    label: 'Swords'
  },
  SUIT_OF_PENTACLES: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    label: 'Pentacles'
  },
};
```

### Status Badges

```typescript
const statusBadges = {
  DRAFT: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    icon: FileText
  },
  PUBLISHED: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    icon: CheckCircle
  },
  ARCHIVED: {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    icon: Archive
  },
};
```

### Color Scheme

Following existing admin component patterns:
- **Background:** slate-900/60 with purple-500/20 borders
- **Hover:** slate-800/30 background
- **Primary accent:** purple-500/600
- **Success:** green-400/500
- **Warning:** amber-400/500
- **Danger:** red-400/500

## Filter Bar

**Layout (horizontal flex):**

```
[Search Input........................] [Card Type ▼] [Status ▼] [Go to Import →]
```

**Search Input:**
- Placeholder: "Search by title or slug..."
- Debounced 500ms
- Triggers refetch on change
- Search icon (lucide-react)

**Card Type Dropdown:**
- Options: All Types, Major Arcana, Wands, Cups, Swords, Pentacles
- Maps to database enum values
- Updates filter state

**Status Dropdown:**
- Options: All Status, Draft, Published, Archived
- Maps to database enum values
- Updates filter state

**Go to Import Button:**
- Calls `onNavigateToImport(null)`
- Purple background
- Upload icon

## Quick Actions

### 1. Preview (Eye icon)
- **Visibility:** Only shown if status is PUBLISHED
- **Action:** Opens `/tarot/articles/:slug` in new tab
- **Styling:** Grey icon, green hover
- **Title:** "Preview" / "Aperçu"

### 2. Edit (Edit2 icon)
- **Visibility:** Always shown
- **Action:** Calls `onNavigateToImport(article.id)`
- **Styling:** Purple icon, purple hover
- **Title:** "Edit" / "Modifier"

### 3. Publish/Unpublish (CheckCircle/XCircle icon)
- **Visibility:** Always shown
- **Logic:**
  - If DRAFT → Button shows "Publish", changes status to PUBLISHED
  - If PUBLISHED → Button shows "Unpublish", changes status to DRAFT
  - If ARCHIVED → Button shows "Publish", changes status to PUBLISHED
- **Action:** PATCH `/api/tarot-articles/admin/:id` with new status
- **Styling:** Green for publish, amber for unpublish
- **Loading:** Show spinner during request
- **Title:** "Publish" / "Publier" or "Unpublish" / "Dépublier"

### 4. Delete (Trash2 icon)
- **Visibility:** Always shown
- **Action:** Opens confirmation modal
- **Modal:**
  - Title: "Delete Article?" / "Supprimer l'article?"
  - Message: "Delete '[Article Title]'? This action cannot be undone."
  - Buttons: Cancel (slate), Delete (red)
- **API:** DELETE `/api/tarot-articles/admin/:id`
- **Styling:** Red icon, red hover
- **Title:** "Delete" / "Supprimer"

## Pagination

**Layout:**
```
Showing 20 of 78 articles        [←] 2 / 4 [→]
```

**Features:**
- Shows current count and total
- Page number and total pages
- Previous button (disabled on page 1)
- Next button (disabled on last page)
- Matches AdminBlog pagination exactly

## API Integration

### New API Service Functions

Add to `services/apiService.ts`:

```typescript
// Fetch admin list with filters
export async function fetchAdminTarotArticles(
  token: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    cardType?: string;
    status?: string;
  }
): Promise<{
  articles: TarotArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.cardType) queryParams.set('cardType', params.cardType);
  if (params.status) queryParams.set('status', params.status);

  return apiRequest(
    `/api/tarot-articles/admin/list?${queryParams.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

// Get single article for editing
export async function fetchAdminTarotArticle(
  token: string,
  id: string
): Promise<TarotArticle> {
  return apiRequest(`/api/tarot-articles/admin/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Quick publish/unpublish
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

// Note: deleteTarotArticle already exists
```

### Backend Enhancement Needed

**New Endpoint:** GET `/api/tarot-articles/admin/:id`

Add to `server/src/routes/tarot-articles.ts`:

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
    console.error('Error fetching tarot article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});
```

Also update the existing `/admin/list` endpoint to support search:

```typescript
// Add to where clause
if (params.search) {
  where.OR = [
    { title: { contains: params.search, mode: 'insensitive' } },
    { slug: { contains: params.search, mode: 'insensitive' } },
  ];
}
```

## Error Handling

**Loading States:**
- **Initial load:** Full-page spinner (matching AdminBlog)
- **Action loading:** Disable action buttons + show spinner icon on button
- **Search/filter:** Keep table visible with semi-transparent overlay

**Error Display:**
- Show error message in red banner at top of component
- Auto-dismiss after 5 seconds
- Provide "Dismiss" button

**API Failures:**
- Catch all API errors in try/catch
- Display user-friendly error messages
- Log detailed errors to console
- Revert optimistic UI updates on failure

**Confirmation Modals:**
- Delete action requires confirmation
- Modal matches existing admin component styling
- Danger button (red) for destructive action

## Parent Integration

### AdminDashboard Updates

**Add New Tab:**
```typescript
{
  id: 'tarot-articles',
  labelEn: 'Tarot Articles',
  labelFr: 'Articles Tarot',
  icon: <FileText className="w-4 h-4" />
}
```

**Add State:**
```typescript
const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
```

**Render Component:**
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

**Pass to ImportArticle:**
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

### ImportArticle Enhancements

**Update Props:**
```typescript
interface ImportArticleProps {
  editingArticleId?: string | null;
  onCancelEdit?: () => void;
}
```

**Edit Mode Logic:**

1. **On Mount:**
   - If `editingArticleId` exists, fetch article data
   - Pre-fill JSON textarea with formatted article data
   - Show banner: "Editing: [Article Title]"
   - Change button text: "Update Article" instead of "Import"

2. **On Submit:**
   - If editing mode, call PATCH `/api/tarot-articles/admin/:id`
   - If import mode, call POST `/api/tarot-articles/admin/import`
   - On success, call `onCancelEdit()` to return to list

3. **Cancel Button:**
   - Show "Cancel" button next to "Update Article"
   - Calls `onCancelEdit()` prop
   - Clears editing state and returns to Tarot Articles tab

**Data Conversion:**
- Fetch full article from backend
- Convert Prisma enum keys back to display names (MAJOR_ARCANA → "Major Arcana")
- Format as JSON for textarea
- Handle schemaJson object → leave as-is (user shouldn't edit)

## Navigation Flow

**Create New Article:**
1. User clicks "Go to Import" → Navigate to Import tab (no editing ID)
2. User pastes JSON, validates, imports
3. Success → Stay on Import tab or navigate to Tarot Articles tab

**Edit Existing Article:**
1. User clicks "Edit" on article row → Navigate to Import tab with article ID
2. ImportArticle fetches article, pre-fills JSON textarea
3. User modifies JSON, validates, clicks "Update Article"
4. Success → Clear editing state, navigate back to Tarot Articles tab
5. List refreshes automatically to show updated article

**Quick Actions:**
1. User clicks "Publish" → Status changes immediately (optimistic)
2. API call completes → Confirm or revert
3. User clicks "Delete" → Show confirmation modal
4. User confirms → Article deleted, list refreshes

## Utility Functions

**Word Count Calculator:**
```typescript
function getWordCount(htmlContent: string): number {
  // Strip HTML tags
  const text = htmlContent.replace(/<[^>]*>/g, ' ');
  // Count words
  const words = text.trim().split(/\s+/);
  return words.filter(word => word.length > 0).length;
}
```

**Format Date:**
```typescript
function formatDate(dateString: string, language: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
```

## Dependencies

**Existing:**
- `@clerk/clerk-react` - Authentication
- `lucide-react` - Icons
- `framer-motion` - Animations (optional for modals)

**No New Dependencies Required**

## Testing Checklist

- [ ] List loads with pagination
- [ ] Search filters by title and slug
- [ ] Card type filter works correctly
- [ ] Status filter works correctly
- [ ] Filters combine correctly (AND logic)
- [ ] Preview opens published articles
- [ ] Edit navigates to Import with pre-filled data
- [ ] Publish changes status from DRAFT to PUBLISHED
- [ ] Unpublish changes status from PUBLISHED to DRAFT
- [ ] Delete shows confirmation and removes article
- [ ] Pagination previous/next works
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Bilingual support (EN/FR)
- [ ] Optimistic UI updates and reverts on error
- [ ] Cancel edit returns to list without saving

## Future Enhancements

**Not in scope for initial implementation:**
- Bulk actions (select multiple, publish all, delete all)
- Sorting by column (title, date, word count)
- Export to JSON
- Duplicate article
- Article versioning
- Preview unpublished articles (would need special route)
- Inline quick edit (change title/slug without full import flow)

## Success Criteria

1. ✅ Admin can view all tarot articles in one list
2. ✅ Admin can filter by card type and status
3. ✅ Admin can search by title or slug
4. ✅ Admin can quickly publish/unpublish articles
5. ✅ Admin can edit articles through validated import flow
6. ✅ Admin can delete articles with confirmation
7. ✅ Admin can preview published articles
8. ✅ Component matches existing admin styling
9. ✅ Bilingual support (EN/FR)
10. ✅ Loading and error states handled gracefully

---

**Next Steps:**
1. Create AdminTarotArticles component
2. Add API service functions
3. Enhance backend with GET single article endpoint and search
4. Update AdminDashboard integration
5. Enhance ImportArticle for editing mode
6. Test complete workflow

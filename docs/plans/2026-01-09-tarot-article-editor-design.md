# TarotArticleEditor Design Document

## Overview

Port Blog tab functionality to Tarot Articles tab with a visual editor for editing imported tarot articles.

## Architecture

### AdminTarotArticles Changes
- Replace current tabbed layout (Articles | Import Article) with sub-tabs: Articles | Categories | Tags | Media
- "Import JSON" becomes a button in header that opens ImportArticle as a modal
- Clicking an article row opens TarotArticleEditor (like BlogPostEditor)
- Keep existing trash/restore functionality in list view

### New TarotArticleEditor Component
Visual editor modeled after BlogPostEditor:
- **Top bar**: Back button, Preview, Save Draft, Publish/Unpublish toggle
- **Two-column layout**: Main editor (~70%) + Sidebar (~30%)
- **Main editor**: Title input, Excerpt textarea, Content editor (WYSIWYG only, no Markdown toggle)
- **Sidebar**: Collapsible sections

### Sidebar Sections

1. **Featured Image**
   - Image preview with upload/remove
   - Alt text input
   - "Choose from Media" button to open media picker
   - Media picker includes trash functionality (like Blog's "Insert image" modal)

2. **Categories & Tags**
   - Multi-select for categories (with inline "Add new" option)
   - Tag input with autocomplete (with inline "Add new" option)

3. **FAQ Manager**
   - List of Q&A pairs with edit/delete buttons
   - "Add FAQ" button
   - Inline editing for each question/answer

4. **Related Cards**
   - Multi-select or tag-style input for related card slugs

### Deferred (Not in Initial Implementation)
- Card Metadata section (cardType, cardNumber, element, astrological correspondence, court/challenge flags)
- SEO section (focus keyword, meta title, meta description)
- These fields remain editable only via JSON import for now

## Data Models

### Existing TarotArticle (no changes needed)
- categories: String[]
- tags: String[]
- Already supports all needed fields

### New Models Required

```prisma
model TarotCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TarotTag {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model TarotMedia {
  id          String    @id @default(cuid())
  filename    String
  url         String
  mimeType    String
  size        Int
  width       Int?
  height      Int?
  alt         String?
  caption     String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
}
```

## API Endpoints

### Tarot Categories
- GET /api/tarot-articles/admin/categories - List all
- POST /api/tarot-articles/admin/categories - Create
- PATCH /api/tarot-articles/admin/categories/:id - Update
- DELETE /api/tarot-articles/admin/categories/:id - Delete

### Tarot Tags
- GET /api/tarot-articles/admin/tags - List all
- POST /api/tarot-articles/admin/tags - Create
- PATCH /api/tarot-articles/admin/tags/:id - Update
- DELETE /api/tarot-articles/admin/tags/:id - Delete

### Tarot Media
- GET /api/tarot-articles/admin/media - List all (with trash filter)
- POST /api/tarot-articles/admin/media/upload - Upload
- PATCH /api/tarot-articles/admin/media/:id - Update (alt, caption)
- DELETE /api/tarot-articles/admin/media/:id - Soft delete (trash)
- POST /api/tarot-articles/admin/media/:id/restore - Restore from trash
- DELETE /api/tarot-articles/admin/media/:id/permanent - Permanent delete

## Component Structure

```
components/admin/
├── AdminTarotArticles.tsx      # Main container with sub-tabs
├── TarotArticleEditor.tsx      # Visual editor (NEW)
├── TarotArticlesList.tsx       # Articles list (refactored from current)
├── TarotCategoriesManager.tsx  # Categories CRUD (NEW)
├── TarotTagsManager.tsx        # Tags CRUD (NEW)
├── TarotMediaManager.tsx       # Media CRUD with trash (NEW)
├── TarotMediaPicker.tsx        # Modal for selecting/uploading media (NEW)
├── TarotFAQManager.tsx         # FAQ Q&A pairs manager (NEW)
└── ImportArticle.tsx           # Existing, used as modal
```

## Implementation Tasks

### Phase 1: Database & Backend
1. Add TarotCategory, TarotTag, TarotMedia models to Prisma schema
2. Run migration
3. Create categories CRUD routes
4. Create tags CRUD routes
5. Create media CRUD routes with upload handling

### Phase 2: Frontend - Infrastructure
6. Create TarotCategoriesManager component
7. Create TarotTagsManager component
8. Create TarotMediaManager component
9. Create TarotMediaPicker modal component
10. Refactor AdminTarotArticles to use sub-tabs layout

### Phase 3: Frontend - Editor
11. Create TarotFAQManager component
12. Create TarotArticleEditor component with:
    - Top bar with back/preview/save/publish
    - Title and excerpt inputs
    - RichTextEditor for content
    - Sidebar with collapsible sections
    - Featured image section with media picker
    - Categories & tags section
    - FAQ manager section
    - Related cards section
13. Wire up ImportArticle as modal triggered by button

### Phase 4: Integration & Polish
14. Connect editor save/publish to existing PATCH endpoint
15. Test full workflow: import → edit → publish
16. Ensure preview works from editor

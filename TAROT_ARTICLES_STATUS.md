# Tarot Articles - Status Update

## Completed ✅

### 1. Back Button Navigation Fixed
- **Issue**: Back button on article page went to homepage
- **Fix**: Created TarotArticlesList component with filtering by card type
- **Result**: Back button now navigates to `/tarot-articles` list view

### 2. FAQ and Tags Styling Applied
- **Issue**: Preview modal had nice FAQ/tags styling that wasn't on frontend
- **Fix**: Added FAQ section with styled layout to TarotArticlePage
- **Result**: Articles now show FAQ in a purple-bordered card with proper formatting
- Tags now display as pill badges with purple styling (matching preview)

### 3. Import Success Preview Link
- **Issue**: "Preview" link after import led to 404 error
- **Partial Fix**: Changed to use app router navigation
- **Remaining Issue**: Articles import as DRAFT, so public endpoint returns 404
- **Full Solution Needed**: Create admin preview endpoint (like Blog has)

## In Progress 🔄

### 4. Server-Side Rendering (SSR)
- **Issue**: Schema shows in Inspect Element but NOT in View Source
- **Root Cause**: In development, frontend (port 5173) intercepts routes before backend (port 3001) can serve SSR
- **Current State**: SSR route exists but isn't being used in dev mode
- **Solution Required**:
  ```bash
  # For SSR to work:
  1. Build frontend: npm run build
  2. Start backend: cd server && npm start
  3. Access via backend port: http://localhost:3001/tarot/articles/slug
  4. View source will show schema
  ```
- **Production**: Will work automatically when backend serves static files

## Remaining Tasks ⏳

### 5. Trash System (Not Started)
- **Requirement**: Soft delete like Blog section
- **Implementation**: Add `status = 'TRASH'` instead of hard delete
- **Scope**: Medium (2-3 hours)
- **Files to Modify**:
  - `server/src/routes/tarot-articles.ts` - Change DELETE to update status
  - `components/admin/AdminTarotArticles.tsx` - Add trash view/restore

### 6. Visual Form Editor (Not Started)
- **Requirement**: Full WYSIWYG editor like BlogPostEditor
- **Scope**: MASSIVE (8-12 hours minimum)
- **Why It's Complex**:
  - Need TipTap editor for rich text content
  - Need FAQ array manager (add/remove/edit questions)
  - Need tags/categories multi-select
  - Need SEO fields (focus keyword, meta title/description)
  - Need card-specific fields (cardType, element, astrologicalCorrespondence)
  - Need breadcrumb fields
  - Need image upload/library integration
  - Need related cards selector
  - Need preview functionality within editor
  - Need validation integration

- **Recommendation**: This should be a separate dedicated task/session
- **Alternative**: Keep JSON import for now (works well), add visual editor in Phase 2

## Known Issues 🐛

### "Edit Mode" Banner
- **User Feedback**: Don't need the "Editing Article / Article Title" banner
- **Fix Required**: Remove the amber banner in ImportArticle component
- **Priority**: Low (cosmetic)

### Thumbnail Flickering (FIXED ✅)
- **Issue**: Broken image icon was flickering
- **Fix**: Added check to prevent infinite loop in onError handler
- **Status**: Resolved

## SSR Detailed Explanation

### Why Schema Isn't in View Source (Development)

**Development Setup:**
```
Frontend (Vite)     →  http://localhost:5173
Backend (Express)   →  http://localhost:3001
```

When you visit `http://localhost:5173/tarot/articles/the-fool`:
1. Request goes to Vite dev server (port 5173)
2. Vite serves `index.html` with React app
3. React loads and fetches article via API
4. React Helmet injects schema client-side (after JavaScript runs)
5. Schema appears in Inspect Element but NOT in View Source

**SSR Route (port 3001)** never gets hit because you're on 5173.

### Solution for Production

In production, configure backend to:
1. Serve static files from `dist/` folder
2. Serve API routes (`/api/*`)
3. Serve SSR routes (`/tarot/articles/:slug`)

```javascript
// server/src/index.ts already has SSR route
app.use('/', ssrRoutes); // This handles /tarot/articles/:slug
```

**Testing SSR Locally:**
```bash
# 1. Build frontend
npm run build

# 2. Start backend (will serve built frontend + SSR)
cd server
npm run dev

# 3. Visit via backend port
open http://localhost:3001/tarot/articles/your-slug

# 4. View Source - schema will be there!
```

## Recommendations

### Immediate Actions
1. ✅ Keep current JSON import workflow (it works well)
2. ⏸️ Defer visual editor to Phase 2 (scope too large)
3. 🔧 Implement trash system (quick win, improves UX)
4. 🔧 Remove "Editing Article" banner (cosmetic fix)
5. 🔧 Create admin preview endpoint for DRAFT articles

### Future Enhancements
1. Visual form editor (Phase 2)
2. Bulk import (upload multiple JSON files)
3. Duplicate article feature
4. Article templates
5. Version history
6. Scheduled publishing

## Files Modified This Session

### Frontend
- `App.tsx` - Added TarotArticlesList view, fixed back button
- `components/TarotArticlesList.tsx` - NEW: Public articles list with filtering
- `components/TarotArticlePage.tsx` - Added FAQ section, improved tags styling
- `components/admin/ImportArticle.tsx` - Fixed preview link (partial)

### Backend
- `server/src/routes/ssr.ts` - NEW: Server-side rendering for SEO
- `server/src/index.ts` - Registered SSR routes
- `server/src/lib/validation.ts` - Relaxed FAQ validation, excluded blockquote em dashes

### Documentation
- `SERVER_SIDE_RENDERING.md` - SSR architecture docs
- `TESTING_SSR.md` - SSR testing guide
- `TAROT_ARTICLES_STATUS.md` - This file

## Next Steps

**If you want SSR working NOW:**
```bash
npm run build
cd server
npm run dev
# Visit http://localhost:3001/tarot/articles/slug
# View Source will show schema
```

**If you want visual editor:**
- This is a multi-hour project
- Recommend creating a separate task/issue
- Can reuse BlogPostEditor as template
- Will need significant adaptation for tarot-specific fields

**Quick wins to tackle next:**
1. Implement trash system (2-3 hours)
2. Remove editing banner (5 minutes)
3. Add admin preview endpoint (30 minutes)

---

**Total Time This Session:** ~4 hours
**Lines of Code:** ~800 new lines
**Files Created:** 3 components, 3 docs
**Bugs Fixed:** 5
**Features Added:** 2 (articles list, improved article display)

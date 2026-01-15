# Tarot Article Drag-and-Drop Reordering - Design

**Date:** 2026-01-15
**Status:** Approved
**Goal:** Add drag-and-drop reordering to admin tarot articles list for better management

## Overview

Allow admin users to reorder tarot articles in the admin dashboard by dragging and dropping. Order is persisted per card type (Major Arcana, Wands, Cups, Swords, Pentacles) and affects only the admin view, not public display.

## Requirements

- Reordering only affects admin dashboard view
- Order persists across sessions (saved to database)
- Order is scoped per card type (5 separate orderings)
- Drag handle appears only when viewing articles of same card type
- Optimistic UI updates with error handling
- Initial sort orders set based on card numbers

## Database Schema

### TarotArticle Model Changes

Add `sortOrder` field:

```prisma
model TarotArticle {
  // ... existing fields ...

  sortOrder Int @default(0)  // Position within its cardType

  @@index([cardType, sortOrder])  // Performance optimization
}
```

### Migration Strategy

1. Add field with default value 0
2. Run initialization script to set sortOrder based on cardNumber
   - Parse cardNumber as integer
   - Set sortOrder = cardNumber for all articles
   - This gives logical initial ordering (The Fool=0, Magician=1, etc.)

## API Design

### New Endpoint

```
PATCH /api/admin/tarot-articles/reorder
Authorization: Bearer <admin-token>
Content-Type: application/json

Request Body:
{
  "articleId": "string",
  "cardType": "MAJOR_ARCANA" | "SUIT_OF_WANDS" | "SUIT_OF_CUPS" | "SUIT_OF_SWORDS" | "SUIT_OF_PENTACLES",
  "newPosition": number  // 0-based index
}

Response: 200 OK
{
  "success": true,
  "message": "Article reordered successfully"
}

Error: 400/403/500
{
  "error": "Error message"
}
```

### Backend Logic

1. Validate admin authentication
2. Validate article exists and cardType matches
3. Fetch all articles of that cardType ordered by sortOrder
4. Remove dragged article from old position
5. Insert at newPosition
6. Renumber all articles (sortOrder = index)
7. Save in database transaction
8. Return success

### Query Updates

Update `fetchAdminTarotArticles` to sort by `sortOrder` when no other sort specified:

```sql
ORDER BY sortOrder ASC, createdAt DESC
```

## UI/UX Design

### Visual Elements

**Drag Handle:**
- Six-dot icon (⋮⋮) on left of each row
- Shows on hover over row
- Only visible when viewing single card type or all articles of one type
- Hidden when viewing mixed results (search, status filters across types)

**Drag Feedback:**
- Dragged item: 50% opacity, elevated shadow
- Drop indicator: Blue/purple horizontal line showing insertion point
- Other items: Smooth vertical animation to make space
- Cursor: Changes to grab/grabbing

**Constraints:**
- Can only drag within same card type section
- Cannot drag across card type boundaries

### Library Choice

**@dnd-kit/core** - Modern, lightweight React drag-and-drop
- Better accessibility
- Smaller bundle size
- Better animation support
- Active maintenance

### State Management

**Optimistic Updates:**
1. User drops article → immediate UI reorder
2. API call in background
3. On success: keep new order
4. On error: revert, show error toast

**Error Handling:**
- Network errors: Revert and show "Failed to reorder" message
- Validation errors: Revert and show specific error
- Concurrent edit conflicts: Reload list

## Implementation Phases

### Phase 1: Database
- Add sortOrder field to schema
- Create and run migration
- Create initialization script
- Run script to set initial orders

### Phase 2: Backend API
- Create reorder endpoint
- Add validation and business logic
- Update query to use sortOrder
- Add error handling
- Test with Postman/curl

### Phase 3: Frontend - Core Functionality
- Install @dnd-kit/core
- Add drag handle UI component
- Implement drag-and-drop logic
- Add optimistic updates
- Connect to API endpoint

### Phase 4: Frontend - Polish
- Add visual feedback (opacity, shadows, lines)
- Add loading states
- Add error handling and revert
- Hide handles when inappropriate
- Test all edge cases

### Phase 5: Testing & Validation
- Test reordering within each card type
- Test filter combinations
- Test error scenarios
- Test concurrent edits
- Verify persistence across sessions

## Success Criteria

- ✅ Admin can drag articles to reorder within card type
- ✅ Order persists after page reload
- ✅ Each card type has independent ordering
- ✅ Drag handles only show when appropriate
- ✅ UI updates feel instant (optimistic)
- ✅ Errors are handled gracefully
- ✅ Public display unaffected
- ✅ No performance degradation with 78 articles

## Non-Goals

- Reordering public display (cards still show by card number)
- Bulk reordering operations
- Undo/redo functionality
- Order history/audit trail
- Reordering across card types

## Technical Considerations

**Performance:**
- Index on (cardType, sortOrder) for fast queries
- Transaction ensures consistency
- Max 22 articles per reorder operation (Major Arcana)

**Edge Cases:**
- New article added: gets sortOrder = max + 1
- Article deleted: gaps in sortOrder are fine
- Card type changed: article moves to end of new type
- Concurrent reorders: last write wins (acceptable)

**Accessibility:**
- Keyboard navigation for drag-and-drop
- Screen reader announcements
- Focus management during drag

## Future Enhancements (Not in Scope)

- Drag-and-drop for blog posts
- Reorder categories/tags
- Custom sort fields (alphabetical, date, etc.)
- Multi-select and bulk drag

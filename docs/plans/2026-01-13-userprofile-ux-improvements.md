# UserProfile UX Improvements Plan

## Completed (This Session)
- [x] Text size fixes for accessibility
- [x] Reading history filters (search, spread type, sort)
- [x] Component extraction (ReadingHistoryCard, AchievementCard, TransactionItem, ReadingFilters)
- [x] Cards JSON parsing fix
- [x] Date contrast improvement
- [x] Unique achievement icons

---

## Remaining Improvements

### 1. Transaction History Enhancements
**Priority**: Medium | **Complexity**: Low

**Features:**
- Add transaction type filter dropdown (Purchases, Bonuses, Readings, All)
- Add date range quick filters (Today, This Week, This Month, All Time)
- Add "Low Credits" CTA when balance < 3

**Implementation:**
```
components/profile/TransactionFilters.tsx (new)
- Type filter dropdown
- Date range buttons
- Reuse filter styling from ReadingFilters
```

**Changes to UserProfile.tsx:**
- Add transaction filter state
- Add filtered transactions memo
- Add low credits CTA in transaction section

---

### 2. Achievements Section Improvements
**Priority**: Medium | **Complexity**: Medium

**Features:**
- Tooltip on hover showing full description + unlock date (if unlocked)
- Unlock celebration animation (confetti burst when newly unlocked)
- Mobile: Single column layout on small screens
- "New!" badge for recently unlocked (within 24h)

**Implementation:**
```
components/profile/AchievementCard.tsx (modify)
- Add Tooltip component wrapper
- Add unlockDate prop
- Add isNew prop for "New!" badge
- Add confetti animation on initial render if isNew
```

**Mobile Grid Change:**
```css
grid-cols-1 sm:grid-cols-2 md:grid-cols-4
```

---

### 3. Profile Header Enhancements
**Priority**: Low | **Complexity**: Medium

**Features:**
- Edit username inline (pencil icon → input field)
- Avatar upload option (Clerk profile image)
- Social share buttons for referral (WhatsApp, Twitter/X, Copy Link)

**Implementation:**
```
components/profile/ProfileHeader.tsx (new - extract from UserProfile)
- Username with edit mode toggle
- Avatar component with upload trigger
- Enhanced referral sharing section
```

**API Changes:**
- Use Clerk's user update API for username
- Use Clerk's profile image upload

---

### 4. Empty States Enhancement
**Priority**: Low | **Complexity**: Low

**Features:**
- Illustrated empty states with call-to-action
- Different illustrations for:
  - No readings → "Start your first reading" CTA
  - No transactions → "Earn credits through daily bonus"
  - Filtered with no results → "No matches found"

**Implementation:**
```
components/profile/EmptyState.tsx (new)
- Props: type ('readings' | 'transactions' | 'filtered')
- Icon/illustration
- Title + description
- Optional CTA button
```

---

### 5. Mobile Experience Polish
**Priority**: High | **Complexity**: Low

**Features:**
- Responsive padding adjustments
- Achievement grid: 1 col (mobile) → 2 col (sm) → 4 col (md+)
- Reading cards: more compact on mobile
- Stats: horizontal scroll on very small screens
- Touch-friendly filter controls

**Implementation:**
- CSS-only changes mostly
- Add responsive classes throughout

**Key Changes:**
```tsx
// Achievements grid
grid-cols-1 sm:grid-cols-2 md:grid-cols-4

// Section padding
p-4 sm:p-6

// Stats on mobile
flex flex-wrap justify-center gap-4 sm:grid sm:grid-cols-3
```

---

### 6. Delight Features (Nice-to-Have)
**Priority**: Low | **Complexity**: Varies

**Features:**
- Reading "Favorite" / bookmark toggle
- Export reading history as PDF
- Share individual reading (generate shareable link)
- Streak celebration at milestones (7, 30, 100 days)
- Credit balance animation on change

---

## Implementation Order (Recommended)

1. **Mobile Polish** (quick wins, high impact)
2. **Transaction Filters** (consistency with reading filters)
3. **Empty States** (polish, low effort)
4. **Achievement Tooltips + New Badge**
5. **Profile Header Enhancements**
6. **Delight Features** (future sprints)

---

## Files to Create/Modify

| File | Action | Priority |
|------|--------|----------|
| `components/profile/TransactionFilters.tsx` | Create | Medium |
| `components/profile/EmptyState.tsx` | Create | Low |
| `components/profile/AchievementCard.tsx` | Modify (tooltips) | Medium |
| `components/UserProfile.tsx` | Modify (mobile, filters) | High |
| `components/profile/ProfileHeader.tsx` | Create (optional) | Low |

---

## Success Metrics

- All text readable on mobile (WCAG AA compliant)
- Filter interactions < 100ms response
- Empty states guide users to actions
- Achievement unlocks feel rewarding
- Profile page loads in < 2s


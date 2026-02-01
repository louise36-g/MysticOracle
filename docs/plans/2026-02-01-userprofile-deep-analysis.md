# UserProfile Deep Analysis - Root Cause Investigation

## Summary of Reported Issues

1. **Time filter buttons (Today/This Week/This Month)** showing no readings
2. **Reading type filter** only shows Single, 3-Card, 5-Card - missing Horseshoe and Celtic Cross
3. **Credit history** - "This Week" and "This Month" buttons show nothing
4. Daily bonuses and reading debits not appearing

---

## Issue 1: Time Filter Buttons Not Showing Readings

### Root Cause Analysis

**The problem is a design/UX confusion, NOT a code bug.**

The UserProfile has TWO separate filtering systems that are conflicting:

1. **ReadingFilters component** (lines 400-412): Has date range buttons (Today, This Week, This Month, All Time)
2. **UnifiedHistoryAccordion component**: Groups readings into collapsible sections (Today, This Week, This Month, This Year, All)

**What's happening:**
- The `ReadingFilters` date range buttons FILTER the data before it reaches the accordion
- The accordion then GROUPS whatever remains into time-based sections
- When you click "Today" in the filters, it filters to only today's readings, then the accordion groups those (showing only "Today" section)
- When you click "This Week" in the filters, readings from today ARE EXCLUDED from "This Week" group because the accordion's grouping logic puts today's readings in "Today", not "This Week"

**The accordion grouping logic (UnifiedHistoryAccordion.tsx lines 69-79):**
```typescript
if (readingDate >= startOfToday) {
  groups.today.push(reading);          // Today = only today
} else if (readingDate >= startOfWeek) {
  groups.week.push(reading);           // This Week = start of week to yesterday
} else if (readingDate >= startOfMonth) {
  groups.month.push(reading);          // This Month = start of month to before this week
}
```

**The filter logic (dateFilters.ts lines 40-43):**
```typescript
const daysMap = {
  today: 0,      // Only today
  week: 7,       // Last 7 days (includes today!)
  month: 30      // Last 30 days (includes today!)
};
```

**Example scenario:**
- User has 3 readings: today, yesterday, and 5 days ago
- User clicks "This Week" filter button
- Filter passes: today, yesterday, 5 days ago (all within 7 days)
- Accordion groups: Today=1, This Week=2, rest are empty
- User sees "Today" accordion section with 1 reading
- User expected to see all 3 in a single "This Week" section

**This is a dual-filtering system that's confusing users.**

### Recommendation

Remove one of these systems. Either:
- **Option A**: Remove date range from ReadingFilters, keep only the accordion grouping (simpler UX)
- **Option B**: Remove accordion time grouping, use a flat list with date filters (more traditional)
- **Option C**: Make the filter buttons control which accordion section is auto-expanded, rather than filtering data

---

## Issue 2: Missing Horseshoe and Celtic Cross in Spread Filter

### Root Cause

The spread filter in ReadingFilters.tsx uses `SPREADS` from constants.ts, which DOES include Horseshoe and Celtic Cross (lines 106-123). However, the filter logic has an issue:

**In UserProfile.tsx lines 111-116:**
```typescript
if (spreadFilter !== 'all') {
  result = result.filter(r => {
    // Non-tarot readings pass through when filtering by spread
    if (r.readingType !== 'tarot') return false;  // ❌ BUG: Should be pass-through
    return r.spreadType?.toLowerCase() === spreadFilter.toLowerCase();
  });
}
```

**Bug:** When filtering by a specific spread type, non-tarot readings (birth_synthesis, personal_year, threshold) are EXCLUDED (`return false`), but the comment says they should "pass through". This is inconsistent.

**But that's not the reported issue.** The issue is that Horseshoe and Celtic Cross don't appear in the dropdown.

**Actual root cause:** The `SPREADS` object in constants.ts is typed as `Partial<Record<SpreadType, SpreadConfig>>`, and the ReadingFilters component iterates over all entries. Let me verify the filter works:

Looking at ReadingFilters.tsx lines 37-40:
```typescript
const spreadOptions = Object.entries(SPREADS).map(([key, spread]) => ({
  value: key as SpreadType,
  label: language === 'en' ? spread.nameEn : spread.nameFr,
}));
```

This should include all 6 spread types. If Horseshoe and Celtic Cross aren't showing:
1. Either SPREADS is being modified elsewhere
2. Or there's a runtime issue

**Need to verify:** Check if any readings with `spreadType: 'horseshoe'` or `spreadType: 'celtic_cross'` exist in the database, and if the SPREADS object is complete at runtime.

---

## Issue 3: Credit History Date Filtering Not Working

### Root Cause

Same issue as #1 - dual filtering systems conflict.

**TransactionFilters.tsx** has date range buttons that filter data.
**TransactionHistoryAccordion.tsx** groups filtered data into time sections.

When you click "This Week":
- Filter returns transactions from last 7 days
- Accordion groups: "Today" gets today's, "This Week" gets start-of-week to yesterday
- If all transactions are from today, "This Week" section is empty

**Additionally:** The filtered transactions are passed to the accordion (line 536-538 in UserProfile.tsx):
```typescript
<TransactionHistoryAccordion
  transactions={filteredTransactions}  // Already filtered by date
/>
```

So if the filter says "This Week" and all data is from today, the accordion's "This Week" section will be empty because today's items go in "Today" group.

---

## Issue 4: Daily Bonuses and Reading Debits Not Appearing

### Possible Causes

1. **Transactions not being created** - Credit deductions might not be creating Transaction records
2. **Wrong transaction type** - Transactions might exist but with different types than expected
3. **API not returning data** - The `/api/v1/users/me/transactions` endpoint might not be returning all records

**Need to verify:**
1. Check database: Are transactions being created for DAILY_BONUS and READING types?
2. Check CreditService: Does `deductCredits` create a Transaction record?
3. Check the API response in browser DevTools

---

## The Core Problem

The UserProfile has become overly complex with:

1. **Two date filtering mechanisms** working against each other
2. **Accordion grouping on already-filtered data** (double-grouping effect)
3. **Filter buttons that don't match accordion section names** conceptually

### Current Data Flow (Broken)

```
Backend Data → Date Filter → Spread Filter → Search Filter → Accordion Grouping → Display
     ↑              ↑                                               ↑
     |              |                                               |
     |         User clicks                                   Groups by same
     |         "This Week"                                   date ranges
     |                                                       (confusing!)
```

### Ideal Data Flow

Either:

**Option A: Filter-based (traditional list)**
```
Backend Data → Type Filter → Date Filter → Search Filter → Flat List Display
```

**Option B: Accordion-based (grouped view)**
```
Backend Data → Type Filter → Search Filter → Accordion Grouping → Display
                                                    ↑
                                              Click accordion
                                              header to expand
```

---

## Recommended Solution

**Rebuild the history sections with a single approach:**

1. **Remove date range filter buttons** from both ReadingFilters and TransactionFilters
2. **Keep the accordion grouping** as the primary navigation
3. **Auto-expand "Today" accordion section** if it has items
4. **Fix the spread filter logic** to properly show all spread types
5. **Verify transaction creation** in CreditService for all operations

This eliminates the confusion of "I clicked This Week but see Today" because there's only one way to navigate time periods.

---

## Files to Modify

| File | Action |
|------|--------|
| `components/profile/ReadingFilters.tsx` | Remove dateRange filter, keep search/spread/sort |
| `components/profile/TransactionFilters.tsx` | Remove dateRange filter, keep type filter only |
| `components/UserProfile.tsx` | Remove dateRange state and filtering logic |
| `utils/dateFilters.ts` | Can be deleted if no longer needed |
| `server/src/services/creditService.ts` | Verify Transaction records are created |

---

## Verification Steps Before Rebuild

1. Check browser console for API errors
2. Check Network tab: What does `/api/v1/users/me/transactions` return?
3. Check Network tab: What does `/api/v1/users/me/readings/all` return?
4. Check database directly: `SELECT * FROM "Transaction" WHERE "userId" = '...' ORDER BY "createdAt" DESC LIMIT 10;`
5. Verify SPREADS object in browser console: `console.log(SPREADS)` should show all 6 types

---

## Decision Needed

Before rebuilding, I need to confirm with you:

**Do you want:**
1. **Accordion-only navigation** (remove date filter buttons, expand accordion sections to see readings by time period)
2. **Filter-only navigation** (remove accordion grouping, show flat list filtered by date buttons)
3. **Hybrid approach** (filter buttons control which accordion section auto-expands)

I recommend **Option 1 (Accordion-only)** because:
- Simpler mental model for users
- Naturally groups readings/transactions by time
- Clicking to expand is intuitive
- Fewer UI controls = less confusion

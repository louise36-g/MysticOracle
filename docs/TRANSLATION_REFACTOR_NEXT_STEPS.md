# Translation Refactor - Continuation Guide

## Quick Start

To continue this refactoring work, follow these steps systematically.

## Phase 1: High-Impact Files (Next 3-4 commits)

### Batch 4: Core Modals & UI (Recommended Next)

**Files:**
- `components/CreditShop.tsx` (29 translations)
- `components/Breadcrumb.tsx` (23 translations)
- `components/PaymentResult.tsx` (payment success/cancel)

**Command:**
```bash
# Check current state
grep -n "language === 'en' ?" components/CreditShop.tsx
grep -n "language === 'en' ?" components/Breadcrumb.tsx
grep -n "language === 'en' ?" components/PaymentResult.tsx
```

**Process:**
1. Add `t` to `useApp()` destructuring
2. Replace all `language === 'en' ? 'Text' : 'Texte'` with `t('key', 'Text')`
3. Look up keys in `scripts/extracted-translations.json`
4. Test with `npm run dev`
5. Commit: `git commit -m "refactor: replace translations in CreditShop, Breadcrumb, PaymentResult"`

### Batch 5: Reading Flow

**Files:**
- `components/ActiveReading.tsx`
- `components/SpreadSelector.tsx`
- `components/reading/ReadingShufflePhase.tsx`
- `components/reading/phases/QuestionIntroPhase.tsx`
- `components/reading/phases/DrawingPhase.tsx`
- `components/reading/phases/RevealingPhase.tsx`
- `components/reading/phases/InterpretationPhase.tsx`

**Keys:** `reading.*`, `tarot.*`

**Special Cases:**
- Validation messages
- Error states
- Card drawing prompts
- Interpretation loading states

**Commit message:**
```bash
git commit -m "refactor: replace translations in reading flow components

- ActiveReading: validation, errors, questions
- Phase components: prompts, instructions, loading states
- Keys used: reading.*, tarot.*

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Batch 6: Profile Components

**Files:**
- `components/UserProfile.tsx`
- `components/profile/AchievementCard.tsx`
- `components/profile/ReadingHistoryCard.tsx`
- `components/profile/TransactionItem.tsx`
- `components/profile/EmptyState.tsx`
- `components/profile/ReadingFilters.tsx`
- `components/profile/TransactionFilters.tsx`

**Keys:** `profile.*`

**Command:**
```bash
find components/profile -name "*.tsx" -exec grep -l "language === 'en' ?" {} \;
```

**Commit message:**
```bash
git commit -m "refactor: replace translations in profile components

- UserProfile: tabs, settings, account info
- History and transaction cards
- Empty states and filters
- Keys used: profile.*

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

## Phase 2: Admin Dashboard (Multiple commits)

**Note:** Admin has 29 files. Break into logical groups:

### Batch 7: Admin Core

**Files:**
- `components/admin/AdminDashboard.tsx`
- `components/admin/AdminOverview.tsx`
- `components/admin/AdminAnalytics.tsx`

### Batch 8: Admin User Management

**Files:**
- `components/admin/AdminUsers.tsx` (34 translations - largest)
- `components/admin/AdminTransactions.tsx`

### Batch 9: Admin Content Management

**Files:**
- `components/admin/AdminTarotArticles.tsx` (39 translations)
- `components/admin/ImportArticle.tsx` (36 translations)
- `components/admin/AdminBlog.tsx`
- `components/admin/blog/BlogPostsTab.tsx`

### Batch 10: Admin Settings & Health

**Files:**
- `components/admin/AdminPackages.tsx`
- `components/admin/AdminEmailTemplates.tsx`
- `components/admin/AdminSettings.tsx`
- `components/admin/AdminHealth.tsx` (19 translations)

**Note:** `AdminTranslations.tsx` already uses translations - skip it.

## Phase 3: Remaining Components

### Batch 11: Blog & Content

**Files:**
- `components/blog/BlogList.tsx` (20 translations)
- `components/blog/BlogPost.tsx` (20 translations)
- `components/AboutUs.tsx`
- `components/TarotArticlePage.tsx`
- `components/TarotArticlesList.tsx`

### Batch 12: Tarot & Cards

**Files:**
- `components/tarot/TarotCardsOverview.tsx`
- `components/tarot/TarotCategorySection.tsx`
- `components/tarot/TarotCardPreview.tsx`
- `components/Card.tsx`

### Batch 13: Rewards & Gamification

**Files:**
- `components/rewards/DailyBonusPopup.tsx`
- `components/rewards/DailyBonusCard.tsx`
- `components/rewards/ReadingCompleteCelebration.tsx`
- `components/rewards/AchievementUnlockModal.tsx`

### Batch 14: Miscellaneous

**Files:**
- `components/HoroscopeReading.tsx`
- `components/WelcomeModal.tsx`
- `components/ReadingModeSelector.tsx`
- `components/SpendingLimitsSettings.tsx` (23 translations)
- `components/QuestionLengthModal.tsx`
- Any other remaining files

## Final Phase: Verification

### Verification Checklist

```bash
# 1. Count remaining files
find components -name "*.tsx" -exec grep -l "language === 'en' ?" {} \; | wc -l
# Should be 0

# 2. Type check
npx tsc --noEmit

# 3. Search for any missed patterns
grep -r "language === 'en' ?" components/ context/ services/
# Should only show logic (setLanguage calls, flag rendering)

# 4. Check for missing keys (run app and check console)
npm run dev
# Switch language, navigate through app
# Look for "Translation key not found" warnings

# 5. Manual testing
# - Sign in/out
# - Create reading
# - View profile
# - Access admin (if admin user)
# - Switch language in each section
# - Check all modals and error states
```

### Final Commit

After all batches are complete:

```bash
git add -A
git commit -m "chore: complete dynamic translation refactor

Final verification:
- All 693 hardcoded translation ternaries replaced
- 72 files updated across components
- Keys mapped to backend translation service
- Type check passes
- Manual testing completed in EN and FR

This completes the migration from hardcoded bilingual strings
to dynamic translation system using t() function.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

## Tools & Resources

### Progress Tracking

```bash
# Run progress script
bash scripts/translation-refactor-remaining.sh

# Count translations in a specific file
grep -c "language === 'en' ?" components/YourFile.tsx

# List all keys from a file
grep -o "language === 'en' ? '[^']*'" components/YourFile.tsx
```

### Key Lookup

```bash
# Search for a key in extracted translations
cat scripts/extracted-translations.json | jq '.translations[] | select(.en | contains("Your Text"))'

# List all keys for a component
cat scripts/extracted-translations.json | jq '.translations[] | select(.file == "YourFile.tsx")'
```

### Testing After Each Batch

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, check for console errors
# (Watch browser console while navigating)

# 3. Quick language switch test
# Click language toggle in header
# Verify text changes in modified components

# 4. Type check
npx tsc --noEmit
```

## Common Patterns

### Pattern 1: Simple Replacement
```tsx
// Before:
{language === 'en' ? 'Hello' : 'Bonjour'}

// After:
{t('greeting.hello', 'Hello')}
```

### Pattern 2: In Attributes
```tsx
// Before:
<button title={language === 'en' ? 'Click me' : 'Cliquez-moi'}>

// After:
<button title={t('button.click', 'Click me')}>
```

### Pattern 3: Plural Handling
```tsx
// Before:
{count} {language === 'en' ? 'item' : 'élément'}

// After:
{count} {t(count === 1 ? 'item.singular' : 'item.plural', count === 1 ? 'item' : 'items')}
```

### Pattern 4: Conditional with Variables
```tsx
// Before:
{language === 'en'
  ? `You have ${credits} credits remaining`
  : `Il vous reste ${credits} crédits`}

// After:
{t('credits.remaining', `You have ${credits} credits remaining`)}
// Note: Template interpolation works in fallback
```

### Pattern 5: Multi-line
```tsx
// Before:
<p>
  {language === 'en'
    ? 'This is a long text that spans multiple lines'
    : 'Ceci est un texte long qui s\'étend sur plusieurs lignes'}
</p>

// After:
<p>
  {t('text.long', 'This is a long text that spans multiple lines')}
</p>
```

## Troubleshooting

### Issue: "Translation key not found"
**Solution:**
1. Check if key exists in `scripts/extracted-translations.json`
2. If not, add it manually to backend seed data
3. Refresh translations cache

### Issue: TypeScript errors after changes
**Solution:**
1. Ensure `t` is destructured from `useApp()` or `useTranslation()`
2. Check import statements
3. Run `npx tsc --noEmit` for details

### Issue: Text not changing when switching language
**Solution:**
1. Check browser console for errors
2. Verify key is correct
3. Ensure backend has both EN and FR translations
4. Try hard refresh (Cmd+Shift+R)

## Progress Tracking

Update `docs/TRANSLATION_REFACTOR_PROGRESS.md` after each batch:
- Move completed files from "Remaining" to "Completed"
- Update commit count
- Update percentage complete

## Questions?

Refer to:
- `docs/TRANSLATION_REFACTOR_PROGRESS.md` - Overall progress
- `scripts/extracted-translations.json` - Key mappings
- `services/translationService.ts` - Translation service implementation
- `context/AppContext.tsx` - Where `t()` function is provided
- `server/src/routes/translations.ts` - Backend seed data

---

**Remember:** This is a mechanical refactor. Take your time, batch logically, test frequently, and commit often. Each batch should be independently functional.

# Translation Refactor Progress Report

## Mission
Replace ALL hardcoded `language === 'en' ? 'Text' : 'Texte'` patterns with dynamic `t('key', 'fallback')` calls across the entire codebase.

## Status: IN PROGRESS (4% Complete)

### Completed (3 commits)

#### Commit 1: App.tsx Refactor
**Files:** `App.tsx`
**Strings Replaced:** ~18
**Keys Used:** `app.App.*`
- Access Denied modal
- Button labels (Sign In, Go Home)
- Hero "Start Your Reading"
- Feature cards (AI Powered Insights, Private & Secure, Instant Clarity)
- Credit modals (Not Enough Credits, Running Low, Buy Credits)
- Oracle placeholder

#### Commit 2: Navigation Components
**Files:** `components/Header.tsx`, `components/SubNav.tsx`, `components/Footer.tsx`
**Keys Used:** `nav.*`, `subnav.*`, `footer.*`
- Header: Nav labels, language switch, sign-in button, mobile menu
- SubNav: Dropdown titles (Tarot, Horoscope, Coming Soon, Learn)
- SubNav: Item labels and descriptions with dynamic keys
- Footer: All sections (Help, Legal, Contact, disclaimer)

#### Commit 3: FAQ Component
**Files:** `components/FAQ.tsx`
**Strings Replaced:** 6 (with plural logic)
**Keys Used:** `faq.readings.*`, `faq.credit`, `faq.credits`
- Spread types with credit costs
- Singular/plural credit handling: `t(count === 1 ? 'faq.credit' : 'faq.credits')`
- Love & Relationships and Career Path spread descriptions

### Remaining Work (66 files, ~630 strings)

#### Priority 1: High-Impact Files (Top 10 by count)
1. **AdminTarotArticles.tsx** (39 translations) - Admin CMS for tarot articles
2. **ImportArticle.tsx** (36 translations) - Bulk article import interface
3. **AdminUsers.tsx** (34 translations) - User management dashboard
4. **CreditShop.tsx** (29 translations) - Credit purchase modal
5. **SpendingLimitsSettings.tsx** (23 translations) - Spending limit controls
6. **Breadcrumb.tsx** (23 translations) - Navigation breadcrumbs
7. **BlogPost.tsx** (20 translations) - Blog post viewer
8. **BlogList.tsx** (20 translations) - Blog listing page
9. **BlogPostsTab.tsx** (19 translations) - Admin blog management
10. **AdminHealth.tsx** (19 translations) - System health dashboard

#### Priority 2: By Category

**Admin Components (29 files)**
- AdminDashboard, AdminOverview, AdminAnalytics
- AdminPackages, AdminEmailTemplates, AdminSettings
- AdminBlog tabs and editors
- AdminTransactions (already using translations)

**Profile Components (6 files)**
- `UserProfile.tsx` - Main profile page
- `AchievementCard.tsx` - Achievement display
- `ReadingHistoryCard.tsx` - Reading history item
- `TransactionItem.tsx` - Transaction display
- `EmptyState.tsx` - Empty state messages
- `ReadingFilters.tsx`, `TransactionFilters.tsx` - Filter UIs

**Reading Flow (6 files)**
- `ActiveReading.tsx` - Main reading controller
- `SpreadSelector.tsx` - Spread selection UI
- `ReadingShufflePhase.tsx` - Card shuffling animation
- Phase components: `QuestionIntroPhase`, `DrawingPhase`, `RevealingPhase`, `InterpretationPhase`

**Blog Components (2 files)**
- `BlogList.tsx` - Already counted above
- `BlogPost.tsx` - Already counted above

**Tarot Components (2 files)**
- `TarotCardsOverview.tsx` - Card gallery
- `TarotCategorySection.tsx` - Category sections

**Rewards Components (4 files)**
- `DailyBonusPopup.tsx` - Login bonus modal
- `DailyBonusCard.tsx` - Bonus card display
- `ReadingCompleteCelebration.tsx` - Reading completion
- `AchievementUnlockModal.tsx` - Achievement popup

**Miscellaneous**
- `AboutUs.tsx` - About page
- `HoroscopeReading.tsx` - Horoscope interface
- `WelcomeModal.tsx` - First-time user welcome
- `Card.tsx` - Tarot card component
- `PaymentResult.tsx` - Payment success/cancel pages

### Implementation Pattern

For each file:

1. **Add `t` to imports:**
   ```tsx
   const { user, language, t } = useApp();
   // or
   const { t, language } = useTranslation();
   ```

2. **Replace ternaries:**
   ```tsx
   // Before:
   {language === 'en' ? 'Hello World' : 'Bonjour Monde'}

   // After:
   {t('component.key', 'Hello World')}
   ```

3. **Handle plurals:**
   ```tsx
   // Before:
   {count} {language === 'en' ? 'credit' : 'crédit'}

   // After:
   {count} {t(count === 1 ? 'singular.key' : 'plural.key', count === 1 ? 'credit' : 'credits')}
   ```

4. **Dynamic keys (for lists):**
   ```tsx
   // Before:
   {language === 'en' ? item.labelEn : item.labelFr}

   // After:
   {t(`module.${item.id}.label`, language === 'en' ? item.labelEn : item.labelFr)}
   ```

### Key Mapping Reference

All extracted translations are in:
```
scripts/extracted-translations.json
```

This file contains:
- Original file and line number
- English and French text
- Generated key in format: `module.Component.snake_case`

Example:
```json
{
  "key": "app.App.not_enough_credits",
  "en": "Not Enough Credits",
  "fr": "Crédits Insuffisants",
  "file": "App.tsx",
  "line": 849
}
```

### Translation Keys Already in Backend

The backend seed data (`server/src/routes/translations.ts`) contains 999 pre-generated translation keys covering:
- `nav.*` - Navigation labels
- `subnav.*` - Sub-navigation dropdowns
- `footer.*` - Footer sections
- `app.*` - Main app strings
- `faq.*` - FAQ questions and answers
- `profile.*` - User profile
- `admin.*` - Admin dashboard
- `reading.*` - Reading flow
- `blog.*` - Blog interface
- `tarot.*` - Tarot cards and spreads
- `legal.*` - Legal pages

### Commit Strategy

Batch commits by category:
1. ✅ Core (App.tsx) - DONE
2. ✅ Navigation (Header, SubNav, Footer) - DONE
3. ✅ FAQ - DONE
4. ⏳ High-impact files (CreditShop, Breadcrumb, SpendingLimits)
5. ⏳ Reading flow (ActiveReading, phases)
6. ⏳ Profile components (UserProfile, history, filters)
7. ⏳ Admin components (by tab)
8. ⏳ Blog and content
9. ⏳ Miscellaneous (AboutUs, HoroscopeReading, etc.)
10. ⏳ Final verification and type check

### Testing Checklist

After each batch:
- [ ] `npm run dev` - Verify app starts
- [ ] Switch language (EN ↔ FR)
- [ ] Check console for missing translation warnings
- [ ] Verify no syntax errors

Final verification:
- [ ] `npx tsc --noEmit` - Type check passes
- [ ] `grep -r "language === 'en' ?" components/` - Zero results
- [ ] Manual UI test of all major flows
- [ ] Language switching works in all contexts

### Notes

- **Logic vs Text:** Lines like `setLanguage(language === 'en' ? 'fr' : 'en')` are logic, not text - don't change
- **Flag rendering:** `{language === 'en' ? <FlagEN /> : <FlagFR />}` is conditional rendering - keep as-is
- **Fallbacks in t():** It's OK to have ternaries inside `t()` calls as fallbacks: `t('key', language === 'en' ? 'Text' : 'Texte')`
- **Context API:** Both `useApp()` and `useTranslation()` provide `t()` function
- **AppContext.tsx has one hardcoded string:** Line 273 in `deductCredits()` - can be refactored later

### Performance Considerations

- Translation loading is async and cached
- `t()` function uses memoization via useCallback
- Translations are pre-loaded on language change
- Background refresh via 'translations-updated' event

### Next Steps

1. Run progress script to track remaining work:
   ```bash
   bash scripts/translation-refactor-remaining.sh
   ```

2. Process high-impact files first (biggest user-facing impact)

3. Batch by category for clean commits

4. Test frequently to catch issues early

5. Final verification sweep before marking complete

---

**Last Updated:** 2026-01-13
**Completed By:** Claude Sonnet 4.5 + Louise Griffin
**Commits:** 3/10 estimated
**Files:** 6/72 (8%)
**Strings:** ~42/693 (6%)

# CelestiArcana Translation System

**Version:** 1.0
**Last Updated:** 2026-01-13

## Overview

CelestiArcana uses a **dynamic, database-backed translation system** that allows all user-facing text to be edited from the admin panel without code changes. Translations are cached client-side for performance and version-tracked for automatic updates.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AppContext provides t() function                     │  │
│  │  └─> translationService.ts                            │  │
│  │       └─> localStorage cache (5min TTL)              │  │
│  │       └─> API fetch on cache miss/stale              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express + Prisma)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/translations/:lang → Returns all translations  │  │
│  │  /api/translations/version → Returns cache version   │  │
│  │  /api/translations/admin/* → CRUD operations         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database (Render)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Language (en, fr)                                    │  │
│  │  Translation (key, value, languageId)                │  │
│  │  CacheVersion (entity, version)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

- ✅ **English Default** - All text defaults to English, French only when explicitly selected
- ✅ **Admin Editable** - All translations manageable via Admin → Translations
- ✅ **Client-Side Caching** - Fast loads with localStorage caching (5min TTL)
- ✅ **Version Tracking** - Automatic cache invalidation when translations update
- ✅ **Development Warnings** - Console warnings for missing translation keys (DEV mode only)
- ✅ **Fallback System** - Never shows blank text (key → fallback → English)
- ✅ **Type Safe** - Full TypeScript support

## Usage

### In Components

```tsx
import { useApp } from '../context/AppContext';

const MyComponent = () => {
  const { t } = useApp();

  return (
    <div>
      <h1>{t('myComponent.title', 'My Title')}</h1>
      <button>{t('common.save', 'Save')}</button>
      <p>{t('myComponent.description', 'Description here')}</p>
    </div>
  );
};
```

### Translation Key Naming Convention

```
[category].[Component].[semantic_key]

Examples:
- nav.home                              → Navigation item
- profile.achievementCard.unlocked      → Profile section, component-specific
- admin.AdminUsers.search_users         → Admin section
- common.save                           → Shared across app
- error.insufficientCredits             → Error messages
- filter.all_time                       → Filter labels
- transaction.type.purchase             → Data-specific labels
```

### Key Naming Rules

1. **Use lowercase with underscores** - `my_key_name` (not camelCase)
2. **Be semantic** - Describe meaning, not location: `error.insufficientCredits` (not `activeReading.line273.message`)
3. **Group by category** - Start with module/section: `profile.*`, `admin.*`, `common.*`
4. **Reuse common keys** - Don't duplicate: use `common.save`, `common.cancel`, etc.
5. **No abbreviations** - `search_users` (not `srch_usr`)

## Adding New Translations

### Method 1: Via Admin Panel (Recommended)

1. Go to **Admin → Translations**
2. Select language (English or Français)
3. Click **+ Add Translation** or edit existing
4. Enter key: `myComponent.myLabel`
5. Enter value: `My Label Text`
6. Click **Save**
7. Repeat for French translation
8. Changes are live immediately

### Method 2: Via Backend Seed File

1. Open `server/src/routes/translations.ts`
2. Add to `defaultTranslations` object:
   ```typescript
   'myComponent.myLabel': { en: 'My Label Text', fr: 'Mon Texte' },
   ```
3. Click **Update Translations** button in Admin → Translations
4. Changes are live after update completes

### Method 3: Bulk Import (Coming Soon)

For large batches, you'll be able to import JSON files.

## Translation Categories

### Core Navigation
```typescript
nav.home, nav.reading, nav.horoscope, nav.profile, nav.admin
nav.credits, nav.signIn, nav.signOut
```

### Common Labels
```typescript
common.save, common.cancel, common.delete, common.edit, common.create
common.close, common.yes, common.no, common.loading, common.error
common.today, common.yesterday, common.days_ago
```

### Error Messages
```typescript
error.insufficientCredits, error.notEnoughCredits, error.lowCredits
error.requestFailed, error.network, error.timeout
```

### Transaction Types
```typescript
transaction.type.purchase, transaction.type.daily_bonus
transaction.type.achievement, transaction.type.referral
transaction.type.reading, transaction.type.question, transaction.type.refund
```

### Filters
```typescript
filter.type, filter.date_range, filter.all, filter.all_time
filter.purchases, filter.bonuses, filter.readings
filter.this_week, filter.this_month
filter.clear_filters, filter.showing_count
```

### Profile Section
```typescript
profile.title, profile.credits, profile.readingHistory
profile.achievements, profile.settings, profile.dailyBonus
```

### Admin Section
```typescript
admin.title, admin.overview, admin.users, admin.transactions
admin.packages, admin.emails, admin.analytics, admin.health
admin.translations, admin.settings
```

## Intentional Non-Translations

These patterns should **NOT** be converted to translations:

### 1. Data Model Field Selection
```tsx
// ✅ CORRECT - Selecting bilingual data fields
const title = language === 'en' ? post.titleEn : post.titleFr;
const name = language === 'en' ? card.nameEn : card.nameFr;
```

**Why:** Database stores content in both languages. This is data access, not UI translation.

### 2. Locale Formatting
```tsx
// ✅ CORRECT - Browser API locale selection
date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR');
```

**Why:** Browser APIs need locale codes, not translation keys.

### 3. AI Prompts and Backend Services
```tsx
// ✅ CORRECT - AI needs bilingual data
const cardName = language === 'en' ? card.nameEn : card.nameFr;
const prompt = `Interpret this card: ${cardName}`;
```

**Why:** AI services and backend operations should use data model fields.

## Caching Strategy

### Client-Side Cache
- **Storage:** localStorage
- **Key Pattern:** `mystic_translations_{lang}`
- **TTL:** 5 minutes
- **Behavior:**
  - Returns cached data immediately
  - Checks version in background if stale
  - Refetches if server version > local version

### Cache Invalidation
- Automatic on admin translation updates
- Version number increments in database
- Client detects version change and refetches
- Dispatches `translations-updated` event to all tabs

### Clearing Cache Manually
```javascript
// In browser console:
localStorage.removeItem('mystic_translations_en');
localStorage.removeItem('mystic_translations_fr');
localStorage.removeItem('mystic_translations_version_en');
localStorage.removeItem('mystic_translations_version_fr');
location.reload();
```

## Development

### Dev Mode Warnings

In development mode, missing translation keys log to console:

```
[Translation Missing] Key: "myComponent.newLabel" | Fallback: "New Label"
Add to backend seed:
'myComponent.newLabel': { en: 'New Label', fr: 'TODO' },
```

This helps developers:
1. Identify missing translations
2. Get suggested seed code
3. Maintain translation coverage

**Note:** Warnings only show in DEV mode. No performance impact in production.

### Testing Translations

Use the comprehensive checklist at `docs/TRANSLATION_TESTING_CHECKLIST.md`:
- Tests all user flows (unauthenticated, authenticated, admin)
- Verifies English defaults
- Tests language switching
- Checks error handling and edge cases

### Extraction Script

Re-run extraction to find remaining hardcoded strings:

```bash
npx tsx scripts/extract-translations.ts
```

Output: `scripts/extracted-translations.json` with all found ternaries.

## Migration Status

### ✅ Completed (43% of codebase)
- Core application (App, Header, SubNav, Footer, FAQ, Breadcrumb, CreditShop, PaymentResult)
- Reading flow (ActiveReading, SpreadSelector, OracleChat, ReadingShufflePhase)
- Profile components (UserProfile, AchievementCard, ReadingHistoryCard, TransactionItem, EmptyState, ReadingFilters, TransactionFilters)
- Admin components (AdminDashboard, AdminOverview, AdminUsers, AdminTransactions, AdminAnalytics)
- Blog & content (BlogList, BlogPost, AboutUs, HoroscopeReading, TarotArticlePage, TarotArticlesList)
- Tarot components (TarotCardsOverview, TarotCategorySection, TarotCardPreview)
- Rewards & modals (DailyBonusPopup, WelcomeModal, CookieConsent)
- Context & services (AppContext deductCredits errors)

### ⏳ Remaining (57% - mostly admin)
- Admin components (AdminSettings, AdminPrompts, AdminEmailTemplates, AdminPackages, AdminCache, AdminHealth, AdminDebug, AdminBlog, BlogPostEditor, etc.)
- User-facing modals (SpendingLimitsSettings, QuestionLengthModal, InterpretationStyleSelector)
- Legal documents (use `content[language]` pattern - different approach needed)

**User-facing coverage: ~75-80%** (excluding admin panels)

## Troubleshooting

### "Still seeing French text"

1. **Clear browser cache:**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. **Check language setting:**
   - Look for language selector in header
   - Verify it's set to English

3. **Update translations:**
   - Go to Admin → Translations
   - Click "Update Translations" button
   - Wait for completion

4. **Check component:**
   - Some components may not be refactored yet
   - See "Migration Status" section above

### "Translation not showing"

1. **Check key exists:**
   - Go to Admin → Translations
   - Search for your key
   - If missing, add it

2. **Verify key name:**
   - Check for typos
   - Keys are case-sensitive
   - Use underscores, not camelCase

3. **Check fallback:**
   - Fallback text should display if key missing
   - If showing key name, no fallback provided

### "Cache not updating"

1. **Wait 5 minutes** - Cache TTL may not be expired
2. **Hard refresh** - Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. **Clear cache** - See "Clear Cache Manually" section
4. **Check version** - Version should increment after admin updates

## API Reference

### Public Endpoints

```typescript
// Get all translations for a language
GET /api/translations/:lang
Response: { translations: Record<string, string>, version: number }

// Get cache version
GET /api/translations/version
Response: { entity: 'translations', version: number }

// Get list of active languages
GET /api/translations/languages
Response: { languages: Language[] }
```

### Admin Endpoints (Auth Required)

```typescript
// Get all languages (with translation counts)
GET /api/translations/admin/languages
Response: { languages: Language[] }

// Get translations for editing
GET /api/translations/admin/:lang
Response: { translations: Translation[] }

// Create/update translation
PUT /api/translations/admin/translations
Body: { key: string, languageId: string, value: string }

// Delete translation
DELETE /api/translations/admin/translations/:id

// Bulk upsert
POST /api/translations/admin/bulk-upsert
Body: { languageCode: string, translations: Record<string, string> }

// Seed/update all translations
POST /api/translations/admin/seed
Response: { success: true, languages: 2, translations: 2022 }
```

## Best Practices

1. **Always provide fallbacks:**
   ```tsx
   ✅ t('key', 'Fallback Text')
   ❌ t('key')  // No fallback
   ```

2. **Use semantic keys:**
   ```tsx
   ✅ t('error.insufficientCredits', 'Insufficient credits')
   ❌ t('error1', 'Insufficient credits')
   ```

3. **Group related translations:**
   ```tsx
   ✅ 'profile.achievements.unlocked'
   ✅ 'profile.achievements.locked'
   ❌ 'unlocked_achievement'
   ❌ 'achievement_that_is_locked'
   ```

4. **Reuse common translations:**
   ```tsx
   ✅ t('common.save', 'Save')
   ❌ t('myComponent.saveButton', 'Save')  // Duplicate
   ```

5. **Keep translations short:**
   ```tsx
   ✅ 'Credits' (short, clear)
   ❌ 'The amount of credits you have available' (too verbose)
   ```

6. **Test both languages:**
   - Always test French to ensure translations exist
   - Verify text fits in UI (French is often longer)
   - Check for proper formatting

## Support

### Resources
- Translation Testing Checklist: `docs/TRANSLATION_TESTING_CHECKLIST.md`
- Coverage Report: `docs/TRANSLATION_COVERAGE_REPORT.md`
- API Spec: See "API Reference" section above

### Getting Help
- Missing translation? Check Admin → Translations first
- Need new feature? Document requirements first
- Found a bug? See `docs/TRANSLATION_TESTING_CHECKLIST.md`

---

**Maintained by:** Development Team
**Questions?** Check CLAUDE.md or ask in team chat

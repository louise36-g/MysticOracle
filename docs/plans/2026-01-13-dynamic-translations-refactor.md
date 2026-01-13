# Dynamic Translations Refactor - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove ALL hardcoded translation ternaries (`language === 'en' ? 'Text' : 'Texte'`) and replace with dynamic translations from the database, making all UI strings editable via the admin panel.

**Architecture:**
- Build an extraction script to find and categorize all hardcoded strings
- Auto-generate semantic translation keys based on component/context (matching existing pattern: `nav.*`, `tarot.*`, etc.)
- Extend the existing `/api/translations/admin/seed` endpoint with all extracted translations
- Replace all ternary operators with `t(key, fallback)` calls using the existing `useApp()` hook
- Update services to accept language parameter instead of using ternaries

**Tech Stack:**
- TypeScript, React, Express
- Existing translation infrastructure (translationService.ts, AppContext, AdminTranslations)
- Node.js script for extraction

**Affected Files:** 85+ files with hardcoded strings

---

## Task 1: Create Translation Extraction Script

**Files:**
- Create: `scripts/extract-translations.ts`
- Create: `scripts/extracted-translations.json` (generated output)

**Step 1: Create extraction script**

Create a Node.js script that scans files and extracts translation patterns:

```typescript
// scripts/extract-translations.ts
import * as fs from 'fs';
import * as path from 'path';

interface Translation {
  key: string;
  en: string;
  fr: string;
  file: string;
  line: number;
}

const translations: Translation[] = [];
const usedKeys = new Set<string>();

// Regex patterns to match language ternaries
const patterns = [
  /language\s*===\s*['"]en['"]\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g,
  /language\s*===\s*["']en["']\s*\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']/g,
];

function generateKey(filePath: string, enText: string): string {
  // Extract component name from file path
  const parts = filePath.replace(/^(components|services)\//, '').replace(/\.(tsx|ts)$/, '').split('/');
  const component = parts[parts.length - 1].replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');

  // Determine base key from file location
  let baseKey = '';
  if (filePath.includes('components/Header')) baseKey = 'header';
  else if (filePath.includes('components/Footer')) baseKey = 'footer';
  else if (filePath.includes('components/admin/')) baseKey = 'admin';
  else if (filePath.includes('components/reading/')) baseKey = 'reading';
  else if (filePath.includes('components/profile/')) baseKey = 'profile';
  else if (filePath.includes('components/rewards/')) baseKey = 'rewards';
  else if (filePath.includes('components/legal/')) baseKey = 'legal';
  else if (filePath.includes('components/blog/')) baseKey = 'blog';
  else if (filePath.includes('components/tarot/')) baseKey = 'tarot';
  else if (filePath.includes('App.tsx')) baseKey = 'app';
  else if (filePath.includes('services/')) baseKey = 'service';
  else baseKey = component;

  // Create slug from English text (max 40 chars)
  const textSlug = enText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 40);

  // Ensure uniqueness
  let key = `${baseKey}.${textSlug}`;
  let counter = 1;
  while (usedKeys.has(key)) {
    key = `${baseKey}.${textSlug}_${counter}`;
    counter++;
  }

  usedKeys.add(key);
  return key;
}

function extractFromFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');

  patterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern);
    while ((match = regex.exec(content)) !== null) {
      const enText = match[1];
      const frText = match[2];
      const index = match.index;
      const lineNumber = content.substring(0, index).split('\n').length;

      translations.push({
        key: generateKey(filePath, enText),
        en: enText,
        fr: frText,
        file: filePath,
        line: lineNumber,
      });
    }
  });
}

function scanDirectory(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && !['node_modules', 'dist', 'build', 'coverage', '.git'].includes(entry.name)) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      extractFromFile(fullPath);
    }
  }
}

// Main execution
console.log('🔍 Scanning for hardcoded translations...');
['./components', './services', './App.tsx', './context'].forEach(path => {
  if (fs.existsSync(path)) scanDirectory(path);
});

console.log(`\n✅ Found ${translations.length} hardcoded translation strings`);

// Report top files
const byFile = translations.reduce((acc, t) => {
  if (!acc[t.file]) acc[t.file] = [];
  acc[t.file].push(t);
  return acc;
}, {} as Record<string, Translation[]>);

console.log('\n📁 Breakdown by file (top 10):');
Object.entries(byFile)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 10)
  .forEach(([file, trans]) => console.log(`  ${file}: ${trans.length} strings`));

// Save results
fs.writeFileSync(
  'scripts/extracted-translations.json',
  JSON.stringify({ translations, summary: { total: translations.length, byFile } }, null, 2)
);

console.log('\n💾 Saved to scripts/extracted-translations.json');
```

**Step 2: Run extraction script**

From project root:
```bash
npx tsx scripts/extract-translations.ts
```

Expected output shows number of strings found per file.

**Step 3: Review extracted translations**

Open `scripts/extracted-translations.json` and verify keys are semantic and organized.

**Step 4: Commit extraction script**

```bash
git add scripts/extract-translations.ts scripts/extracted-translations.json
git commit -m "feat: add translation extraction script"
```

---

## Task 2: Generate Seed Data from Extracted Translations

**Files:**
- Create: `scripts/generate-seed-data.ts`
- Modify: `server/src/routes/translations.ts` (extend defaultTranslations object)

**Step 1: Create seed data generator**

```typescript
// scripts/generate-seed-data.ts
import * as fs from 'fs';

interface ExtractedData {
  translations: Array<{
    key: string;
    en: string;
    fr: string;
    file: string;
    line: number;
  }>;
}

const data: ExtractedData = JSON.parse(
  fs.readFileSync('scripts/extracted-translations.json', 'utf-8')
);

// Generate TypeScript object entries
const entries = data.translations.map(t => {
  const en = t.en.replace(/'/g, "\\'").replace(/\n/g, '\\n');
  const fr = t.fr.replace(/'/g, "\\'").replace(/\n/g, '\\n');
  return `      '${t.key}': { en: '${en}', fr: '${fr}' }, // ${t.file}:${t.line}`;
});

const output = entries.join(',\n');
fs.writeFileSync('scripts/seed-data-additions.txt', output);

console.log(`Generated ${entries.length} translation entries`);
console.log('Saved to scripts/seed-data-additions.txt');
console.log('\nCopy this content into server/src/routes/translations.ts');
console.log('in the defaultTranslations object before the closing brace.');
```

**Step 2: Run seed generator**

```bash
npx tsx scripts/generate-seed-data.ts
```

**Step 3: Update translations.ts seed endpoint**

1. Open `server/src/routes/translations.ts`
2. Find the `defaultTranslations` object (starts around line 380)
3. Before the closing brace (around line 1027), add a new line
4. Paste the contents of `scripts/seed-data-additions.txt`

**Step 4: Test seed endpoint (requires backend running)**

Start backend:
```bash
cd server && npm run dev
```

In another terminal, call seed endpoint with admin token:
```bash
curl -X POST http://localhost:3001/api/translations/admin/seed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: `{ success: true, languages: 2, translations: 500+ }`

**Step 5: Verify in admin UI**

1. Start frontend: `npm run dev`
2. Sign in as admin
3. Navigate to Admin → Translations
4. Search for a few of your new keys
5. Verify they loaded correctly

**Step 6: Commit seed data**

```bash
git add server/src/routes/translations.ts scripts/generate-seed-data.ts scripts/seed-data-additions.txt
git commit -m "feat: extend translation seed with extracted strings"
```

---

## Task 3: Replace Hardcoded Strings - App.tsx

**Files:**
- Modify: `App.tsx` (approximately 18 hardcoded strings)

**Step 1: Import translation function**

Verify `useApp` is imported at the top:
```tsx
import { useApp } from './context/AppContext';
```

Inside the component:
```tsx
const { user, language, t } = useApp();
```

**Step 2: Replace access denied modal (around line 535)**

Find:
```tsx
{language === 'en' ? 'Access Denied' : 'Accès Refusé'}
```

Replace with:
```tsx
{t('app.access_denied', 'Access Denied')}
```

**Step 3: Replace button labels (around lines 545-551)**

Find:
```tsx
{language === 'en' ? 'Sign In' : 'Se connecter'}
{language === 'en' ? 'Go Home' : 'Retour à l\'accueil'}
```

Replace with:
```tsx
{t('nav.signIn', 'Sign In')}
{t('app.go_home', 'Go Home')}
```

**Step 4: Replace hero section (around line 708)**

Find:
```tsx
{language === 'en' ? 'Start Your Reading' : 'Commencer Votre Lecture'}
```

Replace with:
```tsx
{t('home.startReading', 'Start Your Reading')}
```

**Step 5: Replace feature cards (around lines 721-742)**

Find:
```tsx
{language === 'en' ? 'AI Powered Insights' : 'Insights par IA'}
{language === 'en' ? 'Deep, context-aware interpretations powered by AI.' : 'Interprétations profondes et contextuelles alimentées par l\'IA.'}
```

Replace with:
```tsx
{t('features.aiPowered', 'AI Powered Insights')}
{t('features.aiPoweredDesc', 'Deep, context-aware interpretations powered by AI.')}
```

Repeat for the other two features using existing keys from seed:
- `features.privateSecure` / `features.privateSecureDesc`
- `features.instantClarity` / `features.instantClarityDesc`

**Step 6: Replace modal strings (around lines 849-933)**

Find credit modal strings:
```tsx
{language === 'en' ? 'Not Enough Credits' : 'Crédits Insuffisants'}
{language === 'en' ? 'Cancel' : 'Annuler'}
{language === 'en' ? 'Buy Credits' : 'Acheter des Crédits'}
{language === 'en' ? 'Running Low on Credits' : 'Crédits Bientôt Épuisés'}
{language === 'en' ? 'Later' : 'Plus Tard'}
```

Replace with:
```tsx
{t('error.notEnoughCredits', 'Not Enough Credits')}
{t('common.cancel', 'Cancel')}
{t('message.buyCredits', 'Buy Credits')}
{t('error.lowCredits', 'Running Low on Credits')}
{t('message.later', 'Later')}
```

**Step 7: Test App.tsx changes**

```bash
npm run dev
```

Test:
1. Navigate to home page
2. Switch language using flag icon
3. Verify all text updates correctly
4. Navigate to /admin without auth → verify "Access Denied" translates
5. Trigger credit insufficient modal → verify translations

**Step 8: Commit**

```bash
git add App.tsx
git commit -m "refactor: replace hardcoded translations in App.tsx"
```

---

## Task 4: Replace Hardcoded Strings - Navigation Components

**Files:**
- Modify: `components/Header.tsx`
- Modify: `components/SubNav.tsx`
- Modify: `components/Footer.tsx`

**Step 1: Update Header.tsx**

Replace all `language === 'en' ? ...` patterns with `t()` calls using these keys (already in seed):
- `nav.home`
- `nav.reading`
- `nav.horoscope`
- `nav.profile`
- `nav.admin`
- `nav.credits`
- `nav.signIn`
- `nav.signOut`

Example:
```tsx
// Before
{language === 'en' ? 'Profile' : 'Profil'}

// After
{t('nav.profile', 'Profile')}
```

**Step 2: Update SubNav.tsx**

Replace with `subnav.*` keys from seed:
- `subnav.tarot.title`
- `subnav.tarot.single.desc`
- `subnav.horoscope.title`
- `subnav.learn.about.label`
- `subnav.learn.blog.label`
- etc.

**Step 3: Update Footer.tsx**

Replace with `legal.*` keys:
- `legal.privacy`
- `legal.terms`
- `legal.cookies`
- `legal.contact`

**Step 4: Test navigation**

Start app and verify:
- All header links translate
- SubNav dropdown menus translate
- Footer links translate
- Language switch works throughout

**Step 5: Commit**

```bash
git add components/Header.tsx components/SubNav.tsx components/Footer.tsx
git commit -m "refactor: replace hardcoded translations in navigation"
```

---

## Task 5: Replace Hardcoded Strings - FAQ Component

**Files:**
- Modify: `components/FAQ.tsx`

**Step 1: Replace FAQ header**

Use keys:
- `faq.hero.title`
- `faq.hero.subtitle`
- `faq.disclaimer.title`
- `faq.disclaimer.text`

**Step 2: Replace FAQ sections**

The FAQ has extensive translations already in seed under:
- `faq.gettingStarted.*`
- `faq.credits.*`
- `faq.readings.*`
- `faq.privacy.*`
- `faq.support.*`

Replace each ternary with corresponding `t()` call.

**Step 3: Handle special case - credit costs (around line 316-321)**

Find:
```tsx
({singleCardCost} {language === 'en' ? 'credit' : 'crédit'})
```

Replace with:
```tsx
({singleCardCost} {t(singleCardCost === 1 ? 'tarot.credit' : 'tarot.credits')})
```

**Step 4: Test**

Navigate to `/faq` and verify all sections translate correctly.

**Step 5: Commit**

```bash
git add components/FAQ.tsx
git commit -m "refactor: replace hardcoded translations in FAQ"
```

---

## Task 6: Replace Hardcoded Strings - Reading Flow

**Files:**
- Modify: `components/ActiveReading.tsx`
- Modify: `components/SpreadSelector.tsx`
- Modify: `components/reading/ReadingShufflePhase.tsx`
- Modify: `components/reading/phases/QuestionIntroPhase.tsx`
- Modify: `components/reading/phases/DrawingPhase.tsx`
- Modify: `components/reading/phases/RevealingPhase.tsx`
- Modify: `components/reading/phases/InterpretationPhase.tsx`

**Step 1: Update ActiveReading.tsx**

Replace validation messages (around lines 210, 224, 274, 410):
```tsx
// Before
setValidationMessage(language === 'en' ? 'Insufficient credits' : 'Crédits insuffisants');
setQuestion(language === 'en' ? "Guidance from the Tarot" : "Guidance du Tarot");

// After
setValidationMessage(t('error.insufficientCredits', 'Insufficient credits'));
setQuestion(t('tarot.defaultQuestion', 'Guidance from the Tarot'));
```

Add `tarot.defaultQuestion` to seed if not present.

**Step 2: Update SpreadSelector.tsx**

Replace spread names and descriptions with `tarot.*` keys:
- `tarot.singleCard`, `tarot.threeCard`, `tarot.celticCross`, etc.
- `tarot.cost`, `tarot.credit`, `tarot.credits`

**Step 3: Update reading phase components**

For each phase component, replace `language === 'en' ? ...` with appropriate `t()` calls.
Use `reading.*` prefix for phase-specific strings.

**Step 4: Test reading flow**

1. Start a new reading
2. Progress through all phases
3. Test multiple spread types
4. Switch language mid-reading
5. Verify all messages translate

**Step 5: Commit**

```bash
git add components/ActiveReading.tsx components/SpreadSelector.tsx components/reading/
git commit -m "refactor: replace hardcoded translations in reading flow"
```

---

## Task 7: Replace Hardcoded Strings - Profile Components

**Files:**
- Modify: `components/UserProfile.tsx`
- Modify: `components/profile/AchievementCard.tsx`
- Modify: `components/profile/ReadingHistoryCard.tsx`
- Modify: `components/profile/TransactionItem.tsx`
- Modify: `components/profile/EmptyState.tsx`
- Modify: `components/profile/ReadingFilters.tsx`
- Modify: `components/profile/TransactionFilters.tsx`

**Step 1: Update UserProfile.tsx**

Replace with `profile.*` keys:
- `profile.title`
- `profile.credits`
- `profile.readingHistory`
- `profile.achievements`
- `profile.settings`
- `profile.dailyBonus`

**Step 2: Update profile sub-components**

Each sub-component should use `profile.*` or component-specific keys for labels, buttons, empty states.

**Step 3: Test profile page**

Navigate to `/profile` and verify:
- All tabs translate
- Achievement cards translate
- Reading history translates
- Transaction list translates
- Empty states translate

**Step 4: Commit**

```bash
git add components/UserProfile.tsx components/profile/
git commit -m "refactor: replace hardcoded translations in profile"
```

---

## Task 8: Replace Hardcoded Strings - Admin Components

**Files:**
- Modify: `components/admin/*.tsx` (multiple files)

**Step 1: Update admin components**

Most admin strings already have keys under `admin.*`:
- `admin.title`, `admin.overview`, `admin.users`, `admin.transactions`, etc.
- `admin.blog.posts`, `admin.blog.categories`, `admin.blog.newPost`, etc.

Replace all ternaries systematically across:
- AdminDashboard.tsx
- AdminOverview.tsx
- AdminUsers.tsx
- AdminTransactions.tsx
- AdminPackages.tsx
- AdminBlog.tsx
- AdminEmailTemplates.tsx
- AdminHealth.tsx
- AdminSettings.tsx
- AdminAnalytics.tsx
- AdminTranslations.tsx (this one already uses translation context!)

**Step 2: Test admin panel**

Sign in as admin, navigate to `/admin`, and verify:
- All tab labels translate
- Form labels translate
- Buttons translate
- Status messages translate

**Step 3: Commit**

```bash
git add components/admin/
git commit -m "refactor: replace hardcoded translations in admin"
```

---

## Task 9: Replace Hardcoded Strings - Remaining Components

**Files:**
- Modify: `components/AboutUs.tsx`
- Modify: `components/blog/BlogList.tsx`
- Modify: `components/blog/BlogPost.tsx`
- Modify: `components/tarot/*.tsx`
- Modify: `components/rewards/*.tsx`
- Modify: `components/legal/*.tsx`
- Modify: All other components with hardcoded strings

**Step 1: Update AboutUs.tsx**

Use `about.*` keys from seed:
- `about.title`, `about.subtitle`
- `about.story.title`, `about.story.p1`, `about.story.p2`
- `about.values.ai.title`, `about.values.ai.desc`
- etc.

**Step 2: Update blog components**

Use `blog.*` keys:
- `blog.title`, `blog.subtitle`, `blog.featured`, `blog.all`
- `blog.categories`, `blog.tags`, `blog.readMore`
- etc.

**Step 3: Update tarot components**

Use `tarot.*` keys for any UI strings in:
- TarotCardsOverview.tsx
- TarotCategorySection.tsx
- TarotCardPreview.tsx
- TarotArticlePage.tsx
- TarotArticlesList.tsx

**Step 4: Update rewards components**

Use `rewards.*` keys:
- DailyBonusPopup.tsx
- DailyBonusCard.tsx
- AchievementUnlockModal.tsx
- ReadingCompleteCelebration.tsx

**Step 5: Update legal components**

Use `legal.*` keys:
- PrivacyPolicy.tsx
- TermsOfService.tsx
- CookiePolicy.tsx
- CookieConsent.tsx

**Step 6: Update misc components**

Go through remaining files:
- CreditShop.tsx
- HoroscopeReading.tsx
- WelcomeModal.tsx
- QuestionLengthModal.tsx
- PaymentResult.tsx
- Breadcrumb.tsx
- etc.

**Step 7: Test each updated component**

Visit each page/trigger each component and verify translations work.

**Step 8: Commit in logical batches**

```bash
git add components/AboutUs.tsx
git commit -m "refactor: replace hardcoded translations in AboutUs"

git add components/blog/
git commit -m "refactor: replace hardcoded translations in blog"

git add components/tarot/
git commit -m "refactor: replace hardcoded translations in tarot components"

git add components/rewards/
git commit -m "refactor: replace hardcoded translations in rewards"

git add components/legal/
git commit -m "refactor: replace hardcoded translations in legal"

git add components/
git commit -m "refactor: replace hardcoded translations in remaining components"
```

---

## Task 10: Update Services and Context

**Files:**
- Modify: `context/AppContext.tsx:273`
- Review: `services/openrouterService.ts` (may not need changes)

**Step 1: Update AppContext deductCredits error**

Find line 273:
```tsx
message: language === 'en' ? 'Insufficient credits' : 'Crédits insuffisants'
```

This context method doesn't have access to `t()`. Options:
1. Remove message (let components handle translation)
2. Pass translated message from component

**Recommendation:** Simplify to English, let components translate:
```tsx
return { success: false, message: 'Insufficient credits' };
```

Components calling this can use `t('error.insufficientCredits')`.

**Step 2: Review openrouterService.ts**

This service uses language ternaries for:
- Card names in AI prompts
- Reversed indicator in prompts
- Spread names in prompts

**Decision:** Keep as-is. These strings are part of AI prompts, not user-facing UI. It's acceptable to keep them hardcoded in the service.

If we wanted to make them dynamic, we'd need to pass translated strings as parameters.

**Step 3: Commit**

```bash
git add context/AppContext.tsx
git commit -m "refactor: simplify error messages in AppContext"
```

---

## Task 11: Verify Translation Coverage

**Step 1: Re-run extraction script**

```bash
npx tsx scripts/extract-translations.ts
```

Expected: 0 remaining hardcoded strings (or only intentional exceptions documented)

**Step 2: Manual grep verification**

```bash
grep -r "language === 'en' ?" components/ App.tsx context/ --include="*.tsx" --include="*.ts"
```

Expected: No matches (or only in services/prompts as documented exceptions)

**Step 3: Alternative pattern check**

Also check for:
```bash
grep -r "language === \"en\" ?" components/ App.tsx context/ --include="*.tsx" --include="*.ts"
```

**Step 4: Document exceptions**

Create `docs/TRANSLATION_EXCEPTIONS.md`:

```markdown
# Translation Exceptions

The following files intentionally retain hardcoded language ternaries:

## services/openrouterService.ts

**Reason:** Card names, spread names, and position meanings are used in AI prompts sent to OpenRouter. These are internal to the prompt construction and not displayed to users.

**Lines:**
- 284: Card name selection for prompts
- 289: Reversed indicator in prompts
- 310-336: Spread details for prompt context

**Decision:** Keep as-is. If we need to make these dynamic in the future, we can pass translated strings as parameters to the service functions.
```

**Step 5: Commit**

```bash
git add docs/TRANSLATION_EXCEPTIONS.md
git commit -m "docs: document translation exceptions"
```

---

## Task 12: End-to-End Testing

**Step 1: Test unauthenticated user flow**

1. Start app: `npm run dev`
2. Navigate to home page
3. Switch language EN → FR
4. Verify all text translates:
   - Header navigation
   - Hero section
   - Feature cards
   - Footer
5. Navigate to `/faq`
6. Switch FR → EN
7. Verify FAQ sections translate
8. Navigate to `/about`
9. Verify about page translates
10. Navigate to `/how-credits-work`
11. Verify credits page translates

**Step 2: Test authenticated user flow**

1. Sign in
2. Switch language multiple times
3. Navigate to `/reading`
4. Start a reading
5. Progress through phases
6. Switch language mid-reading
7. Verify all prompts/buttons translate
8. Complete reading
9. Navigate to `/profile`
10. Verify all profile sections translate
11. Switch language on profile page

**Step 3: Test admin flow**

1. Sign in as admin (username: mooks or louise)
2. Navigate to `/admin`
3. Verify all admin tabs translate
4. Navigate to Admin → Translations
5. Edit a translation (e.g., change "Home" to "Homepage")
6. Navigate back to home page
7. Verify change appears (may take up to 5 minutes for cache refresh)
8. Force refresh browser to bypass cache
9. Verify updated translation appears

**Step 4: Test missing translation fallback**

1. Via admin panel, delete a translation (or temporarily rename a key)
2. Navigate to page that uses it
3. Verify fallback English text appears
4. Check browser console for any errors (optional: add dev warning)

**Step 5: Test cache behavior**

1. Open DevTools → Network tab
2. Clear cache
3. Reload page
4. Verify initial translation API call
5. Navigate between pages
6. Verify NO additional translation API calls (using localStorage)
7. Wait 5+ minutes
8. Reload page
9. Verify background version check occurs

**Step 6: Test language persistence**

1. Set language to French
2. Close browser tab
3. Reopen application
4. Verify language is still French (stored in user profile)

---

## Task 13: Performance and Error Handling

**Step 1: Add missing translation warning (optional)**

In `context/AppContext.tsx`, update the `t()` function to log missing keys in development:

```tsx
const t = useCallback(
  (key: string, fallback?: string): string => {
    const result = translate(translations, key, fallback);
    if (import.meta.env.DEV && !translations[key] && fallback) {
      console.warn(`[Translation] Missing key: ${key}`);
    }
    return result;
  },
  [translations]
);
```

**Step 2: Test with missing keys**

1. Add a new component with `t('nonexistent.key', 'Fallback')`
2. Verify:
   - Fallback text displays
   - Warning appears in console (dev mode only)

**Step 3: Commit**

```bash
git add context/AppContext.tsx
git commit -m "feat: add dev warning for missing translation keys"
```

---

## Task 14: Update Documentation

**Files:**
- Modify: `CLAUDE.md`
- Create: `docs/TRANSLATIONS.md`

**Step 1: Update CLAUDE.md**

Add section after line 100:

```markdown
## Translation System

All user-facing strings are dynamic and editable via the Admin panel. **Never use hardcoded ternaries.**

### Using Translations in Components

```tsx
import { useApp } from '../context/AppContext';

function MyComponent() {
  const { t } = useApp();

  return (
    <div>
      <h1>{t('page.title', 'Default Title')}</h1>
      <p>{t('page.description', 'Default description')}</p>
    </div>
  );
}
```

### Adding New Translations

1. **Use in code** with fallback:
   ```tsx
   {t('feature.newLabel', 'My New Label')}
   ```

2. **Add to seed** in `server/src/routes/translations.ts`:
   ```typescript
   'feature.newLabel': { en: 'My New Label', fr: 'Mon Nouveau Label' },
   ```

3. **Re-run seed** (admin only):
   ```bash
   curl -X POST http://localhost:3001/api/translations/admin/seed \
     -H "Authorization: Bearer TOKEN"
   ```

4. **Or add via Admin UI**: Admin → Translations → Edit directly

### Translation Key Conventions

- Use dot notation: `section.subsection.identifier`
- Organize by context: `nav.*`, `tarot.*`, `profile.*`, `admin.*`
- Keep keys descriptive: `error.insufficient_credits` not `err1`
- Use English fallback for development

### NEVER Do This

❌ **Hardcoded ternaries:**
```tsx
{language === 'en' ? 'Text' : 'Texte'}
```

✅ **Dynamic translations:**
```tsx
{t('context.key', 'Text')}
```
```

**Step 2: Create comprehensive translation docs**

Create `docs/TRANSLATIONS.md`:

```markdown
# Translation System Documentation

## Architecture Overview

MysticOracle uses a database-backed translation system with intelligent client-side caching:

### Components

1. **Database (PostgreSQL)**
   - `Language` table: Supported languages (en, fr)
   - `Translation` table: Key-value pairs per language
   - `CacheVersion` table: Version tracking for cache invalidation

2. **Backend API** (`server/src/routes/translations.ts`)
   - Public endpoints: `/api/translations/:langCode`, `/api/translations/version`
   - Admin endpoints: CRUD operations for languages and translations
   - Seed endpoint: `/api/translations/admin/seed` (populates defaults)

3. **Frontend Service** (`services/translationService.ts`)
   - Loads translations on app start
   - Caches in localStorage with version tracking
   - Background sync every 5 minutes
   - Event-based cache invalidation

4. **React Context** (`context/AppContext.tsx`)
   - Provides `t(key, fallback)` function
   - Manages current language
   - Updates on language switch

5. **Admin UI** (`components/admin/AdminTranslations.tsx`)
   - Full CRUD interface
   - Search and organize by prefix
   - Immediate cache invalidation on changes

## Frontend Usage

### Basic Usage

```tsx
import { useApp } from '../context/AppContext';

function MyComponent() {
  const { t, language } = useApp();

  return (
    <div>
      <h1>{t('page.title', 'Page Title')}</h1>
      <p>{t('page.description', 'Description text')}</p>
    </div>
  );
}
```

### Dynamic Keys

```tsx
const creditWord = count === 1 ? 'tarot.credit' : 'tarot.credits';
<span>{count} {t(creditWord)}</span>
```

### With Variables

Translation values can include variables, but you need to handle interpolation:

```tsx
const message = t('profile.credits_balance', 'You have {count} credits');
const final = message.replace('{count}', user.credits.toString());
```

## Key Naming Conventions

### Pattern

`<context>.<subsection>.<identifier>`

### Contexts

- `nav.*` - Navigation (header, footer, menus)
- `tarot.*` - Tarot reading content
- `reading.*` - Reading flow UI
- `profile.*` - User profile page
- `admin.*` - Admin dashboard
- `blog.*` - Blog/articles
- `horoscope.*` - Horoscope content
- `common.*` - Shared UI elements (buttons, labels)
- `error.*` - Error messages
- `message.*` - User-facing messages
- `legal.*` - Legal pages (privacy, terms)
- `features.*` - Feature descriptions
- `about.*` - About page
- `faq.*` - FAQ page
- `credits.*` - Credits/pricing page
- `shop.*` - Credit shop
- `rewards.*` - Achievements/bonuses
- `welcome.*` - Welcome modal
- `reflection.*` - Reading reflections
- `subnav.*` - SubNav dropdowns
- `confirm.*` - Confirmation dialogs
- `status.*` - Status labels

### Examples

```typescript
'nav.home': { en: 'Home', fr: 'Accueil' }
'tarot.singleCard': { en: 'Single Card', fr: 'Une Carte' }
'error.insufficientCredits': { en: 'Insufficient credits', fr: 'Crédits insuffisants' }
'common.cancel': { en: 'Cancel', fr: 'Annuler' }
'profile.readingHistory': { en: 'Reading History', fr: 'Historique des Lectures' }
```

## Backend Management

### Seed Endpoint

**Purpose:** Initialize or reset translations to defaults

**Endpoint:** `POST /api/translations/admin/seed`

**Auth:** Admin only

**What it does:**
1. Creates English and French languages (if not exist)
2. Upserts all translations from `defaultTranslations` object
3. Bumps cache version to invalidate client caches

**When to use:**
- Initial setup (first deploy)
- After adding new translations to seed data
- To reset translations to defaults (overrides admin edits!)

### Adding New Translations to Seed

1. Open `server/src/routes/translations.ts`
2. Find `defaultTranslations` object (line ~380)
3. Add new entries:
   ```typescript
   'myfeature.label': { en: 'My Label', fr: 'Mon Label' },
   'myfeature.description': { en: 'Description', fr: 'Description' },
   ```
4. Restart backend
5. Call seed endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/translations/admin/seed \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Admin CRUD API

**List languages:**
```bash
GET /api/translations/admin/languages
```

**Get all translations for a language:**
```bash
GET /api/translations/admin/en
GET /api/translations/admin/fr
```

**Create/update translation:**
```bash
POST /api/translations/admin/translations
{
  "key": "feature.label",
  "value": "My Label",
  "languageId": "language-uuid"
}
```

**Bulk upsert:**
```bash
POST /api/translations/admin/translations/bulk
{
  "languageId": "language-uuid",
  "translations": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

**Delete translation:**
```bash
DELETE /api/translations/admin/translations/:id
```

## Caching Strategy

### Client-Side Cache

**Storage:** localStorage

**Keys:**
- `mystic_translations_en` - English translations object
- `mystic_translations_fr` - French translations object
- `mystic_translations_version_en` - English version number
- `mystic_translations_version_fr` - French version number

**TTL:** None (persists until invalidated)

**Stale Threshold:** 5 minutes

**How it works:**
1. On app load, check localStorage for cached translations
2. If found, use immediately (fast!)
3. If cache timestamp > 5 minutes old, check version in background
4. If server version > local version, fetch new translations
5. Dispatch `translations-updated` event to trigger re-render

**Benefits:**
- Instant load times (no API call on every page load)
- Automatic updates (within 5 minutes of admin changes)
- Offline-first (works even if API is down)

### Server-Side Cache

**Storage:** Redis (via CacheService)

**TTL:** 3600 seconds (1 hour)

**Keys:**
- `translations:languages` - List of active languages
- `translations:en` - English translations
- `translations:fr` - French translations
- `translations:version` - Current version number

**Invalidation:**
- Automatic on any translation mutation (create, update, delete)
- Manual via `/api/admin/cache/purge` endpoint

## Version Tracking

The `CacheVersion` table tracks when translations change:

```sql
CREATE TABLE "CacheVersion" (
  "entity" TEXT PRIMARY KEY,
  "version" INTEGER NOT NULL
);

INSERT INTO "CacheVersion" (entity, version) VALUES ('translations', 1);
```

**On any translation change:**
```typescript
await prisma.cacheVersion.upsert({
  where: { entity: 'translations' },
  create: { entity: 'translations', version: 1 },
  update: { version: { increment: 1 } }
});
```

**Client checks version:**
```typescript
GET /api/translations/version → { version: 5 }
```

If client has version 4, refetch translations.

## Testing Translations

### Manual Testing

1. **Switch language:**
   - Click flag icon in header
   - Verify all UI text updates

2. **Edit translation:**
   - Admin → Translations
   - Find a key, edit value
   - Navigate to page using that key
   - Wait up to 5 minutes or force refresh
   - Verify change appears

3. **Test fallback:**
   - Use `t('nonexistent.key', 'Fallback')`
   - Verify "Fallback" displays
   - Check console for warning (dev mode)

### Automated Testing

```typescript
import { translate } from '../services/translationService';

describe('translate', () => {
  it('returns translation if key exists', () => {
    const translations = { 'nav.home': 'Home' };
    expect(translate(translations, 'nav.home')).toBe('Home');
  });

  it('returns fallback if key missing', () => {
    expect(translate({}, 'missing.key', 'Fallback')).toBe('Fallback');
  });

  it('returns key if no fallback provided', () => {
    expect(translate({}, 'missing.key')).toBe('missing.key');
  });
});
```

## Troubleshooting

### Translation not updating

1. Check cache version:
   ```bash
   GET /api/translations/version
   ```

2. Check localStorage version:
   ```javascript
   localStorage.getItem('mystic_translations_version_en')
   ```

3. If versions match but translation wrong:
   - Clear localStorage: `localStorage.clear()`
   - Refresh page

4. If server version not incrementing:
   - Check `CacheVersion` table
   - Manually bump: `UPDATE "CacheVersion" SET version = version + 1 WHERE entity = 'translations'`

### Translation showing key instead of text

1. Check translation exists in database
2. Check localStorage has the key
3. Check `t()` call has correct key name
4. Check fallback is provided

### Language not persisting

1. Check user profile in database
2. Verify `/api/users/me` returns correct language
3. Check `updateUserProfile` API call succeeds when switching

## Best Practices

### DO

✅ Use `t()` for ALL user-facing text
✅ Provide descriptive fallbacks
✅ Organize keys by context
✅ Document new key patterns
✅ Test language switching

### DON'T

❌ Hardcode language ternaries
❌ Use cryptic key names (e.g., `str1`)
❌ Put HTML in translation values
❌ Use translations for internal logic
❌ Forget to add to seed data

## Migration from Hardcoded Strings

See `docs/plans/2026-01-13-dynamic-translations-refactor.md` for the full migration plan.

**Summary:**
1. Extract all `language === 'en' ? 'Text' : 'Texte'` patterns
2. Generate semantic keys
3. Add to seed data
4. Replace with `t()` calls
5. Test thoroughly
```

**Step 3: Commit documentation**

```bash
git add CLAUDE.md docs/TRANSLATIONS.md
git commit -m "docs: add comprehensive translation system documentation"
```

---

## Task 15: Final Cleanup and Verification

**Step 1: Remove extraction scripts**

```bash
git rm scripts/extract-translations.ts scripts/generate-seed-data.ts scripts/extracted-translations.json scripts/seed-data-additions.txt
git commit -m "chore: remove temporary extraction scripts"
```

**Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: No type errors

If errors occur, fix them before proceeding.

**Step 3: Run build**

Frontend:
```bash
npm run build
```

Backend:
```bash
cd server && npm run build
```

Both should succeed with no errors.

**Step 4: Create commit summary**

```bash
git log --oneline --since="1 day ago" > docs/TRANSLATION_REFACTOR_SUMMARY.txt
git add docs/TRANSLATION_REFACTOR_SUMMARY.txt
git commit -m "docs: add refactor commit summary"
```

**Step 5: Final verification**

Run one last grep to ensure no hardcoded strings remain:
```bash
grep -r "language === 'en' ?" --include="*.tsx" --include="*.ts" components/ App.tsx context/ services/
```

Expected: Only documented exceptions (or no matches)

---

## Completion Checklist

Before marking this refactor complete, verify:

- [ ] Extraction script created and run successfully
- [ ] All hardcoded strings extracted to JSON
- [ ] Seed data extended with all extracted translations
- [ ] Seed endpoint tested and runs successfully
- [ ] App.tsx refactored (0 hardcoded strings)
- [ ] Navigation components refactored (Header, SubNav, Footer)
- [ ] FAQ component refactored
- [ ] Reading flow components refactored
- [ ] Profile components refactored
- [ ] Admin components refactored
- [ ] All other components refactored
- [ ] Services reviewed (intentional exceptions documented)
- [ ] Context updated (no hardcoded messages)
- [ ] Final grep returns 0 results (excluding documented exceptions)
- [ ] Language switching works throughout app
- [ ] Admin translation editing works
- [ ] Cache invalidation works
- [ ] Fallbacks work for missing keys
- [ ] Performance is acceptable (no extra API calls)
- [ ] Documentation updated (CLAUDE.md, TRANSLATIONS.md)
- [ ] Translation exceptions documented
- [ ] Type check passes (`tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] Extraction scripts removed

---

## Deployment Plan

### Pre-Deployment

1. Merge all commits to main branch
2. Run tests in CI/CD (if configured)
3. Create deployment tag: `git tag v1.1.0-translations`

### Backend Deployment

1. Deploy backend to production
2. Prisma migrations run automatically (no schema changes needed)
3. Call seed endpoint:
   ```bash
   curl -X POST https://api.mysticoracle.com/api/translations/admin/seed \
     -H "Authorization: Bearer PRODUCTION_ADMIN_TOKEN"
   ```
4. Verify seed succeeded: Check response for success + translation count
5. Test API: `curl https://api.mysticoracle.com/api/translations/en`

### Frontend Deployment

1. Build frontend: `npm run build`
2. Deploy build to production
3. Verify deployment: Visit site, check console for errors

### Post-Deployment Verification

1. Visit production site
2. Switch language EN ↔ FR
3. Navigate to multiple pages
4. Verify all text translates
5. Sign in as admin
6. Edit a translation via Admin panel
7. Verify change appears (within 5 minutes)

### Monitoring

Check for:
- API errors (translation endpoints)
- JavaScript console errors
- Missing translation warnings
- User reports of untranslated text

---

## Rollback Plan

If critical issues occur post-deployment:

### Frontend Rollback

1. Revert to previous frontend deployment
2. Old hardcoded strings will display
3. Translation API calls will fail gracefully (fallbacks work)

### Backend Rollback

Not necessary - translations are additive only. If issues occur:
1. Revert frontend (see above)
2. Fix issues in development
3. Re-deploy when ready

### Database Rollback

Not recommended. If absolutely necessary:
1. Truncate `Translation` table: `TRUNCATE "Translation";`
2. Truncate `Language` table: `TRUNCATE "Language" CASCADE;`
3. Reset version: `UPDATE "CacheVersion" SET version = 1 WHERE entity = 'translations';`
4. Re-run seed

---

## Success Criteria

This refactor is complete when:

1. ✅ **Zero hardcoded strings** (excluding documented exceptions)
2. ✅ **All UI text translates** when switching language
3. ✅ **Admin can edit any string** via Admin panel
4. ✅ **Changes appear within 5 minutes** (cache refresh)
5. ✅ **Fallbacks work** for missing translations
6. ✅ **No performance regression** (instant loads via localStorage)
7. ✅ **Documentation complete** (CLAUDE.md, TRANSLATIONS.md)
8. ✅ **Type check passes**
9. ✅ **Build succeeds**
10. ✅ **Production deployment successful**

---

## Notes for Implementer

- **Take breaks** - This is a large refactor (85+ files)
- **Commit frequently** - Small, logical commits are easier to review/revert
- **Test as you go** - Don't wait until the end to test language switching
- **Use search & replace carefully** - Many patterns are repetitive
- **Check existing keys** - Many translations already exist in seed data
- **Ask for help** - If unsure about a key name or context, ask
- **Document as you go** - Add comments for tricky cases

Good luck! 🎯

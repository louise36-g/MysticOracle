# Celtic Cross Implementation Plan

> **For Claude:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement the Celtic Cross 10-card spread with 5 thematic categories, one universal layout, and the iconic cross + staff visual arrangement.

**Architecture:** Create celticCrossLayouts.ts constants, CelticCrossIntroPhase component, update SpreadIntroSelector with Celtic Cross case, add state/handlers to ActiveReading.tsx. The CelticCrossDisplay visual component is deferred to a later task.

**Tech Stack:** React, TypeScript, Framer Motion, Tailwind CSS

---

## Tasks

### Task 1: Create celticCrossLayouts.ts constants file

**Files:**
- Create: `constants/celticCrossLayouts.ts`

**Reference:** Follow the pattern in `constants/horseshoeLayouts.ts`

**Step 1:** Create the file with types and interfaces:

```typescript
// constants/celticCrossLayouts.ts

export type CelticCrossCategory =
  | 'love'
  | 'career'
  | 'money'
  | 'life_path'
  | 'family';

// Only one layout - the universal Celtic Cross
export type CelticCrossLayoutId = 'celtic_cross';

export interface CelticCrossLayout {
  id: CelticCrossLayoutId;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  positions: {
    en: [string, string, string, string, string, string, string, string, string, string];
    fr: [string, string, string, string, string, string, string, string, string, string];
  };
}

export interface CelticCrossCategoryConfig {
  id: CelticCrossCategory;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  iconName: string;
  colorClass: string;
  layouts: CelticCrossLayoutId[];
  defaultLayout: CelticCrossLayoutId;
}

export interface CelticCrossQuestion {
  id: string;
  textEn: string;
  textFr: string;
}
```

**Step 2:** Add the universal layout definition:

```typescript
// The single universal Celtic Cross layout
export const CELTIC_CROSS_LAYOUT: CelticCrossLayout = {
  id: 'celtic_cross',
  labelEn: 'Celtic Cross',
  labelFr: 'Croix Celtique',
  taglineEn: 'The most comprehensive spread for deep insight into complex situations. Ten cards reveal the full picture - past, present, future, and the forces at play.',
  taglineFr: 'Le tirage le plus complet pour une vision profonde des situations complexes. Dix cartes révèlent le tableau complet - passé, présent, futur et les forces en jeu.',
  positions: {
    en: [
      'The heart of the matter',
      "What's blocking you",
      "What's beneath (unconscious)",
      "What's behind (past)",
      "What's above (conscious goal)",
      "What's ahead (near future)",
      'How you see yourself',
      'How others see you',
      'What you need to know',
      'Where this leads'
    ],
    fr: [
      'Le cœur du sujet',
      'Ce qui vous bloque',
      'Ce qui est en dessous (inconscient)',
      'Ce qui est derrière (passé)',
      'Ce qui est au-dessus (objectif conscient)',
      'Ce qui est devant (futur proche)',
      'Comment vous vous voyez',
      'Comment les autres vous voient',
      'Ce que vous devez savoir',
      'Où cela mène'
    ]
  },
};

// For SpreadIntroSelector compatibility - record format
export const CELTIC_CROSS_LAYOUTS: Record<CelticCrossLayoutId, CelticCrossLayout> = {
  celtic_cross: CELTIC_CROSS_LAYOUT,
};
```

**Step 3:** Add the 5 category configurations:

```typescript
export const CELTIC_CROSS_CATEGORIES: CelticCrossCategoryConfig[] = [
  {
    id: 'love',
    labelEn: 'Love & Relationships',
    labelFr: 'Amour & Relations',
    taglineEn: 'Deep insight into matters of the heart',
    taglineFr: 'Vision profonde des affaires du cœur',
    iconName: 'Heart',
    colorClass: 'rose',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
  {
    id: 'career',
    labelEn: 'Career & Purpose',
    labelFr: 'Carrière & Vocation',
    taglineEn: 'Clarity on your professional path',
    taglineFr: 'Clarté sur votre chemin professionnel',
    iconName: 'Briefcase',
    colorClass: 'amber',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
  {
    id: 'money',
    labelEn: 'Money & Abundance',
    labelFr: 'Argent & Abondance',
    taglineEn: 'Understanding your relationship with prosperity',
    taglineFr: 'Comprendre votre relation avec la prospérité',
    iconName: 'Coins',
    colorClass: 'emerald',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
  {
    id: 'life_path',
    labelEn: 'Life Path',
    labelFr: 'Chemin de Vie',
    taglineEn: 'Navigate major crossroads and transitions',
    taglineFr: 'Naviguez les carrefours et transitions majeurs',
    iconName: 'Compass',
    colorClass: 'indigo',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
  {
    id: 'family',
    labelEn: 'Family & Community',
    labelFr: 'Famille & Communauté',
    taglineEn: 'Insight into bonds and belonging',
    taglineFr: 'Vision des liens et de l\'appartenance',
    iconName: 'Users',
    colorClass: 'teal',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
];
```

**Step 4:** Add questions organized by category:

```typescript
// Questions organized by category (not by layout, since there's only one layout)
export const CELTIC_CROSS_QUESTIONS: Record<CelticCrossCategory, CelticCrossQuestion[]> = {
  love: [
    { id: 'cc_love1', textEn: 'What do I need to understand about where this relationship is heading?', textFr: 'Que dois-je comprendre sur la direction que prend cette relation?' },
    { id: 'cc_love2', textEn: 'What patterns in my heart are shaping how I connect with others?', textFr: 'Quels schémas dans mon cœur façonnent la façon dont je me connecte aux autres?' },
    { id: 'cc_love3', textEn: 'What would help me feel more at peace about this situation with [person]?', textFr: 'Qu\'est-ce qui m\'aiderait à me sentir plus en paix concernant cette situation avec [personne]?' },
    { id: 'cc_love4', textEn: "What's asking for my attention in how I give and receive love?", textFr: 'Qu\'est-ce qui demande mon attention dans ma façon de donner et recevoir l\'amour?' },
  ],
  career: [
    { id: 'cc_career1', textEn: 'What do I need to see clearly about my professional path right now?', textFr: 'Que dois-je voir clairement sur mon chemin professionnel en ce moment?' },
    { id: 'cc_career2', textEn: "What's really driving my feelings of restlessness or dissatisfaction at work?", textFr: 'Qu\'est-ce qui alimente vraiment mes sentiments d\'agitation ou d\'insatisfaction au travail?' },
    { id: 'cc_career3', textEn: 'What would help me feel more aligned with my sense of purpose?', textFr: 'Qu\'est-ce qui m\'aiderait à me sentir plus aligné(e) avec mon sens du but?' },
    { id: 'cc_career4', textEn: "What am I not seeing about this career decision I'm facing?", textFr: 'Qu\'est-ce que je ne vois pas concernant cette décision de carrière?' },
  ],
  money: [
    { id: 'cc_money1', textEn: 'What do I need to understand about my relationship with money and security?', textFr: 'Que dois-je comprendre sur ma relation avec l\'argent et la sécurité?' },
    { id: 'cc_money2', textEn: 'What beliefs or patterns are influencing my financial situation?', textFr: 'Quelles croyances ou schémas influencent ma situation financière?' },
    { id: 'cc_money3', textEn: 'What would help me feel more grounded about my financial future?', textFr: 'Qu\'est-ce qui m\'aiderait à me sentir plus ancré(e) concernant mon avenir financier?' },
    { id: 'cc_money4', textEn: "What's asking for attention in how I relate to abundance?", textFr: 'Qu\'est-ce qui demande attention dans ma relation à l\'abondance?' },
  ],
  life_path: [
    { id: 'cc_life1', textEn: "What do I need to understand about this crossroads I'm facing?", textFr: 'Que dois-je comprendre sur ce carrefour auquel je fais face?' },
    { id: 'cc_life2', textEn: "What's really at the heart of this major decision?", textFr: 'Qu\'est-ce qui est vraiment au cœur de cette décision majeure?' },
    { id: 'cc_life3', textEn: 'What would bring me clarity about the direction my life is taking?', textFr: 'Qu\'est-ce qui m\'apporterait de la clarté sur la direction que prend ma vie?' },
    { id: 'cc_life4', textEn: 'What am I being called to see about my journey right now?', textFr: 'Qu\'est-ce que je suis appelé(e) à voir sur mon voyage en ce moment?' },
  ],
  family: [
    { id: 'cc_family1', textEn: 'What do I need to understand about the dynamics in my family?', textFr: 'Que dois-je comprendre sur les dynamiques dans ma famille?' },
    { id: 'cc_family2', textEn: 'What patterns are shaping my role within my family or community?', textFr: 'Quels schémas façonnent mon rôle au sein de ma famille ou communauté?' },
    { id: 'cc_family3', textEn: 'What would help me feel more at peace in this relationship with [family member]?', textFr: 'Qu\'est-ce qui m\'aiderait à me sentir plus en paix dans cette relation avec [membre de la famille]?' },
    { id: 'cc_family4', textEn: "What's asking for healing in my sense of belonging?", textFr: 'Qu\'est-ce qui demande guérison dans mon sentiment d\'appartenance?' },
  ],
};

// For SpreadIntroSelector - questions keyed by layout (but we only have one)
// This maps the layout to category-based questions
export const CELTIC_CROSS_LAYOUT_QUESTIONS: Record<CelticCrossLayoutId, CelticCrossQuestion[]> = {
  celtic_cross: [], // Empty - we'll use category-based questions
};
```

**Step 5:** Add helper text and utility functions:

```typescript
export const CELTIC_CROSS_CUSTOM_QUESTION_HELPER = {
  en: "The Celtic Cross excels at complex, layered questions. Share what's weighing on you - the cards will illuminate all dimensions.",
  fr: 'La Croix Celtique excelle pour les questions complexes et nuancées. Partagez ce qui vous préoccupe - les cartes illumineront toutes les dimensions.',
};

// Helper to get category config by id
export function getCelticCrossCategory(id: CelticCrossCategory): CelticCrossCategoryConfig | undefined {
  return CELTIC_CROSS_CATEGORIES.find(c => c.id === id);
}

// Helper to get questions for a category
export function getCelticCrossQuestions(categoryId: CelticCrossCategory): CelticCrossQuestion[] {
  return CELTIC_CROSS_QUESTIONS[categoryId] || [];
}
```

**Step 6:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 7:** Commit:

```bash
git add constants/celticCrossLayouts.ts
git commit -m "feat: add Celtic Cross layouts constants

- Single universal layout with 10 positions
- 5 categories: love, career, money, life_path, family
- 4 introspective questions per category
- Helper functions for category lookup"
```

---

### Task 2: Update SpreadIntroSelector with Celtic Cross imports and case

**Files:**
- Modify: `components/reading/phases/SpreadIntroSelector.tsx`

**Step 1:** Add Celtic Cross imports after the Horseshoe imports (around line 60):

```typescript
import {
  CELTIC_CROSS_CATEGORIES,
  CELTIC_CROSS_LAYOUTS,
  CELTIC_CROSS_QUESTIONS,
  CELTIC_CROSS_CUSTOM_QUESTION_HELPER,
  CelticCrossCategory,
  CelticCrossLayoutId,
} from '../../../constants/celticCrossLayouts';
```

**Step 2:** Update the CategoryId type union (around line 92):

```typescript
type CategoryId = SingleCardCategory | ThreeCardCategory | FiveCardCategory | HorseshoeCategory | CelticCrossCategory;
```

**Step 3:** Update the LayoutId type union (around line 93):

```typescript
type LayoutId = SingleCardLayoutId | ThreeCardLayoutId | FiveCardLayoutId | HorseshoeLayoutId | CelticCrossLayoutId;
```

**Step 4:** Add CELTIC_CROSS case in the useMemo (after HORSESHOE case, around line 190):

```typescript
      case SpreadType.CELTIC_CROSS:
        return {
          categories: CELTIC_CROSS_CATEGORIES as CategoryConfig[],
          layouts: CELTIC_CROSS_LAYOUTS as Record<string, LayoutConfig>,
          questions: CELTIC_CROSS_QUESTIONS as Record<string, QuestionConfig[]>,
          customHelper: CELTIC_CROSS_CUSTOM_QUESTION_HELPER,
        };
```

**Step 5:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 6:** Commit:

```bash
git add components/reading/phases/SpreadIntroSelector.tsx
git commit -m "feat: add Celtic Cross support to SpreadIntroSelector

- Import Celtic Cross constants
- Add to CategoryId and LayoutId type unions
- Add CELTIC_CROSS case to useMemo"
```

---

### Task 3: Create CelticCrossIntroPhase component

**Files:**
- Create: `components/reading/phases/CelticCrossIntroPhase.tsx`

**Reference:** Copy the pattern from `components/reading/phases/HorseshoeIntroPhase.tsx`

**Step 1:** Create the component file:

```typescript
// components/reading/phases/CelticCrossIntroPhase.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Coins } from 'lucide-react';
import { SpreadConfig, SpreadType, InterpretationStyle } from '../../../types';
import Button from '../../Button';
import ThemedBackground from '../ThemedBackground';
import { SPREAD_THEMES } from '../SpreadThemes';
import SpreadIntroSelector from './SpreadIntroSelector';
import {
  CelticCrossCategory,
  CelticCrossLayoutId,
} from '../../../constants/celticCrossLayouts';

interface CelticCrossIntroPhaseProps {
  spread: SpreadConfig;
  language: 'en' | 'fr';
  // Category, layout & question selection
  selectedCategory: CelticCrossCategory | null;
  selectedLayout: CelticCrossLayoutId | null;
  customQuestion: string;
  onCategorySelect: (category: CelticCrossCategory) => void;
  onLayoutSelect: (layoutId: CelticCrossLayoutId) => void;
  onCustomQuestionChange: (text: string) => void;
  // Interpretation styles
  isAdvanced: boolean;
  selectedStyles: InterpretationStyle[];
  onAdvancedToggle: () => void;
  onStyleToggle: (style: InterpretationStyle) => void;
  // Validation & action
  validationMessage: string | null;
  totalCost: number;
  credits: number;
  onStartShuffle: () => void;
}

const CelticCrossIntroPhase: React.FC<CelticCrossIntroPhaseProps> = ({
  spread,
  language,
  selectedCategory,
  selectedLayout,
  customQuestion,
  onCategorySelect,
  onLayoutSelect,
  onCustomQuestionChange,
  isAdvanced,
  selectedStyles,
  onAdvancedToggle,
  onStyleToggle,
  validationMessage,
  totalCost,
  credits,
  onStartShuffle,
}) => {
  // Use the spread theme with fallback
  const theme = SPREAD_THEMES[spread.id] || {
    icon: '✨',
    textAccent: 'text-violet-300',
  };

  const hasValidQuestion = customQuestion.trim().length > 0;
  const canProceed = selectedCategory !== null && selectedLayout !== null && hasValidQuestion && credits >= totalCost;

  // Handler for question select from suggestions
  const handleQuestionSelect = (_questionId: string, questionText: string) => {
    onCustomQuestionChange(questionText);
  };

  return (
    <div className="flex flex-col items-center px-4 py-6 md:py-8 relative min-h-screen">
      <ThemedBackground spreadType={spread.id} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 border border-white/10 mb-3">
            <span className={theme.textAccent}>{theme.icon}</span>
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
              {language === 'en' ? 'Celtic Cross' : 'Croix Celtique'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-heading text-white mb-1">
            {language === 'en' ? 'Complete Picture' : 'Tableau Complet'}
          </h2>
          <p className={`text-sm ${theme.textAccent} italic`}>
            {language === 'en' ? 'Ten cards illuminate the full story' : 'Dix cartes illuminent l\'histoire complète'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-violet-500/20 overflow-hidden">
          {/* Spread Intro Selector */}
          <div className="p-4 md:p-5">
            <SpreadIntroSelector
              spreadType={SpreadType.CELTIC_CROSS}
              language={language}
              selectedCategory={selectedCategory}
              selectedLayout={selectedLayout}
              customQuestion={customQuestion}
              onCategorySelect={onCategorySelect}
              onLayoutSelect={onLayoutSelect}
              onCustomQuestionChange={onCustomQuestionChange}
              onQuestionSelect={handleQuestionSelect}
              isAdvanced={isAdvanced}
              selectedStyles={selectedStyles}
              onAdvancedToggle={onAdvancedToggle}
              onStyleToggle={onStyleToggle}
            />
          </div>

          {/* Validation Error */}
          {validationMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-4 mb-3 flex items-center gap-2 p-2.5 bg-red-500/15 border border-red-500/30 rounded-lg text-red-300 text-xs"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{validationMessage}</span>
            </motion.div>
          )}

          {/* CTA Button */}
          <div className="p-4 bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                {language === 'en' ? 'Cost' : 'Coût'}
              </span>
              <div className="flex items-center gap-1.5 text-violet-300">
                <Coins className="w-4 h-4" />
                <span className="font-bold text-lg">{totalCost}</span>
                <span className="text-slate-500 text-xs">
                  {language === 'en' ? 'credits' : 'crédits'}
                </span>
              </div>
            </div>
            <Button
              onClick={onStartShuffle}
              size="lg"
              className="w-full"
              disabled={!canProceed}
            >
              {language === 'en' ? 'Shuffle the Deck' : 'Mélanger le Jeu'}
            </Button>
            {!canProceed && !validationMessage && (
              <p className="text-center text-xs text-slate-500 mt-2">
                {!selectedCategory
                  ? (language === 'en' ? 'Select a theme to continue' : 'Sélectionnez un thème pour continuer')
                  : !selectedLayout
                    ? (language === 'en' ? 'Select a layout' : 'Sélectionnez une disposition')
                    : !hasValidQuestion
                      ? (language === 'en' ? 'Enter your question' : 'Entrez votre question')
                      : (language === 'en' ? 'Insufficient credits' : 'Crédits insuffisants')}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CelticCrossIntroPhase;
```

**Step 2:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 3:** Commit:

```bash
git add components/reading/phases/CelticCrossIntroPhase.tsx
git commit -m "feat: add CelticCrossIntroPhase component

- Follows HorseshoeIntroPhase pattern
- Uses violet color theme
- Integrates with SpreadIntroSelector"
```

---

### Task 4: Update ActiveReading.tsx with Celtic Cross state and handlers

**Files:**
- Modify: `components/ActiveReading.tsx`

**Step 1:** Add import for CelticCrossIntroPhase after HorseshoeIntroPhase import (around line 24):

```typescript
import CelticCrossIntroPhase from './reading/phases/CelticCrossIntroPhase';
```

**Step 2:** Add import for Celtic Cross types after horseshoeLayouts import (around line 41):

```typescript
import {
  CelticCrossCategory,
  CelticCrossLayoutId,
  getCelticCrossCategory,
} from '../constants/celticCrossLayouts';
```

**Step 3:** Add Celtic Cross state variables after horseshoe state (around line 191):

```typescript
  // Celtic Cross intro state
  const [celticCrossCategory, setCelticCrossCategory] = useState<CelticCrossCategory | null>(null);
  const [celticCrossLayout, setCelticCrossLayout] = useState<CelticCrossLayoutId | null>(null);
  const [celticCrossCustomQuestion, setCelticCrossCustomQuestion] = useState('');
```

**Step 4:** Add Celtic Cross handlers after horseshoe handlers (around line 479):

```typescript
  // Celtic Cross handlers
  const handleCelticCrossCategorySelect = useCallback((category: CelticCrossCategory) => {
    setCelticCrossCategory(category);
    // Auto-set layout to default for this category (always celtic_cross)
    const categoryConfig = getCelticCrossCategory(category);
    if (categoryConfig) {
      setCelticCrossLayout(categoryConfig.defaultLayout);
    }
  }, []);

  const handleCelticCrossLayoutSelect = useCallback((layoutId: CelticCrossLayoutId) => {
    setCelticCrossLayout(layoutId);
  }, []);

  const handleCelticCrossCustomQuestionChange = useCallback((text: string) => {
    setCelticCrossCustomQuestion(text);
    handleQuestionChange({ target: { value: text } } as React.ChangeEvent<HTMLTextAreaElement>);
  }, [handleQuestionChange]);
```

**Step 5:** Add CELTIC_CROSS case in renderPhaseContent after HORSESHOE case (around line 778):

```typescript
      // Use celtic cross intro for celtic cross spread
      if (spread.id === SpreadType.CELTIC_CROSS) {
        return (
          <CelticCrossIntroPhase
            spread={spread}
            language={language}
            selectedCategory={celticCrossCategory}
            selectedLayout={celticCrossLayout}
            customQuestion={celticCrossCustomQuestion}
            onCategorySelect={handleCelticCrossCategorySelect}
            onLayoutSelect={handleCelticCrossLayoutSelect}
            onCustomQuestionChange={handleCelticCrossCustomQuestionChange}
            isAdvanced={isAdvanced}
            selectedStyles={selectedStyles}
            onAdvancedToggle={() => setIsAdvanced(!isAdvanced)}
            onStyleToggle={toggleStyle}
            validationMessage={validationMessage}
            totalCost={displayCost}
            credits={user?.credits || 0}
            onStartShuffle={startShuffleAnimation}
          />
        );
      }
```

**Step 6:** Update the getLayoutId function in regenerateReading to handle Celtic Cross (around line 349):

```typescript
      if (spread.id === SpreadType.HORSESHOE && horseshoeLayout) {
        return horseshoeLayout;
      }
      if (spread.id === SpreadType.CELTIC_CROSS && celticCrossLayout) {
        return celticCrossLayout;
      }
```

**Step 7:** Update the getLayoutId function in startReading to handle Celtic Cross (around line 549):

```typescript
      if (spread.id === SpreadType.HORSESHOE && horseshoeLayout) {
        return horseshoeLayout;
      }
      if (spread.id === SpreadType.CELTIC_CROSS && celticCrossLayout) {
        return celticCrossLayout;
      }
```

**Step 8:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 9:** Commit:

```bash
git add components/ActiveReading.tsx
git commit -m "feat: integrate Celtic Cross into ActiveReading

- Add CelticCrossIntroPhase import
- Add Celtic Cross state variables
- Add Celtic Cross handlers
- Add CELTIC_CROSS case in renderPhaseContent
- Update getLayoutId for regenerateReading and startReading"
```

---

### Task 5: Add Celtic Cross theme to SpreadThemes

**Files:**
- Modify: `components/reading/SpreadThemes.ts`

**Step 1:** Check if CELTIC_CROSS theme exists, if not add it:

```typescript
  [SpreadType.CELTIC_CROSS]: {
    icon: '✨',
    textAccent: 'text-violet-300',
    gradient: 'from-violet-900/40 via-purple-900/30 to-indigo-900/40',
    borderColor: 'border-violet-500/20',
    glowColor: 'shadow-violet-500/20',
  },
```

**Step 2:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 3:** Commit:

```bash
git add components/reading/SpreadThemes.ts
git commit -m "feat: add Celtic Cross theme to SpreadThemes"
```

---

### Task 6: Update ThemedBackground for Celtic Cross (if needed)

**Files:**
- Modify: `components/reading/ThemedBackground.tsx`

**Step 1:** Check if CELTIC_CROSS is handled in the background component. If it falls through to default, that may be fine, but if specific styling is needed, add a case.

**Step 2:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 3:** If changes were made, commit:

```bash
git add components/reading/ThemedBackground.tsx
git commit -m "feat: add Celtic Cross background theme"
```

---

### Task 7: Manual Testing

**Step 1:** Start the dev server:

```bash
npm run dev
```

**Step 2:** Test the Celtic Cross flow:

1. Navigate to /reading/celtic-cross
2. Verify 5 categories appear (Love, Career, Money, Life Path, Family)
3. Click a category - verify it expands and auto-selects the celtic_cross layout
4. Verify 4 suggested questions appear for the selected category
5. Type a custom question or click a suggestion
6. Verify "Go Deeper" advanced options appear and work
7. Verify cost shows 10 credits (+ 1 if advanced selected)
8. Verify "Shuffle the Deck" button enables when question is entered
9. Click shuffle and verify the reading flow proceeds

**Step 3:** Test each category has its own questions:

- Love: 4 relationship-focused questions
- Career: 4 work-focused questions
- Money: 4 finance-focused questions
- Life Path: 4 direction-focused questions
- Family: 4 family-focused questions

---

### Task 8: Final verification and push

**Step 1:** Run TypeScript check:

```bash
npx tsc --noEmit
```

**Step 2:** Verify git status shows all expected changes:

```bash
git status
```

**Step 3:** Push to remote:

```bash
git push origin main
```

---

## Files Summary

| File | Action |
|------|--------|
| `constants/celticCrossLayouts.ts` | Create |
| `components/reading/phases/CelticCrossIntroPhase.tsx` | Create |
| `components/reading/phases/SpreadIntroSelector.tsx` | Modify |
| `components/ActiveReading.tsx` | Modify |
| `components/reading/SpreadThemes.ts` | Modify (if needed) |
| `components/reading/ThemedBackground.tsx` | Modify (if needed) |

---

## Deferred: CelticCrossDisplay Component

The visual cross + staff card arrangement component is deferred to a future task. For now, the Celtic Cross will use the default card display (linear arrangement). The iconic visual layout can be added as a follow-up enhancement.

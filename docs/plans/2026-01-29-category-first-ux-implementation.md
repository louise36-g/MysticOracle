# Category-First UX Implementation Plan

> **For Claude:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Replace spread-first navigation with category-first UX where users select a life theme (Love, Career, Money, Life Path, Family, Birth Cards) then choose reading depth (1-10 cards).

**Architecture:** New CategorySelector component with expanding cards, simplified IntroPhase accepting pre-selected category, new Birth Cards flow with date entry and static meanings.

**Tech Stack:** React 19, TypeScript, Framer Motion, Tailwind CSS

**Design Doc:** `docs/plans/2026-01-29-category-first-ux-design.md`

---

## Task 1: Create Category Types and Constants

**Files:**
- Create: `constants/categoryConfig.ts`
- Modify: `types.ts`

**Step 1:** Add new types to `types.ts` after line 21 (after SpreadType enum):

```typescript
// Reading categories (category-first UX)
export type ReadingCategory = 'love' | 'career' | 'money' | 'life_path' | 'family' | 'birth_cards';

// Depth options (maps to card counts)
export type ReadingDepth = 1 | 3 | 5 | 7 | 10;
export type BirthCardDepth = 1 | 2 | 3;

// Map depth to SpreadType
export const DEPTH_TO_SPREAD: Record<ReadingDepth, SpreadType> = {
  1: SpreadType.SINGLE,
  3: SpreadType.THREE_CARD,
  5: SpreadType.FIVE_CARD,
  7: SpreadType.HORSESHOE,
  10: SpreadType.CELTIC_CROSS,
};
```

**Step 2:** Create `constants/categoryConfig.ts`:

```typescript
// constants/categoryConfig.ts
import { ReadingCategory, ReadingDepth, BirthCardDepth } from '../types';
import { ThreeCardLayoutId } from './threeCardLayouts';
import { FiveCardLayoutId } from './fiveCardLayouts';
import { Heart, Briefcase, Coins, Compass, Users, Sparkles } from 'lucide-react';
import React from 'react';

export interface CategoryConfig {
  id: ReadingCategory;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  icon: React.ReactNode;
  colorTheme: {
    gradient: string;
    accent: string;
    glow: string;
    border: string;
  };
  depths: ReadingDepth[] | BirthCardDepth[];
  defaultLayouts: {
    3?: ThreeCardLayoutId;
    5?: FiveCardLayoutId;
  };
}

export interface DepthOption {
  cards: number;
  labelEn: string;
  labelFr: string;
  cost: number;
}

// Depth options for regular categories
export const REGULAR_DEPTHS: DepthOption[] = [
  { cards: 1, labelEn: 'Quick Insight', labelFr: 'Aperçu Rapide', cost: 1 },
  { cards: 3, labelEn: 'Past Present Future', labelFr: 'Passé Présent Futur', cost: 3 },
  { cards: 5, labelEn: 'Deep Dive', labelFr: 'Exploration Profonde', cost: 5 },
  { cards: 7, labelEn: "Fortune's Arc", labelFr: 'Arc du Destin', cost: 7 },
  { cards: 10, labelEn: 'Complete Picture', labelFr: 'Tableau Complet', cost: 10 },
];

// Depth options for Birth Cards
export const BIRTH_CARD_DEPTHS: DepthOption[] = [
  { cards: 1, labelEn: 'Soul Card', labelFr: "Carte de l'Âme", cost: 1 },
  { cards: 2, labelEn: 'Soul + Personality', labelFr: 'Âme + Personnalité', cost: 2 },
  { cards: 3, labelEn: 'Year Energy', labelFr: "Énergie de l'Année", cost: 3 },
];

// Category configurations
export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'love',
    labelEn: 'Love',
    labelFr: 'Amour',
    taglineEn: 'Matters of the Heart',
    taglineFr: 'Affaires du Cœur',
    icon: React.createElement(Heart, { className: 'w-6 h-6' }),
    colorTheme: {
      gradient: 'from-rose-950 via-pink-900 to-rose-950',
      accent: 'text-rose-300',
      glow: 'rgba(251, 113, 133, 0.3)',
      border: 'hover:border-rose-400/50',
    },
    depths: [1, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      3: 'you_them_connection',
      5: 'love_relationships',
    },
  },
  {
    id: 'career',
    labelEn: 'Career',
    labelFr: 'Carrière',
    taglineEn: 'Your Professional Path',
    taglineFr: 'Votre Chemin Professionnel',
    icon: React.createElement(Briefcase, { className: 'w-6 h-6' }),
    colorTheme: {
      gradient: 'from-amber-950 via-yellow-900 to-amber-950',
      accent: 'text-amber-300',
      glow: 'rgba(251, 191, 36, 0.3)',
      border: 'hover:border-amber-400/50',
    },
    depths: [1, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      3: 'situation_action_outcome',
      5: 'career_purpose',
    },
  },
  {
    id: 'money',
    labelEn: 'Money',
    labelFr: 'Argent',
    taglineEn: 'Abundance & Prosperity',
    taglineFr: 'Abondance & Prospérité',
    icon: React.createElement(Coins, { className: 'w-6 h-6' }),
    colorTheme: {
      gradient: 'from-emerald-950 via-green-900 to-emerald-950',
      accent: 'text-emerald-300',
      glow: 'rgba(52, 211, 153, 0.3)',
      border: 'hover:border-emerald-400/50',
    },
    depths: [1, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      3: 'situation_action_outcome',
      5: 'alchemy',
    },
  },
  {
    id: 'life_path',
    labelEn: 'Life Path',
    labelFr: 'Chemin de Vie',
    taglineEn: 'Direction & Purpose',
    taglineFr: 'Direction & Objectif',
    icon: React.createElement(Compass, { className: 'w-6 h-6' }),
    colorTheme: {
      gradient: 'from-indigo-950 via-purple-900 to-indigo-950',
      accent: 'text-indigo-300',
      glow: 'rgba(129, 140, 248, 0.3)',
      border: 'hover:border-indigo-400/50',
    },
    depths: [1, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      3: 'past_present_future',
      5: 'authentic_self',
    },
  },
  {
    id: 'family',
    labelEn: 'Family',
    labelFr: 'Famille',
    taglineEn: 'Bonds & Belonging',
    taglineFr: 'Liens & Appartenance',
    icon: React.createElement(Users, { className: 'w-6 h-6' }),
    colorTheme: {
      gradient: 'from-teal-950 via-cyan-900 to-teal-950',
      accent: 'text-teal-300',
      glow: 'rgba(45, 212, 191, 0.3)',
      border: 'hover:border-teal-400/50',
    },
    depths: [1, 3, 5, 7, 10] as ReadingDepth[],
    defaultLayouts: {
      3: 'you_them_connection',
      5: 'inner_child',
    },
  },
  {
    id: 'birth_cards',
    labelEn: 'Birth Cards',
    labelFr: 'Cartes de Naissance',
    taglineEn: "Your Soul's Blueprint",
    taglineFr: "L'Empreinte de Votre Âme",
    icon: React.createElement(Sparkles, { className: 'w-6 h-6' }),
    colorTheme: {
      gradient: 'from-violet-950 via-purple-900 to-violet-950',
      accent: 'text-violet-300',
      glow: 'rgba(167, 139, 250, 0.3)',
      border: 'hover:border-violet-400/50',
    },
    depths: [1, 2, 3] as BirthCardDepth[],
    defaultLayouts: {},
  },
];

// Helper to get category by id
export function getCategory(id: ReadingCategory): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

// Helper to get depths for a category
export function getDepthsForCategory(categoryId: ReadingCategory): DepthOption[] {
  return categoryId === 'birth_cards' ? BIRTH_CARD_DEPTHS : REGULAR_DEPTHS;
}
```

**Step 3:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 4:** Commit:

```bash
git add types.ts constants/categoryConfig.ts
git commit -m "feat: add category types and configuration for category-first UX"
```

---

## Task 2: Create CategorySelector Component

**Files:**
- Create: `components/CategorySelector.tsx`

**Step 1:** Create the CategorySelector component with expanding cards:

```typescript
// components/CategorySelector.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, getDepthsForCategory, CategoryConfig, DepthOption } from '../constants/categoryConfig';
import { ReadingCategory } from '../types';
import CreditShop from './CreditShop';
import DepthVisual from './reading/DepthVisual';

const CategorySelector: React.FC = () => {
  const { language, user } = useApp();
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<ReadingCategory | null>(null);
  const [showCreditShop, setShowCreditShop] = useState(false);

  const handleCategoryClick = (categoryId: ReadingCategory) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  const handleDepthSelect = (category: CategoryConfig, depth: DepthOption) => {
    if (!user || user.credits < depth.cost) {
      setShowCreditShop(true);
      return;
    }

    if (category.id === 'birth_cards') {
      navigate(`/reading/birth-cards/${depth.cards}`);
    } else {
      navigate(`/reading/${category.id}/${depth.cards}`);
    }
  };

  const handleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategory(null);
  };

  return (
    <>
      <CreditShop isOpen={showCreditShop} onClose={() => setShowCreditShop(false)} />

      <div className="max-w-5xl mx-auto py-12 px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl md:text-4xl font-heading text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-purple-200 to-amber-200 mb-3">
            {language === 'en' ? 'What draws you today?' : "Qu'est-ce qui vous attire aujourd'hui?"}
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            {language === 'en'
              ? 'Choose a theme that resonates with your current journey.'
              : 'Choisissez un thème qui résonne avec votre voyage actuel.'}
          </p>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((category, index) => {
            const isExpanded = expandedCategory === category.id;
            const isOther = expandedCategory !== null && !isExpanded;

            return (
              <motion.div
                key={category.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{
                  opacity: isOther ? 0.4 : 1,
                  y: 0,
                  scale: isOther ? 0.95 : 1,
                }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className={`
                  relative rounded-2xl overflow-hidden cursor-pointer
                  border border-white/10 ${category.colorTheme.border}
                  transition-all duration-300
                  ${isExpanded ? 'md:col-span-2 lg:col-span-3' : ''}
                `}
                onClick={() => !isExpanded && handleCategoryClick(category.id)}
                style={{
                  boxShadow: isExpanded ? `0 20px 60px -15px ${category.colorTheme.glow}` : 'none',
                }}
              >
                {/* Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.colorTheme.gradient}`} />

                {/* Content */}
                <div className="relative z-10 p-6">
                  {/* Header row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className={category.colorTheme.accent}>{category.icon}</span>
                      <div>
                        <h3 className="text-xl font-heading text-white">
                          {language === 'en' ? category.labelEn : category.labelFr}
                        </h3>
                        <p className={`text-sm ${category.colorTheme.accent} opacity-80`}>
                          {language === 'en' ? category.taglineEn : category.taglineFr}
                        </p>
                      </div>
                    </div>
                    {isExpanded && (
                      <button
                        onClick={handleCollapse}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <X className="w-5 h-5 text-white/70" />
                      </button>
                    )}
                  </div>

                  {/* Expanded content: Depth selector */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6"
                      >
                        <p className="text-white/70 text-sm mb-4">
                          {language === 'en'
                            ? 'How deep would you like to go?'
                            : 'Quelle profondeur souhaitez-vous?'}
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                          {getDepthsForCategory(category.id).map((depth) => {
                            const hasCredits = user && user.credits >= depth.cost;
                            return (
                              <motion.button
                                key={depth.cards}
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDepthSelect(category, depth);
                                }}
                                className={`
                                  flex flex-col items-center p-4 rounded-xl
                                  bg-black/30 border border-white/10
                                  hover:border-white/30 transition-all
                                  min-w-[100px]
                                  ${!hasCredits ? 'opacity-60' : ''}
                                `}
                              >
                                <DepthVisual
                                  cards={depth.cards}
                                  category={category.id}
                                  colorTheme={category.colorTheme}
                                />
                                <span className="text-white text-sm font-medium mt-2">
                                  {language === 'en' ? depth.labelEn : depth.labelFr}
                                </span>
                                <div className={`flex items-center gap-1 mt-1 ${category.colorTheme.accent}`}>
                                  <Coins className="w-3 h-3" />
                                  <span className="text-xs">{depth.cost}</span>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default CategorySelector;
```

**Step 2:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 3:** Commit:

```bash
git add components/CategorySelector.tsx
git commit -m "feat: create CategorySelector component with expanding depth options"
```

---

## Task 3: Create DepthVisual Component

**Files:**
- Create: `components/reading/DepthVisual.tsx`

**Step 1:** Create visual card stack representations:

```typescript
// components/reading/DepthVisual.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ReadingCategory } from '../../types';

interface DepthVisualProps {
  cards: number;
  category: ReadingCategory;
  colorTheme: {
    glow: string;
  };
}

const DepthVisual: React.FC<DepthVisualProps> = ({ cards, category, colorTheme }) => {
  const cardClass = 'rounded-sm bg-gradient-to-br from-white/20 to-white/5 border border-white/30';

  // Single card
  if (cards === 1) {
    return (
      <div className="h-12 flex items-center justify-center">
        <motion.div
          className={`${cardClass} w-6 h-10`}
          style={{ boxShadow: `0 0 8px ${colorTheme.glow}` }}
        />
      </div>
    );
  }

  // Birth cards: 2 or 3
  if (category === 'birth_cards' && (cards === 2 || cards === 3)) {
    return (
      <div className="h-12 flex items-center justify-center gap-1">
        {Array.from({ length: cards }).map((_, i) => (
          <motion.div
            key={i}
            className={`${cardClass} w-5 h-8`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>
    );
  }

  // 3 cards - row
  if (cards === 3) {
    return (
      <div className="h-12 flex items-center justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`${cardClass} w-5 h-8`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>
    );
  }

  // 5 cards - row
  if (cards === 5) {
    return (
      <div className="h-12 flex items-center justify-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={`${cardClass} w-4 h-7`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          />
        ))}
      </div>
    );
  }

  // 7 cards - horseshoe arc
  if (cards === 7) {
    const arcHeights = [0, 8, 14, 16, 14, 8, 0];
    const rotations = [20, 12, 5, 0, -5, -12, -20];
    return (
      <div className="h-14 flex items-end justify-center gap-0.5">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div
            key={i}
            className={`${cardClass} w-3 h-6`}
            style={{
              marginBottom: `${arcHeights[i]}px`,
              transform: `rotate(${rotations[i]}deg)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.06 }}
          />
        ))}
      </div>
    );
  }

  // 10 cards - celtic cross mini
  if (cards === 10) {
    return (
      <div className="h-14 flex items-center justify-center gap-2">
        {/* Cross portion */}
        <div className="relative w-10 h-12">
          {/* Center */}
          <div className={`${cardClass} w-3 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
          {/* Crossing */}
          <div className={`${cardClass} w-3 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 opacity-70`} />
          {/* Arms */}
          <div className={`${cardClass} w-2.5 h-4 absolute top-0 left-1/2 -translate-x-1/2`} />
          <div className={`${cardClass} w-2.5 h-4 absolute bottom-0 left-1/2 -translate-x-1/2`} />
          <div className={`${cardClass} w-2.5 h-4 absolute top-1/2 left-0 -translate-y-1/2`} />
          <div className={`${cardClass} w-2.5 h-4 absolute top-1/2 right-0 -translate-y-1/2`} />
        </div>
        {/* Staff */}
        <div className="flex flex-col gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${cardClass} w-2.5 h-3`} />
          ))}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="h-12 flex items-center justify-center">
      <span className="text-white/50 text-xs">{cards} cards</span>
    </div>
  );
};

export default DepthVisual;
```

**Step 2:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 3:** Commit:

```bash
git add components/reading/DepthVisual.tsx
git commit -m "feat: create DepthVisual component for card stack representations"
```

---

## Task 4: Update Routes for Category-First Structure

**Files:**
- Modify: `routes/routes.ts`
- Modify: `routes/index.tsx`

**Step 1:** Update `routes/routes.ts` - replace spread routes with category routes:

```typescript
// Route path constants - single source of truth
export const ROUTES = {
  HOME: '/',

  // Auth
  PROFILE: '/profile',

  // Reading flow (category-first)
  READING: '/reading',
  READING_CATEGORY: '/reading/:category',  // e.g., /reading/love
  READING_CATEGORY_DEPTH: '/reading/:category/:depth',  // e.g., /reading/love/3
  READING_BIRTH_CARDS: '/reading/birth-cards/:depth',  // Birth cards special route
  READING_VIEW: '/reading/view/:id',  // View saved reading

  // ... rest unchanged
```

**Step 2:** Update `routes/index.tsx` - update protected routes section (around line 217-244):

Replace the reading routes with:

```typescript
// Reading - category selector
{
  path: ROUTES.READING,
  element: lazyLoad(() => import('../components/CategorySelector')),
},
// Reading with category and depth
{
  path: ROUTES.READING_CATEGORY_DEPTH,
  element: <ReadingLayout />,
},
// Birth cards special route
{
  path: ROUTES.READING_BIRTH_CARDS,
  element: lazyLoad(() => import('../components/reading/BirthCardEntry')),
},
// View saved reading
{
  path: ROUTES.READING_VIEW,
  element: lazyLoad(() => import('../components/UserProfile')),
},
```

**Step 3:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 4:** Commit:

```bash
git add routes/routes.ts routes/index.tsx
git commit -m "feat: update routes for category-first navigation structure"
```

---

## Task 5: Create Unified CategoryIntroPhase Component

**Files:**
- Create: `components/reading/phases/CategoryIntroPhase.tsx`

**Step 1:** Create a unified intro phase that accepts pre-selected category:

```typescript
// components/reading/phases/CategoryIntroPhase.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Coins, ChevronDown, ChevronUp } from 'lucide-react';
import { SpreadConfig, InterpretationStyle, ReadingCategory, ReadingDepth } from '../../../types';
import { getCategory, getDepthsForCategory } from '../../../constants/categoryConfig';
import { THREE_CARD_LAYOUTS, ThreeCardLayoutId } from '../../../constants/threeCardLayouts';
import { FIVE_CARD_LAYOUTS, FiveCardLayoutId } from '../../../constants/fiveCardLayouts';
import Button from '../../Button';
import ThemedBackground from '../ThemedBackground';
import { SPREAD_THEMES } from '../SpreadThemes';
import SpreadIntroSelector from './SpreadIntroSelector';

interface CategoryIntroPhaseProps {
  spread: SpreadConfig;
  language: 'en' | 'fr';
  category: ReadingCategory;
  depth: ReadingDepth;
  // Layout state
  selectedLayout: ThreeCardLayoutId | FiveCardLayoutId | null;
  onLayoutSelect: (layoutId: ThreeCardLayoutId | FiveCardLayoutId) => void;
  // Question state
  customQuestion: string;
  onCustomQuestionChange: (text: string) => void;
  // Advanced options
  isAdvanced: boolean;
  selectedStyles: InterpretationStyle[];
  onAdvancedToggle: () => void;
  onStyleToggle: (style: InterpretationStyle) => void;
  // Validation and actions
  validationMessage: string | null;
  totalCost: number;
  credits: number;
  onStartShuffle: () => void;
}

const CategoryIntroPhase: React.FC<CategoryIntroPhaseProps> = ({
  spread,
  language,
  category,
  depth,
  selectedLayout,
  onLayoutSelect,
  customQuestion,
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
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const categoryConfig = getCategory(category);
  const theme = SPREAD_THEMES[spread.id];
  const depthOption = getDepthsForCategory(category).find((d) => d.cards === depth);

  const hasValidQuestion = customQuestion.trim().length > 0;
  const canProceed = hasValidQuestion && credits >= totalCost;

  // Get layout options for 3-card and 5-card depths
  const layoutOptions = useMemo(() => {
    if (depth === 3) {
      return Object.values(THREE_CARD_LAYOUTS);
    } else if (depth === 5) {
      return Object.values(FIVE_CARD_LAYOUTS);
    }
    return null;
  }, [depth]);

  const currentLayoutLabel = useMemo(() => {
    if (!selectedLayout) return null;
    if (depth === 3 && THREE_CARD_LAYOUTS[selectedLayout as ThreeCardLayoutId]) {
      const layout = THREE_CARD_LAYOUTS[selectedLayout as ThreeCardLayoutId];
      return language === 'en' ? layout.labelEn : layout.labelFr;
    }
    if (depth === 5 && FIVE_CARD_LAYOUTS[selectedLayout as FiveCardLayoutId]) {
      const layout = FIVE_CARD_LAYOUTS[selectedLayout as FiveCardLayoutId];
      return language === 'en' ? layout.labelEn : layout.labelFr;
    }
    return null;
  }, [selectedLayout, depth, language]);

  if (!categoryConfig) return null;

  return (
    <div className="flex flex-col items-center px-4 py-6 md:py-8 relative min-h-screen">
      <ThemedBackground spreadType={spread.id} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Header with category badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 border border-white/10 mb-3">
            <span className={categoryConfig.colorTheme.accent}>{categoryConfig.icon}</span>
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
              {language === 'en' ? categoryConfig.labelEn : categoryConfig.labelFr}
            </span>
            <span className="text-white/30">•</span>
            <span className="text-xs text-white/60">
              {depthOption && (language === 'en' ? depthOption.labelEn : depthOption.labelFr)}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-heading text-white mb-1">
            {language === 'en' ? 'Set Your Intention' : 'Définissez Votre Intention'}
          </h2>
          <p className={`text-sm ${categoryConfig.colorTheme.accent} italic`}>
            {language === 'en' ? categoryConfig.taglineEn : categoryConfig.taglineFr}
          </p>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 md:p-5">
            {/* Layout picker (collapsible, only for 3 and 5 card depths) */}
            {layoutOptions && (
              <div className="mb-4">
                <button
                  onClick={() => setShowLayoutPicker(!showLayoutPicker)}
                  className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div>
                    <span className="text-xs text-white/50 uppercase tracking-wider">
                      {language === 'en' ? 'Layout' : 'Disposition'}
                    </span>
                    <p className="text-sm text-white/90">{currentLayoutLabel}</p>
                  </div>
                  {showLayoutPicker ? (
                    <ChevronUp className="w-4 h-4 text-white/50" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/50" />
                  )}
                </button>

                <AnimatePresence>
                  {showLayoutPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 space-y-1 max-h-48 overflow-y-auto"
                    >
                      {layoutOptions.map((layout) => (
                        <button
                          key={layout.id}
                          onClick={() => {
                            onLayoutSelect(layout.id as ThreeCardLayoutId | FiveCardLayoutId);
                            setShowLayoutPicker(false);
                          }}
                          className={`
                            w-full text-left px-3 py-2 rounded-lg transition-colors
                            ${selectedLayout === layout.id
                              ? 'bg-white/20 border border-white/30'
                              : 'bg-white/5 hover:bg-white/10'
                            }
                          `}
                        >
                          <p className="text-sm text-white/90">
                            {language === 'en' ? layout.labelEn : layout.labelFr}
                          </p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Question input and advanced options via SpreadIntroSelector */}
            <SpreadIntroSelector
              spreadType={spread.id}
              language={language}
              selectedCategory={category}
              selectedLayout={selectedLayout}
              customQuestion={customQuestion}
              onCategorySelect={() => {}} // Category already selected
              onLayoutSelect={onLayoutSelect}
              onCustomQuestionChange={onCustomQuestionChange}
              onQuestionSelect={(_id, text) => onCustomQuestionChange(text)}
              isAdvanced={isAdvanced}
              selectedStyles={selectedStyles}
              onAdvancedToggle={onAdvancedToggle}
              onStyleToggle={onStyleToggle}
              hideCategory={true}
              hideLayout={true}
            />
          </div>

          {/* Validation message */}
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

          {/* Footer with cost and button */}
          <div className="p-4 bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                {language === 'en' ? 'Cost' : 'Coût'}
              </span>
              <div className="flex items-center gap-1.5 text-amber-300">
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
              {language === 'en' ? 'Begin Reading' : 'Commencer la Lecture'}
            </Button>
            {!canProceed && !validationMessage && (
              <p className="text-center text-xs text-slate-500 mt-2">
                {!hasValidQuestion
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

export default CategoryIntroPhase;
```

**Step 2:** Add `hideCategory` and `hideLayout` props to SpreadIntroSelector (modify `components/reading/phases/SpreadIntroSelector.tsx`):

Add to interface around line 30:
```typescript
hideCategory?: boolean;
hideLayout?: boolean;
```

Add to function parameters and wrap category/layout sections with conditional rendering.

**Step 3:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 4:** Commit:

```bash
git add components/reading/phases/CategoryIntroPhase.tsx components/reading/phases/SpreadIntroSelector.tsx
git commit -m "feat: create unified CategoryIntroPhase with collapsible layout picker"
```

---

## Task 6: Update ActiveReading for Category-First Flow

**Files:**
- Modify: `components/ActiveReading.tsx`

**Step 1:** Update ActiveReading to parse category and depth from URL params instead of spread type.

Add imports at top:
```typescript
import { ReadingCategory, ReadingDepth, DEPTH_TO_SPREAD } from '../types';
import { getCategory } from '../constants/categoryConfig';
import CategoryIntroPhase from './reading/phases/CategoryIntroPhase';
```

**Step 2:** Update the useParams and state initialization to handle new URL structure:

```typescript
const { category: categoryParam, depth: depthParam } = useParams<{
  category: string;
  depth: string;
}>();

// Parse category and depth from URL
const category = categoryParam as ReadingCategory;
const depth = parseInt(depthParam || '1', 10) as ReadingDepth;
const categoryConfig = getCategory(category);

// Get the spread type from depth
const spreadType = DEPTH_TO_SPREAD[depth];
const spread = SPREADS[spreadType];
```

**Step 3:** Update the intro phase rendering to use CategoryIntroPhase:

```typescript
// In the phase rendering switch/conditional
if (phase === 'intro') {
  return (
    <CategoryIntroPhase
      spread={spread}
      language={language}
      category={category}
      depth={depth}
      selectedLayout={selectedLayout}
      onLayoutSelect={handleLayoutSelect}
      customQuestion={customQuestion}
      onCustomQuestionChange={setCustomQuestion}
      isAdvanced={isAdvanced}
      selectedStyles={selectedStyles}
      onAdvancedToggle={() => setIsAdvanced(!isAdvanced)}
      onStyleToggle={handleStyleToggle}
      validationMessage={validationMessage}
      totalCost={totalCost}
      credits={user?.credits || 0}
      onStartShuffle={handleStartShuffle}
    />
  );
}
```

**Step 4:** Set default layout based on category config when component mounts.

**Step 5:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 6:** Commit:

```bash
git add components/ActiveReading.tsx
git commit -m "feat: update ActiveReading to handle category-first URL structure"
```

---

## Task 7: Create Birth Card Entry Component

**Files:**
- Create: `components/reading/BirthCardEntry.tsx`

**Step 1:** Create the birth date entry screen:

```typescript
// components/reading/BirthCardEntry.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Coins, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BirthCardDepth } from '../../types';
import { BIRTH_CARD_DEPTHS, getCategory } from '../../constants/categoryConfig';
import Button from '../Button';
import ThemedBackground from './ThemedBackground';
import { SpreadType } from '../../types';

const BirthCardEntry: React.FC = () => {
  const { depth: depthParam } = useParams<{ depth: string }>();
  const navigate = useNavigate();
  const { language, user } = useApp();

  const depth = parseInt(depthParam || '1', 10) as BirthCardDepth;
  const depthOption = BIRTH_CARD_DEPTHS.find((d) => d.cards === depth);
  const categoryConfig = getCategory('birth_cards');

  const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });
  const [customQuestion, setCustomQuestion] = useState('');

  const cost = depthOption?.cost || 1;
  const hasCredits = user && user.credits >= cost;

  const isValidDate = () => {
    const day = parseInt(birthDate.day, 10);
    const month = parseInt(birthDate.month, 10);
    const year = parseInt(birthDate.year, 10);
    return (
      day >= 1 && day <= 31 &&
      month >= 1 && month <= 12 &&
      year >= 1900 && year <= new Date().getFullYear()
    );
  };

  const handleReveal = () => {
    if (!isValidDate() || !hasCredits) return;

    // Navigate to birth card reading with date in state
    navigate('/reading/birth-cards/reveal', {
      state: {
        birthDate,
        depth,
        question: customQuestion,
      },
    });
  };

  const descriptions = {
    1: {
      en: 'Your Soul Card reveals the energy of your incarnation - your core life purpose.',
      fr: "Votre Carte de l'Âme révèle l'énergie de votre incarnation - votre but de vie.",
    },
    2: {
      en: 'Discover your Soul Card plus your Personality Card - the energy you project to the world.',
      fr: "Découvrez votre Carte de l'Âme plus votre Carte de Personnalité - l'énergie que vous projetez.",
    },
    3: {
      en: 'The complete portrait: Soul, Personality, and your Year Card for 2026.',
      fr: "Le portrait complet: Âme, Personnalité, et votre Carte de l'Année pour 2026.",
    },
  };

  if (!categoryConfig || !depthOption) return null;

  return (
    <div className="flex flex-col items-center px-4 py-6 md:py-8 relative min-h-screen">
      <ThemedBackground spreadType={SpreadType.CELTIC_CROSS} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 border border-white/10 mb-3">
            <Sparkles className="w-4 h-4 text-violet-300" />
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
              {language === 'en' ? 'Birth Cards' : 'Cartes de Naissance'}
            </span>
            <span className="text-white/30">•</span>
            <span className="text-xs text-white/60">
              {language === 'en' ? depthOption.labelEn : depthOption.labelFr}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-heading text-white mb-1">
            {language === 'en' ? "Your Soul's Blueprint" : "L'Empreinte de Votre Âme"}
          </h2>
          <p className="text-sm text-violet-300 italic">
            {descriptions[depth][language]}
          </p>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-violet-500/20 overflow-hidden">
          <div className="p-4 md:p-5">
            {/* Birth date input */}
            <div className="mb-6">
              <label className="block text-sm text-white/70 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {language === 'en' ? 'Enter your birth date' : 'Entrez votre date de naissance'}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={language === 'en' ? 'Day' : 'Jour'}
                  value={birthDate.day}
                  onChange={(e) => setBirthDate({ ...birthDate, day: e.target.value })}
                  min="1"
                  max="31"
                  className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:border-violet-500/50 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder={language === 'en' ? 'Month' : 'Mois'}
                  value={birthDate.month}
                  onChange={(e) => setBirthDate({ ...birthDate, month: e.target.value })}
                  min="1"
                  max="12"
                  className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:border-violet-500/50 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder={language === 'en' ? 'Year' : 'Année'}
                  value={birthDate.year}
                  onChange={(e) => setBirthDate({ ...birthDate, year: e.target.value })}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:border-violet-500/50 focus:outline-none"
                />
              </div>
            </div>

            {/* What you'll discover */}
            <div className="mb-6 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
              <p className="text-xs text-violet-300 uppercase tracking-wider mb-2">
                {language === 'en' ? "What you'll discover" : 'Ce que vous découvrirez'}
              </p>
              <ul className="space-y-1 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  {language === 'en' ? 'Soul Card - your life purpose' : "Carte de l'Âme - votre but de vie"}
                </li>
                {depth >= 2 && (
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    {language === 'en' ? 'Personality Card - your nature' : 'Carte de Personnalité - votre nature'}
                  </li>
                )}
                {depth >= 3 && (
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    {language === 'en' ? 'Year Card - 2026 energy theme' : "Carte de l'Année - thème énergétique 2026"}
                  </li>
                )}
              </ul>
            </div>

            {/* Optional question */}
            <div className="mb-4">
              <label className="block text-sm text-white/70 mb-2">
                {language === 'en'
                  ? 'Optional: Add a question about your cards'
                  : 'Optionnel: Ajoutez une question sur vos cartes'}
              </label>
              <textarea
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'What would you like to understand?'
                    : 'Que souhaitez-vous comprendre?'
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none resize-none h-20"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                {language === 'en' ? 'Cost' : 'Coût'}
              </span>
              <div className="flex items-center gap-1.5 text-amber-300">
                <Coins className="w-4 h-4" />
                <span className="font-bold text-lg">{cost}</span>
                <span className="text-slate-500 text-xs">
                  {language === 'en' ? 'credits' : 'crédits'}
                </span>
              </div>
            </div>
            <Button
              onClick={handleReveal}
              size="lg"
              className="w-full"
              disabled={!isValidDate() || !hasCredits}
            >
              {language === 'en' ? 'Reveal Your Cards' : 'Révélez Vos Cartes'}
            </Button>
            {!isValidDate() && (
              <p className="text-center text-xs text-slate-500 mt-2">
                {language === 'en' ? 'Enter a valid birth date' : 'Entrez une date de naissance valide'}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BirthCardEntry;
```

**Step 2:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 3:** Commit:

```bash
git add components/reading/BirthCardEntry.tsx
git commit -m "feat: create BirthCardEntry component for birth date input"
```

---

## Task 8: Create Birth Card Meanings Constants

**Files:**
- Create: `constants/birthCardMeanings.ts`

**Step 1:** Create static meanings for the 22 Major Arcana (Soul/Personality cards):

```typescript
// constants/birthCardMeanings.ts

export interface BirthCardMeaning {
  id: number;
  nameEn: string;
  nameFr: string;
  soulMeaningEn: string;
  soulMeaningFr: string;
  personalityMeaningEn: string;
  personalityMeaningFr: string;
}

// 22 Major Arcana with soul and personality meanings
export const BIRTH_CARD_MEANINGS: BirthCardMeaning[] = [
  {
    id: 0,
    nameEn: 'The Fool',
    nameFr: 'Le Mat',
    soulMeaningEn: 'Your soul carries the energy of infinite potential and new beginnings. You are here to embrace life with childlike wonder, take leaps of faith, and trust the journey even when the destination is unknown. Your purpose is to remind others that every moment is a fresh start.',
    soulMeaningFr: "Votre âme porte l'énergie du potentiel infini et des nouveaux départs. Vous êtes ici pour embrasser la vie avec un émerveillement enfantin, faire des sauts de foi et faire confiance au voyage même lorsque la destination est inconnue.",
    personalityMeaningEn: 'You naturally project an energy of spontaneity and optimism. Others see you as someone unafraid to take risks and willing to venture into the unknown. Your presence reminds people of life\'s endless possibilities.',
    personalityMeaningFr: "Vous projetez naturellement une énergie de spontanéité et d'optimisme. Les autres vous voient comme quelqu'un qui n'a pas peur de prendre des risques.",
  },
  {
    id: 1,
    nameEn: 'The Magician',
    nameFr: 'Le Magicien',
    soulMeaningEn: 'Your soul carries the energy of manifestation and willpower. You are here to bridge the spiritual and material worlds, to take ideas and make them reality. Your purpose is to show others that we all have the power to create our own lives.',
    soulMeaningFr: "Votre âme porte l'énergie de la manifestation et de la volonté. Vous êtes ici pour relier les mondes spirituel et matériel, pour prendre des idées et les concrétiser.",
    personalityMeaningEn: 'You project an energy of capability and resourcefulness. Others see you as someone who can make things happen, who has all the tools they need. Your presence inspires others to take action.',
    personalityMeaningFr: "Vous projetez une énergie de capacité et d'ingéniosité. Les autres vous voient comme quelqu'un qui peut faire bouger les choses.",
  },
  {
    id: 2,
    nameEn: 'The High Priestess',
    nameFr: 'La Papesse',
    soulMeaningEn: 'Your soul carries the energy of intuition and mystery. You are here to access hidden knowledge, trust your inner wisdom, and hold space for the unknown. Your purpose is to remind others that not everything needs to be explained - some truths are felt.',
    soulMeaningFr: "Votre âme porte l'énergie de l'intuition et du mystère. Vous êtes ici pour accéder aux connaissances cachées et faire confiance à votre sagesse intérieure.",
    personalityMeaningEn: 'You project an energy of depth and wisdom. Others sense there is more to you than meets the eye. Your presence creates space for reflection and inner knowing.',
    personalityMeaningFr: "Vous projetez une énergie de profondeur et de sagesse. Les autres sentent qu'il y a plus en vous qu'il n'y paraît.",
  },
  // ... Continue for all 22 Major Arcana
  // (Abbreviated for plan - full implementation will include all 22)
];

// Year card meaning (changes annually)
export const YEAR_CARD_2026 = {
  cardId: 10, // Example: Wheel of Fortune for 2026
  meaningEn: 'The year 2026 carries the energy of the Wheel of Fortune - a year of significant changes, cycles completing, and new opportunities arising. Embrace the natural flow of life and trust that what turns away makes room for what is meant for you.',
  meaningFr: "L'année 2026 porte l'énergie de la Roue de Fortune - une année de changements significatifs, de cycles qui s'achèvent et de nouvelles opportunités. Embrassez le flux naturel de la vie.",
};

// Calculate birth cards from date
export function calculateBirthCards(day: number, month: number, year: number): {
  soulCard: number;
  personalityCard: number;
} {
  // Sum all digits of birth date
  const dateString = `${day}${month}${year}`;
  let sum = dateString.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);

  // Reduce to 1-22 range (Major Arcana)
  while (sum > 22) {
    sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }

  const soulCard = sum;

  // Personality card: further reduce if > 9
  let personalityCard = soulCard;
  if (personalityCard > 9) {
    personalityCard = personalityCard.toString().split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }

  // Handle special case where soul and personality are the same
  if (soulCard === personalityCard && soulCard > 9) {
    // They have a single card that represents both
  }

  return { soulCard, personalityCard };
}

// Get meaning by card ID
export function getBirthCardMeaning(cardId: number): BirthCardMeaning | undefined {
  return BIRTH_CARD_MEANINGS.find((m) => m.id === cardId);
}
```

**Step 2:** Verify TypeScript compiles:

```bash
npx tsc --noEmit
```

**Step 3:** Commit:

```bash
git add constants/birthCardMeanings.ts
git commit -m "feat: add birth card meanings and calculation logic"
```

---

## Task 9: Integration Testing and Cleanup

**Files:**
- Remove or deprecate: Old spread-specific intro phases (optional, can keep for now)
- Test: Full flow from CategorySelector → IntroPhase → Reading

**Step 1:** Manual testing checklist:

1. Navigate to `/reading` - CategorySelector should appear
2. Click a category (e.g., Love) - card should expand showing depth options
3. Click a depth (e.g., 3 cards) - should navigate to `/reading/love/3`
4. IntroPhase should show with:
   - Category badge (Love • Past Present Future)
   - Collapsible layout picker (smart default selected)
   - Question input
   - Advanced style options
5. Enter question, click Begin Reading
6. Drawing phase, reveal phase, interpretation should work as before

**Step 2:** Test Birth Cards flow:

1. Click Birth Cards category
2. Select depth (e.g., 2 cards)
3. Navigate to `/reading/birth-cards/2`
4. Enter birth date
5. Click Reveal Your Cards
6. Verify calculation and display

**Step 3:** Clean up any TypeScript errors:

```bash
npx tsc --noEmit
```

**Step 4:** Final commit:

```bash
git add -A
git commit -m "feat: complete category-first UX implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Category types and config | `types.ts`, `constants/categoryConfig.ts` |
| 2 | CategorySelector component | `components/CategorySelector.tsx` |
| 3 | DepthVisual component | `components/reading/DepthVisual.tsx` |
| 4 | Route updates | `routes/routes.ts`, `routes/index.tsx` |
| 5 | CategoryIntroPhase | `components/reading/phases/CategoryIntroPhase.tsx` |
| 6 | ActiveReading updates | `components/ActiveReading.tsx` |
| 7 | BirthCardEntry | `components/reading/BirthCardEntry.tsx` |
| 8 | Birth card meanings | `constants/birthCardMeanings.ts` |
| 9 | Integration & cleanup | Testing, final adjustments |

**Total estimated tasks:** 9 major tasks with multiple steps each

**Dependencies:**
- Task 1 must complete before Tasks 2, 5, 6
- Task 3 must complete before Task 2
- Task 4 must complete before testing
- Tasks 7-8 can be done in parallel with Tasks 5-6

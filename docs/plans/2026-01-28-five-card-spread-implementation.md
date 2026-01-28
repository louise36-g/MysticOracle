# Five-Card Spread Implementation Plan

> **For Claude:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Transform the separate Love/Career spreads into a unified 5-Card Spread with 5 categories, 10 layouts, and curated questions.

**Architecture:** Mirror the 3-card intro phase pattern: constants file with categories/layouts/questions, selector components, and intro phase component that orchestrates selection flow.

**Tech Stack:** React, TypeScript, Framer Motion, Tailwind CSS, Lucide icons

---

## Tasks

### Task 1: Create fiveCardLayouts.ts constants file

**Files:**
- Create: `constants/fiveCardLayouts.ts`

**Step 1:** Create the types and interfaces

```typescript
// constants/fiveCardLayouts.ts

export type FiveCardCategory =
  | 'self_awareness'
  | 'gentle_healing'
  | 'know_yourself'
  | 'personal_growth'
  | 'relationships_career';

export type FiveCardLayoutId =
  | 'iceberg'
  | 'mirror'
  | 'inner_child'
  | 'safe_space'
  | 'authentic_self'
  | 'values'
  | 'alchemy'
  | 'seasons'
  | 'love_relationships'
  | 'career_purpose';

export interface FiveCardLayout {
  id: FiveCardLayoutId;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  positions: {
    en: [string, string, string, string, string];
    fr: [string, string, string, string, string];
  };
}

export interface FiveCardCategoryConfig {
  id: FiveCardCategory;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  iconName: string;
  colorClass: string;
  layouts: FiveCardLayoutId[];
  defaultLayout: FiveCardLayoutId;
}

export interface FiveCardQuestion {
  id: string;
  textEn: string;
  textFr: string;
}
```

**Step 2:** Add the layout definitions (all 10 layouts)

```typescript
export const FIVE_CARD_LAYOUTS: Record<FiveCardLayoutId, FiveCardLayout> = {
  // Self-Awareness layouts
  iceberg: {
    id: 'iceberg',
    labelEn: 'The Iceberg',
    labelFr: "L'Iceberg",
    taglineEn: 'Dive beneath the surface.',
    taglineFr: 'Plongez sous la surface.',
    positions: {
      en: ["What's visible", "What's beneath", 'Root cause', 'How it serves you', 'Path to integration'],
      fr: ['Ce qui est visible', 'Ce qui est caché', 'Cause profonde', 'Comment cela vous sert', "Chemin vers l'intégration"],
    },
  },
  mirror: {
    id: 'mirror',
    labelEn: 'The Mirror',
    labelFr: 'Le Miroir',
    taglineEn: 'See yourself truly.',
    taglineFr: 'Voyez-vous vraiment.',
    positions: {
      en: ['How you see yourself', 'How others see you', 'What you refuse to see', 'The truth beneath', 'Acceptance message'],
      fr: ['Comment vous vous voyez', 'Comment les autres vous voient', 'Ce que vous refusez de voir', 'La vérité profonde', "Message d'acceptation"],
    },
  },
  // Gentle Healing layouts
  inner_child: {
    id: 'inner_child',
    labelEn: 'Inner Child',
    labelFr: 'Enfant Intérieur',
    taglineEn: 'Nurture your tender heart.',
    taglineFr: 'Nourrissez votre cœur tendre.',
    positions: {
      en: ['Your inner child now', 'What they need', 'What wounded them', 'How to nurture them', 'The gift they hold'],
      fr: ['Votre enfant intérieur', 'Ce dont il a besoin', 'Ce qui l\'a blessé', 'Comment le nourrir', 'Le cadeau qu\'il porte'],
    },
  },
  safe_space: {
    id: 'safe_space',
    labelEn: 'Safe Space',
    labelFr: 'Espace Sécurisant',
    taglineEn: 'Create sanctuary within.',
    taglineFr: 'Créez un sanctuaire intérieur.',
    positions: {
      en: ['Where you feel unsafe', 'What safety means to you', 'What blocks safety', 'Creating internal safety', 'Your protector energy'],
      fr: ['Où vous vous sentez vulnérable', 'Ce que la sécurité signifie', 'Ce qui bloque la sécurité', 'Créer la sécurité intérieure', 'Votre énergie protectrice'],
    },
  },
  // Know Yourself layouts
  authentic_self: {
    id: 'authentic_self',
    labelEn: 'Authentic Self',
    labelFr: 'Moi Authentique',
    taglineEn: 'Uncover who you truly are.',
    taglineFr: 'Découvrez qui vous êtes vraiment.',
    positions: {
      en: ['Who you were taught to be', 'Who you pretend to be', 'Who you fear being', 'Who you truly are', 'How to embody your truth'],
      fr: ['Qui on vous a appris à être', 'Qui vous prétendez être', 'Qui vous craignez d\'être', 'Qui vous êtes vraiment', 'Comment incarner votre vérité'],
    },
  },
  values: {
    id: 'values',
    labelEn: 'Values',
    labelFr: 'Valeurs',
    taglineEn: 'Align with what matters.',
    taglineFr: 'Alignez-vous avec ce qui compte.',
    positions: {
      en: ['What you say you value', 'What your actions reveal', 'A value abandoned', 'A value calling you', 'Alignment message'],
      fr: ['Ce que vous dites valoriser', 'Ce que vos actions révèlent', 'Une valeur abandonnée', 'Une valeur qui vous appelle', "Message d'alignement"],
    },
  },
  // Personal Growth layouts
  alchemy: {
    id: 'alchemy',
    labelEn: 'The Alchemy',
    labelFr: "L'Alchimie",
    taglineEn: 'Transform lead into gold.',
    taglineFr: 'Transformez le plomb en or.',
    positions: {
      en: ['The lead (what feels heavy)', 'The fire (transformation needed)', 'The process', 'The gold (what you\'re becoming)', 'The philosopher\'s stone'],
      fr: ['Le plomb (ce qui pèse)', 'Le feu (transformation)', 'Le processus', "L'or (ce que vous devenez)", 'La pierre philosophale'],
    },
  },
  seasons: {
    id: 'seasons',
    labelEn: 'The Seasons',
    labelFr: 'Les Saisons',
    taglineEn: 'Honor natural cycles.',
    taglineFr: 'Honorez les cycles naturels.',
    positions: {
      en: ['What needs to die (autumn)', 'What needs rest (winter)', 'Ready to sprout (spring)', 'Ready to bloom (summer)', "The cycle's wisdom"],
      fr: ['Ce qui doit mourir (automne)', 'Ce qui a besoin de repos (hiver)', 'Prêt à germer (printemps)', 'Prêt à fleurir (été)', 'La sagesse du cycle'],
    },
  },
  // Relationships and Career layouts
  love_relationships: {
    id: 'love_relationships',
    labelEn: 'Love & Relationships',
    labelFr: 'Amour & Relations',
    taglineEn: 'Navigate matters of the heart.',
    taglineFr: 'Naviguez les affaires du cœur.',
    positions: {
      en: ['Your Heart', 'Their Heart', 'The Connection', 'Challenges', 'Potential'],
      fr: ['Votre Cœur', 'Son Cœur', 'La Connexion', 'Défis', 'Potentiel'],
    },
  },
  career_purpose: {
    id: 'career_purpose',
    labelEn: 'Career & Purpose',
    labelFr: 'Carrière & Vocation',
    taglineEn: 'Chart your professional path.',
    taglineFr: 'Tracez votre chemin professionnel.',
    positions: {
      en: ['Current Position', 'Obstacles', 'Hidden Factors', 'Action to Take', 'Outcome'],
      fr: ['Position Actuelle', 'Obstacles', 'Facteurs Cachés', 'Action à Prendre', 'Résultat'],
    },
  },
};
```

**Step 3:** Add category configurations

```typescript
export const FIVE_CARD_CATEGORIES: FiveCardCategoryConfig[] = [
  {
    id: 'self_awareness',
    labelEn: 'Self-Awareness',
    labelFr: 'Conscience de Soi',
    taglineEn: 'Exploring what lies beneath the surface',
    taglineFr: 'Explorer ce qui se cache sous la surface',
    iconName: 'Eye',
    colorClass: 'indigo',
    layouts: ['iceberg', 'mirror'],
    defaultLayout: 'iceberg',
  },
  {
    id: 'gentle_healing',
    labelEn: 'Gentle Healing',
    labelFr: 'Guérison Douce',
    taglineEn: 'Nurturing your heart and inner child',
    taglineFr: 'Prendre soin de votre cœur et enfant intérieur',
    iconName: 'Heart',
    colorClass: 'rose',
    layouts: ['inner_child', 'safe_space'],
    defaultLayout: 'inner_child',
  },
  {
    id: 'know_yourself',
    labelEn: 'Know Yourself',
    labelFr: 'Se Connaître',
    taglineEn: 'Discovering who you truly are',
    taglineFr: 'Découvrir qui vous êtes vraiment',
    iconName: 'Compass',
    colorClass: 'amber',
    layouts: ['authentic_self', 'values'],
    defaultLayout: 'authentic_self',
  },
  {
    id: 'personal_growth',
    labelEn: 'Personal Growth',
    labelFr: 'Croissance Personnelle',
    taglineEn: 'Embracing change and new beginnings',
    taglineFr: 'Embrasser le changement et les nouveaux départs',
    iconName: 'Sprout',
    colorClass: 'emerald',
    layouts: ['alchemy', 'seasons'],
    defaultLayout: 'alchemy',
  },
  {
    id: 'relationships_career',
    labelEn: 'Relationships & Career',
    labelFr: 'Relations & Carrière',
    taglineEn: 'Navigating love and work',
    taglineFr: "Naviguer l'amour et le travail",
    iconName: 'Users',
    colorClass: 'violet',
    layouts: ['love_relationships', 'career_purpose'],
    defaultLayout: 'love_relationships',
  },
];
```

**Step 4:** Add curated questions (layout-specific for relationships_career)

```typescript
// Questions for most categories (3 per category)
export const FIVE_CARD_QUESTIONS: Record<FiveCardCategory, FiveCardQuestion[]> = {
  self_awareness: [
    { id: '5sa1', textEn: 'What recurring patterns in my life are inviting my attention right now?', textFr: 'Quels schémas récurrents dans ma vie réclament mon attention en ce moment?' },
    { id: '5sa2', textEn: 'What truth about myself am I ready to acknowledge, even if I haven\'t fully seen it before?', textFr: 'Quelle vérité sur moi-même suis-je prêt(e) à reconnaître, même si je ne l\'ai pas vue clairement avant?' },
    { id: '5sa3', textEn: 'How can I deepen my relationship with myself through greater honesty and self-reflection?', textFr: 'Comment puis-je approfondir ma relation avec moi-même par plus d\'honnêteté et d\'introspection?' },
  ],
  gentle_healing: [
    { id: '5gh1', textEn: 'Which part of me is quietly asking for tenderness, patience, and care?', textFr: 'Quelle partie de moi demande silencieusement tendresse, patience et soin?' },
    { id: '5gh2', textEn: 'What does my heart truly need in order to feel safe enough to heal?', textFr: 'De quoi mon cœur a-t-il vraiment besoin pour se sentir assez en sécurité pour guérir?' },
    { id: '5gh3', textEn: 'How can I offer myself the same compassion, understanding, and warmth I give to those I love?', textFr: 'Comment puis-je m\'offrir la même compassion, compréhension et chaleur que je donne à ceux que j\'aime?' },
  ],
  know_yourself: [
    { id: '5ky1', textEn: 'Where in my life am I being called to align my actions more closely with my core values?', textFr: 'Où dans ma vie suis-je appelé(e) à aligner mes actions plus étroitement avec mes valeurs fondamentales?' },
    { id: '5ky2', textEn: 'What aspect of my truest self is asking to be seen, accepted, or expressed?', textFr: 'Quel aspect de mon moi le plus authentique demande à être vu, accepté ou exprimé?' },
    { id: '5ky3', textEn: 'How can I honour my authentic self more fully in my everyday choices and routines?', textFr: 'Comment puis-je honorer mon moi authentique plus pleinement dans mes choix et routines quotidiennes?' },
  ],
  personal_growth: [
    { id: '5pg1', textEn: 'What subtle transformation is already unfolding within me or around me?', textFr: 'Quelle transformation subtile se déploie déjà en moi ou autour de moi?' },
    { id: '5pg2', textEn: 'How can I surrender more trust to the process of change I am moving through?', textFr: 'Comment puis-je faire davantage confiance au processus de changement que je traverse?' },
    { id: '5pg3', textEn: 'What is ready to shift or evolve within me?', textFr: 'Qu\'est-ce qui est prêt à changer ou à évoluer en moi?' },
  ],
  relationships_career: [], // Layout-specific questions below
};

// Layout-specific questions for relationships_career category
export const FIVE_CARD_LAYOUT_QUESTIONS: Record<'love_relationships' | 'career_purpose', FiveCardQuestion[]> = {
  love_relationships: [
    { id: '5lr1', textEn: 'What is this relationship revealing to me about my needs, patterns, and expectations?', textFr: 'Que me révèle cette relation sur mes besoins, schémas et attentes?' },
    { id: '5lr2', textEn: 'Where am I being invited to communicate more honestly, openly, or courageously with others?', textFr: 'Où suis-je invité(e) à communiquer plus honnêtement, ouvertement ou courageusement avec les autres?' },
    { id: '5lr3', textEn: 'How can I show up in my relationships in a way that feels authentic, respectful, and emotionally aligned?', textFr: 'Comment puis-je me présenter dans mes relations de manière authentique, respectueuse et émotionnellement alignée?' },
  ],
  career_purpose: [
    { id: '5cp1', textEn: 'What opportunities, skills, or strengths should I focus on to move my career forward?', textFr: 'Sur quelles opportunités, compétences ou forces devrais-je me concentrer pour faire avancer ma carrière?' },
    { id: '5cp2', textEn: 'What strategic step would create the most progress or momentum in my professional life?', textFr: 'Quelle étape stratégique créerait le plus de progrès ou d\'élan dans ma vie professionnelle?' },
    { id: '5cp3', textEn: 'What do I need to see clearly about my current role or career path to make a confident next move?', textFr: 'Que dois-je voir clairement concernant mon rôle actuel ou mon parcours professionnel pour faire un pas confiant?' },
  ],
};
```

**Step 5:** Add helper functions

```typescript
export const FIVE_CARD_CUSTOM_QUESTION_HELPER = {
  en: 'Open-ended questions work best. Try "What can I learn from..." or "What do I need to understand about..."',
  fr: 'Les questions ouvertes fonctionnent mieux. Essayez "Que puis-je apprendre de..." ou "Que dois-je comprendre de..."',
};

export function getFiveCardCategory(id: FiveCardCategory): FiveCardCategoryConfig | undefined {
  return FIVE_CARD_CATEGORIES.find(c => c.id === id);
}

export function getFiveCardQuestionsForSelection(
  category: FiveCardCategory,
  layoutId: FiveCardLayoutId
): FiveCardQuestion[] {
  // For relationships_career, return layout-specific questions
  if (category === 'relationships_career') {
    if (layoutId === 'love_relationships' || layoutId === 'career_purpose') {
      return FIVE_CARD_LAYOUT_QUESTIONS[layoutId];
    }
  }
  return FIVE_CARD_QUESTIONS[category];
}
```

**Step 6:** Commit

```bash
git add constants/fiveCardLayouts.ts
git commit -m "feat(5card): add fiveCardLayouts.ts with categories, layouts, and questions"
```

---

### Task 2: Create FiveCardCategorySelector component

**Files:**
- Create: `components/reading/phases/FiveCardCategorySelector.tsx`

**Step 1:** Create the component with category grid

```typescript
// components/reading/phases/FiveCardCategorySelector.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Heart, Compass, Sprout, Users, Check } from 'lucide-react';
import {
  FiveCardCategory,
  FiveCardCategoryConfig,
  FIVE_CARD_CATEGORIES,
} from '../../../constants/fiveCardLayouts';

interface FiveCardCategorySelectorProps {
  language: 'en' | 'fr';
  selectedCategory: FiveCardCategory | null;
  onSelect: (category: FiveCardCategory) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Eye,
  Heart,
  Compass,
  Sprout,
  Users,
};

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string }> = {
  indigo: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', text: 'text-indigo-300' },
  rose: { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-300' },
  amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300' },
  violet: { bg: 'bg-violet-500/20', border: 'border-violet-500/40', text: 'text-violet-300' },
};

const FiveCardCategorySelector: React.FC<FiveCardCategorySelectorProps> = ({
  language,
  selectedCategory,
  onSelect,
}) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400 text-center mb-4">
        {language === 'en' ? 'Choose your focus' : 'Choisissez votre thème'}
      </p>
      <div className="grid grid-cols-1 gap-2">
        {FIVE_CARD_CATEGORIES.map((category) => {
          const Icon = ICON_MAP[category.iconName] || Eye;
          const colors = COLOR_CLASSES[category.colorClass] || COLOR_CLASSES.indigo;
          const isSelected = selectedCategory === category.id;

          return (
            <motion.button
              key={category.id}
              onClick={() => onSelect(category.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`
                w-full p-4 rounded-xl border transition-all text-left
                ${isSelected
                  ? `${colors.bg} ${colors.border} ring-1 ring-white/20`
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isSelected ? colors.bg : 'bg-slate-700/50'}
                `}>
                  <Icon className={`w-5 h-5 ${isSelected ? colors.text : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${isSelected ? colors.text : 'text-slate-200'}`}>
                      {language === 'en' ? category.labelEn : category.labelFr}
                    </h3>
                    {isSelected && (
                      <Check className={`w-4 h-4 ${colors.text}`} />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'en' ? category.taglineEn : category.taglineFr}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default FiveCardCategorySelector;
```

**Step 2:** Commit

```bash
git add components/reading/phases/FiveCardCategorySelector.tsx
git commit -m "feat(5card): add FiveCardCategorySelector component"
```

---

### Task 3: Create FiveCardLayoutSelector component

**Files:**
- Create: `components/reading/phases/FiveCardLayoutSelector.tsx`

**Step 1:** Create layout selector that shows after category selection

```typescript
// components/reading/phases/FiveCardLayoutSelector.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import {
  FiveCardCategory,
  FiveCardLayoutId,
  FiveCardCategoryConfig,
  FIVE_CARD_LAYOUTS,
  getFiveCardCategory,
} from '../../../constants/fiveCardLayouts';

interface FiveCardLayoutSelectorProps {
  language: 'en' | 'fr';
  category: FiveCardCategory;
  selectedLayout: FiveCardLayoutId | null;
  onSelect: (layoutId: FiveCardLayoutId) => void;
}

const FiveCardLayoutSelector: React.FC<FiveCardLayoutSelectorProps> = ({
  language,
  category,
  selectedLayout,
  onSelect,
}) => {
  const categoryConfig = getFiveCardCategory(category);
  if (!categoryConfig) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-4 pt-4 border-t border-slate-700/50"
    >
      <p className="text-sm text-slate-400 mb-3">
        {language === 'en' ? 'Choose your layout' : 'Choisissez votre disposition'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {categoryConfig.layouts.map((layoutId) => {
          const layout = FIVE_CARD_LAYOUTS[layoutId];
          const isSelected = selectedLayout === layoutId;

          return (
            <motion.button
              key={layoutId}
              onClick={() => onSelect(layoutId)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-3 rounded-lg border transition-all text-left
                ${isSelected
                  ? 'bg-purple-500/20 border-purple-500/40 ring-1 ring-purple-400/30'
                  : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${isSelected ? 'text-purple-200' : 'text-slate-300'}`}>
                  {language === 'en' ? layout.labelEn : layout.labelFr}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-purple-300" />}
              </div>
              <p className="text-xs text-slate-500">
                {language === 'en' ? layout.taglineEn : layout.taglineFr}
              </p>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default FiveCardLayoutSelector;
```

**Step 2:** Commit

```bash
git add components/reading/phases/FiveCardLayoutSelector.tsx
git commit -m "feat(5card): add FiveCardLayoutSelector component"
```

---

### Task 4: Create FiveCardQuestionSelector component

**Files:**
- Create: `components/reading/phases/FiveCardQuestionSelector.tsx`

**Step 1:** Create component following ThreeCardQuestionSelector pattern

```typescript
// components/reading/phases/FiveCardQuestionSelector.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, PenLine } from 'lucide-react';
import FiveCardCategorySelector from './FiveCardCategorySelector';
import FiveCardLayoutSelector from './FiveCardLayoutSelector';
import {
  FiveCardCategory,
  FiveCardLayoutId,
  FiveCardQuestion,
  getFiveCardQuestionsForSelection,
  FIVE_CARD_CUSTOM_QUESTION_HELPER,
} from '../../../constants/fiveCardLayouts';

interface FiveCardQuestionSelectorProps {
  language: 'en' | 'fr';
  selectedCategory: FiveCardCategory | null;
  selectedLayout: FiveCardLayoutId | null;
  selectedQuestionId: string | null;
  customQuestion: string;
  isWritingOwn: boolean;
  onCategorySelect: (category: FiveCardCategory) => void;
  onLayoutSelect: (layoutId: FiveCardLayoutId) => void;
  onQuestionSelect: (questionId: string, questionText: string) => void;
  onCustomQuestionChange: (text: string) => void;
  onWriteOwn: () => void;
}

const FiveCardQuestionSelector: React.FC<FiveCardQuestionSelectorProps> = ({
  language,
  selectedCategory,
  selectedLayout,
  selectedQuestionId,
  customQuestion,
  isWritingOwn,
  onCategorySelect,
  onLayoutSelect,
  onQuestionSelect,
  onCustomQuestionChange,
  onWriteOwn,
}) => {
  // Get questions based on category and layout
  const questions: FiveCardQuestion[] = selectedCategory && selectedLayout
    ? getFiveCardQuestionsForSelection(selectedCategory, selectedLayout)
    : [];

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <FiveCardCategorySelector
        language={language}
        selectedCategory={selectedCategory}
        onSelect={onCategorySelect}
      />

      {/* Layout Selection (shows after category) */}
      <AnimatePresence>
        {selectedCategory && (
          <FiveCardLayoutSelector
            language={language}
            category={selectedCategory}
            selectedLayout={selectedLayout}
            onSelect={onLayoutSelect}
          />
        )}
      </AnimatePresence>

      {/* Question Selection (shows after layout) */}
      <AnimatePresence>
        {selectedCategory && selectedLayout && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-700/50"
          >
            <p className="text-sm text-slate-400 mb-3">
              {language === 'en' ? 'Your question' : 'Votre question'}
            </p>

            {/* Curated Questions */}
            {!isWritingOwn && (
              <div className="space-y-2 mb-3">
                {questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => onQuestionSelect(q.id, language === 'en' ? q.textEn : q.textFr)}
                    className={`
                      w-full p-3 rounded-lg text-left text-sm transition-all
                      ${selectedQuestionId === q.id
                        ? 'bg-purple-500/20 border border-purple-500/40 text-purple-100'
                        : 'bg-slate-800/30 border border-slate-700/30 text-slate-300 hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`
                        w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center
                        ${selectedQuestionId === q.id ? 'bg-purple-500 border-purple-500' : 'border-slate-600'}
                      `}>
                        {selectedQuestionId === q.id && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span>{language === 'en' ? q.textEn : q.textFr}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Write Your Own Toggle */}
            <button
              onClick={onWriteOwn}
              className={`
                w-full p-3 rounded-lg text-left text-sm transition-all flex items-center gap-2
                ${isWritingOwn
                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-100'
                  : 'bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:border-slate-600'
                }
              `}
            >
              <PenLine className="w-4 h-4" />
              {language === 'en' ? 'Write your own question' : 'Écrivez votre propre question'}
            </button>

            {/* Custom Question Input */}
            <AnimatePresence>
              {isWritingOwn && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <textarea
                    value={customQuestion}
                    onChange={(e) => onCustomQuestionChange(e.target.value)}
                    placeholder={language === 'en' ? 'Type your question here...' : 'Tapez votre question ici...'}
                    className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-purple-500/50"
                    rows={3}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {language === 'en'
                      ? FIVE_CARD_CUSTOM_QUESTION_HELPER.en
                      : FIVE_CARD_CUSTOM_QUESTION_HELPER.fr}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FiveCardQuestionSelector;
```

**Step 2:** Commit

```bash
git add components/reading/phases/FiveCardQuestionSelector.tsx
git commit -m "feat(5card): add FiveCardQuestionSelector component"
```

---

### Task 5: Create FiveCardIntroPhase component

**Files:**
- Create: `components/reading/phases/FiveCardIntroPhase.tsx`

**Step 1:** Create the main intro phase component (mirrors ThreeCardIntroPhase)

```typescript
// components/reading/phases/FiveCardIntroPhase.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Check, AlertCircle, ChevronDown, Coins } from 'lucide-react';
import { SpreadConfig, InterpretationStyle } from '../../../types';
import Button from '../../Button';
import ThemedBackground from '../ThemedBackground';
import { SPREAD_THEMES } from '../SpreadThemes';
import FiveCardQuestionSelector from './FiveCardQuestionSelector';
import {
  FiveCardCategory,
  FiveCardLayoutId,
  FIVE_CARD_LAYOUTS,
} from '../../../constants/fiveCardLayouts';

interface FiveCardIntroPhaseProps {
  spread: SpreadConfig;
  language: 'en' | 'fr';
  // Category, layout & question selection
  selectedCategory: FiveCardCategory | null;
  selectedLayout: FiveCardLayoutId | null;
  selectedQuestionId: string | null;
  customQuestion: string;
  isWritingOwn: boolean;
  onCategorySelect: (category: FiveCardCategory) => void;
  onLayoutSelect: (layoutId: FiveCardLayoutId) => void;
  onQuestionSelect: (questionId: string, questionText: string) => void;
  onCustomQuestionChange: (text: string) => void;
  onWriteOwnToggle: () => void;
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

const FiveCardIntroPhase: React.FC<FiveCardIntroPhaseProps> = ({
  spread,
  language,
  selectedCategory,
  selectedLayout,
  selectedQuestionId,
  customQuestion,
  isWritingOwn,
  onCategorySelect,
  onLayoutSelect,
  onQuestionSelect,
  onCustomQuestionChange,
  onWriteOwnToggle,
  isAdvanced,
  selectedStyles,
  onAdvancedToggle,
  onStyleToggle,
  validationMessage,
  totalCost,
  credits,
  onStartShuffle,
}) => {
  const theme = SPREAD_THEMES[spread.id] || SPREAD_THEMES.five_card;

  const hasValidQuestion = selectedQuestionId !== null || (isWritingOwn && customQuestion.trim().length > 0);
  const canProceed = selectedCategory !== null && selectedLayout !== null && hasValidQuestion && credits >= totalCost;

  const layoutLabel = selectedLayout
    ? (language === 'en' ? FIVE_CARD_LAYOUTS[selectedLayout].labelEn : FIVE_CARD_LAYOUTS[selectedLayout].labelFr)
    : null;

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
              {language === 'en' ? 'Five Card Spread' : 'Tirage Cinq Cartes'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-heading text-white mb-1">
            {language === 'en' ? 'Deep Inner Work' : 'Travail Intérieur Profond'}
          </h2>
          <p className={`text-sm ${theme.textAccent} italic`}>
            {language === 'en' ? 'Five cards illuminate the path within' : 'Cinq cartes illuminent le chemin intérieur'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden">
          {/* Question Selection Section */}
          <div className="p-4 md:p-5">
            <FiveCardQuestionSelector
              language={language}
              selectedCategory={selectedCategory}
              selectedLayout={selectedLayout}
              selectedQuestionId={selectedQuestionId}
              customQuestion={customQuestion}
              isWritingOwn={isWritingOwn}
              onCategorySelect={onCategorySelect}
              onLayoutSelect={onLayoutSelect}
              onQuestionSelect={onQuestionSelect}
              onCustomQuestionChange={onCustomQuestionChange}
              onWriteOwn={onWriteOwnToggle}
            />

            {/* Selected layout label */}
            {selectedCategory && selectedLayout && layoutLabel && (
              <div className="mt-3 text-xs text-slate-500 text-center">
                {language === 'en' ? 'Layout: ' : 'Disposition: '}
                <span className="text-slate-400">{layoutLabel}</span>
              </div>
            )}
          </div>

          {/* Advanced Options Toggle */}
          <div className="border-t border-slate-800">
            <button
              onClick={onAdvancedToggle}
              className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400">
                  {language === 'en' ? 'Go Deeper' : 'Approfondir'}
                </span>
                {isAdvanced && selectedStyles.length > 0 && (
                  <span className="text-xs text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Coins className="w-3 h-3" />+1
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isAdvanced ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <p className="text-xs text-slate-500 mb-3">
                      {language === 'en'
                        ? 'Add extra perspectives to your reading (+1 credit for any selection)'
                        : 'Ajoutez des perspectives supplémentaires (+1 crédit pour toute sélection)'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: InterpretationStyle.SPIRITUAL, labelEn: 'Spiritual', labelFr: 'Spirituel' },
                        { id: InterpretationStyle.PSYCHO_EMOTIONAL, labelEn: 'Psycho-Emotional', labelFr: 'Psycho-Émotionnel' },
                        { id: InterpretationStyle.NUMEROLOGY, labelEn: 'Numerology', labelFr: 'Numérologie' },
                        { id: InterpretationStyle.ELEMENTAL, labelEn: 'Elements', labelFr: 'Éléments' }
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => onStyleToggle(option.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            selectedStyles.includes(option.id)
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800/50 text-slate-500 border border-transparent hover:bg-slate-800'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                            selectedStyles.includes(option.id) ? 'bg-amber-500 border-amber-500' : 'border-slate-600'
                          }`}>
                            {selectedStyles.includes(option.id) && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          {language === 'en' ? option.labelEn : option.labelFr}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              <div className="flex items-center gap-1.5 text-purple-300">
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
                      ? (language === 'en' ? 'Select or write a question' : 'Sélectionnez ou écrivez une question')
                      : (language === 'en' ? 'Insufficient credits' : 'Crédits insuffisants')}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FiveCardIntroPhase;
```

**Step 2:** Commit

```bash
git add components/reading/phases/FiveCardIntroPhase.tsx
git commit -m "feat(5card): add FiveCardIntroPhase component"
```

---

### Task 6: Update types.ts to add FIVE_CARD spread type

**Files:**
- Modify: `types.ts`

**Step 1:** Add FIVE_CARD to SpreadType enum

Find the SpreadType enum and add:
```typescript
export enum SpreadType {
  SINGLE = 'single',
  THREE_CARD = 'three_card',
  FIVE_CARD = 'five_card',  // ADD THIS
  LOVE = 'love',
  CAREER = 'career',
  HORSESHOE = 'horseshoe',
  CELTIC_CROSS = 'celtic_cross',
}
```

**Step 2:** Commit

```bash
git add types.ts
git commit -m "feat(5card): add FIVE_CARD to SpreadType enum"
```

---

### Task 7: Update constants.ts with unified 5-card spread

**Files:**
- Modify: `constants.ts`

**Step 1:** Replace LOVE and CAREER spreads with unified FIVE_CARD spread

```typescript
// Replace the separate LOVE and CAREER entries with:
[SpreadType.FIVE_CARD]: {
  id: SpreadType.FIVE_CARD,
  nameEn: "Five Card Spread",
  nameFr: "Tirage à Cinq Cartes",
  cost: 5,
  positions: 5,
  // Default positions - these get overridden by layout selection
  positionMeaningsEn: ["First", "Second", "Third", "Fourth", "Fifth"],
  positionMeaningsFr: ["Premier", "Deuxième", "Troisième", "Quatrième", "Cinquième"]
},
```

Note: Keep LOVE and CAREER in the enum for backwards compatibility with existing readings, but remove them from SPREADS (they're superseded by FIVE_CARD).

**Step 2:** Commit

```bash
git add constants.ts
git commit -m "feat(5card): add unified FIVE_CARD spread to constants"
```

---

### Task 8: Update SpreadSelector for unified 5-card option

**Files:**
- Modify: `components/SpreadSelector.tsx`

**Step 1:** Find where spreads are rendered and ensure FIVE_CARD is shown instead of LOVE/CAREER

**Step 2:** Update the spread order to show: Single, Three-Card, Five-Card, Horseshoe, Celtic Cross

**Step 3:** Commit

```bash
git add components/SpreadSelector.tsx
git commit -m "feat(5card): update SpreadSelector for unified 5-card spread"
```

---

### Task 9: Update HomePage.tsx slug mapping

**Files:**
- Modify: `components/HomePage.tsx`

**Step 1:** Update the slugMap to include five-card:

```typescript
const slugMap: Record<SpreadType, string> = {
  [SpreadType.SINGLE]: 'single',
  [SpreadType.THREE_CARD]: 'three-card',
  [SpreadType.FIVE_CARD]: 'five-card',  // ADD THIS
  [SpreadType.LOVE]: 'love',
  [SpreadType.CAREER]: 'career',
  [SpreadType.HORSESHOE]: 'horseshoe',
  [SpreadType.CELTIC_CROSS]: 'celtic-cross',
};
```

**Step 2:** Commit

```bash
git add components/HomePage.tsx
git commit -m "feat(5card): add five-card slug mapping to HomePage"
```

---

### Task 10: Add 5-card state management to ActiveReading

**Files:**
- Modify: `components/ActiveReading.tsx`

**Step 1:** Add 5-card state variables (mirror the 3-card pattern):

```typescript
// 5-Card intro phase state
const [fiveCardCategory, setFiveCardCategory] = useState<FiveCardCategory | null>(null);
const [fiveCardLayout, setFiveCardLayout] = useState<FiveCardLayoutId | null>(null);
const [fiveCardQuestionId, setFiveCardQuestionId] = useState<string | null>(null);
const [fiveCardCustomQuestion, setFiveCardCustomQuestion] = useState('');
const [fiveCardWritingOwn, setFiveCardWritingOwn] = useState(false);
```

**Step 2:** Add imports for 5-card types

```typescript
import {
  FiveCardCategory,
  FiveCardLayoutId,
  FIVE_CARD_LAYOUTS,
  getFiveCardCategory,
} from '../constants/fiveCardLayouts';
```

**Step 3:** Add phase handling for 5-card intro

Find where phase is determined and add:
```typescript
const isFiveCard = spread.id === SpreadType.FIVE_CARD;
const showFiveCardIntro = isFiveCard && phase === 'intro';
```

**Step 4:** Add handlers for 5-card selections:

```typescript
const handleFiveCardCategorySelect = (category: FiveCardCategory) => {
  setFiveCardCategory(category);
  // Auto-select default layout
  const config = getFiveCardCategory(category);
  if (config) {
    setFiveCardLayout(config.defaultLayout);
  }
  // Reset question selection
  setFiveCardQuestionId(null);
  setFiveCardCustomQuestion('');
  setFiveCardWritingOwn(false);
};

const handleFiveCardLayoutSelect = (layoutId: FiveCardLayoutId) => {
  setFiveCardLayout(layoutId);
  // Reset question when changing layout (for relationships_career category)
  setFiveCardQuestionId(null);
  setFiveCardCustomQuestion('');
  setFiveCardWritingOwn(false);
};

const handleFiveCardQuestionSelect = (questionId: string, questionText: string) => {
  setFiveCardQuestionId(questionId);
  setQuestion(questionText);
  setFiveCardWritingOwn(false);
};

const handleFiveCardCustomQuestionChange = (text: string) => {
  setFiveCardCustomQuestion(text);
  setQuestion(text);
};

const handleFiveCardWriteOwnToggle = () => {
  setFiveCardWritingOwn(!fiveCardWritingOwn);
  if (!fiveCardWritingOwn) {
    setFiveCardQuestionId(null);
  }
};
```

**Step 5:** Update position meanings to use layout-specific positions

```typescript
// Inside interpretation/drawing/revealing phases, use:
const getPositionMeanings = () => {
  if (isFiveCard && fiveCardLayout) {
    const layout = FIVE_CARD_LAYOUTS[fiveCardLayout];
    return language === 'en' ? layout.positions.en : layout.positions.fr;
  }
  // fallback to spread defaults
  return language === 'en' ? spread.positionMeaningsEn : spread.positionMeaningsFr;
};
```

**Step 6:** Commit

```bash
git add components/ActiveReading.tsx
git commit -m "feat(5card): add 5-card state management to ActiveReading"
```

---

### Task 11: Render FiveCardIntroPhase in ActiveReading

**Files:**
- Modify: `components/ActiveReading.tsx`

**Step 1:** Import FiveCardIntroPhase

```typescript
import FiveCardIntroPhase from './reading/phases/FiveCardIntroPhase';
```

**Step 2:** Add conditional rendering for 5-card intro phase

Find where ThreeCardIntroPhase is rendered and add similar:

```typescript
{showFiveCardIntro && (
  <FiveCardIntroPhase
    spread={spread}
    language={language}
    selectedCategory={fiveCardCategory}
    selectedLayout={fiveCardLayout}
    selectedQuestionId={fiveCardQuestionId}
    customQuestion={fiveCardCustomQuestion}
    isWritingOwn={fiveCardWritingOwn}
    onCategorySelect={handleFiveCardCategorySelect}
    onLayoutSelect={handleFiveCardLayoutSelect}
    onQuestionSelect={handleFiveCardQuestionSelect}
    onCustomQuestionChange={handleFiveCardCustomQuestionChange}
    onWriteOwnToggle={handleFiveCardWriteOwnToggle}
    isAdvanced={isAdvanced}
    selectedStyles={selectedStyles}
    onAdvancedToggle={handleAdvancedToggle}
    onStyleToggle={handleStyleToggle}
    validationMessage={validationMessage}
    totalCost={displayCost}
    credits={user?.credits || 0}
    onStartShuffle={startShuffleAnimation}
  />
)}
```

**Step 3:** Commit

```bash
git add components/ActiveReading.tsx
git commit -m "feat(5card): render FiveCardIntroPhase in ActiveReading"
```

---

### Task 12: Pass fiveCardLayout to drawing/revealing/interpretation phases

**Files:**
- Modify: `components/ActiveReading.tsx`
- Modify: `components/reading/phases/DrawingPhase.tsx`
- Modify: `components/reading/phases/RevealingPhase.tsx`
- Modify: `components/reading/phases/InterpretationPhase.tsx`

**Step 1:** Add fiveCardLayout prop to each phase component interface

**Step 2:** Pass fiveCardLayout from ActiveReading to each phase

**Step 3:** Update position label logic in each phase to check for fiveCardLayout:

```typescript
// Example in DrawingPhase
const getPositionLabel = (index: number) => {
  if (fiveCardLayout) {
    const layout = FIVE_CARD_LAYOUTS[fiveCardLayout];
    const positions = language === 'en' ? layout.positions.en : layout.positions.fr;
    return positions[index] || `Card ${index + 1}`;
  }
  // existing threeCardLayout check
  if (threeCardLayout) {
    // ... existing code
  }
  // fallback
  return language === 'en' ? spread.positionMeaningsEn[index] : spread.positionMeaningsFr[index];
};
```

**Step 4:** Commit

```bash
git add components/ActiveReading.tsx components/reading/phases/DrawingPhase.tsx components/reading/phases/RevealingPhase.tsx components/reading/phases/InterpretationPhase.tsx
git commit -m "feat(5card): pass fiveCardLayout to reading phases"
```

---

### Task 13: Add 5-card spread theme to SpreadThemes.ts

**Files:**
- Modify: `components/reading/SpreadThemes.ts`

**Step 1:** Add theme for five_card spread:

```typescript
five_card: {
  id: 'five_card',
  icon: '🔮',
  gradient: 'from-purple-900 via-violet-800 to-indigo-900',
  border: 'border-purple-500/30',
  textAccent: 'text-purple-300',
  bgOverlay: 'bg-purple-900/20',
},
```

**Step 2:** Commit

```bash
git add components/reading/SpreadThemes.ts
git commit -m "feat(5card): add five_card theme to SpreadThemes"
```

---

### Task 14: Add layout-specific prompt guidance to prompts.ts

**Files:**
- Modify: `server/src/shared/constants/prompts.ts`

**Step 1:** Add spread guidance for all 10 layouts:

```typescript
// Add after existing spread guidance entries

{
  key: 'SPREAD_GUIDANCE_FIVE_CARD_ICEBERG',
  description: 'The Iceberg 5-card layout guidance',
  category: 'tarot',
  variables: [],
  defaultValue:
    'This Iceberg spread explores the layers of consciousness. The first card reveals what is visible and conscious. The second uncovers what lies beneath in the unconscious. The third illuminates the root cause. The fourth shows how this pattern serves you. The fifth reveals the path to integration and wholeness.',
},

{
  key: 'SPREAD_GUIDANCE_FIVE_CARD_MIRROR',
  description: 'The Mirror 5-card layout guidance',
  category: 'tarot',
  variables: [],
  defaultValue:
    'This Mirror spread reveals multiple perspectives of self. The first card shows how you see yourself. The second shows how others perceive you. The third uncovers what you refuse to see. The fourth reveals the deeper truth beneath both views. The fifth offers a message of acceptance.',
},

{
  key: 'SPREAD_GUIDANCE_FIVE_CARD_INNER_CHILD',
  description: 'Inner Child 5-card layout guidance',
  category: 'tarot',
  variables: [],
  defaultValue:
    'This Inner Child spread nurtures healing. The first card reveals the state of your inner child now. The second shows what they need. The third uncovers what wounded them. The fourth guides how to nurture them. The fifth reveals the gift they hold for you.',
},

{
  key: 'SPREAD_GUIDANCE_FIVE_CARD_SAFE_SPACE',
  description: 'Safe Space 5-card layout guidance',
  category: 'tarot',
  variables: [],
  defaultValue:
    'This Safe Space spread explores inner sanctuary. The first card shows where you feel unsafe. The second reveals what safety means to you. The third uncovers what blocks you from feeling safe. The fourth guides how to create internal safety. The fifth reveals your protector energy.',
},

{
  key: 'SPREAD_GUIDANCE_FIVE_CARD_AUTHENTIC_SELF',
  description: 'Authentic Self 5-card layout guidance',
  category: 'tarot',
  variables: [],
  defaultValue:
    'This Authentic Self spread reveals your true nature. The first card shows who you were taught to be. The second reveals who you pretend to be. The third uncovers who you fear being. The fourth illuminates who you truly are. The fifth guides how to embody your truth.',
},

{
  key: 'SPREAD_GUIDANCE_FIVE_CARD_VALUES',
  description: 'Values 5-card layout guidance',
  category: 'tarot',
  variables: [],
  defaultValue:
    'This Values spread explores alignment. The first card shows what you say you value. The second reveals what your actions truly demonstrate. The third uncovers a value you have abandoned. The fourth shows a value calling to you. The fifth offers an alignment message.',
},

{
  key: 'SPREAD_GUIDANCE_FIVE_CARD_ALCHEMY',
  description: 'The Alchemy 5-card layout guidance',
  category: 'tarot',
  variables: [],
  defaultValue:
    'This Alchemy spread illuminates transformation. The first card is the lead: what feels heavy. The second is the fire: the transformation needed. The third reveals the process of how change happens. The fourth is the gold: what you are becoming. The fifth is the philosopher\'s stone: your inner catalyst.',
},

{
  key: 'SPREAD_GUIDANCE_FIVE_CARD_SEASONS',
  description: 'The Seasons 5-card layout guidance',
  category: 'tarot',
  variables: [],
  defaultValue:
    'This Seasons spread honors natural cycles. The first card represents autumn: what needs to die. The second is winter: what needs rest. The third is spring: what is ready to sprout. The fourth is summer: what is ready to bloom. The fifth reveals the cycle\'s wisdom.',
},

{
  key: 'SPREAD_GUIDANCE_FIVE_CARD_LOVE_RELATIONSHIPS',
  description: 'Love & Relationships 5-card layout guidance',
  category: 'tarot',
  variables: [],
  defaultValue:
    'This Love and Relationships spread explores the emotional landscape of connection. The first card reveals your heart and inner emotions. The second shows their perspective and feelings. The third represents the connection or dynamic between you. The fourth highlights challenges or obstacles to be aware of. The fifth reveals the potential outcome or path forward.',
},

{
  key: 'SPREAD_GUIDANCE_FIVE_CARD_CAREER_PURPOSE',
  description: 'Career & Purpose 5-card layout guidance',
  category: 'tarot',
  variables: [],
  defaultValue:
    'This Career and Purpose spread illuminates your professional journey. The first card shows your current position and standing. The second reveals obstacles or challenges in your path. The third uncovers hidden factors or opportunities you may not see. The fourth suggests specific action to take. The fifth indicates the likely outcome of following this guidance.',
},
```

**Step 2:** Commit

```bash
git add server/src/shared/constants/prompts.ts
git commit -m "feat(5card): add layout-specific prompt guidance for all 10 layouts"
```

---

### Task 15: Update AI route for dynamic layout guidance

**Files:**
- Modify: `server/src/routes/ai.ts`

**Step 1:** Add mapping for 5-card layouts to prompt keys

```typescript
const FIVE_CARD_LAYOUT_GUIDANCE_MAP: Record<string, string> = {
  'iceberg': 'SPREAD_GUIDANCE_FIVE_CARD_ICEBERG',
  'mirror': 'SPREAD_GUIDANCE_FIVE_CARD_MIRROR',
  'inner_child': 'SPREAD_GUIDANCE_FIVE_CARD_INNER_CHILD',
  'safe_space': 'SPREAD_GUIDANCE_FIVE_CARD_SAFE_SPACE',
  'authentic_self': 'SPREAD_GUIDANCE_FIVE_CARD_AUTHENTIC_SELF',
  'values': 'SPREAD_GUIDANCE_FIVE_CARD_VALUES',
  'alchemy': 'SPREAD_GUIDANCE_FIVE_CARD_ALCHEMY',
  'seasons': 'SPREAD_GUIDANCE_FIVE_CARD_SEASONS',
  'love_relationships': 'SPREAD_GUIDANCE_FIVE_CARD_LOVE_RELATIONSHIPS',
  'career_purpose': 'SPREAD_GUIDANCE_FIVE_CARD_CAREER_PURPOSE',
};
```

**Step 2:** Update the spread guidance lookup logic to check for 5-card layouts:

```typescript
// Find where spreadLayoutGuidance is assembled
if (spreadType === 'five_card' && layoutId) {
  const guidanceKey = FIVE_CARD_LAYOUT_GUIDANCE_MAP[layoutId];
  if (guidanceKey) {
    spreadLayoutGuidance = getPromptValue(guidanceKey);
  }
}
```

**Step 3:** Commit

```bash
git add server/src/routes/ai.ts
git commit -m "feat(5card): add dynamic layout guidance lookup for 5-card spreads"
```

---

### Task 16: Update API service to send layoutId for 5-card

**Files:**
- Modify: `services/apiService.ts`

**Step 1:** Ensure createReading and generate functions include layoutId parameter

This may already be in place from 3-card implementation. Verify the function signature accepts layoutId and passes it to the backend.

**Step 2:** Commit

```bash
git add services/apiService.ts
git commit -m "feat(5card): ensure layoutId is passed in API calls"
```

---

### Task 17: Pass layoutId from ActiveReading to API for 5-card

**Files:**
- Modify: `components/ActiveReading.tsx`

**Step 1:** Update the API call that generates interpretation to include fiveCardLayout:

```typescript
// In the interpretation generation call
const layoutId = isFiveCard ? fiveCardLayout : isThreeCard ? threeCardLayout : undefined;

// Pass layoutId to generate function
const result = await generate(token, {
  spreadType: spread.id,
  layoutId,
  // ... other params
});
```

**Step 2:** Update the createReading call to include layoutId for saving:

```typescript
const savedReading = await createReading(token, {
  spreadType: spread.id,
  layoutId: isFiveCard ? fiveCardLayout : isThreeCard ? threeCardLayout : undefined,
  // ... other params
});
```

**Step 3:** Commit

```bash
git add components/ActiveReading.tsx
git commit -m "feat(5card): pass fiveCardLayout as layoutId to API"
```

---

### Task 18: Manual testing verification

**Tests to perform:**

1. **Navigate to 5-Card Spread:**
   - From HomePage, click Tarot → should see "Five Card Spread" option
   - Click Five Card Spread → should navigate to /reading/five-card

2. **Category Selection:**
   - All 5 categories should display with icons and taglines
   - Clicking a category should highlight it and show layout options

3. **Layout Selection:**
   - Each category should show 2 layout options
   - Selecting a layout should show question options

4. **Question Selection for regular categories:**
   - Self-Awareness, Gentle Healing, Know Yourself, Personal Growth should show their 3 curated questions

5. **Question Selection for Relationships & Career:**
   - When Love & Relationships layout is selected → show relationship questions
   - When Career & Purpose layout is selected → show career questions

6. **Custom Question:**
   - "Write your own question" should expand input field
   - Typing should enable the Begin Reading button

7. **Style Options:**
   - "Go Deeper" should expand style selection
   - Selecting a style should show +1 credit indicator

8. **Cost Display:**
   - Base cost should show 5 credits
   - With style selected should show 6 credits

9. **Complete Reading Flow:**
   - Click "Shuffle the Deck" → shuffle animation
   - Draw 5 cards → reveal phase with layout-specific position names
   - Interpretation should use layout-specific guidance

10. **Position Labels:**
    - The Iceberg should show: "What's visible", "What's beneath", etc.
    - Love & Relationships should show: "Your Heart", "Their Heart", etc.

---

## Files Modified Summary

| File | Change |
|------|--------|
| `constants/fiveCardLayouts.ts` | New file with categories, layouts, questions |
| `components/reading/phases/FiveCardCategorySelector.tsx` | New component |
| `components/reading/phases/FiveCardLayoutSelector.tsx` | New component |
| `components/reading/phases/FiveCardQuestionSelector.tsx` | New component |
| `components/reading/phases/FiveCardIntroPhase.tsx` | New component |
| `types.ts` | Add FIVE_CARD to SpreadType enum |
| `constants.ts` | Add unified FIVE_CARD spread |
| `components/SpreadSelector.tsx` | Update to show unified 5-card option |
| `components/HomePage.tsx` | Add five-card slug mapping |
| `components/ActiveReading.tsx` | Add 5-card state, handlers, phase rendering |
| `components/reading/phases/DrawingPhase.tsx` | Add fiveCardLayout prop and position logic |
| `components/reading/phases/RevealingPhase.tsx` | Add fiveCardLayout prop and position logic |
| `components/reading/phases/InterpretationPhase.tsx` | Add fiveCardLayout prop and position logic |
| `components/reading/SpreadThemes.ts` | Add five_card theme |
| `server/src/shared/constants/prompts.ts` | Add 10 layout-specific prompt guidance |
| `server/src/routes/ai.ts` | Add 5-card layout guidance lookup |
| `services/apiService.ts` | Ensure layoutId is passed |

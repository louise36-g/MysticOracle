# Three Card Intro Phase Implementation Plan

> **For Claude:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement the guided intro phase for 3-card readings with category selection, layout choice, and curated questions (as designed in `docs/plans/2026-01-27-three-card-intro-phase-design.md`).

**Architecture:** Mirror SingleCardIntroPhase patterns. Categories map to layouts. Decision/Healing categories offer two layout options via radio buttons. Questions are shared across layouts within a category.

**Tech Stack:** React 19, TypeScript, Framer Motion, Tailwind CSS

---

## Tasks

### Task 1: Create threeCardLayouts.ts constants file

**Files:**
- Create: `constants/threeCardLayouts.ts`

**Step 1: Create the constants file**

```typescript
// constants/threeCardLayouts.ts

export type ThreeCardCategory = 'general' | 'love' | 'career' | 'decision' | 'healing';

export type ThreeCardLayoutId =
  | 'past_present_future'
  | 'you_them_connection'
  | 'situation_action_outcome'
  | 'option_a_b_guidance'
  | 'situation_obstacle_path'
  | 'mind_body_spirit'
  | 'challenge_support_growth';

export interface ThreeCardLayout {
  id: ThreeCardLayoutId;
  labelEn: string;
  labelFr: string;
  positions: {
    en: [string, string, string];
    fr: [string, string, string];
  };
}

export interface ThreeCardCategoryConfig {
  id: ThreeCardCategory;
  labelEn: string;
  labelFr: string;
  iconName: string;
  layouts: ThreeCardLayoutId[];
  defaultLayout: ThreeCardLayoutId;
}

export interface ThreeCardQuestion {
  id: string;
  textEn: string;
  textFr: string;
}

// Layout definitions
export const THREE_CARD_LAYOUTS: Record<ThreeCardLayoutId, ThreeCardLayout> = {
  past_present_future: {
    id: 'past_present_future',
    labelEn: 'Past → Present → Future',
    labelFr: 'Passé → Présent → Futur',
    positions: {
      en: ['Past', 'Present', 'Future'],
      fr: ['Passé', 'Présent', 'Futur'],
    },
  },
  you_them_connection: {
    id: 'you_them_connection',
    labelEn: 'You → Them → Connection',
    labelFr: 'Vous → Eux → Connexion',
    positions: {
      en: ['You', 'Them', 'The Connection'],
      fr: ['Vous', 'Eux', 'La Connexion'],
    },
  },
  situation_action_outcome: {
    id: 'situation_action_outcome',
    labelEn: 'Situation → Action → Outcome',
    labelFr: 'Situation → Action → Résultat',
    positions: {
      en: ['Situation', 'Action', 'Outcome'],
      fr: ['Situation', 'Action', 'Résultat'],
    },
  },
  option_a_b_guidance: {
    id: 'option_a_b_guidance',
    labelEn: 'Option A → Option B → Guidance',
    labelFr: 'Option A → Option B → Conseil',
    positions: {
      en: ['Option A', 'Option B', 'Guidance'],
      fr: ['Option A', 'Option B', 'Conseil'],
    },
  },
  situation_obstacle_path: {
    id: 'situation_obstacle_path',
    labelEn: 'Situation → Obstacle → Path Forward',
    labelFr: 'Situation → Obstacle → Voie à Suivre',
    positions: {
      en: ['Situation', 'Obstacle', 'Path Forward'],
      fr: ['Situation', 'Obstacle', 'Voie à Suivre'],
    },
  },
  mind_body_spirit: {
    id: 'mind_body_spirit',
    labelEn: 'Mind → Body → Spirit',
    labelFr: 'Esprit → Corps → Âme',
    positions: {
      en: ['Mind', 'Body', 'Spirit'],
      fr: ['Esprit', 'Corps', 'Âme'],
    },
  },
  challenge_support_growth: {
    id: 'challenge_support_growth',
    labelEn: 'Challenge → Support → Growth',
    labelFr: 'Défi → Soutien → Croissance',
    positions: {
      en: ['Challenge', 'Support', 'Growth'],
      fr: ['Défi', 'Soutien', 'Croissance'],
    },
  },
};

// Category configurations
export const THREE_CARD_CATEGORIES: ThreeCardCategoryConfig[] = [
  {
    id: 'general',
    labelEn: 'General Guidance',
    labelFr: 'Guidance Générale',
    iconName: 'Sparkles',
    layouts: ['past_present_future'],
    defaultLayout: 'past_present_future',
  },
  {
    id: 'love',
    labelEn: 'Love & Relationships',
    labelFr: 'Amour & Relations',
    iconName: 'Heart',
    layouts: ['you_them_connection'],
    defaultLayout: 'you_them_connection',
  },
  {
    id: 'career',
    labelEn: 'Career & Purpose',
    labelFr: 'Carrière & Vocation',
    iconName: 'Briefcase',
    layouts: ['situation_action_outcome'],
    defaultLayout: 'situation_action_outcome',
  },
  {
    id: 'decision',
    labelEn: 'Decision-Making',
    labelFr: 'Prise de Décision',
    iconName: 'Scale',
    layouts: ['option_a_b_guidance', 'situation_obstacle_path'],
    defaultLayout: 'option_a_b_guidance',
  },
  {
    id: 'healing',
    labelEn: 'Healing & Growth',
    labelFr: 'Guérison & Croissance',
    iconName: 'Leaf',
    layouts: ['mind_body_spirit', 'challenge_support_growth'],
    defaultLayout: 'mind_body_spirit',
  },
];

// Questions per category (same questions work for all layouts within a category)
export const THREE_CARD_QUESTIONS: Record<ThreeCardCategory, ThreeCardQuestion[]> = {
  general: [
    { id: '3gen1', textEn: 'What do I most need to understand about this situation right now?', textFr: 'Que dois-je comprendre de cette situation en ce moment?' },
    { id: '3gen2', textEn: 'What energy is surrounding this issue?', textFr: 'Quelle énergie entoure cette situation?' },
    { id: '3gen3', textEn: 'What is being asked of me at this time?', textFr: "Qu'est-ce qui m'est demandé en ce moment?" },
    { id: '3gen4', textEn: 'What am I not seeing clearly?', textFr: 'Que ne vois-je pas clairement?' },
    { id: '3gen5', textEn: 'What would support my highest good in this situation?', textFr: "Qu'est-ce qui soutiendrait mon plus grand bien dans cette situation?" },
  ],
  love: [
    { id: '3love1', textEn: 'What is the deeper dynamic between me and this person?', textFr: 'Quelle est la dynamique profonde entre cette personne et moi?' },
    { id: '3love2', textEn: 'What can I learn from this connection?', textFr: 'Que puis-je apprendre de cette connexion?' },
    { id: '3love3', textEn: 'What role do I play in the current state of this relationship?', textFr: "Quel rôle je joue dans l'état actuel de cette relation?" },
    { id: '3love4', textEn: 'What would help me move forward in a healthy way?', textFr: "Qu'est-ce qui m'aiderait à avancer sainement?" },
    { id: '3love5', textEn: 'What is this relationship teaching me about myself?', textFr: "Que m'apprend cette relation sur moi-même?" },
  ],
  career: [
    { id: '3car1', textEn: 'What direction is most aligned with me right now?', textFr: 'Quelle direction est la plus alignée avec moi en ce moment?' },
    { id: '3car2', textEn: 'What strengths should I be leaning into at work?', textFr: "Sur quelles forces devrais-je m'appuyer au travail?" },
    { id: '3car3', textEn: 'What is blocking my progress, and how can I address it?', textFr: "Qu'est-ce qui bloque ma progression et comment y remédier?" },
    { id: '3car4', textEn: 'What opportunities am I overlooking?', textFr: 'Quelles opportunités est-ce que je néglige?' },
    { id: '3car5', textEn: 'What would success look like for me in this phase of my career?', textFr: 'À quoi ressemblerait le succès dans cette phase de ma carrière?' },
  ],
  decision: [
    { id: '3dec1', textEn: 'What are the key factors I should consider before deciding?', textFr: 'Quels sont les facteurs clés à considérer avant de décider?' },
    { id: '3dec2', textEn: 'What is the potential outcome if I choose this path?', textFr: 'Quel est le résultat potentiel si je choisis cette voie?' },
    { id: '3dec3', textEn: 'What fears or beliefs are influencing my choice?', textFr: 'Quelles peurs ou croyances influencent mon choix?' },
    { id: '3dec4', textEn: 'What would help me feel more confident in my decision?', textFr: "Qu'est-ce qui m'aiderait à me sentir plus confiant dans ma décision?" },
    { id: '3dec5', textEn: 'What is the long-term lesson connected to this choice?', textFr: 'Quelle est la leçon à long terme liée à ce choix?' },
  ],
  healing: [
    { id: '3heal1', textEn: 'What needs healing or attention within me right now?', textFr: "Qu'est-ce qui a besoin de guérison ou d'attention en moi maintenant?" },
    { id: '3heal2', textEn: 'What pattern am I being asked to release?', textFr: 'Quel schéma suis-je invité à libérer?' },
    { id: '3heal3', textEn: 'What would help me feel more balanced and grounded?', textFr: "Qu'est-ce qui m'aiderait à me sentir plus équilibré et ancré?" },
    { id: '3heal4', textEn: 'What inner strength can I draw on?', textFr: "Sur quelle force intérieure puis-je m'appuyer?" },
    { id: '3heal5', textEn: 'How can I best support my own growth at this time?', textFr: 'Comment puis-je soutenir ma propre croissance en ce moment?' },
  ],
};

// Helper text for custom questions
export const THREE_CARD_CUSTOM_QUESTION_HELPER = {
  en: 'Open-ended questions work best. Try "What can I learn from..." or "What do I need to understand about..."',
  fr: 'Les questions ouvertes fonctionnent mieux. Essayez "Que puis-je apprendre de..." ou "Que dois-je comprendre de..."',
};

// Helper to get category config by id
export function getThreeCardCategory(id: ThreeCardCategory): ThreeCardCategoryConfig | undefined {
  return THREE_CARD_CATEGORIES.find(c => c.id === id);
}

// Helper to check if category has multiple layouts
export function categoryHasMultipleLayouts(categoryId: ThreeCardCategory): boolean {
  const category = getThreeCardCategory(categoryId);
  return category ? category.layouts.length > 1 : false;
}
```

**Step 2: Verify file was created correctly**

Run: `cat constants/threeCardLayouts.ts | head -50`

**Step 3: Commit**

```bash
git add constants/threeCardLayouts.ts
git commit -m "feat: add threeCardLayouts constants for 3-card intro phase"
```

---

### Task 2: Create LayoutSelector component

**Files:**
- Create: `components/reading/LayoutSelector.tsx`

**Step 1: Create the component**

```typescript
// components/reading/LayoutSelector.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  THREE_CARD_LAYOUTS,
  ThreeCardLayoutId,
} from '../../constants/threeCardLayouts';

interface LayoutSelectorProps {
  language: 'en' | 'fr';
  layouts: ThreeCardLayoutId[];
  selectedLayout: ThreeCardLayoutId;
  onLayoutSelect: (layoutId: ThreeCardLayoutId) => void;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  language,
  layouts,
  selectedLayout,
  onLayoutSelect,
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        {language === 'en' ? 'Choose Your Layout' : 'Choisissez Votre Disposition'}
      </label>
      <div className="space-y-2">
        {layouts.map((layoutId) => {
          const layout = THREE_CARD_LAYOUTS[layoutId];
          const isSelected = selectedLayout === layoutId;
          const positions = layout.positions[language];

          return (
            <button
              key={layoutId}
              onClick={() => onLayoutSelect(layoutId)}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-500/40'
                  : 'bg-slate-800/50 border-transparent hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Radio indicator + Label */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-cyan-400' : 'border-slate-600'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-cyan-400"
                    />
                  )}
                </div>
                <span className={`text-sm font-medium ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`}>
                  {language === 'en' ? layout.labelEn : layout.labelFr}
                </span>
              </div>

              {/* Visual card positions */}
              <div className="flex items-center justify-center gap-2 ml-7">
                {positions.map((position, idx) => (
                  <React.Fragment key={idx}>
                    <div
                      className={`flex flex-col items-center ${
                        isSelected ? 'text-cyan-300' : 'text-slate-500'
                      }`}
                    >
                      <div
                        className={`w-8 h-12 rounded border-2 ${
                          isSelected
                            ? 'border-cyan-500/60 bg-cyan-500/10'
                            : 'border-slate-600 bg-slate-800/50'
                        }`}
                      />
                      <span className="text-[10px] mt-1 text-center max-w-[50px] leading-tight">
                        {position}
                      </span>
                    </div>
                    {idx < positions.length - 1 && (
                      <span className={`text-xs ${isSelected ? 'text-cyan-500/60' : 'text-slate-600'}`}>
                        →
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LayoutSelector;
```

**Step 2: Export from index**

Add to `components/reading/index.ts`:
```typescript
export { default as LayoutSelector } from './LayoutSelector';
```

**Step 3: Commit**

```bash
git add components/reading/LayoutSelector.tsx components/reading/index.ts
git commit -m "feat: add LayoutSelector component for 3-card layout choice"
```

---

### Task 3: Create ThreeCardQuestionSelector component

**Files:**
- Create: `components/reading/phases/ThreeCardQuestionSelector.tsx`

**Step 1: Create the component (mirrors SingleCardQuestionSelector)**

```typescript
// components/reading/phases/ThreeCardQuestionSelector.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Heart, Briefcase, Scale, Leaf, PenLine } from 'lucide-react';
import {
  THREE_CARD_CATEGORIES,
  THREE_CARD_QUESTIONS,
  THREE_CARD_CUSTOM_QUESTION_HELPER,
  ThreeCardCategory,
  ThreeCardLayoutId,
  categoryHasMultipleLayouts,
  getThreeCardCategory,
} from '../../../constants/threeCardLayouts';
import LayoutSelector from '../LayoutSelector';

interface ThreeCardQuestionSelectorProps {
  language: 'en' | 'fr';
  selectedCategory: ThreeCardCategory | null;
  selectedLayout: ThreeCardLayoutId | null;
  selectedQuestionId: string | null;
  customQuestion: string;
  isWritingOwn: boolean;
  onCategorySelect: (category: ThreeCardCategory) => void;
  onLayoutSelect: (layoutId: ThreeCardLayoutId) => void;
  onQuestionSelect: (questionId: string, questionText: string) => void;
  onCustomQuestionChange: (text: string) => void;
  onWriteOwn: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  Scale: <Scale className="w-4 h-4" />,
  Leaf: <Leaf className="w-4 h-4" />,
};

const ThreeCardQuestionSelector: React.FC<ThreeCardQuestionSelectorProps> = ({
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const questions = selectedCategory ? THREE_CARD_QUESTIONS[selectedCategory] : [];
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);
  const categoryConfig = selectedCategory ? getThreeCardCategory(selectedCategory) : null;
  const hasMultipleLayouts = selectedCategory ? categoryHasMultipleLayouts(selectedCategory) : false;

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {language === 'en' ? 'Choose a Theme' : 'Choisissez un Thème'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {THREE_CARD_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              <span className={selectedCategory === cat.id ? 'text-cyan-400' : 'text-slate-500'}>
                {ICON_MAP[cat.iconName]}
              </span>
              <span className="truncate">{language === 'en' ? cat.labelEn : cat.labelFr}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Layout Selection - Only for categories with multiple layouts */}
      <AnimatePresence>
        {selectedCategory && hasMultipleLayouts && categoryConfig && selectedLayout && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LayoutSelector
              language={language}
              layouts={categoryConfig.layouts}
              selectedLayout={selectedLayout}
              onLayoutSelect={onLayoutSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Selection - Show when category selected and not writing own */}
      <AnimatePresence>
        {selectedCategory && !isWritingOwn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'en' ? 'Select Your Question' : 'Sélectionnez Votre Question'}
            </label>

            {/* Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-950/60 border border-slate-700 rounded-lg text-left hover:border-cyan-500/50 transition-colors"
              >
                <span className={selectedQuestion ? 'text-white' : 'text-slate-500'}>
                  {selectedQuestion
                    ? (language === 'en' ? selectedQuestion.textEn : selectedQuestion.textFr)
                    : (language === 'en' ? 'Choose a question...' : 'Choisissez une question...')}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
                  >
                    {questions.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          onQuestionSelect(q.id, language === 'en' ? q.textEn : q.textFr);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-800 transition-colors ${
                          selectedQuestionId === q.id ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300'
                        }`}
                      >
                        {language === 'en' ? q.textEn : q.textFr}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Write your own option */}
            <button
              onClick={onWriteOwn}
              className="mt-3 flex items-center gap-2 text-sm text-amber-500/80 hover:text-amber-400 transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Or write your own question' : 'Ou écrivez votre propre question'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Question Input */}
      <AnimatePresence>
        {selectedCategory && isWritingOwn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'en' ? 'Your Question' : 'Votre Question'}
            </label>
            <textarea
              value={customQuestion}
              onChange={(e) => onCustomQuestionChange(e.target.value)}
              placeholder={language === 'en' ? 'What would you like guidance on?' : 'Sur quoi aimeriez-vous recevoir des conseils?'}
              rows={2}
              maxLength={500}
              className="w-full bg-slate-950/60 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 border border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/30 text-sm resize-none"
            />
            <div className="mt-2 flex items-start justify-between gap-4">
              <p className="text-xs text-slate-500 flex-1">
                {language === 'en' ? THREE_CARD_CUSTOM_QUESTION_HELPER.en : THREE_CARD_CUSTOM_QUESTION_HELPER.fr}
              </p>
              <span className="text-xs text-slate-500">{customQuestion.length}/500</span>
            </div>

            {/* Back to dropdown */}
            <button
              onClick={onWriteOwn}
              className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-400 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5 rotate-90" />
              <span>{language === 'en' ? 'Back to suggested questions' : 'Retour aux questions suggérées'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThreeCardQuestionSelector;
```

**Step 2: Export from phases index**

Add to `components/reading/phases/index.ts`:
```typescript
export { default as ThreeCardQuestionSelector } from './ThreeCardQuestionSelector';
```

**Step 3: Commit**

```bash
git add components/reading/phases/ThreeCardQuestionSelector.tsx components/reading/phases/index.ts
git commit -m "feat: add ThreeCardQuestionSelector component"
```

---

### Task 4: Create ThreeCardIntroPhase component

**Files:**
- Create: `components/reading/phases/ThreeCardIntroPhase.tsx`

**Step 1: Create the component (mirrors SingleCardIntroPhase)**

```typescript
// components/reading/phases/ThreeCardIntroPhase.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Check, AlertCircle, ChevronDown, Coins } from 'lucide-react';
import { SpreadConfig, InterpretationStyle } from '../../../types';
import Button from '../../Button';
import ThemedBackground from '../ThemedBackground';
import { SPREAD_THEMES } from '../SpreadThemes';
import ThreeCardQuestionSelector from './ThreeCardQuestionSelector';
import {
  ThreeCardCategory,
  ThreeCardLayoutId,
  THREE_CARD_LAYOUTS,
} from '../../../constants/threeCardLayouts';

interface ThreeCardIntroPhaseProps {
  spread: SpreadConfig;
  language: 'en' | 'fr';
  // Category, layout & question selection
  selectedCategory: ThreeCardCategory | null;
  selectedLayout: ThreeCardLayoutId | null;
  selectedQuestionId: string | null;
  customQuestion: string;
  isWritingOwn: boolean;
  onCategorySelect: (category: ThreeCardCategory) => void;
  onLayoutSelect: (layoutId: ThreeCardLayoutId) => void;
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

const ThreeCardIntroPhase: React.FC<ThreeCardIntroPhaseProps> = ({
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
  const theme = SPREAD_THEMES[spread.id];

  // Determine if we have a valid question to proceed
  const hasValidQuestion = selectedQuestionId !== null || (isWritingOwn && customQuestion.trim().length > 0);
  const canProceed = selectedCategory !== null && selectedLayout !== null && hasValidQuestion && credits >= totalCost;

  // Get layout label for display
  const layoutLabel = selectedLayout
    ? (language === 'en' ? THREE_CARD_LAYOUTS[selectedLayout].labelEn : THREE_CARD_LAYOUTS[selectedLayout].labelFr)
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
              {language === 'en' ? 'Three Card Spread' : 'Tirage Trois Cartes'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-heading text-white mb-1">
            {language === 'en' ? 'Deeper Insight' : 'Vision Approfondie'}
          </h2>
          <p className={`text-sm ${theme.textAccent} italic`}>
            {language === 'en' ? 'Three cards reveal the full picture' : 'Trois cartes révèlent le tableau complet'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-cyan-500/20 overflow-hidden">
          {/* Question Selection Section */}
          <div className="p-4 md:p-5">
            <ThreeCardQuestionSelector
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

            {/* Show selected layout as subtle label for single-layout categories */}
            {selectedCategory && selectedLayout && layoutLabel && (
              <div className="mt-3 text-xs text-slate-500 text-center">
                {language === 'en' ? 'Layout: ' : 'Disposition: '}
                <span className="text-slate-400">{layoutLabel}</span>
              </div>
            )}
          </div>

          {/* Advanced Options Toggle - Go Deeper */}
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
              <div className="flex items-center gap-1.5 text-cyan-300">
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

export default ThreeCardIntroPhase;
```

**Step 2: Export from phases index**

Add to `components/reading/phases/index.ts`:
```typescript
export { default as ThreeCardIntroPhase } from './ThreeCardIntroPhase';
```

**Step 3: Export from reading index**

Add to `components/reading/index.ts`:
```typescript
export { ThreeCardIntroPhase } from './phases';
```

**Step 4: Commit**

```bash
git add components/reading/phases/ThreeCardIntroPhase.tsx components/reading/phases/index.ts components/reading/index.ts
git commit -m "feat: add ThreeCardIntroPhase component"
```

---

### Task 5: Add 3-card state management to ActiveReading

**Files:**
- Modify: `components/ActiveReading.tsx`

**Step 1: Add imports at top of file (around line 10-25)**

Add these imports:
```typescript
import { ThreeCardCategory, ThreeCardLayoutId, getThreeCardCategory } from '../constants/threeCardLayouts';
```

And update the reading import:
```typescript
import {
  // ... existing imports
  ThreeCardIntroPhase,
} from './reading';
```

**Step 2: Add state variables (around line 150-160, after singleCard state)**

Add after `const [isWritingOwnQuestion, setIsWritingOwnQuestion] = useState(false);`:

```typescript
// Three card intro state
const [threeCardCategory, setThreeCardCategory] = useState<ThreeCardCategory | null>(null);
const [threeCardLayout, setThreeCardLayout] = useState<ThreeCardLayoutId | null>(null);
const [threeCardQuestionId, setThreeCardQuestionId] = useState<string | null>(null);
const [threeCardCustomQuestion, setThreeCardCustomQuestion] = useState('');
const [isWritingOwnThreeCard, setIsWritingOwnThreeCard] = useState(false);
```

**Step 3: Add handler functions (around line 365-380, after single card handlers)**

Add after `handleWriteOwnToggle`:

```typescript
// Three card handlers
const handleThreeCardCategorySelect = useCallback((category: ThreeCardCategory) => {
  setThreeCardCategory(category);
  setThreeCardQuestionId(null);
  // Auto-set layout to default for this category
  const categoryConfig = getThreeCardCategory(category);
  if (categoryConfig) {
    setThreeCardLayout(categoryConfig.defaultLayout);
  }
}, []);

const handleThreeCardLayoutSelect = useCallback((layoutId: ThreeCardLayoutId) => {
  setThreeCardLayout(layoutId);
}, []);

const handleThreeCardQuestionSelect = useCallback((questionId: string, questionText: string) => {
  setThreeCardQuestionId(questionId);
  handleQuestionChange({ target: { value: questionText } } as React.ChangeEvent<HTMLTextAreaElement>);
}, [handleQuestionChange]);

const handleThreeCardCustomQuestionChange = useCallback((text: string) => {
  setThreeCardCustomQuestion(text);
  handleQuestionChange({ target: { value: text } } as React.ChangeEvent<HTMLTextAreaElement>);
}, [handleQuestionChange]);

const handleThreeCardWriteOwnToggle = useCallback(() => {
  setIsWritingOwnThreeCard(prev => !prev);
  if (!isWritingOwnThreeCard) {
    setThreeCardQuestionId(null);
  }
}, [isWritingOwnThreeCard]);
```

**Step 4: Update renderPhaseContent to handle THREE_CARD (around line 594)**

After the `if (spread.id === SpreadType.SINGLE)` block, add:

```typescript
      // Use three card intro for three card spread
      if (spread.id === SpreadType.THREE_CARD) {
        return (
          <ThreeCardIntroPhase
            spread={spread}
            language={language}
            selectedCategory={threeCardCategory}
            selectedLayout={threeCardLayout}
            selectedQuestionId={threeCardQuestionId}
            customQuestion={threeCardCustomQuestion}
            isWritingOwn={isWritingOwnThreeCard}
            onCategorySelect={handleThreeCardCategorySelect}
            onLayoutSelect={handleThreeCardLayoutSelect}
            onQuestionSelect={handleThreeCardQuestionSelect}
            onCustomQuestionChange={handleThreeCardCustomQuestionChange}
            onWriteOwnToggle={handleThreeCardWriteOwnToggle}
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

**Step 5: Commit**

```bash
git add components/ActiveReading.tsx
git commit -m "feat: integrate ThreeCardIntroPhase into ActiveReading"
```

---

### Task 6: Add layout-specific prompt guidance to prompts.ts

**Files:**
- Modify: `server/src/shared/constants/prompts.ts`

**Step 1: Add 7 new layout guidance prompts (after SPREAD_GUIDANCE_THREE_CARD around line 92)**

Add these new prompt definitions:

```typescript
  {
    key: 'SPREAD_GUIDANCE_THREE_CARD_PAST_PRESENT_FUTURE',
    description: 'Past-Present-Future 3-card layout guidance',
    category: 'tarot',
    variables: [],
    defaultValue:
      'This Past-Present-Future spread reveals the timeline of your situation. The first card shows influences from your past that have shaped where you are. The second card reflects your current circumstances and energy. The third card illuminates the direction you are heading if you continue on this path.',
  },

  {
    key: 'SPREAD_GUIDANCE_THREE_CARD_YOU_THEM_CONNECTION',
    description: 'You-Them-Connection 3-card layout guidance',
    category: 'tarot',
    variables: [],
    defaultValue:
      'This relationship spread explores the dynamic between two people. The first card reflects your energy, feelings, and role in this connection. The second card reveals the other person\'s energy and perspective. The third card shows the nature of the bond itself—what exists between you.',
  },

  {
    key: 'SPREAD_GUIDANCE_THREE_CARD_SITUATION_ACTION_OUTCOME',
    description: 'Situation-Action-Outcome 3-card layout guidance',
    category: 'tarot',
    variables: [],
    defaultValue:
      'This career spread provides practical guidance. The first card shows your current professional situation and its energy. The second card suggests what action or approach is called for. The third card reveals the likely outcome of taking that approach.',
  },

  {
    key: 'SPREAD_GUIDANCE_THREE_CARD_OPTION_A_B_GUIDANCE',
    description: 'Option A-Option B-Guidance 3-card layout guidance',
    category: 'tarot',
    variables: [],
    defaultValue:
      'This decision spread illuminates two paths. The first card shows the energy and potential of one option. The second card shows the energy and potential of the other option. The third card offers guidance on what to consider as you choose.',
  },

  {
    key: 'SPREAD_GUIDANCE_THREE_CARD_SITUATION_OBSTACLE_PATH',
    description: 'Situation-Obstacle-Path Forward 3-card layout guidance',
    category: 'tarot',
    variables: [],
    defaultValue:
      'This clarity spread helps when you feel stuck. The first card reveals the true nature of your situation. The second card shows what is blocking you or creating confusion. The third card illuminates how to move forward with clarity.',
  },

  {
    key: 'SPREAD_GUIDANCE_THREE_CARD_MIND_BODY_SPIRIT',
    description: 'Mind-Body-Spirit 3-card layout guidance',
    category: 'tarot',
    variables: [],
    defaultValue:
      'This holistic spread explores your whole being. The first card reveals what is happening in your thoughts and mental state. The second card shows what your physical self or material circumstances need. The third card illuminates your spiritual state and soul lessons.',
  },

  {
    key: 'SPREAD_GUIDANCE_THREE_CARD_CHALLENGE_SUPPORT_GROWTH',
    description: 'Challenge-Support-Growth 3-card layout guidance',
    category: 'tarot',
    variables: [],
    defaultValue:
      'This healing spread guides your inner work. The first card acknowledges what you are facing or struggling with. The second card reveals what can support and comfort you through this. The third card shows the growth and wisdom that can emerge from this experience.',
  },
```

**Step 2: Commit**

```bash
git add server/src/shared/constants/prompts.ts
git commit -m "feat: add layout-specific prompt guidance for 3-card spreads"
```

---

### Task 7: Update AI route to use dynamic layout guidance

**Files:**
- Modify: `server/src/routes/ai.ts`

**Step 1: Find where spread guidance is selected and add layoutId handling**

Search for `SPREAD_GUIDANCE` in the file and update the logic to check for `layoutId` in the request body.

When `spreadType` is `THREE_CARD` and `layoutId` is provided, use the layout-specific guidance key:
```typescript
// Example logic:
let spreadGuidanceKey = `SPREAD_GUIDANCE_${spreadType.toUpperCase()}`;

// For THREE_CARD with layout, use layout-specific guidance
if (spreadType.toUpperCase() === 'THREE_CARD' && layoutId) {
  const layoutKey = layoutId.toUpperCase();
  spreadGuidanceKey = `SPREAD_GUIDANCE_THREE_CARD_${layoutKey}`;
}
```

**Step 2: Ensure the request schema accepts `layoutId`**

Add `layoutId` to the request validation:
```typescript
layoutId: z.string().optional(),
```

**Step 3: Pass `positionMeanings` from layout to the prompt**

When layoutId is provided, extract position meanings and include them in the card descriptions.

**Step 4: Commit**

```bash
git add server/src/routes/ai.ts
git commit -m "feat: support layout-specific guidance in AI route for 3-card readings"
```

---

### Task 8: Update API service to send layoutId

**Files:**
- Modify: `services/apiService.ts`

**Step 1: Update generateReading function signature**

Add `layoutId` parameter:
```typescript
export async function generateReading(
  token: string,
  data: {
    spreadType: string;
    interpretationStyle: string;
    question?: string;
    cards: Array<{ name: string; isReversed: boolean; position: number }>;
    language: 'en' | 'fr';
    category?: string;
    layoutId?: string;  // ADD
  }
): Promise<ReadingResult> {
```

**Step 2: Commit**

```bash
git add services/apiService.ts
git commit -m "feat: add layoutId parameter to generateReading API call"
```

---

### Task 9: Pass layoutId from ActiveReading to API

**Files:**
- Modify: `components/ActiveReading.tsx`

**Step 1: Update generateReading calls to include threeCardLayout**

Find the `generateReading` calls (around lines 317 and 453) and add `layoutId`:

```typescript
layoutId: spread.id === SpreadType.THREE_CARD ? threeCardLayout ?? undefined : undefined,
```

**Step 2: Add threeCardLayout to dependency arrays**

Update the dependency arrays for the callbacks that use generateReading.

**Step 3: Commit**

```bash
git add components/ActiveReading.tsx
git commit -m "feat: pass layoutId to generateReading for 3-card spreads"
```

---

### Task 10: Manual testing verification

**Step 1: Start development servers**

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
npm run dev
```

**Step 2: Test General category (single layout)**

1. Navigate to Three Card spread
2. Select "General Guidance" category
3. Verify Past → Present → Future layout shows as label (no radio buttons)
4. Select a question from dropdown
5. Click "Shuffle the Deck"
6. Verify reading generates with correct position meanings

**Step 3: Test Decision category (multiple layouts)**

1. Navigate to Three Card spread
2. Select "Decision-Making" category
3. Verify two layout options appear as radio buttons
4. Select "Situation → Obstacle → Path Forward"
5. Verify visual shows correct card positions
6. Select a question, shuffle, verify reading

**Step 4: Test Healing category (multiple layouts)**

1. Select "Healing & Growth"
2. Verify Mind → Body → Spirit and Challenge → Support → Growth options
3. Test both layouts work correctly

**Step 5: Test custom question**

1. Select any category
2. Click "Or write your own question"
3. Type a custom question
4. Verify can shuffle and generate reading

**Step 6: Test advanced styles**

1. Expand "Go Deeper"
2. Select Spiritual style
3. Verify +1 credit indicator shows
4. Complete reading, verify style appears

---

## Files Modified Summary

| File | Action | Description |
|------|--------|-------------|
| `constants/threeCardLayouts.ts` | Create | Categories, layouts, questions, French translations |
| `components/reading/LayoutSelector.tsx` | Create | Radio buttons with visual card positions |
| `components/reading/phases/ThreeCardQuestionSelector.tsx` | Create | Category chips + layout selector + question dropdown |
| `components/reading/phases/ThreeCardIntroPhase.tsx` | Create | Main intro phase component |
| `components/reading/phases/index.ts` | Modify | Export new components |
| `components/reading/index.ts` | Modify | Export new components |
| `components/ActiveReading.tsx` | Modify | State, handlers, routing to ThreeCardIntroPhase |
| `server/src/shared/constants/prompts.ts` | Modify | Add 7 layout guidance texts |
| `server/src/routes/ai.ts` | Modify | Use dynamic layout in prompt building |
| `services/apiService.ts` | Modify | Add layoutId parameter |

---

## Cost

Remains **3 credits** for all 3-card readings (no change to pricing).

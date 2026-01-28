# Single Card Oracle Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the single card spread into a daily oracle guidance experience with category-based questions and themed interpretations.

**Architecture:** The single card spread will have a distinct UX flow from other spreads. When `spread.id === SpreadType.SINGLE`, the QuestionIntroPhase shows category selection and curated questions instead of the generic textarea. Backend uses a dedicated prompt template for single card readings.

**Tech Stack:** React, TypeScript, Tailwind CSS, Express, Zod, Prisma

---

## Task 1: Add Question Bank Constants

**Files:**
- Create: `constants/singleCardQuestions.ts`
- Modify: `constants.ts:75-83` (position meaning)

**Step 1: Create the question bank file**

```typescript
// constants/singleCardQuestions.ts

export type SingleCardCategory =
  | 'general'
  | 'love'
  | 'career'
  | 'decision'
  | 'healing';

export interface CategoryConfig {
  id: SingleCardCategory;
  labelEn: string;
  labelFr: string;
  iconName: string; // Lucide icon name
}

export interface CuratedQuestion {
  id: string;
  textEn: string;
  textFr: string;
}

export const SINGLE_CARD_CATEGORIES: CategoryConfig[] = [
  { id: 'general', labelEn: 'General Guidance', labelFr: 'Guidance Générale', iconName: 'Sparkles' },
  { id: 'love', labelEn: 'Love & Relationships', labelFr: 'Amour & Relations', iconName: 'Heart' },
  { id: 'career', labelEn: 'Career & Purpose', labelFr: 'Carrière & Vocation', iconName: 'Briefcase' },
  { id: 'decision', labelEn: 'Decision-Making', labelFr: 'Prise de Décision', iconName: 'Scale' },
  { id: 'healing', labelEn: 'Healing & Growth', labelFr: 'Guérison & Croissance', iconName: 'Leaf' },
];

export const SINGLE_CARD_QUESTIONS: Record<SingleCardCategory, CuratedQuestion[]> = {
  general: [
    { id: 'gen1', textEn: 'What do I most need to understand about this situation right now?', textFr: 'Que dois-je comprendre de cette situation en ce moment?' },
    { id: 'gen2', textEn: 'What energy is surrounding this issue?', textFr: 'Quelle énergie entoure cette situation?' },
    { id: 'gen3', textEn: 'What is being asked of me at this time?', textFr: 'Qu\'est-ce qui m\'est demandé en ce moment?' },
    { id: 'gen4', textEn: 'What am I not seeing clearly?', textFr: 'Que ne vois-je pas clairement?' },
    { id: 'gen5', textEn: 'What would support my highest good in this situation?', textFr: 'Qu\'est-ce qui soutiendrait mon plus grand bien dans cette situation?' },
  ],
  love: [
    { id: 'love1', textEn: 'What is the deeper dynamic between me and this person?', textFr: 'Quelle est la dynamique profonde entre cette personne et moi?' },
    { id: 'love2', textEn: 'What can I learn from this connection?', textFr: 'Que puis-je apprendre de cette connexion?' },
    { id: 'love3', textEn: 'What role do I play in the current state of this relationship?', textFr: 'Quel rôle je joue dans l\'état actuel de cette relation?' },
    { id: 'love4', textEn: 'What would help me move forward in a healthy way?', textFr: 'Qu\'est-ce qui m\'aiderait à avancer sainement?' },
    { id: 'love5', textEn: 'What is this relationship teaching me about myself?', textFr: 'Que m\'apprend cette relation sur moi-même?' },
  ],
  career: [
    { id: 'car1', textEn: 'What direction is most aligned with me right now?', textFr: 'Quelle direction est la plus alignée avec moi en ce moment?' },
    { id: 'car2', textEn: 'What strengths should I be leaning into at work?', textFr: 'Sur quelles forces devrais-je m\'appuyer au travail?' },
    { id: 'car3', textEn: 'What is blocking my progress, and how can I address it?', textFr: 'Qu\'est-ce qui bloque ma progression et comment y remédier?' },
    { id: 'car4', textEn: 'What opportunities am I overlooking?', textFr: 'Quelles opportunités est-ce que je néglige?' },
    { id: 'car5', textEn: 'What would success look like for me in this phase of my career?', textFr: 'À quoi ressemblerait le succès dans cette phase de ma carrière?' },
  ],
  decision: [
    { id: 'dec1', textEn: 'What are the key factors I should consider before deciding?', textFr: 'Quels sont les facteurs clés à considérer avant de décider?' },
    { id: 'dec2', textEn: 'What is the potential outcome if I choose this path?', textFr: 'Quel est le résultat potentiel si je choisis cette voie?' },
    { id: 'dec3', textEn: 'What fears or beliefs are influencing my choice?', textFr: 'Quelles peurs ou croyances influencent mon choix?' },
    { id: 'dec4', textEn: 'What would help me feel more confident in my decision?', textFr: 'Qu\'est-ce qui m\'aiderait à me sentir plus confiant dans ma décision?' },
    { id: 'dec5', textEn: 'What is the long-term lesson connected to this choice?', textFr: 'Quelle est la leçon à long terme liée à ce choix?' },
  ],
  healing: [
    { id: 'heal1', textEn: 'What needs healing or attention within me right now?', textFr: 'Qu\'est-ce qui a besoin de guérison ou d\'attention en moi maintenant?' },
    { id: 'heal2', textEn: 'What pattern am I being asked to release?', textFr: 'Quel schéma suis-je invité à libérer?' },
    { id: 'heal3', textEn: 'What would help me feel more balanced and grounded?', textFr: 'Qu\'est-ce qui m\'aiderait à me sentir plus équilibré et ancré?' },
    { id: 'heal4', textEn: 'What inner strength can I draw on?', textFr: 'Sur quelle force intérieure puis-je m\'appuyer?' },
    { id: 'heal5', textEn: 'How can I best support my own growth at this time?', textFr: 'Comment puis-je soutenir ma propre croissance en ce moment?' },
  ],
};

// Helper text shown when user chooses to write their own question
export const CUSTOM_QUESTION_HELPER = {
  en: 'Open-ended questions work best. Try "What can I learn from..." or "What do I need to understand about..."',
  fr: 'Les questions ouvertes fonctionnent mieux. Essayez "Que puis-je apprendre de..." ou "Que dois-je comprendre de..."',
};

// Link to blog article about asking good questions
export const QUESTION_GUIDE_LINK = '/blog/how-to-ask-good-tarot-questions';
```

**Step 2: Update position meaning in constants.ts**

Change line 81-82 from:
```typescript
positionMeaningsEn: ["The Answer"],
positionMeaningsFr: ["La Réponse"]
```
To:
```typescript
positionMeaningsEn: ["Today's Guidance"],
positionMeaningsFr: ["Guidance du Jour"]
```

**Step 3: Commit**

```bash
git add constants/singleCardQuestions.ts constants.ts
git commit -m "feat(single-card): add question bank and update position meaning"
```

---

## Task 2: Create Single Card Question Selector Component

**Files:**
- Create: `components/reading/phases/SingleCardQuestionSelector.tsx`

**Step 1: Create the component**

```typescript
// components/reading/phases/SingleCardQuestionSelector.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, Sparkles, Heart, Briefcase, Scale, Leaf, PenLine } from 'lucide-react';
import {
  SINGLE_CARD_CATEGORIES,
  SINGLE_CARD_QUESTIONS,
  CUSTOM_QUESTION_HELPER,
  QUESTION_GUIDE_LINK,
  SingleCardCategory,
} from '../../../constants/singleCardQuestions';

interface SingleCardQuestionSelectorProps {
  language: 'en' | 'fr';
  selectedCategory: SingleCardCategory | null;
  selectedQuestionId: string | null;
  customQuestion: string;
  onCategorySelect: (category: SingleCardCategory) => void;
  onQuestionSelect: (questionId: string, questionText: string) => void;
  onCustomQuestionChange: (text: string) => void;
  onWriteOwn: () => void;
  isWritingOwn: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  Scale: <Scale className="w-4 h-4" />,
  Leaf: <Leaf className="w-4 h-4" />,
};

const SingleCardQuestionSelector: React.FC<SingleCardQuestionSelectorProps> = ({
  language,
  selectedCategory,
  selectedQuestionId,
  customQuestion,
  onCategorySelect,
  onQuestionSelect,
  onCustomQuestionChange,
  onWriteOwn,
  isWritingOwn,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const questions = selectedCategory ? SINGLE_CARD_QUESTIONS[selectedCategory] : [];
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {language === 'en' ? 'Choose a Theme' : 'Choisissez un Thème'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SINGLE_CARD_CATEGORIES.map((cat) => (
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

      {/* Question Selection - Only show when category selected */}
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
                {language === 'en' ? CUSTOM_QUESTION_HELPER.en : CUSTOM_QUESTION_HELPER.fr}
              </p>
              <span className="text-xs text-slate-500">{customQuestion.length}/500</span>
            </div>
            <a
              href={QUESTION_GUIDE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-500/70 hover:text-cyan-400 transition-colors"
            >
              {language === 'en' ? 'How to ask good questions' : 'Comment poser de bonnes questions'}
              <ExternalLink className="w-3 h-3" />
            </a>

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

export default SingleCardQuestionSelector;
```

**Step 2: Commit**

```bash
git add components/reading/phases/SingleCardQuestionSelector.tsx
git commit -m "feat(single-card): add question selector component"
```

---

## Task 3: Create Single Card Intro Phase Component

**Files:**
- Create: `components/reading/phases/SingleCardIntroPhase.tsx`
- Modify: `components/reading/phases/index.ts`

**Step 1: Create the single card intro phase**

```typescript
// components/reading/phases/SingleCardIntroPhase.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Check, AlertCircle, ChevronDown, Coins } from 'lucide-react';
import { SpreadConfig, InterpretationStyle, SpreadType } from '../../../types';
import Button from '../../Button';
import ThemedBackground from '../ThemedBackground';
import { SPREAD_THEMES } from '../SpreadThemes';
import SingleCardQuestionSelector from './SingleCardQuestionSelector';
import { SingleCardCategory } from '../../../constants/singleCardQuestions';

interface SingleCardIntroPhaseProps {
  spread: SpreadConfig;
  language: 'en' | 'fr';
  // Category & question selection
  selectedCategory: SingleCardCategory | null;
  selectedQuestionId: string | null;
  customQuestion: string;
  isWritingOwn: boolean;
  onCategorySelect: (category: SingleCardCategory) => void;
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

const SingleCardIntroPhase: React.FC<SingleCardIntroPhaseProps> = ({
  spread,
  language,
  selectedCategory,
  selectedQuestionId,
  customQuestion,
  isWritingOwn,
  onCategorySelect,
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
  const canProceed = selectedCategory !== null && hasValidQuestion && credits >= totalCost;

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
              {language === 'en' ? 'Daily Oracle' : 'Oracle du Jour'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-heading text-white mb-1">
            {language === 'en' ? "Today's Guidance" : 'Guidance du Jour'}
          </h2>
          <p className={`text-sm ${theme.textAccent} italic`}>
            {language === 'en' ? 'Draw a card to illuminate your path' : 'Tirez une carte pour éclairer votre chemin'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-cyan-500/20 overflow-hidden">
          {/* Question Selection Section */}
          <div className="p-4 md:p-5">
            <SingleCardQuestionSelector
              language={language}
              selectedCategory={selectedCategory}
              selectedQuestionId={selectedQuestionId}
              customQuestion={customQuestion}
              onCategorySelect={onCategorySelect}
              onQuestionSelect={onQuestionSelect}
              onCustomQuestionChange={onCustomQuestionChange}
              onWriteOwn={onWriteOwnToggle}
              isWritingOwn={isWritingOwn}
            />
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
                {isAdvanced && (
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
              {language === 'en' ? 'Draw Your Card' : 'Tirez Votre Carte'}
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

export default SingleCardIntroPhase;
```

**Step 2: Export from phases/index.ts**

Add to `components/reading/phases/index.ts`:
```typescript
export { default as SingleCardIntroPhase } from './SingleCardIntroPhase';
export { default as SingleCardQuestionSelector } from './SingleCardQuestionSelector';
```

**Step 3: Commit**

```bash
git add components/reading/phases/SingleCardIntroPhase.tsx components/reading/phases/index.ts
git commit -m "feat(single-card): add single card intro phase component"
```

---

## Task 4: Add Backend Single Card Prompt

**Files:**
- Modify: `server/src/shared/constants/prompts.ts`

**Step 1: Add PROMPT_TAROT_BASE_SINGLE to prompts array**

Add after SPREAD_GUIDANCE_CELTIC_CROSS (around line 128):

```typescript
  {
    key: 'PROMPT_TAROT_BASE_SINGLE',
    description: 'Single card oracle reading - daily guidance focused',
    category: 'tarot',
    isBase: true,
    variables: [
      'language',
      'category',
      'question',
      'cardDescription',
      'styleInstructions',
      'reframingGuidance',
    ],
    defaultValue: `You are a mystical, wise, and empathetic Tarot Reader offering daily oracle guidance.

Task: Provide an insightful single card reading as daily guidance.
Language: {{language}}
Category: {{category}}

User's Intention: "{{question}}"

Card Drawn:
{{cardDescription}}

Important Guidelines:
- Interpret the card as drawn (upright or reversed, not both)
- This is reflective guidance, not predictive divination
- Offer awareness and insight, not prescriptive advice
- Theme your guidance to the user's chosen category ({{category}})
{{reframingGuidance}}

Structure your response with these sections:

1. **The Card's Energy** — Describe what this card represents: its core symbolism, archetypes, and themes as they appear in this orientation. Ground the seeker in the card's essence before applying it to their situation. Write 150-200 words.

2. **Today's Guidance** — Connect the card's energy to their intention and chosen category. What themes might arise today? What should they be aware of or open to? Speak to their situation without telling them what to do. Let the card illuminate rather than instruct. Write 150-200 words.

{{styleInstructions}}

IMPORTANT FORMATTING RULES:
- Write in flowing, natural prose paragraphs
- Use **bold** only for card name and section headings
- DO NOT use tables, grids, or bullet points
- DO NOT use emojis or icons
- Write as a mystical oracle would speak, not as an AI assistant

Tone: Mystical, reflective, warm, and gently empowering.`,
  },

  {
    key: 'SINGLE_CARD_STYLE_SPIRITUAL',
    description: 'Spiritual perspective section for single card reading',
    category: 'tarot',
    variables: [],
    defaultValue: `3. **Spiritual Perspective** — Explore the soul lessons and higher purpose this card offers. What spiritual growth or awakening does it point toward? What invitation does the universe extend through this card? Write 80-100 words.`,
  },

  {
    key: 'SINGLE_CARD_STYLE_NUMEROLOGY',
    description: 'Numerology section for single card reading',
    category: 'tarot',
    variables: ['cardNumber'],
    defaultValue: `3. **Numerological Insight** — The number {{cardNumber}} carries meaning. Explore cycles, timing, and the numerological significance present in this card. What does this number reveal about the energy and timing of your situation? Write 80-100 words.`,
  },

  {
    key: 'SINGLE_CARD_STYLE_ELEMENTAL',
    description: 'Elemental section for single card reading',
    category: 'tarot',
    variables: ['element'],
    defaultValue: `3. **Elemental Energy** — This card carries {{element}} energy. How can you work with this elemental quality today? What does this element ask you to embrace or balance? Write 80-100 words.`,
  },

  {
    key: 'SINGLE_CARD_STYLE_PSYCHO',
    description: 'Psycho-emotional section for single card reading',
    category: 'tarot',
    variables: [],
    defaultValue: `3. **Psycho-Emotional Reflection** — What inner patterns, emotional themes, or psychological insights does this card reveal? What might be surfacing from within that deserves your attention? Write 80-100 words.`,
  },

  {
    key: 'SINGLE_CARD_REFRAMING',
    description: 'Guidance for reframing yes/no questions',
    category: 'tarot',
    variables: [],
    defaultValue: `If the user's question appears to be yes/no or blame-focused, gently acknowledge their concern while offering a more empowering perspective. Do not lecture — simply weave a reframe naturally into your guidance.`,
  },
```

**Step 2: Commit**

```bash
git add server/src/shared/constants/prompts.ts
git commit -m "feat(single-card): add dedicated single card prompt templates"
```

---

## Task 5: Update Prompt Service for Single Card

**Files:**
- Modify: `server/src/services/promptService.ts`

**Step 1: Add getSingleCardReadingPrompt function**

Add after `getTarotReadingPrompt` function (around line 125):

```typescript
/**
 * Get assembled single card oracle reading prompt
 */
export async function getSingleCardReadingPrompt(params: {
  category: string;
  question: string;
  cardDescription: string;
  cardNumber?: string;
  element?: string;
  styles: string[];
  language: 'en' | 'fr';
}): Promise<string> {
  try {
    const basePrompt = await getPrompt('PROMPT_TAROT_BASE_SINGLE');
    const reframingGuidance = await getPrompt('SINGLE_CARD_REFRAMING');

    const languageName = params.language === 'en' ? 'English' : 'French';

    // Build style instructions if any styles selected
    let styleInstructions = '';
    if (params.styles.length > 0) {
      const styleSections: string[] = [];

      for (const style of params.styles) {
        let stylePrompt: string;
        switch (style) {
          case 'spiritual':
            stylePrompt = await getPrompt('SINGLE_CARD_STYLE_SPIRITUAL');
            styleSections.push(stylePrompt);
            break;
          case 'numerology':
            stylePrompt = await getPrompt('SINGLE_CARD_STYLE_NUMEROLOGY');
            stylePrompt = stylePrompt.replace('{{cardNumber}}', params.cardNumber || 'this card\'s');
            styleSections.push(stylePrompt);
            break;
          case 'elemental':
            stylePrompt = await getPrompt('SINGLE_CARD_STYLE_ELEMENTAL');
            stylePrompt = stylePrompt.replace('{{element}}', params.element || 'elemental');
            styleSections.push(stylePrompt);
            break;
          case 'psycho_emotional':
            stylePrompt = await getPrompt('SINGLE_CARD_STYLE_PSYCHO');
            styleSections.push(stylePrompt);
            break;
        }
      }

      styleInstructions = styleSections.join('\n\n');
    }

    const variables = {
      language: languageName,
      category: params.category,
      question: params.question,
      cardDescription: params.cardDescription,
      styleInstructions,
      reframingGuidance,
    };

    return interpolatePrompt(basePrompt, variables);
  } catch (error) {
    console.error('[PromptService] Error assembling single card prompt:', error);
    throw error;
  }
}
```

**Step 2: Export the new function**

Update the exports at the bottom of the file:

```typescript
export default {
  getPrompt,
  getTarotReadingPrompt,
  getSingleCardReadingPrompt,  // Add this
  getTarotFollowUpPrompt,
  getHoroscopePrompt,
  getHoroscopeFollowUpPrompt,
  interpolatePrompt,
  clearCache,
  seedPrompts,
  getPromptService,
};
```

Also update `getPromptService()`:

```typescript
export function getPromptService() {
  return {
    getPrompt,
    getTarotReadingPrompt,
    getSingleCardReadingPrompt,  // Add this
    getTarotFollowUpPrompt,
    getHoroscopePrompt,
    getHoroscopeFollowUpPrompt,
    interpolatePrompt,
    clearCache,
    seedPrompts,
  };
}
```

**Step 3: Commit**

```bash
git add server/src/services/promptService.ts
git commit -m "feat(single-card): add getSingleCardReadingPrompt to prompt service"
```

---

## Task 6: Update AI Route for Single Card

**Files:**
- Modify: `server/src/routes/ai.ts`

**Step 1: Update the generate tarot schema to accept category**

Find `generateTarotSchema` and add category field:

```typescript
const generateTarotSchema = z.object({
  spread: z.object({
    id: z.string(),
    nameEn: z.string(),
    nameFr: z.string(),
    positions: z.number(),
    creditCost: z.number(),
  }),
  style: z.array(z.string()),
  cards: z.array(z.object({
    card: z.object({
      id: z.number(),
      nameEn: z.string(),
      nameFr: z.string(),
    }),
    isReversed: z.boolean(),
  })),
  question: z.string(),
  language: z.enum(['en', 'fr']),
  // New field for single card
  category: z.string().optional(),
});
```

**Step 2: Update the POST /tarot/generate handler**

After the existing `getTarotReadingPrompt` call (around line 246), add conditional logic for single card:

```typescript
// Inside the handler, after validation
const { spread, style, cards, question, language, category } = validation.data;

// ... existing logging ...

// Check if this is a single card reading
const isSingleCard = spread.id === 'single' && spread.positions === 1;

let prompt: string;
let maxTokens: number;

if (isSingleCard) {
  // Use single card prompt
  const card = cards[0];
  const cardName = language === 'en' ? card.card.nameEn : card.card.nameFr;
  const orientation = card.isReversed ? '(Reversed)' : '(Upright)';
  const cardDescription = `${cardName} ${orientation}`;

  // Map card to element (simplified - you may want to expand this)
  const cardElement = getCardElement(card.card.id);
  const cardNumber = getCardNumber(card.card.id);

  // Map style array to expected format
  const styleMap: Record<string, string> = {
    'spiritual': 'spiritual',
    'psycho_emotional': 'psycho_emotional',
    'numerology': 'numerology',
    'elemental': 'elemental',
  };
  const mappedStyles = style.map(s => styleMap[s.toLowerCase()] || s).filter(Boolean);

  prompt = await getSingleCardReadingPrompt({
    category: category || 'general',
    question,
    cardDescription,
    cardNumber,
    element: cardElement,
    styles: mappedStyles,
    language,
  });

  // Base 800 tokens + 200 per style
  maxTokens = 800 + (mappedStyles.length * 200);
} else {
  // Existing multi-card logic
  const spreadType = spread.id;
  const styleInstructions = style.length > 0
    ? `Interpretation styles: ${style.join(', ')}`
    : 'Use a classic interpretation style';

  const positionMeanings = language === 'en' ? spread.positionMeaningsEn : spread.positionMeaningsFr;
  const cardsDescription = cards
    .map((c, idx) => {
      const cardName = language === 'en' ? c.card.nameEn : c.card.nameFr;
      const position = positionMeanings?.[idx] || `Position ${idx + 1}`;
      const orientation = c.isReversed ? '(Reversed)' : '(Upright)';
      return `${position}: ${cardName} ${orientation}`;
    })
    .join('\n');

  prompt = await getTarotReadingPrompt({
    spreadType,
    styleInstructions,
    question,
    cardsDescription,
    language,
  });

  maxTokens = {
    1: 600,
    3: 1200,
    5: 2000,
    7: 2000,
    10: 2500,
  }[spread.positions] || 1500;
}
```

**Step 3: Add helper functions for card metadata**

Add at the top of the file (after imports):

```typescript
// Helper to get card element based on card ID
function getCardElement(cardId: number): string {
  // Major Arcana (0-21) - varies by card, default to Spirit
  if (cardId <= 21) return 'Spirit';

  // Minor Arcana: Wands (22-35), Cups (36-49), Swords (50-63), Pentacles (64-77)
  if (cardId <= 35) return 'Fire';
  if (cardId <= 49) return 'Water';
  if (cardId <= 63) return 'Air';
  return 'Earth';
}

// Helper to get card number for numerology
function getCardNumber(cardId: number): string {
  // Major Arcana
  if (cardId <= 21) return String(cardId);

  // Minor Arcana - extract the number (Ace=1 through 10, then Page=11, Knight=12, Queen=13, King=14)
  const suitPosition = (cardId - 22) % 14;
  return String(suitPosition + 1);
}
```

**Step 4: Import the new prompt function**

Update imports at top of file:

```typescript
import { getTarotReadingPrompt, getTarotFollowUpPrompt, getSingleCardReadingPrompt } from '../services/promptService.js';
```

**Step 5: Commit**

```bash
git add server/src/routes/ai.ts
git commit -m "feat(single-card): update AI route to handle single card readings"
```

---

## Task 7: Integrate Single Card Flow in ActiveReading

**Files:**
- Modify: `components/ActiveReading.tsx`
- Modify: `components/reading/index.ts`

**Step 1: Add state for single card category/question in ActiveReading**

Add imports and state after existing state declarations:

```typescript
// Add import
import { SingleCardCategory } from '../constants/singleCardQuestions';
import { SingleCardIntroPhase } from './reading/phases';

// Add state (after existing state declarations around line 140)
const [singleCardCategory, setSingleCardCategory] = useState<SingleCardCategory | null>(null);
const [singleCardQuestionId, setSingleCardQuestionId] = useState<string | null>(null);
const [singleCardCustomQuestion, setSingleCardCustomQuestion] = useState('');
const [isWritingOwnQuestion, setIsWritingOwnQuestion] = useState(false);
```

**Step 2: Add handlers for single card selection**

```typescript
// Add handlers after existing handlers
const handleCategorySelect = useCallback((category: SingleCardCategory) => {
  setSingleCardCategory(category);
  setSingleCardQuestionId(null); // Reset question when category changes
  setIsWritingOwnQuestion(false);
}, []);

const handleQuestionSelect = useCallback((questionId: string, questionText: string) => {
  setSingleCardQuestionId(questionId);
  // Update the main question state with selected question text
  handleQuestionChange({ target: { value: questionText } } as React.ChangeEvent<HTMLTextAreaElement>);
}, [handleQuestionChange]);

const handleCustomQuestionChange = useCallback((text: string) => {
  setSingleCardCustomQuestion(text);
  handleQuestionChange({ target: { value: text } } as React.ChangeEvent<HTMLTextAreaElement>);
}, [handleQuestionChange]);

const handleWriteOwnToggle = useCallback(() => {
  setIsWritingOwnQuestion(prev => !prev);
  if (!isWritingOwnQuestion) {
    setSingleCardQuestionId(null);
  }
}, [isWritingOwnQuestion]);
```

**Step 3: Update totalCost calculation for single card**

```typescript
const totalCost = useMemo(() => {
  // For single card, advanced options cost +1 total (not per style)
  if (spread.id === SpreadType.SINGLE) {
    return spread.cost + (isAdvanced && selectedStyles.length > 0 ? 1 : 0);
  }
  // Original calculation for other spreads
  return spread.cost + (isAdvanced ? 1 : 0) + (extendedQuestionPaid ? 1 : 0);
}, [spread.id, spread.cost, isAdvanced, selectedStyles.length, extendedQuestionPaid]);
```

**Step 4: Update renderPhaseContent for single card intro**

In the `renderPhaseContent` function, update the intro phase section:

```typescript
if (phase === 'intro') {
  // Use single card intro for single card spread
  if (spread.id === SpreadType.SINGLE) {
    return (
      <SingleCardIntroPhase
        spread={spread}
        language={language}
        selectedCategory={singleCardCategory}
        selectedQuestionId={singleCardQuestionId}
        customQuestion={singleCardCustomQuestion}
        isWritingOwn={isWritingOwnQuestion}
        onCategorySelect={handleCategorySelect}
        onQuestionSelect={handleQuestionSelect}
        onCustomQuestionChange={handleCustomQuestionChange}
        onWriteOwnToggle={handleWriteOwnToggle}
        isAdvanced={isAdvanced}
        selectedStyles={selectedStyles}
        onAdvancedToggle={() => setIsAdvanced(!isAdvanced)}
        onStyleToggle={toggleStyle}
        validationMessage={validationMessage}
        totalCost={totalCost}
        credits={user?.credits || 0}
        onStartShuffle={startShuffleAnimation}
      />
    );
  }

  // Existing QuestionIntroPhase for other spreads
  return (
    <QuestionIntroPhase
      // ... existing props
    />
  );
}
```

**Step 5: Update startReading to pass category**

In the `startReading` callback, update the generateReading call:

```typescript
const result = await generateReading({
  spread,
  isAdvanced,
  selectedStyles,
  drawnCards,
  question,
  language,
  category: spread.id === SpreadType.SINGLE ? singleCardCategory : undefined,
});
```

**Step 6: Commit**

```bash
git add components/ActiveReading.tsx components/reading/index.ts
git commit -m "feat(single-card): integrate single card flow in ActiveReading"
```

---

## Task 8: Update useReadingGeneration Hook

**Files:**
- Modify: `hooks/useReadingGeneration.ts` (or wherever generateReading is defined)

**Step 1: Find and update the hook**

Add category to the generateReading parameters:

```typescript
interface GenerateReadingParams {
  spread: SpreadConfig;
  isAdvanced: boolean;
  selectedStyles: InterpretationStyle[];
  drawnCards: DrawnCard[];
  question: string;
  language: 'en' | 'fr';
  category?: string; // Add this
}
```

**Step 2: Pass category to API call**

In the API call, include category:

```typescript
const response = await fetch(`${API_URL}/api/v1/ai/tarot/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    spread: {
      id: spread.id,
      nameEn: spread.nameEn,
      nameFr: spread.nameFr,
      positions: spread.positions,
      creditCost: spread.cost,
      positionMeaningsEn: spread.positionMeaningsEn,
      positionMeaningsFr: spread.positionMeaningsFr,
    },
    style: selectedStyles,
    cards: drawnCards.map(dc => ({
      card: {
        id: dc.card.id,
        nameEn: dc.card.nameEn,
        nameFr: dc.card.nameFr,
      },
      isReversed: dc.isReversed,
    })),
    question,
    language,
    category, // Add this
  }),
});
```

**Step 3: Commit**

```bash
git add hooks/useReadingGeneration.ts
git commit -m "feat(single-card): update useReadingGeneration to pass category"
```

---

## Task 9: Final Testing & Cleanup

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 2: Run the dev server and test**

```bash
npm run dev
```

Test cases:
1. Navigate to single card spread
2. Select a category (should show questions)
3. Select a curated question (should populate)
4. Try writing own question
5. Toggle interpretation styles (cost should show +1 for any selection)
6. Complete a reading and verify the interpretation structure

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(single-card): complete single card oracle redesign

- Add category-based question selection
- Create dedicated single card intro phase
- Add curated question bank (5 categories, 5 questions each)
- Implement 'go deeper' interpretation styles (+1 credit for any)
- Update backend prompt for oracle-style guidance
- Change position label to 'Today's Guidance'"
```

---

## Summary

This implementation:

1. **DRY**: Reuses existing components (ThemedBackground, Button, SPREAD_THEMES) and patterns
2. **KISS**: Single card has its own intro phase rather than complex conditionals in the existing one
3. **SOLID**:
   - Single Responsibility: Each component has one job
   - Open/Closed: New functionality via new components, not modifying existing ones heavily
   - Interface Segregation: SingleCardIntroPhase has only the props it needs

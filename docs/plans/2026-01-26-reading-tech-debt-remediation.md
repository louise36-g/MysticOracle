# Reading System Tech Debt Remediation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate critical technical debt in the reading system: remove code duplication, fix hardcoded i18n strings, add integration tests for AI routes, and extract custom hooks to reduce ActiveReading.tsx complexity.

**Architecture:** Extract shared utilities for API parameter transformation, create custom React hooks for reading flow state management, and add comprehensive integration tests using Vitest with existing mock infrastructure.

**Tech Stack:** React 19, TypeScript, Vitest, Clerk Auth, Express.js

---

## Prerequisites

Before starting, ensure:
- Server runs: `cd server && npm run dev`
- Frontend runs: `npm run dev`
- Tests pass: `cd server && npm test`

---

## Task 1: Extract API Parameter Transformation Utilities

**Files:**
- Create: `utils/readingApiHelpers.ts`
- Modify: `components/ActiveReading.tsx:139-160, 344-365`
- Test: Manual verification (utility is pure function)

**Step 1: Create the utility file**

Create `utils/readingApiHelpers.ts`:

```typescript
import { SpreadConfig, InterpretationStyle } from '../types';

/**
 * Transform SpreadConfig to API-compatible spread params
 * Eliminates duplication between regenerateReading and startReading
 */
export function toAPISpreadParams(spread: SpreadConfig) {
  return {
    id: spread.id,
    nameEn: spread.nameEn,
    nameFr: spread.nameFr,
    positions: spread.positions,
    positionMeaningsEn: spread.positionMeaningsEn,
    positionMeaningsFr: spread.positionMeaningsFr,
    creditCost: spread.cost,
  };
}

/**
 * Convert interpretation style selection to API-compatible string array
 */
export function toStyleStrings(
  isAdvanced: boolean,
  selectedStyles: InterpretationStyle[]
): string[] {
  return isAdvanced
    ? selectedStyles.map(s => s.toString())
    : [InterpretationStyle.CLASSIC.toString()];
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors (existing errors in other files are acceptable)

**Step 3: Update ActiveReading.tsx imports**

Add to imports in `components/ActiveReading.tsx` (around line 14):

```typescript
import { toAPISpreadParams, toStyleStrings } from '../utils/readingApiHelpers';
```

**Step 4: Replace first duplicate block (regenerateReading)**

Replace lines 139-152 in `components/ActiveReading.tsx`:

FROM:
```typescript
      // Convert spread to backend format
      const spreadParams = {
        id: spread.id,
        nameEn: spread.nameEn,
        nameFr: spread.nameFr,
        positions: spread.positions,
        positionMeaningsEn: spread.positionMeaningsEn,
        positionMeaningsFr: spread.positionMeaningsFr,
        creditCost: spread.cost,
      };

      // Convert styles to array of strings
      const styleStrings = isAdvanced
        ? selectedStyles.map(s => s.toString())
        : [InterpretationStyle.CLASSIC.toString()];
```

TO:
```typescript
      const spreadParams = toAPISpreadParams(spread);
      const styleStrings = toStyleStrings(isAdvanced, selectedStyles);
```

**Step 5: Replace second duplicate block (startReading)**

Replace lines 343-356 in `components/ActiveReading.tsx`:

FROM:
```typescript
      // Convert spread to backend format
      const spreadParams = {
        id: spread.id,
        nameEn: spread.nameEn,
        nameFr: spread.nameFr,
        positions: spread.positions,
        positionMeaningsEn: spread.positionMeaningsEn,
        positionMeaningsFr: spread.positionMeaningsFr,
        creditCost: spread.cost,
      };

      // Convert styles to array of strings
      const styleStrings = isAdvanced
        ? selectedStyles.map(s => s.toString())
        : [InterpretationStyle.CLASSIC.toString()];
```

TO:
```typescript
      const spreadParams = toAPISpreadParams(spread);
      const styleStrings = toStyleStrings(isAdvanced, selectedStyles);
```

**Step 6: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors

**Step 7: Test manually**

1. Open http://localhost:5173/tarot/single-card
2. Enter a question
3. Complete a reading
4. Verify interpretation generates successfully

**Step 8: Commit**

```bash
git add utils/readingApiHelpers.ts components/ActiveReading.tsx
git commit -m "$(cat <<'EOF'
refactor: extract API parameter transformation utilities

- Create toAPISpreadParams() and toStyleStrings() helpers
- Eliminate duplicate code blocks in ActiveReading.tsx
- Reduces maintenance burden and prevents inconsistent bugs

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Fix Hardcoded i18n Strings

**Files:**
- Modify: `components/ActiveReading.tsx` (6 locations)

**Step 1: Identify all hardcoded strings**

Lines to fix:
- Line 166-168: `'Failed to generate reading. Please try again.'`
- Line 223-226: `'Failed to summarize question. Please try again.'`
- Line 274-277: `"Please enter a question above or select 'General Guidance'."`
- Line 284-287: `"Question too long..."`
- Line 423-425: `'Failed to generate reading. Please try again.'`
- Line 506-509: `'Sorry, I could not process your question. Please try again.'`

**Step 2: Replace line 166-168 (regenerateReading error)**

FROM:
```typescript
      setReadingText(language === 'en'
        ? 'Failed to generate reading. Please try again.'
        : 'Échec de la génération de la lecture. Veuillez réessayer.');
```

TO:
```typescript
      setReadingText(t('reading.error.generateFailed', 'Failed to generate reading. Please try again.'));
```

**Step 3: Replace line 223-226 (summarize error)**

FROM:
```typescript
      setValidationMessage(
        language === 'en'
          ? 'Failed to summarize question. Please try again.'
          : 'Échec du résumé de la question. Veuillez réessayer.'
      );
```

TO:
```typescript
      setValidationMessage(t('reading.error.summarizeFailed', 'Failed to summarize question. Please try again.'));
```

**Step 4: Replace line 274-277 (missing question)**

FROM:
```typescript
      setValidationMessage(
        language === 'en'
          ? "Please enter a question above or select 'General Guidance'."
          : "Veuillez entrer une question ou sélectionner 'Guidance Générale'."
      );
```

TO:
```typescript
      setValidationMessage(t('reading.error.missingQuestion', "Please enter a question above or select 'General Guidance'."));
```

**Step 5: Replace line 284-287 (question too long)**

FROM:
```typescript
      setValidationMessage(
        language === 'en'
          ? `Question too long (${questionLength}/${QUESTION_LENGTH.HARD_LIMIT} characters). Please shorten it.`
          : `Question trop longue (${questionLength}/${QUESTION_LENGTH.HARD_LIMIT} caractères). Veuillez la raccourcir.`
      );
```

TO:
```typescript
      setValidationMessage(t('reading.error.questionTooLong', `Question too long (${questionLength}/${QUESTION_LENGTH.HARD_LIMIT} characters). Please shorten it.`));
```

**Step 6: Replace line 423-425 (startReading error)**

FROM:
```typescript
      const errorMessage = language === 'en'
        ? 'Failed to generate reading. Please try again.'
        : 'Échec de la génération de la lecture. Veuillez réessayer.';
```

TO:
```typescript
      const errorMessage = t('reading.error.generateFailed', 'Failed to generate reading. Please try again.');
```

**Step 7: Replace line 506-509 (chat error)**

FROM:
```typescript
      const errorMessage = language === 'en'
        ? 'Sorry, I could not process your question. Please try again.'
        : 'Désolé, je n\'ai pas pu traiter votre question. Veuillez réessayer.';
```

TO:
```typescript
      const errorMessage = t('reading.error.chatFailed', 'Sorry, I could not process your question. Please try again.');
```

**Step 8: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors

**Step 9: Test manually**

1. Switch language to French
2. Trigger an error (e.g., submit empty question)
3. Verify fallback English text shows (translations will be added to DB separately)

**Step 10: Commit**

```bash
git add components/ActiveReading.tsx
git commit -m "$(cat <<'EOF'
refactor: replace hardcoded i18n strings with t() function

- Replace 6 hardcoded language conditionals with translation calls
- Uses existing translation system with English fallbacks
- Enables future French translations via admin panel

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add Integration Tests for AI Routes

**Files:**
- Create: `server/src/__tests__/routes/ai.test.ts`
- Create: `server/src/__tests__/mocks/openRouterService.ts`

**Step 1: Create OpenRouter service mock**

Create `server/src/__tests__/mocks/openRouterService.ts`:

```typescript
import { vi } from 'vitest';

export const createMockOpenRouterService = () => ({
  generateTarotReading: vi.fn().mockResolvedValue('Mock tarot interpretation text'),
  generateTarotFollowUp: vi.fn().mockResolvedValue('Mock follow-up answer'),
  generateHoroscope: vi.fn().mockResolvedValue('Mock horoscope text'),
  generateHoroscopeFollowUp: vi.fn().mockResolvedValue('Mock horoscope follow-up'),
});

export const createFailingOpenRouterService = () => ({
  generateTarotReading: vi.fn().mockRejectedValue(new Error('AI service unavailable')),
  generateTarotFollowUp: vi.fn().mockRejectedValue(new Error('AI service unavailable')),
  generateHoroscope: vi.fn().mockRejectedValue(new Error('AI service unavailable')),
  generateHoroscopeFollowUp: vi.fn().mockRejectedValue(new Error('AI service unavailable')),
});
```

**Step 2: Update mocks index**

Add to `server/src/__tests__/mocks/index.ts`:

```typescript
export * from './openRouterService.js';
```

**Step 3: Create AI routes test file**

Create `server/src/__tests__/routes/ai.test.ts`:

```typescript
/**
 * AI Routes Integration Tests
 * Tests for /api/v1/ai/tarot/generate and /api/v1/ai/tarot/followup
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock the auth middleware before importing routes
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 'test-user-123' };
    next();
  },
}));

// Mock the openRouterService
vi.mock('../../services/openRouterService.js', () => ({
  openRouterService: {
    generateTarotReading: vi.fn().mockResolvedValue('The Fool represents new beginnings...'),
    generateTarotFollowUp: vi.fn().mockResolvedValue('This card suggests...'),
  },
}));

// Mock the promptService
vi.mock('../../services/promptService.js', () => ({
  getTarotReadingPrompt: vi.fn().mockResolvedValue('Mock prompt for tarot reading'),
  getTarotFollowUpPrompt: vi.fn().mockResolvedValue('Mock prompt for follow-up'),
}));

import express from 'express';
import request from 'supertest';
import aiRouter from '../../routes/ai.js';
import { openRouterService } from '../../services/openRouterService.js';
import { getTarotReadingPrompt, getTarotFollowUpPrompt } from '../../services/promptService.js';

describe('AI Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/ai', aiRouter);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/v1/ai/tarot/generate', () => {
    const validPayload = {
      spread: {
        id: 'single',
        nameEn: 'Single Card',
        nameFr: 'Carte Unique',
        positions: 1,
        positionMeaningsEn: ['Present Situation'],
        positionMeaningsFr: ['Situation Actuelle'],
        creditCost: 1,
      },
      style: ['CLASSIC'],
      cards: [
        {
          card: {
            id: 'the-fool',
            nameEn: 'The Fool',
            nameFr: 'Le Mat',
            arcana: 'major',
          },
          positionIndex: 0,
          isReversed: false,
        },
      ],
      question: 'What does my future hold?',
      language: 'en' as const,
    };

    it('should generate a tarot reading successfully', async () => {
      const response = await request(app)
        .post('/api/v1/ai/tarot/generate')
        .send(validPayload)
        .expect(200);

      expect(response.body).toHaveProperty('interpretation');
      expect(response.body.interpretation).toBe('The Fool represents new beginnings...');
      expect(response.body).toHaveProperty('creditsRequired', 1);
    });

    it('should call promptService with correctly transformed parameters', async () => {
      await request(app)
        .post('/api/v1/ai/tarot/generate')
        .send(validPayload)
        .expect(200);

      expect(getTarotReadingPrompt).toHaveBeenCalledWith({
        spreadType: 'single',
        styleInstructions: 'Interpretation styles: CLASSIC',
        question: 'What does my future hold?',
        cardsDescription: 'Present Situation: The Fool (Upright)',
        language: 'en',
      });
    });

    it('should format reversed cards correctly', async () => {
      const reversedPayload = {
        ...validPayload,
        cards: [
          {
            ...validPayload.cards[0],
            isReversed: true,
          },
        ],
      };

      await request(app)
        .post('/api/v1/ai/tarot/generate')
        .send(reversedPayload)
        .expect(200);

      expect(getTarotReadingPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          cardsDescription: 'Present Situation: The Fool (Reversed)',
        })
      );
    });

    it('should use French position meanings when language is fr', async () => {
      const frenchPayload = { ...validPayload, language: 'fr' as const };

      await request(app)
        .post('/api/v1/ai/tarot/generate')
        .send(frenchPayload)
        .expect(200);

      expect(getTarotReadingPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          cardsDescription: 'Situation Actuelle: Le Mat (Upright)',
          language: 'fr',
        })
      );
    });

    it('should return 400 for invalid payload', async () => {
      const invalidPayload = { ...validPayload, spread: null };

      const response = await request(app)
        .post('/api/v1/ai/tarot/generate')
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request data');
    });

    it('should return 500 when AI service fails', async () => {
      vi.mocked(openRouterService.generateTarotReading).mockRejectedValueOnce(
        new Error('AI service unavailable')
      );

      const response = await request(app)
        .post('/api/v1/ai/tarot/generate')
        .send(validPayload)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'AI service unavailable');
    });

    it('should handle multiple interpretation styles', async () => {
      const multiStylePayload = {
        ...validPayload,
        style: ['CLASSIC', 'SPIRITUAL', 'NUMEROLOGY'],
      };

      await request(app)
        .post('/api/v1/ai/tarot/generate')
        .send(multiStylePayload)
        .expect(200);

      expect(getTarotReadingPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          styleInstructions: 'Interpretation styles: CLASSIC, SPIRITUAL, NUMEROLOGY',
        })
      );
    });

    it('should use default style instructions when style array is empty', async () => {
      const emptyStylePayload = { ...validPayload, style: [] };

      await request(app)
        .post('/api/v1/ai/tarot/generate')
        .send(emptyStylePayload)
        .expect(200);

      expect(getTarotReadingPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          styleInstructions: 'Use a classic interpretation style',
        })
      );
    });
  });

  describe('POST /api/v1/ai/tarot/followup', () => {
    const validFollowUpPayload = {
      reading: 'The Fool represents new beginnings...',
      history: [
        { role: 'user' as const, content: 'What about my career?' },
        { role: 'assistant' as const, content: 'The Fool suggests...' },
      ],
      question: 'Can you elaborate on the timing?',
      language: 'en' as const,
    };

    it('should generate a follow-up answer successfully', async () => {
      const response = await request(app)
        .post('/api/v1/ai/tarot/followup')
        .send(validFollowUpPayload)
        .expect(200);

      expect(response.body).toHaveProperty('answer');
      expect(response.body.answer).toBe('This card suggests...');
    });

    it('should call promptService with correctly transformed parameters', async () => {
      await request(app)
        .post('/api/v1/ai/tarot/followup')
        .send(validFollowUpPayload)
        .expect(200);

      expect(getTarotFollowUpPrompt).toHaveBeenCalledWith({
        context: 'The Fool represents new beginnings...',
        history: 'user: What about my career?\nassistant: The Fool suggests...',
        newQuestion: 'Can you elaborate on the timing?',
        language: 'en',
      });
    });

    it('should return 400 for invalid payload', async () => {
      const invalidPayload = { ...validFollowUpPayload, reading: '' };

      const response = await request(app)
        .post('/api/v1/ai/tarot/followup')
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request data');
    });
  });
});
```

**Step 4: Install supertest if needed**

Run: `cd server && npm install --save-dev supertest @types/supertest`

**Step 5: Run the tests**

Run: `cd server && npm test -- src/__tests__/routes/ai.test.ts`
Expected: All tests pass

**Step 6: Run full test suite**

Run: `cd server && npm test`
Expected: All tests pass (including existing tests)

**Step 7: Check coverage**

Run: `cd server && npm test -- --coverage`
Expected: ai.ts coverage should be >60%

**Step 8: Commit**

```bash
cd server
git add src/__tests__/routes/ai.test.ts src/__tests__/mocks/openRouterService.ts src/__tests__/mocks/index.ts package.json package-lock.json
git commit -m "$(cat <<'EOF'
test: add integration tests for AI routes

- Add tests for POST /api/v1/ai/tarot/generate
- Add tests for POST /api/v1/ai/tarot/followup
- Verify parameter transformation to promptService
- Test error handling for AI service failures
- Add openRouterService mock factory

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Extract useReadingGeneration Hook

**Files:**
- Create: `hooks/useReadingGeneration.ts`
- Modify: `components/ActiveReading.tsx`

**Step 1: Create the hook file**

Create `hooks/useReadingGeneration.ts`:

```typescript
import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { SpreadConfig, InterpretationStyle, TarotCard } from '../types';
import { generateTarotReading as generateTarotReadingAPI } from '../services/apiService';
import { toAPISpreadParams, toStyleStrings } from '../utils/readingApiHelpers';

interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
}

interface UseReadingGenerationProps {
  spread: SpreadConfig;
  drawnCards: DrawnCard[];
  isAdvanced: boolean;
  selectedStyles: InterpretationStyle[];
  question: string;
}

interface UseReadingGenerationResult {
  readingText: string;
  readingLanguage: string | null;
  isGenerating: boolean;
  generateReading: () => Promise<string | null>;
  setReadingText: (text: string) => void;
}

export function useReadingGeneration({
  spread,
  drawnCards,
  isAdvanced,
  selectedStyles,
  question,
}: UseReadingGenerationProps): UseReadingGenerationResult {
  const { language, t } = useApp();
  const { getToken } = useAuth();

  const [readingText, setReadingText] = useState<string>('');
  const [readingLanguage, setReadingLanguage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReading = useCallback(async (): Promise<string | null> => {
    setIsGenerating(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const cardsWithPosition = drawnCards.map((item, idx) => ({
        card: item.card,
        isReversed: item.isReversed,
        positionIndex: idx,
      }));

      const spreadParams = toAPISpreadParams(spread);
      const styleStrings = toStyleStrings(isAdvanced, selectedStyles);

      const result = await generateTarotReadingAPI(token, {
        spread: spreadParams,
        style: styleStrings,
        cards: cardsWithPosition,
        question,
        language,
      });

      setReadingText(result.interpretation);
      setReadingLanguage(language);
      setIsGenerating(false);
      return result.interpretation;
    } catch (error) {
      console.error('Failed to generate reading:', error);
      const errorMessage = t('reading.error.generateFailed', 'Failed to generate reading. Please try again.');
      setReadingText(errorMessage);
      setIsGenerating(false);
      return null;
    }
  }, [drawnCards, spread, isAdvanced, selectedStyles, question, language, getToken, t]);

  return {
    readingText,
    readingLanguage,
    isGenerating,
    generateReading,
    setReadingText,
  };
}

export default useReadingGeneration;
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors

**Step 3: Commit the hook (don't integrate yet)**

```bash
git add hooks/useReadingGeneration.ts
git commit -m "$(cat <<'EOF'
feat: add useReadingGeneration hook

- Extract reading generation logic from ActiveReading
- Handles token auth, API calls, and error states
- Uses shared utility functions for parameter transformation
- Prepares for ActiveReading refactor

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Extract useOracleChat Hook

**Files:**
- Create: `hooks/useOracleChat.ts`

**Step 1: Create the hook file**

Create `hooks/useOracleChat.ts`:

```typescript
import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { generateTarotFollowUp, addFollowUpQuestion } from '../services/apiService';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface UseOracleChatProps {
  readingText: string;
  backendReadingId: string | null;
}

interface UseOracleChatResult {
  chatHistory: ChatMessage[];
  chatInput: string;
  isChatLoading: boolean;
  sessionQuestionCount: number;
  getQuestionCost: () => number;
  setChatInput: (value: string) => void;
  sendMessage: (e: React.FormEvent) => Promise<void>;
}

export function useOracleChat({
  readingText,
  backendReadingId,
}: UseOracleChatProps): UseOracleChatResult {
  const { language, deductCredits, t } = useApp();
  const { getToken } = useAuth();

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [sessionQuestionCount, setSessionQuestionCount] = useState(0);

  const getQuestionCost = useCallback(() => {
    // 2 questions for 1 credit: charge on even counts (0, 2, 4...), free on odd counts (1, 3, 5...)
    if (sessionQuestionCount % 2 === 0) return 1;
    return 0;
  }, [sessionQuestionCount]);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const cost = getQuestionCost();
    if (cost > 0) {
      const result = await deductCredits(cost);
      if (!result.success) {
        alert(t('error.insufficientCredits', 'Insufficient credits'));
        return;
      }
    }

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);
    setSessionQuestionCount(prev => prev + 1);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Convert chat history to backend format
      const historyForBackend = chatHistory.map(h => ({
        role: h.role === 'model' ? 'assistant' as const : h.role,
        content: h.content,
      }));

      const result = await generateTarotFollowUp(token, {
        reading: readingText,
        history: historyForBackend,
        question: userMsg,
        language,
      });

      setChatHistory(prev => [...prev, { role: 'model', content: result.answer }]);

      // Save follow-up question to backend
      if (backendReadingId) {
        try {
          await addFollowUpQuestion(token, backendReadingId, userMsg, result.answer);
        } catch (saveError) {
          // Non-blocking - follow-up just won't be saved to history if save fails
          console.error('Failed to save follow-up to backend:', saveError);
        }
      }
    } catch (error) {
      console.error('Failed to generate follow-up response:', error);
      const errorMessage = t('reading.error.chatFailed', 'Sorry, I could not process your question. Please try again.');
      setChatHistory(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading, getQuestionCost, deductCredits, language, readingText, chatHistory, backendReadingId, getToken, t]);

  return {
    chatHistory,
    chatInput,
    isChatLoading,
    sessionQuestionCount,
    getQuestionCost,
    setChatInput,
    sendMessage,
  };
}

export default useOracleChat;
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors

**Step 3: Commit the hook**

```bash
git add hooks/useOracleChat.ts
git commit -m "$(cat <<'EOF'
feat: add useOracleChat hook

- Extract chat logic from ActiveReading
- Handles message sending, credit deduction, backend persistence
- Manages session question count for credit calculation
- Uses translation system for error messages

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Extract useQuestionInput Hook

**Files:**
- Create: `hooks/useQuestionInput.ts`

**Step 1: Create the hook file**

Create `hooks/useQuestionInput.ts`:

```typescript
import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { summarizeQuestion } from '../services/apiService';

// Question length thresholds
export const QUESTION_LENGTH = {
  FREE_LIMIT: 500,
  HARD_LIMIT: 2000,
} as const;

type QuestionLengthStatus = 'ok' | 'extended' | 'exceeded';

interface UseQuestionInputResult {
  question: string;
  questionError: boolean;
  validationMessage: string | null;
  questionLength: number;
  currentLimit: number;
  questionLengthStatus: QuestionLengthStatus;
  extendedQuestionPaid: boolean;
  showLengthModal: boolean;
  isProcessingLength: boolean;
  handleQuestionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleGeneralGuidance: () => void;
  handleAISummarize: () => Promise<void>;
  handleUseFullQuestion: (userCredits: number, projectedCost: number) => void;
  handleShortenManually: () => void;
  setShowLengthModal: (show: boolean) => void;
  setValidationMessage: (message: string | null) => void;
  validateQuestion: () => boolean;
}

export function useQuestionInput(): UseQuestionInputResult {
  const { language, refreshUser, t } = useApp();
  const { getToken } = useAuth();

  const [question, setQuestion] = useState('');
  const [questionError, setQuestionError] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [showLengthModal, setShowLengthModal] = useState(false);
  const [extendedQuestionPaid, setExtendedQuestionPaid] = useState(false);
  const [isProcessingLength, setIsProcessingLength] = useState(false);

  const questionLength = question.length;
  const currentLimit = extendedQuestionPaid ? QUESTION_LENGTH.HARD_LIMIT : QUESTION_LENGTH.FREE_LIMIT;

  const questionLengthStatus = useMemo((): QuestionLengthStatus => {
    if (questionLength <= QUESTION_LENGTH.FREE_LIMIT) return 'ok';
    if (questionLength <= QUESTION_LENGTH.HARD_LIMIT) return 'extended';
    return 'exceeded';
  }, [questionLength]);

  const handleQuestionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Enforce hard limit
    if (newValue.length > QUESTION_LENGTH.HARD_LIMIT) {
      return;
    }
    setQuestion(newValue);
    setExtendedQuestionPaid(false);
    if (newValue) {
      setQuestionError(false);
      setValidationMessage(null);
    }
  }, []);

  const handleGeneralGuidance = useCallback(() => {
    setQuestion(t('reading.generalGuidance', 'Guidance from the Tarot'));
    setQuestionError(false);
    setValidationMessage(null);
  }, [t]);

  const handleAISummarize = useCallback(async () => {
    setIsProcessingLength(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const result = await summarizeQuestion(token, question, language);
      setQuestion(result.summary);
      setShowLengthModal(false);
      setExtendedQuestionPaid(false);
      refreshUser();
    } catch (error) {
      console.error('Failed to summarize question:', error);
      setValidationMessage(t('reading.error.summarizeFailed', 'Failed to summarize question. Please try again.'));
    } finally {
      setIsProcessingLength(false);
    }
  }, [question, language, getToken, refreshUser, t]);

  const handleUseFullQuestion = useCallback((userCredits: number, projectedCost: number) => {
    if (userCredits < projectedCost) {
      setValidationMessage(t('error.insufficientCredits', 'Insufficient credits'));
      return;
    }
    setExtendedQuestionPaid(true);
    setShowLengthModal(false);
  }, [t]);

  const handleShortenManually = useCallback(() => {
    setShowLengthModal(false);
  }, []);

  const validateQuestion = useCallback((): boolean => {
    if (!question.trim()) {
      setQuestionError(true);
      setValidationMessage(t('reading.error.missingQuestion', "Please enter a question above or select 'General Guidance'."));
      return false;
    }

    if (questionLengthStatus === 'exceeded') {
      setValidationMessage(t('reading.error.questionTooLong', `Question too long (${questionLength}/${QUESTION_LENGTH.HARD_LIMIT} characters). Please shorten it.`));
      return false;
    }

    if (questionLengthStatus === 'extended' && !extendedQuestionPaid) {
      setShowLengthModal(true);
      return false;
    }

    setValidationMessage(null);
    return true;
  }, [question, questionLengthStatus, questionLength, extendedQuestionPaid, t]);

  return {
    question,
    questionError,
    validationMessage,
    questionLength,
    currentLimit,
    questionLengthStatus,
    extendedQuestionPaid,
    showLengthModal,
    isProcessingLength,
    handleQuestionChange,
    handleGeneralGuidance,
    handleAISummarize,
    handleUseFullQuestion,
    handleShortenManually,
    setShowLengthModal,
    setValidationMessage,
    validateQuestion,
  };
}

export default useQuestionInput;
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors

**Step 3: Commit the hook**

```bash
git add hooks/useQuestionInput.ts
git commit -m "$(cat <<'EOF'
feat: add useQuestionInput hook

- Extract question handling logic from ActiveReading
- Manages validation, length checking, modal state
- Handles AI summarization and extended question payment
- Exports QUESTION_LENGTH constants

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Create hooks index file

**Files:**
- Create: `hooks/index.ts`

**Step 1: Create index file**

Create `hooks/index.ts`:

```typescript
// Reading-related hooks
export { useReadingGeneration } from './useReadingGeneration';
export { useOracleChat } from './useOracleChat';
export { useQuestionInput, QUESTION_LENGTH } from './useQuestionInput';

// Data fetching hooks
export { useFetchData, useFetchPaginated } from './useFetchData';
export type { UseFetchDataOptions, UseFetchDataResult } from './useFetchData';
export type { UseFetchPaginatedOptions, UseFetchPaginatedResult } from './useFetchData';
```

**Step 2: Commit**

```bash
git add hooks/index.ts
git commit -m "$(cat <<'EOF'
feat: add hooks index for clean exports

- Re-export all custom hooks from single entry point
- Export types and constants

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Run Full Test Suite and Verify

**Step 1: Run all backend tests**

Run: `cd server && npm test`
Expected: All tests pass

**Step 2: Run TypeScript check on frontend**

Run: `npx tsc --noEmit`
Expected: No new errors

**Step 3: Run TypeScript check on backend**

Run: `cd server && npx tsc --noEmit`
Expected: Same pre-existing errors only (no new errors)

**Step 4: Manual smoke test**

1. Start server: `cd server && npm run dev`
2. Start frontend: `npm run dev`
3. Navigate to http://localhost:5173/tarot/single-card
4. Complete a full reading flow
5. Ask a follow-up question
6. Verify all works correctly

**Step 5: Final commit**

```bash
git add -A
git status
# Verify only expected files are staged
git commit -m "$(cat <<'EOF'
chore: reading system tech debt remediation complete

Summary of changes:
- Extracted API param utilities (eliminates duplication)
- Fixed 6 hardcoded i18n strings
- Added AI routes integration tests (>60% coverage)
- Created 3 custom hooks for state management
  - useReadingGeneration
  - useOracleChat
  - useQuestionInput

Next steps (future PRs):
- Integrate hooks into ActiveReading.tsx
- Add more edge case tests
- Fix pre-existing TypeScript errors

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

| Task | Effort | Impact |
|------|--------|--------|
| 1. Extract API utilities | 30 min | Eliminates bug duplication |
| 2. Fix i18n strings | 20 min | Enables translations |
| 3. Add AI route tests | 60 min | Catches regressions |
| 4-6. Extract hooks | 45 min | Prepares for refactor |
| 7-8. Finalize | 15 min | Clean up |
| **Total** | **~3 hours** | **High ROI** |

---

## Future Work (Not in this plan)

1. **Integrate hooks into ActiveReading.tsx** - Replace inline state with hooks
2. **Add frontend component tests** - Test hooks with React Testing Library
3. **Fix pre-existing TypeScript errors** - Clean up horoscopes.ts, planetaryCalculationService.ts

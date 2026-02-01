/**
 * AI Routes Tests
 * Integration tests for POST /api/v1/ai/tarot/generate and /api/v1/ai/tarot/followup
 * Verifies request validation and proper parameter transformation
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock auth middleware - bypass authentication
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn((_req: any, _res: any, next: any) => {
    _req.auth = { userId: 'test-user-123', sessionId: 'test-session' };
    next();
  }),
  requireAdmin: vi.fn((_req: any, _res: any, next: any) => next()),
  optionalAuth: vi.fn((_req: any, _res: any, next: any) => next()),
}));

// Mock openRouterService
vi.mock('../../services/openRouterService.js', () => ({
  openRouterService: {
    generateTarotReading: vi.fn(),
    generateTarotFollowUp: vi.fn(),
  },
}));

// Mock promptService
vi.mock('../../services/promptService.js', () => ({
  getTarotReadingPrompt: vi.fn(),
  getTarotFollowUpPrompt: vi.fn(),
}));

// Mock aiSettings
vi.mock('../../services/aiSettings.js', () => ({
  getAISettings: vi.fn().mockResolvedValue({
    apiKey: 'test-api-key',
    model: 'test-model',
  }),
}));

// Mock CreditService
vi.mock('../../services/CreditService.js', () => ({
  creditService: {
    checkSufficientCredits: vi.fn(),
    deductCredits: vi.fn(),
  },
  CREDIT_COSTS: {
    SUMMARIZE_QUESTION: 1,
    FOLLOW_UP: 1,
  },
}));

import { openRouterService } from '../../services/openRouterService.js';
import { getTarotReadingPrompt, getTarotFollowUpPrompt } from '../../services/promptService.js';

// Import the router after mocks are set up
import aiRoutes from '../../routes/ai/index.js';

// Type cast mocked functions
const mockGenerateTarotReading = openRouterService.generateTarotReading as Mock;
const mockGenerateTarotFollowUp = openRouterService.generateTarotFollowUp as Mock;
const mockGetTarotReadingPrompt = getTarotReadingPrompt as Mock;
const mockGetTarotFollowUpPrompt = getTarotFollowUpPrompt as Mock;

describe('AI Routes', () => {
  let app: express.Application;

  // Valid test data
  const validSpread = {
    id: 'three-card',
    nameEn: 'Three Card Spread',
    nameFr: 'Tirage Trois Cartes',
    positions: 3,
    positionMeaningsEn: ['Past', 'Present', 'Future'],
    positionMeaningsFr: ['Passe', 'Present', 'Avenir'],
    creditCost: 2,
  };

  const validCards = [
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
    {
      card: {
        id: 'the-magician',
        nameEn: 'The Magician',
        nameFr: 'Le Bateleur',
        arcana: 'major',
      },
      positionIndex: 1,
      isReversed: true,
    },
    {
      card: {
        id: 'the-high-priestess',
        nameEn: 'The High Priestess',
        nameFr: 'La Papesse',
        arcana: 'major',
      },
      positionIndex: 2,
      isReversed: false,
    },
  ];

  const validGenerateRequest = {
    spread: validSpread,
    style: ['classic', 'spiritual'],
    cards: validCards,
    question: 'What does my future hold?',
    language: 'en',
  };

  const validFollowUpRequest = {
    reading: 'Your three-card reading indicates a journey of transformation...',
    history: [
      { role: 'user' as const, content: 'Tell me more about the present card' },
      { role: 'assistant' as const, content: 'The Magician in reverse suggests...' },
    ],
    question: 'What about the future card?',
    language: 'en',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up Express app with the AI routes
    app = express();
    app.use(express.json());
    app.use('/api/v1/ai', aiRoutes);

    // Default mock responses
    mockGetTarotReadingPrompt.mockResolvedValue('Generated tarot prompt');
    mockGetTarotFollowUpPrompt.mockResolvedValue('Generated follow-up prompt');
    mockGenerateTarotReading.mockResolvedValue('Your reading interpretation...');
    mockGenerateTarotFollowUp.mockResolvedValue('Additional insight...');
  });

  describe('POST /api/v1/ai/tarot/generate', () => {
    describe('Request Validation', () => {
      it('should reject request with missing spread', async () => {
        const invalidRequest = { ...validGenerateRequest };
        delete (invalidRequest as any).spread;

        const res = await request(app)
          .post('/api/v1/ai/tarot/generate')
          .send(invalidRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid request data');
        expect(res.body.details).toBeDefined();
      });

      it('should reject request with invalid spread structure', async () => {
        const invalidRequest = {
          ...validGenerateRequest,
          spread: { id: 'test' }, // Missing required fields
        };

        const res = await request(app)
          .post('/api/v1/ai/tarot/generate')
          .send(invalidRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid request data');
      });

      it('should reject request with missing cards', async () => {
        const invalidRequest = { ...validGenerateRequest };
        delete (invalidRequest as any).cards;

        const res = await request(app)
          .post('/api/v1/ai/tarot/generate')
          .send(invalidRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid request data');
      });

      it('should reject request with invalid language', async () => {
        const invalidRequest = {
          ...validGenerateRequest,
          language: 'de', // Not 'en' or 'fr'
        };

        const res = await request(app)
          .post('/api/v1/ai/tarot/generate')
          .send(invalidRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid request data');
      });

      it('should reject request with invalid card structure', async () => {
        const invalidRequest = {
          ...validGenerateRequest,
          cards: [{ card: { id: 'test' }, positionIndex: 0 }], // Missing isReversed
        };

        const res = await request(app)
          .post('/api/v1/ai/tarot/generate')
          .send(invalidRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid request data');
      });
    });

    describe('Parameter Transformation', () => {
      it('should transform spread/cards/style into correct format for promptService', async () => {
        const res = await request(app)
          .post('/api/v1/ai/tarot/generate')
          .send(validGenerateRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(200);

        // Verify getTarotReadingPrompt was called with transformed parameters
        expect(mockGetTarotReadingPrompt).toHaveBeenCalledTimes(1);
        const promptCall = mockGetTarotReadingPrompt.mock.calls[0][0];

        // spreadType should be the spread id
        expect(promptCall.spreadType).toBe('three-card');

        // styleInstructions should include spiritual content (classic is the base, spiritual is additive)
        // The implementation uses styleDescriptions which maps 'spiritual' to actual instructions
        expect(promptCall.styleInstructions).toContain('spiritual');
        expect(promptCall.styleInstructions).toContain('soul');

        // cardsDescription should contain formatted card info
        // Note: Upright cards don't show orientation, only Reversed is mentioned
        expect(promptCall.cardsDescription).toContain('The Fool');
        expect(promptCall.cardsDescription).toContain('The Magician');
        expect(promptCall.cardsDescription).toContain('Reversed'); // Only reversed cards are marked
        expect(promptCall.cardsDescription).toContain('Past');
        expect(promptCall.cardsDescription).toContain('Present');
        expect(promptCall.cardsDescription).toContain('Future');

        // question and language should be passed through
        expect(promptCall.question).toBe('What does my future hold?');
        expect(promptCall.language).toBe('en');
      });

      it('should use French position meanings when language is fr', async () => {
        const frenchRequest = { ...validGenerateRequest, language: 'fr' };

        const res = await request(app)
          .post('/api/v1/ai/tarot/generate')
          .send(frenchRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(200);

        const promptCall = mockGetTarotReadingPrompt.mock.calls[0][0];
        expect(promptCall.cardsDescription).toContain('Le Mat');
        expect(promptCall.cardsDescription).toContain('Passe');
        expect(promptCall.cardsDescription).toContain('Present');
        expect(promptCall.cardsDescription).toContain('Avenir');
        expect(promptCall.language).toBe('fr');
      });

      it('should use default style message when style array is empty', async () => {
        const noStyleRequest = { ...validGenerateRequest, style: [] };

        const res = await request(app)
          .post('/api/v1/ai/tarot/generate')
          .send(noStyleRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(200);

        const promptCall = mockGetTarotReadingPrompt.mock.calls[0][0];
        expect(promptCall.styleInstructions).toBe(
          'Use a classic interpretation style focusing on traditional tarot symbolism.'
        );
      });
    });

    describe('Successful Response', () => {
      it('should return interpretation on success', async () => {
        mockGenerateTarotReading.mockResolvedValue('A powerful reading awaits you...');

        const res = await request(app)
          .post('/api/v1/ai/tarot/generate')
          .send(validGenerateRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(200);
        expect(res.body.interpretation).toBe('A powerful reading awaits you...');
        expect(res.body.creditsRequired).toBe(2); // From spread.creditCost
      });

      it('should call openRouterService with correct options', async () => {
        await request(app)
          .post('/api/v1/ai/tarot/generate')
          .send(validGenerateRequest)
          .set('Authorization', 'Bearer test-token');

        expect(mockGenerateTarotReading).toHaveBeenCalledWith(
          'Generated tarot prompt',
          expect.objectContaining({
            temperature: 0.7,
            maxTokens: 2100, // 3 positions = 1500 base + 2 styles * 300 = 2100 tokens
          })
        );
      });

      it('should scale maxTokens based on spread positions', async () => {
        // 5-card spread with no style bonus
        const fiveCardRequest = {
          ...validGenerateRequest,
          style: [], // No styles = no style bonus
          spread: { ...validSpread, id: 'five-card', positions: 5 },
          cards: [...validCards, validCards[0], validCards[1]], // 5 cards
        };

        await request(app)
          .post('/api/v1/ai/tarot/generate')
          .send(fiveCardRequest)
          .set('Authorization', 'Bearer test-token');

        expect(mockGenerateTarotReading).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ maxTokens: 2000 }) // 5 positions = 2000 base, no style bonus
        );
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when openRouterService fails', async () => {
        mockGenerateTarotReading.mockRejectedValue(new Error('API timeout'));

        const res = await request(app)
          .post('/api/v1/ai/tarot/generate')
          .send(validGenerateRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('API timeout');
      });

      it('should return 500 when promptService fails', async () => {
        mockGetTarotReadingPrompt.mockRejectedValue(new Error('Prompt not found'));

        const res = await request(app)
          .post('/api/v1/ai/tarot/generate')
          .send(validGenerateRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Prompt not found');
      });
    });
  });

  describe('POST /api/v1/ai/tarot/followup', () => {
    describe('Request Validation', () => {
      it('should reject request with missing reading', async () => {
        const invalidRequest = { ...validFollowUpRequest };
        delete (invalidRequest as any).reading;

        const res = await request(app)
          .post('/api/v1/ai/tarot/followup')
          .send(invalidRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid request data');
      });

      it('should reject request with empty reading', async () => {
        const invalidRequest = { ...validFollowUpRequest, reading: '' };

        const res = await request(app)
          .post('/api/v1/ai/tarot/followup')
          .send(invalidRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid request data');
      });

      it('should reject request with missing question', async () => {
        const invalidRequest = { ...validFollowUpRequest };
        delete (invalidRequest as any).question;

        const res = await request(app)
          .post('/api/v1/ai/tarot/followup')
          .send(invalidRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid request data');
      });

      it('should reject request with question exceeding 500 chars', async () => {
        const invalidRequest = {
          ...validFollowUpRequest,
          question: 'a'.repeat(501),
        };

        const res = await request(app)
          .post('/api/v1/ai/tarot/followup')
          .send(invalidRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid request data');
      });

      it('should reject request with invalid history role', async () => {
        const invalidRequest = {
          ...validFollowUpRequest,
          history: [{ role: 'system', content: 'test' }], // 'system' not allowed
        };

        const res = await request(app)
          .post('/api/v1/ai/tarot/followup')
          .send(invalidRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid request data');
      });

      it('should reject request with invalid language', async () => {
        const invalidRequest = { ...validFollowUpRequest, language: 'es' };

        const res = await request(app)
          .post('/api/v1/ai/tarot/followup')
          .send(invalidRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid request data');
      });
    });

    describe('Parameter Transformation', () => {
      it('should call promptService with correct parameters', async () => {
        const res = await request(app)
          .post('/api/v1/ai/tarot/followup')
          .send(validFollowUpRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(200);

        expect(mockGetTarotFollowUpPrompt).toHaveBeenCalledWith({
          context: validFollowUpRequest.reading,
          history:
            'user: Tell me more about the present card\nassistant: The Magician in reverse suggests...',
          newQuestion: validFollowUpRequest.question,
          language: 'en',
        });
      });

      it('should handle empty history array', async () => {
        const noHistoryRequest = { ...validFollowUpRequest, history: [] };

        const res = await request(app)
          .post('/api/v1/ai/tarot/followup')
          .send(noHistoryRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(200);

        expect(mockGetTarotFollowUpPrompt).toHaveBeenCalledWith(
          expect.objectContaining({
            history: '',
          })
        );
      });

      it('should pass French language correctly', async () => {
        const frenchRequest = { ...validFollowUpRequest, language: 'fr' };

        await request(app)
          .post('/api/v1/ai/tarot/followup')
          .send(frenchRequest)
          .set('Authorization', 'Bearer test-token');

        expect(mockGetTarotFollowUpPrompt).toHaveBeenCalledWith(
          expect.objectContaining({
            language: 'fr',
          })
        );
      });
    });

    describe('Successful Response', () => {
      it('should return answer on success', async () => {
        mockGenerateTarotFollowUp.mockResolvedValue('The future card reveals...');

        const res = await request(app)
          .post('/api/v1/ai/tarot/followup')
          .send(validFollowUpRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(200);
        expect(res.body.answer).toBe('The future card reveals...');
        expect(res.body.creditsRequired).toBe(1); // CREDIT_COSTS.FOLLOW_UP
      });

      it('should call openRouterService with history and options', async () => {
        await request(app)
          .post('/api/v1/ai/tarot/followup')
          .send(validFollowUpRequest)
          .set('Authorization', 'Bearer test-token');

        expect(mockGenerateTarotFollowUp).toHaveBeenCalledWith(
          'Generated follow-up prompt',
          validFollowUpRequest.history,
          expect.objectContaining({
            temperature: 0.7,
            maxTokens: 500,
          })
        );
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when openRouterService fails', async () => {
        mockGenerateTarotFollowUp.mockRejectedValue(new Error('Connection refused'));

        const res = await request(app)
          .post('/api/v1/ai/tarot/followup')
          .send(validFollowUpRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Connection refused');
      });

      it('should return 500 when promptService fails', async () => {
        mockGetTarotFollowUpPrompt.mockRejectedValue(new Error('Template error'));

        const res = await request(app)
          .post('/api/v1/ai/tarot/followup')
          .send(validFollowUpRequest)
          .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Template error');
      });
    });
  });
});

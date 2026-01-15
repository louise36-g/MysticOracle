/**
 * Unified OpenRouter Service - Phase 2 of API Key Architecture Refactoring
 *
 * Single service for all OpenRouter API calls (Tarot + Horoscope)
 * - Consistent error handling
 * - Shared retry logic
 * - Single client instance
 * - Memory caching support
 * - Proper logging and monitoring
 */

import { getAISettings } from './aiSettings.js';

interface OpenRouterConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * OpenRouter Service - Unified interface for all AI generation
 */
export class OpenRouterService {
  private apiKey: string | null = null;
  private model: string;
  private baseURL = 'https://openrouter.ai/api/v1';
  private retryConfig: RetryConfig;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.model = 'openai/gpt-oss-120b:free'; // Default model
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Initialize the service with API settings
   * Called before each request to ensure fresh config
   */
  private async initialize(): Promise<void> {
    const settings = await getAISettings();

    if (!settings.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    this.apiKey = settings.apiKey;
    this.model = settings.model;
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoffDelay(attempt: number): number {
    const exponentialDelay = this.retryConfig.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelayMs);
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(status: number): boolean {
    // Retry on server errors (5xx) and rate limiting (429)
    return (status >= 500 && status < 600) || status === 429;
  }

  /**
   * Make a request to OpenRouter with retry logic
   */
  private async makeRequest(
    messages: OpenRouterMessage[],
    config: Partial<OpenRouterConfig> = {}
  ): Promise<string> {
    await this.initialize();

    if (!this.apiKey) {
      throw new Error('API key not available after initialization');
    }

    const requestConfig: OpenRouterConfig = {
      model: config.model || this.model,
      temperature: config.temperature ?? 0.8,
      maxTokens: config.maxTokens ?? 1000,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': process.env.FRONTEND_URL || 'https://mysticoracle.com',
            'X-Title': 'MysticOracle',
          },
          body: JSON.stringify({
            model: requestConfig.model,
            messages,
            temperature: requestConfig.temperature,
            max_tokens: requestConfig.maxTokens,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();

          // Log detailed error information
          console.error('[OpenRouterService] API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            attempt: attempt + 1,
            maxRetries: this.retryConfig.maxRetries,
          });

          // Handle specific error cases
          if (response.status === 401) {
            throw new Error('AI service authentication failed. Please check API key.');
          } else if (response.status === 402) {
            throw new Error('AI service credits exhausted. Please contact support.');
          } else if (
            this.isRetryableError(response.status) &&
            attempt < this.retryConfig.maxRetries
          ) {
            // Retry on 429 or 5xx errors
            const delay = this.calculateBackoffDelay(attempt);
            console.log(
              `[OpenRouterService] Retrying after ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`
            );
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else if (response.status === 429) {
            throw new Error('AI service rate limited. Please try again in a moment.');
          }

          throw new Error(`AI service error (${response.status}). Please try again.`);
        }

        const data = (await response.json()) as OpenRouterResponse;
        const content = data.choices[0]?.message?.content;

        if (!content) {
          throw new Error('No content in AI response');
        }

        // Log token usage if available
        if (data.usage) {
          console.log('[OpenRouterService] Token usage:', {
            prompt: data.usage.prompt_tokens,
            completion: data.usage.completion_tokens,
            total: data.usage.total_tokens,
          });
        }

        return content;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Don't retry on authentication or configuration errors
        if (
          lastError.message.includes('authentication') ||
          lastError.message.includes('credits exhausted') ||
          lastError.message.includes('not configured')
        ) {
          throw lastError;
        }

        // Retry on network errors
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(
            `[OpenRouterService] Network error, retrying after ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    // All retries exhausted
    throw lastError || new Error('Failed to generate AI response after multiple attempts');
  }

  /**
   * Generate a tarot reading
   */
  async generateTarotReading(
    prompt: string,
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<string> {
    return this.makeRequest([{ role: 'user', content: prompt }], {
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 2500,
    });
  }

  /**
   * Generate a tarot follow-up answer
   */
  async generateTarotFollowUp(
    prompt: string,
    conversationHistory: OpenRouterMessage[],
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<string> {
    return this.makeRequest([...conversationHistory, { role: 'user', content: prompt }], {
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 500,
    });
  }

  /**
   * Generate a horoscope
   */
  async generateHoroscope(
    prompt: string,
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<string> {
    return this.makeRequest([{ role: 'user', content: prompt }], {
      temperature: options.temperature ?? 0.8,
      maxTokens: options.maxTokens ?? 1000,
    });
  }

  /**
   * Generate a horoscope follow-up answer
   */
  async generateHoroscopeFollowUp(
    prompt: string,
    conversationHistory: OpenRouterMessage[],
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<string> {
    return this.makeRequest([...conversationHistory, { role: 'user', content: prompt }], {
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 400,
    });
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();

// Export type for use in other modules
export type { OpenRouterMessage };

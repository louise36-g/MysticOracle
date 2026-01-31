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

// Timeout for OpenRouter API requests (30 seconds)
const REQUEST_TIMEOUT_MS = 30000;

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
    console.log('[OpenRouterService] makeRequest called, initializing...');
    await this.initialize();
    console.log('[OpenRouterService] Initialized, model:', this.model);

    if (!this.apiKey) {
      throw new Error('API key not available after initialization');
    }

    const requestConfig: OpenRouterConfig = {
      model: config.model || this.model,
      temperature: config.temperature ?? 0.8,
      maxTokens: config.maxTokens ?? 1000,
    };

    console.log('[OpenRouterService] Config:', {
      model: requestConfig.model,
      maxTokens: requestConfig.maxTokens,
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(
          '[OpenRouterService] Attempt',
          attempt + 1,
          '- sending request with',
          REQUEST_TIMEOUT_MS,
          'ms timeout...'
        );
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('[OpenRouterService] Timeout reached, aborting...');
          controller.abort();
        }, REQUEST_TIMEOUT_MS);

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
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

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
          } else if (response.status === 404) {
            throw new Error(
              `AI model not found: ${requestConfig.model}. Please check AI_MODEL setting.`
            );
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
        console.log(
          '[OpenRouterService] Response status:',
          response.status,
          'finish_reason:',
          data.choices[0]?.finish_reason
        );

        let content = data.choices[0]?.message?.content;

        // Handle reasoning models that put content in reasoning field instead of content
        if (!content && data.choices[0]?.message) {
          const message = data.choices[0].message as Record<string, unknown>;
          const reasoning = message.reasoning as string | undefined;

          if (reasoning) {
            console.log(
              '[OpenRouterService] No content but found reasoning field, length:',
              reasoning.length
            );
            console.log(
              '[OpenRouterService] Reasoning preview (first 500 chars):',
              reasoning.substring(0, 500)
            );

            // Try to extract quoted paragraphs first (the model may draft in quotes)
            const quotedTexts: string[] = [];
            const quoteMatches = reasoning.matchAll(/"([^"]{50,})"/g);
            for (const match of quoteMatches) {
              quotedTexts.push(match[1]);
            }

            if (quotedTexts.length >= 2) {
              // Combine the extracted paragraphs with proper formatting
              content = quotedTexts
                .map((text, i) => {
                  if (i === 0) return `**The Card's Energy**\n\n${text}`;
                  if (i === 1) return `**Guidance**\n\n${text}`;
                  return text;
                })
                .join('\n\n');
              console.log(
                '[OpenRouterService] Extracted',
                quotedTexts.length,
                'paragraphs from quoted text'
              );
            } else {
              // Fallback: look for section headers in the reasoning
              const energyMatch = reasoning.match(
                /\*\*(?:The )?Card'?s? Energy\*\*[\s\n]*([^*]+?)(?=\*\*|$)/i
              );
              const guidanceMatch = reasoning.match(
                /\*\*(?:Today'?s? )?Guidance\*\*[\s\n]*([^*]+?)(?=\*\*|$)/i
              );

              if (energyMatch || guidanceMatch) {
                const parts: string[] = [];
                if (energyMatch) parts.push(`**The Card's Energy**\n\n${energyMatch[1].trim()}`);
                if (guidanceMatch) parts.push(`**Guidance**\n\n${guidanceMatch[1].trim()}`);
                content = parts.join('\n\n');
                console.log('[OpenRouterService] Extracted content using section header matching');
              } else {
                // Last resort: use the last substantial paragraph from reasoning
                const paragraphs = reasoning.split(/\n\n+/).filter(p => p.trim().length > 100);
                if (paragraphs.length > 0) {
                  const lastParagraph = paragraphs[paragraphs.length - 1].trim();
                  content = `**Guidance**\n\n${lastParagraph}`;
                  console.log('[OpenRouterService] Used last paragraph as fallback content');
                }
              }
            }
          }
        }

        if (!content) {
          console.error('[OpenRouterService] No usable content in response');
          const message = data.choices[0]?.message as Record<string, unknown>;
          if (message?.reasoning) {
            console.error(
              '[OpenRouterService] Reasoning was present but could not extract content'
            );
          }
          throw new Error('No content in AI response');
        }

        // Detect and reject content that looks like AI planning/reasoning instead of actual output
        const planningPatterns = [
          /^Let's (think|write|craft|aim|do|pick|create)/im,
          /^We need to/im,
          /^Paragraph \d+:/im,
          /Word count:/im,
          /^\d+-\d+ words/im,
          /Let's check for forbidden/im,
          /Check for forbidden words/im,
          /Use specific language\./im,
          /each \d+-\d+ words/im,
          /We must not use/im,
          /Also avoid/im,
          /avoid "[^"]+"/im,
          /^\*\*Guidance\*\*\s+We/im,
        ];

        const looksLikePlanning = planningPatterns.some(pattern => pattern.test(content));
        if (looksLikePlanning) {
          console.error(
            '[OpenRouterService] Content appears to be AI planning/reasoning, not actual output'
          );
          console.error('[OpenRouterService] Content preview:', content.substring(0, 300));
          throw new Error(
            'AI returned planning/reasoning instead of actual content. Please retry.'
          );
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
        console.error('[OpenRouterService] Caught error:', lastError.name, lastError.message);

        // Handle timeout (abort) errors - check multiple ways AbortError can manifest
        const isAbortError =
          lastError.name === 'AbortError' ||
          (error as NodeJS.ErrnoException)?.code === 'ABORT_ERR' ||
          lastError.message.includes('aborted');

        if (isAbortError) {
          console.error('[OpenRouterService] Request timed out after', REQUEST_TIMEOUT_MS, 'ms');
          throw new Error('AI request timed out. Please try again.');
        }

        // Don't retry on authentication or configuration errors
        if (
          lastError.message.includes('authentication') ||
          lastError.message.includes('credits exhausted') ||
          lastError.message.includes('not configured') ||
          lastError.message.includes('timed out')
        ) {
          throw lastError;
        }

        // Retry on network errors
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(
            `[OpenRouterService] Network error: "${lastError.message}", retrying after ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`
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

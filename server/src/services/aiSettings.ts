/**
 * AI Settings Service - Phase 4: Environment Variables Only
 *
 * Simplified configuration using only environment variables.
 * Database-based configuration removed for security and simplicity.
 *
 * Required environment variables:
 * - OPENROUTER_API_KEY: OpenRouter API key
 * - AI_MODEL: AI model identifier (optional, defaults to free tier)
 */

interface AISettings {
  apiKey: string | null;
  model: string;
}

// Cache settings for 5 minutes to avoid recreating objects
let cachedSettings: AISettings | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const DEFAULT_MODEL = 'openai/gpt-oss-120b:free';

/**
 * Get AI settings from environment variables only
 */
export async function getAISettings(): Promise<AISettings> {
  const now = Date.now();

  // Return cached settings if still valid
  if (cachedSettings && now < cacheExpiry) {
    return cachedSettings;
  }

  // Read from environment variables only
  // Trim whitespace from API key to avoid authentication issues
  const rawApiKey = process.env.OPENROUTER_API_KEY || null;
  const apiKey = rawApiKey?.trim() || null;
  const model = process.env.AI_MODEL || DEFAULT_MODEL;

  // Log configuration for debugging
  console.log(`[AI Settings] API Key: ${apiKey ? 'configured' : 'NOT CONFIGURED'}`);
  console.log(`[AI Settings] Model: ${model}`);
  if (apiKey) {
    console.log(`[AI Settings] API Key prefix: ${apiKey.substring(0, 15)}...`);
  }

  cachedSettings = { apiKey, model };
  cacheExpiry = now + CACHE_TTL_MS;

  return cachedSettings;
}

/**
 * Clear the settings cache
 */
export function clearAISettingsCache(): void {
  cachedSettings = null;
  cacheExpiry = 0;
}

/**
 * Check if OpenRouter API is configured
 */
export async function isAIConfigured(): Promise<boolean> {
  const settings = await getAISettings();
  return !!settings.apiKey;
}

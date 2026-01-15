import prisma from '../db/prisma.js';

interface AISettings {
  apiKey: string | null;
  model: string;
}

// Cache settings for 5 minutes to avoid constant DB queries
let cachedSettings: AISettings | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get AI settings from environment variables (preferred) or database (fallback)
 * Environment variables take priority to ensure consistent configuration.
 *
 * Phase 1 of API Key Architecture Refactoring:
 * - Prioritize env vars over database to fix horoscope authentication
 * - Add logging to track configuration source
 */
export async function getAISettings(): Promise<AISettings> {
  const now = Date.now();

  // Return cached settings if still valid
  if (cachedSettings && now < cacheExpiry) {
    return cachedSettings;
  }

  try {
    // Query database for settings (fallback only)
    const dbSettings = await prisma.systemSetting.findMany({
      where: { key: { in: ['OPENROUTER_API_KEY', 'AI_MODEL'] } },
    });
    const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));

    // Environment variables take priority over database
    // Trim whitespace from API key to avoid authentication issues
    const rawApiKey =
      process.env.OPENROUTER_API_KEY || settingsMap.get('OPENROUTER_API_KEY') || null;
    const apiKey = rawApiKey?.trim() || null;
    const model = process.env.AI_MODEL || settingsMap.get('AI_MODEL') || 'openai/gpt-oss-120b:free';

    // Log configuration source for debugging
    const apiKeySource = process.env.OPENROUTER_API_KEY
      ? 'environment'
      : settingsMap.get('OPENROUTER_API_KEY')
        ? 'database'
        : 'none';
    const modelSource = process.env.AI_MODEL
      ? 'environment'
      : settingsMap.get('AI_MODEL')
        ? 'database'
        : 'default';

    console.log(`[AI Settings] API Key source: ${apiKeySource}, Model source: ${modelSource}`);
    if (apiKey) {
      console.log(`[AI Settings] Using API key: ${apiKey.substring(0, 15)}...`);
    }

    cachedSettings = { apiKey, model };
    cacheExpiry = now + CACHE_TTL_MS;

    return cachedSettings;
  } catch (error) {
    console.error('Error fetching AI settings from database:', error);
    // Fall back to env vars if DB query fails
    const settings = {
      apiKey: process.env.OPENROUTER_API_KEY?.trim() || null,
      model: process.env.AI_MODEL || 'openai/gpt-oss-120b:free',
    };
    console.log('[AI Settings] Using environment variables (database query failed)');
    return settings;
  }
}

/**
 * Clear the settings cache (call after updating settings via admin)
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

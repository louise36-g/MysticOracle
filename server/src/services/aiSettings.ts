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
 * Get AI settings from database (preferred) or environment variables (fallback)
 * Database settings take priority when present.
 */
export async function getAISettings(): Promise<AISettings> {
  const now = Date.now();

  // Return cached settings if still valid
  if (cachedSettings && now < cacheExpiry) {
    return cachedSettings;
  }

  try {
    // Query database for settings
    const dbSettings = await prisma.systemSetting.findMany({
      where: { key: { in: ['OPENROUTER_API_KEY', 'AI_MODEL'] } }
    });
    const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));

    // Database values take priority over env vars
    const apiKey = settingsMap.get('OPENROUTER_API_KEY') || process.env.OPENROUTER_API_KEY || null;
    const model = settingsMap.get('AI_MODEL') || process.env.AI_MODEL || 'openai/gpt-oss-120b:free';

    cachedSettings = { apiKey, model };
    cacheExpiry = now + CACHE_TTL_MS;

    return cachedSettings;
  } catch (error) {
    console.error('Error fetching AI settings from database:', error);
    // Fall back to env vars if DB query fails
    return {
      apiKey: process.env.OPENROUTER_API_KEY || null,
      model: process.env.AI_MODEL || 'openai/gpt-oss-120b:free'
    };
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

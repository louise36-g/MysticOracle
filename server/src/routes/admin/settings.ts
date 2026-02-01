/**
 * Admin Routes - System Settings, Health & Services
 */

import { Router, prisma, clearAISettingsCache, updateSettingSchema } from './shared.js';

const router = Router();

// ============================================
// SYSTEM CONFIGURATION
// ============================================

// Get current AI configuration (checks DB settings first, then env vars)
router.get('/config/ai', async (req, res) => {
  try {
    // Check database for overridden settings
    const dbSettings = await prisma.systemSetting.findMany({
      where: { key: { in: ['AI_MODEL', 'OPENROUTER_API_KEY'] } },
    });
    const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));

    const model = settingsMap.get('AI_MODEL') || process.env.AI_MODEL || 'openai/gpt-4o-mini';
    const hasApiKey = !!(settingsMap.get('OPENROUTER_API_KEY') || process.env.OPENROUTER_API_KEY);

    res.json({
      model,
      provider: process.env.AI_PROVIDER || 'openrouter',
      hasApiKey,
    });
  } catch (error) {
    console.error('Error fetching AI config:', error);
    res.status(500).json({ error: 'Failed to fetch AI config' });
  }
});

// ============================================
// SERVICE CONFIGURATION
// ============================================

router.get('/services', async (req, res) => {
  try {
    const systemHealthService = req.container.resolve('systemHealthService');
    const services = await systemHealthService.getServiceStatuses();
    res.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// ============================================
// SYSTEM HEALTH
// ============================================

router.get('/health', async (req, res) => {
  try {
    const systemHealthService = req.container.resolve('systemHealthService');
    const health = await systemHealthService.checkHealth();
    res.json(health);
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({ error: 'Failed to check health' });
  }
});

// ============================================
// SYSTEM SETTINGS CRUD
// ============================================

// Get all editable settings
router.get('/', async (req, res) => {
  try {
    const getSettingsUseCase = req.container.resolve('getSettingsUseCase');
    const result = await getSettingsUseCase.execute();
    res.json(result);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update a setting
router.post('/', async (req, res) => {
  try {
    const { key, value } = updateSettingSchema.parse(req.body);

    // Handle empty value (delete setting to fall back to env var)
    if (value === '') {
      await prisma.systemSetting.deleteMany({ where: { key } });
      if (key === 'OPENROUTER_API_KEY' || key === 'AI_MODEL') {
        clearAISettingsCache();
      }
      return res.json({ success: true });
    }

    const updateSettingUseCase = req.container.resolve('updateSettingUseCase');
    const result = await updateSettingUseCase.execute({ key, value });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Clear AI settings cache if an AI-related setting was changed
    if (key === 'OPENROUTER_API_KEY' || key === 'AI_MODEL') {
      clearAISettingsCache();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

export default router;

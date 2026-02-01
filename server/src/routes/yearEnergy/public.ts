/**
 * Year Energy Routes - Public Endpoints
 *
 * Endpoints:
 * - GET /current - Get current year's energy
 * - GET /:year - Get specific year's energy
 */

import { Router, prisma, yearParamSchema, MAJOR_ARCANA } from './shared.js';

const router = Router();

// ============================================
// CURRENT YEAR ENERGY
// ============================================

/**
 * GET /api/v1/year-energy/current
 * Convenience endpoint to get current year's energy
 * NOTE: Must be defined BEFORE /:year to avoid route conflict
 */
router.get('/current', async (req, res) => {
  const currentYear = new Date().getFullYear();
  const language = (req.query.language as string) || 'en';

  try {
    const yearEnergy = await prisma.yearEnergy.findUnique({
      where: { year: currentYear },
    });

    if (!yearEnergy) {
      return res.status(404).json({
        error: 'Year energy not found',
        message: `No energy data available for year ${currentYear}`,
      });
    }

    const card = MAJOR_ARCANA[yearEnergy.yearCardId];

    res.json({
      year: yearEnergy.year,
      yearNumber: yearEnergy.yearNumber,
      yearCard: {
        id: yearEnergy.yearCardId,
        name: language === 'en' ? card?.name : card?.nameFr,
        element: language === 'en' ? yearEnergy.yearElement : card?.elementFr,
      },
      cyclePosition: yearEnergy.cyclePosition,
      themes: language === 'en' ? yearEnergy.themesEn : yearEnergy.themesFr,
      challenges: language === 'en' ? yearEnergy.challengesEn : yearEnergy.challengesFr,
      opportunities: language === 'en' ? yearEnergy.opportunitiesEn : yearEnergy.opportunitiesFr,
    });
  } catch (error) {
    console.error('[YearEnergy] Error fetching current year energy:', error);
    res.status(500).json({ error: 'Failed to fetch year energy' });
  }
});

// ============================================
// SPECIFIC YEAR ENERGY
// ============================================

/**
 * GET /api/v1/year-energy/:year
 * Get universal year energy for a specific year
 * Public endpoint
 */
router.get('/:year', async (req, res) => {
  try {
    const validation = yearParamSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid year parameter' });
    }

    const { year } = validation.data;
    const language = (req.query.language as string) || 'en';

    const yearEnergy = await prisma.yearEnergy.findUnique({
      where: { year },
    });

    if (!yearEnergy) {
      return res.status(404).json({
        error: 'Year energy not found',
        message: `No energy data available for year ${year}`,
      });
    }

    const card = MAJOR_ARCANA[yearEnergy.yearCardId];

    res.json({
      year: yearEnergy.year,
      yearNumber: yearEnergy.yearNumber,
      yearCard: {
        id: yearEnergy.yearCardId,
        name: language === 'en' ? card?.name : card?.nameFr,
        element: language === 'en' ? yearEnergy.yearElement : card?.elementFr,
      },
      cyclePosition: yearEnergy.cyclePosition,
      themes: language === 'en' ? yearEnergy.themesEn : yearEnergy.themesFr,
      challenges: language === 'en' ? yearEnergy.challengesEn : yearEnergy.challengesFr,
      opportunities: language === 'en' ? yearEnergy.opportunitiesEn : yearEnergy.opportunitiesFr,
    });
  } catch (error) {
    console.error('[YearEnergy] Error fetching year energy:', error);
    res.status(500).json({ error: 'Failed to fetch year energy' });
  }
});

export default router;

/**
 * Year Energy Routes - Public Endpoints
 *
 * Endpoints:
 * - GET /current - Get current year's energy
 * - GET /:year - Get specific year's energy
 */

import { Router, prisma, yearParamSchema, MAJOR_ARCANA } from './shared.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { NotFoundError } from '../../shared/errors/ApplicationError.js';

const router = Router();

// ============================================
// CURRENT YEAR ENERGY
// ============================================

/**
 * GET /api/v1/year-energy/current
 * Convenience endpoint to get current year's energy
 * NOTE: Must be defined BEFORE /:year to avoid route conflict
 */
router.get(
  '/current',
  asyncHandler(async (req, res) => {
    const currentYear = new Date().getFullYear();
    const language = (req.query.language as string) || 'en';

    const yearEnergy = await prisma.yearEnergy.findUnique({
      where: { year: currentYear },
    });

    if (!yearEnergy) {
      throw new NotFoundError('Year energy');
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
  })
);

// ============================================
// SPECIFIC YEAR ENERGY
// ============================================

/**
 * GET /api/v1/year-energy/:year
 * Get universal year energy for a specific year
 * Public endpoint
 */
router.get(
  '/:year',
  asyncHandler(async (req, res) => {
    const { year } = yearParamSchema.parse(req.params);
    const language = (req.query.language as string) || 'en';

    const yearEnergy = await prisma.yearEnergy.findUnique({
      where: { year },
    });

    if (!yearEnergy) {
      throw new NotFoundError('Year energy');
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
  })
);

export default router;

/**
 * Admin Routes - Dashboard Stats & Analytics
 */

import { Router, prisma } from './shared.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';

const router = Router();

// ============================================
// DASHBOARD STATS
// ============================================

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const adminStatsService = req.container.resolve('adminStatsService');
    const stats = await adminStatsService.getDashboardStats();
    res.json(stats);
  })
);

// ============================================
// READINGS ANALYTICS
// ============================================

router.get(
  '/readings/stats',
  asyncHandler(async (req, res) => {
    const [bySpreadType, recentReadings] = await Promise.all([
      prisma.reading.groupBy({
        by: ['spreadType'],
        _count: true,
      }),
      prisma.reading.findMany({
        select: {
          id: true,
          spreadType: true,
          creditCost: true,
          createdAt: true,
          user: { select: { username: true } },
          // Note: NOT including question or interpretation for privacy
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    res.json({
      bySpreadType,
      recentReadings,
    });
  })
);

// ============================================
// ANALYTICS
// ============================================

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const adminAnalyticsService = req.container.resolve('adminAnalyticsService');
    const analytics = await adminAnalyticsService.getAnalytics(7);
    res.json(analytics);
  })
);

export default router;

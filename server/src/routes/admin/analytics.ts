/**
 * Admin Routes - Dashboard Stats & Analytics
 */

import { Router, prisma } from './shared.js';

const router = Router();

// ============================================
// DASHBOARD STATS
// ============================================

router.get('/stats', async (req, res) => {
  try {
    const adminStatsService = req.container.resolve('adminStatsService');
    const stats = await adminStatsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================
// READINGS ANALYTICS
// ============================================

router.get('/readings/stats', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error fetching reading stats:', error);
    res.status(500).json({ error: 'Failed to fetch reading stats' });
  }
});

// ============================================
// ANALYTICS
// ============================================

router.get('/', async (req, res) => {
  try {
    const adminAnalyticsService = req.container.resolve('adminAnalyticsService');
    const analytics = await adminAnalyticsService.getAnalytics(7);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;

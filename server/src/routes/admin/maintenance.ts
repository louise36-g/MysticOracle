/**
 * Admin Routes - Cache, Maintenance & Error Logs
 */

import { Router, prisma, cacheService } from './shared.js';

const router = Router();

// ============================================
// ERROR LOG (in-memory)
// ============================================

interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  source: string;
  message: string;
  details?: string;
  userId?: string;
  path?: string;
}

// In-memory error log (last 100 entries)
const MAX_ERROR_LOG_SIZE = 100;
const errorLog: ErrorLogEntry[] = [];

// Helper to add an error to the log
export function logError(entry: Omit<ErrorLogEntry, 'id' | 'timestamp'>): void {
  const newEntry: ErrorLogEntry = {
    id: Math.random().toString(36).substring(2, 15),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  errorLog.unshift(newEntry);

  // Keep only the last N entries
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.pop();
  }
}

// Get error logs
router.get('/error-logs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, MAX_ERROR_LOG_SIZE);
  const level = req.query.level as string;
  const source = req.query.source as string;

  let filteredLogs = errorLog;

  if (level) {
    filteredLogs = filteredLogs.filter(log => log.level === level);
  }

  if (source) {
    filteredLogs = filteredLogs.filter(log =>
      log.source.toLowerCase().includes(source.toLowerCase())
    );
  }

  res.json({
    logs: filteredLogs.slice(0, limit),
    total: filteredLogs.length,
    maxSize: MAX_ERROR_LOG_SIZE,
  });
});

// Clear error logs
router.delete('/error-logs', (req, res) => {
  errorLog.length = 0;
  res.json({ success: true, message: 'Error logs cleared' });
});

// ============================================
// CACHE MANAGEMENT
// ============================================

// GET /api/admin/cache/stats
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = cacheService.getStats();
    const lastPurge = cacheService.getLastPurge();

    res.json({
      ...stats,
      lastPurge: lastPurge?.toISOString() || null,
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

// POST /api/admin/cache/purge
router.post('/cache/purge', async (req, res) => {
  try {
    await cacheService.flush();
    res.json({ success: true, message: 'Cache purged successfully' });
  } catch (error) {
    console.error('Error purging cache:', error);
    res.status(500).json({ error: 'Failed to purge cache' });
  }
});

// ============================================
// MAINTENANCE
// ============================================

// POST /api/admin/maintenance/normalize-readings
router.post('/normalize-readings', async (req, res) => {
  try {
    // Import dynamically to avoid circular dependency issues
    const { normalizeExistingReadings } = await import('../../jobs/normalizeReadingCards.js');
    const result = await normalizeExistingReadings();

    res.json({
      success: true,
      ...result,
      message: `Normalized ${result.processed} readings (${result.skipped} skipped, ${result.errors} errors)`,
    });
  } catch (error) {
    console.error('Error normalizing readings:', error);
    res.status(500).json({ error: 'Failed to normalize readings' });
  }
});

// POST /api/admin/maintenance/cleanup-horoscopes
router.post('/cleanup-horoscopes', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.horoscopeCache.deleteMany({
      where: { date: { lt: sevenDaysAgo } },
    });

    res.json({
      success: true,
      deleted: result.count,
      message: `Deleted ${result.count} old horoscope cache entries`,
    });
  } catch (error) {
    console.error('Error cleaning up horoscopes:', error);
    res.status(500).json({ error: 'Failed to cleanup horoscope cache' });
  }
});

export default router;

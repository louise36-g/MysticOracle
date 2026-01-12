import prisma from '../db/prisma.js';

/**
 * Cleanup old horoscope cache entries
 * Deletes entries older than 7 days to prevent database bloat
 */
export async function cleanupOldHoroscopes(): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const result = await prisma.horoscopeCache.deleteMany({
      where: {
        date: { lt: sevenDaysAgo }
      }
    });

    console.log(`[Horoscope Cleanup] Deleted ${result.count} old cache entries`);
    return result.count;
  } catch (error) {
    console.error('[Horoscope Cleanup] Error:', error);
    throw error;
  }
}

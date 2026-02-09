import prisma from '../db/prisma.js';

/**
 * Cleanup old horoscope cache entries
 * Deletes entries from yesterday and earlier (daily reset at midnight)
 */
export async function cleanupOldHoroscopes(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const result = await prisma.horoscopeCache.deleteMany({
      where: {
        date: { lt: today },
      },
    });

    console.log(
      `[Horoscope Cleanup] Deleted ${result.count} horoscope cache entries from before today`
    );
    return result.count;
  } catch (error) {
    console.error('[Horoscope Cleanup] Error:', error);
    throw error;
  }
}

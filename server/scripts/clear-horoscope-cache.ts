/**
 * Clear today's horoscope cache
 */
import prisma from '../src/db/prisma.js';

async function clearCache() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Clear ALL cached horoscopes
  const result = await prisma.horoscopeCache.deleteMany({});

  console.log(`✅ Cleared ${result.count} cached horoscopes from database`);
  console.log('Note: In-memory cache will clear on server restart');

  await prisma.$disconnect();
}

clearCache().catch(console.error);

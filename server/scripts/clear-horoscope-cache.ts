/**
 * Clear all horoscope caches to force regeneration with new prompt
 *
 * Run with: npx tsx scripts/clear-horoscope-cache.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // Delete all cached horoscopes from database
  const result = await prisma.horoscopeCache.deleteMany({});

  console.log(`Deleted ${result.count} cached horoscopes from database`);
  console.log('Memory cache will clear on server restart or after TTL expires.');
  console.log('New horoscopes will be generated with the updated prompt.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

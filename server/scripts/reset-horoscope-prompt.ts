/**
 * One-time script to delete the horoscope prompt from DB
 * so it falls back to the new default in prompts.ts
 *
 * Run with: npx tsx scripts/reset-horoscope-prompt.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  }),
});

async function main() {
  const result = await prisma.systemSetting.deleteMany({
    where: { key: 'PROMPT_HOROSCOPE' },
  });

  console.log(`Deleted ${result.count} row(s) for PROMPT_HOROSCOPE`);
  console.log('The new default prompt will now be used.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

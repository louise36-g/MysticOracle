/**
 * One-time script to delete the horoscope prompt from DB
 * so it falls back to the new default in prompts.ts
 *
 * Run with: npx tsx scripts/reset-horoscope-prompt.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

/**
 * Force-upserts the yes/no clarify prompt to DB so the new
 * "Deeper Picture" framing takes effect immediately.
 *
 * Run with: DATABASE_URL="..." npx tsx scripts/update-clarify-prompt.ts
 */

import prisma from '../src/db/prisma.js';
import { DEFAULT_PROMPTS } from '../src/shared/constants/prompts.js';

const KEY = 'PROMPT_YESNO_THREE_CARD';

const prompt = DEFAULT_PROMPTS.find(p => p.key === KEY);
if (!prompt) {
  console.error(`  ✗ Not found in DEFAULT_PROMPTS: ${KEY}`);
  process.exit(1);
}

await prisma.systemSetting.upsert({
  where: { key: KEY },
  create: { key: KEY, value: prompt.defaultValue },
  update: { value: prompt.defaultValue },
});

console.log(`  ✓ Upserted: ${KEY} (${prompt.defaultValue.length} chars)`);
console.log('\nDone. Restart the server (or wait 5 min for cache TTL) for changes to take effect.');
await prisma.$disconnect();

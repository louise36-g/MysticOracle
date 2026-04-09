/**
 * Resets the PROMPT_YESNO_THREE_CARD database entry to the updated default.
 * Run after deploying prompt text improvements:
 *   npx tsx scripts/reset-yesno-prompt.ts
 */

import prisma from '../src/db/prisma.js';
import { getDefaultPrompt } from '../src/shared/constants/prompts.js';

const KEY = 'PROMPT_YESNO_THREE_CARD';

const def = getDefaultPrompt(KEY);
if (!def) {
  console.error(`Prompt definition not found: ${KEY}`);
  process.exit(1);
}

await prisma.systemSetting.upsert({
  where: { key: KEY },
  update: { value: def.defaultValue },
  create: {
    key: KEY,
    value: def.defaultValue,
    isSecret: false,
    description: def.description,
  },
});

console.log(`✓ ${KEY} updated in database`);
await prisma.$disconnect();

/**
 * Generate TypeScript seed data from extracted translations
 *
 * Reads: scripts/extracted-translations.json
 * Writes: scripts/seed-data-additions.txt
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Constants
const INPUT_FILE = 'scripts/extracted-translations.json';
const OUTPUT_FILE = 'scripts/seed-data-additions.txt';
const MAX_COMMENT_LENGTH = 50;

interface Translation {
  key: string;
  en: string;
  fr: string;
  file: string;
  line: number;
}

interface ExtractedData {
  translations: Translation[];
}

/**
 * Escape special characters for TypeScript string literals
 */
function escapeString(text: string): string {
  return text
    .replace(/\\/g, '\\\\')  // Backslashes
    .replace(/'/g, "\\'")    // Single quotes
    .replace(/\n/g, '\\n')   // Newlines
    .replace(/\r/g, '\\r')   // Carriage returns
    .replace(/\t/g, '\\t');  // Tabs
}

/**
 * Format file location comment
 */
function formatComment(file: string, line: number): string {
  const location = `${file}:${line}`;
  if (location.length > MAX_COMMENT_LENGTH) {
    return `${location.substring(0, MAX_COMMENT_LENGTH - 3)}...`;
  }
  return location;
}

/**
 * Generate TypeScript entry for translation
 */
function generateEntry(translation: Translation): string {
  const { key, en, fr, file, line } = translation;
  const escapedEn = escapeString(en);
  const escapedFr = escapeString(fr);
  const comment = formatComment(file, line);

  return `      '${key}': { en: '${escapedEn}', fr: '${escapedFr}' }, // ${comment}`;
}

/**
 * Main generator function
 */
function generateSeedData(): void {
  const inputPath = join(process.cwd(), INPUT_FILE);
  const outputPath = join(process.cwd(), OUTPUT_FILE);

  // Read input file
  const jsonContent = readFileSync(inputPath, 'utf-8');
  const data: ExtractedData = JSON.parse(jsonContent);

  // Generate seed entries
  const entries = data.translations
    .map(generateEntry)
    .join('\n');

  // Prepare output with instructions
  const output = [
    '// ============================================',
    '// EXTRACTED TRANSLATIONS - AUTO-GENERATED',
    '// ============================================',
    '// Copy the following lines and paste them into server/src/routes/translations.ts',
    '// Location: Inside defaultTranslations object, BEFORE the closing brace (line ~1027)',
    '// Preserve existing translations, add these new ones',
    '',
    entries,
    '',
    `// Total: ${data.translations.length} translations added`,
  ].join('\n');

  // Write output
  writeFileSync(outputPath, output, 'utf-8');

  // Print summary
  console.log('✅ Seed data generation complete!');
  console.log('');
  console.log(`📊 Statistics:`);
  console.log(`   - Input file:  ${INPUT_FILE}`);
  console.log(`   - Output file: ${OUTPUT_FILE}`);
  console.log(`   - Translations: ${data.translations.length}`);
  console.log('');
  console.log(`📋 Next steps:`);
  console.log(`   1. Open server/src/routes/translations.ts`);
  console.log(`   2. Find the defaultTranslations object (around line 380)`);
  console.log(`   3. Scroll to BEFORE the closing brace (line ~1027)`);
  console.log(`   4. Paste contents of ${OUTPUT_FILE}`);
  console.log(`   5. Verify no duplicate keys with existing translations`);
  console.log('');
}

// Run generator
try {
  generateSeedData();
} catch (error) {
  console.error('❌ Error generating seed data:', error);
  process.exit(1);
}

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
const ELLIPSIS_LENGTH = 3; // Length of '...'
const TARGET_FILE_LINE_START = 380;
const TARGET_FILE_LINE_END = 1027;

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
    return `${location.substring(0, MAX_COMMENT_LENGTH - ELLIPSIS_LENGTH)}...`;
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
 * Read and parse translations from input file
 */
function readTranslationsFile(): ExtractedData {
  const inputPath = join(process.cwd(), INPUT_FILE);
  const jsonContent = readFileSync(inputPath, 'utf-8');
  return JSON.parse(jsonContent);
}

/**
 * Format translations to TypeScript entries
 */
function formatSeedEntries(translations: Translation[]): string {
  return translations.map(generateEntry).join('\n');
}

/**
 * Write output files with seed data
 */
function writeSeedFiles(entries: string, count: number): void {
  const outputPath = join(process.cwd(), OUTPUT_FILE);

  const output = [
    '// ============================================',
    '// EXTRACTED TRANSLATIONS - AUTO-GENERATED',
    '// ============================================',
    '// Copy the following lines and paste them into server/src/routes/translations.ts',
    `// Location: Inside defaultTranslations object, BEFORE the closing brace (line ~${TARGET_FILE_LINE_END})`,
    '// Preserve existing translations, add these new ones',
    '',
    entries,
    '',
    `// Total: ${count} translations added`,
  ].join('\n');

  writeFileSync(outputPath, output, 'utf-8');
}

/**
 * Print generation summary and next steps
 */
function printGenerationSummary(count: number): void {
  console.log('✅ Seed data generation complete!');
  console.log('');
  console.log(`📊 Statistics:`);
  console.log(`   - Input file:  ${INPUT_FILE}`);
  console.log(`   - Output file: ${OUTPUT_FILE}`);
  console.log(`   - Translations: ${count}`);
  console.log('');
  console.log(`📋 Next steps:`);
  console.log(`   1. Open server/src/routes/translations.ts`);
  console.log(`   2. Find the defaultTranslations object (around line ${TARGET_FILE_LINE_START})`);
  console.log(`   3. Scroll to BEFORE the closing brace (line ~${TARGET_FILE_LINE_END})`);
  console.log(`   4. Paste contents of ${OUTPUT_FILE}`);
  console.log(`   5. Verify no duplicate keys with existing translations`);
  console.log('');
}

/**
 * Main generator function - orchestrates the seed data generation process
 */
function generateSeedData(): void {
  const data = readTranslationsFile();
  const entries = formatSeedEntries(data.translations);
  writeSeedFiles(entries, data.translations.length);
  printGenerationSummary(data.translations.length);
}

// Run generator
try {
  generateSeedData();
} catch (error) {
  console.error('❌ Error generating seed data:', error);
  process.exit(1);
}

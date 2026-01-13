import * as fs from 'fs';
import * as path from 'path';

interface Translation {
  key: string;
  en: string;
  fr: string;
  file: string;
  line: number;
}

interface ExtractionResult {
  translations: Translation[];
  summary: {
    total: number;
    byFile: Record<string, number>;
  };
}

interface TranslationMatch {
  englishText: string;
  frenchText: string;
  lineNumber: number;
}

// Constants
const SCAN_DIRECTORIES = ['components', 'services', 'context'];
const SCAN_ROOT_FILES = ['App.tsx'];
const FILE_EXTENSIONS = ['.tsx', '.ts'];
const TERNARY_PATTERN = /language\s*===\s*['"]en['"]\s*\?\s*['"`]((?:[^'"`\\]|\\.)+)['"`]\s*:\s*['"`]((?:[^'"`\\]|\\.)+)['"`]/g;
const OUTPUT_FILE_PATH = 'scripts/extracted-translations.json';
const MAX_KEY_WORDS = 3;
const INITIAL_SUFFIX_NUMBER = 2;
const TOP_FILES_TO_DISPLAY = 10;
const LINE_NUMBER_OFFSET = 1;

function unescapeText(text: string): string {
  return text.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

function extractTranslationsFromLine(
  line: string,
  lineNumber: number
): TranslationMatch[] {
  const matches: TranslationMatch[] = [];
  const regex = new RegExp(TERNARY_PATTERN);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    matches.push({
      englishText: unescapeText(match[1]),
      frenchText: unescapeText(match[2]),
      lineNumber
    });
  }

  return matches;
}

function readFileLines(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n');
}

function getComponentNameFromPath(filePath: string): string {
  const parts = filePath.split(path.sep);
  const fileName = parts[parts.length - 1].replace(/\.(tsx?|jsx?)$/, '');
  return fileName;
}

function getModuleNameFromPath(filePath: string): string {
  const parts = filePath.split(path.sep);

  if (parts.includes('components')) {
    const componentIndex = parts.indexOf('components');
    if (componentIndex + 1 < parts.length && parts[componentIndex + 1] !== parts[parts.length - 1].replace(/\.(tsx?|jsx?)$/, '')) {
      return parts[componentIndex + 1];
    }
    return 'components';
  }

  if (parts.includes('services')) return 'services';
  if (parts.includes('context')) return 'context';

  return 'app';
}

function generateSemanticKey(
  filePath: string,
  englishText: string,
  existingKeys: Set<string>
): string {
  const moduleName = getModuleNameFromPath(filePath);
  const componentName = getComponentNameFromPath(filePath);

  const baseKey = createBaseKey(englishText);
  const fullKey = `${moduleName}.${componentName}.${baseKey}`;

  return ensureUniqueKey(fullKey, existingKeys);
}

function createBaseKey(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, MAX_KEY_WORDS)
    .join('_');

  return normalized || 'text';
}

function ensureUniqueKey(
  key: string,
  existingKeys: Set<string>
): string {
  if (!existingKeys.has(key)) {
    return key;
  }

  let counter = INITIAL_SUFFIX_NUMBER;
  while (existingKeys.has(`${key}_${counter}`)) {
    counter++;
  }

  return `${key}_${counter}`;
}

function createTranslation(
  filePath: string,
  match: TranslationMatch,
  key: string
): Translation {
  return {
    key,
    en: match.englishText,
    fr: match.frenchText,
    file: filePath,
    line: match.lineNumber
  };
}

function processLineMatches(
  filePath: string,
  matches: TranslationMatch[],
  existingKeys: Set<string>
): Translation[] {
  return matches.map(match => {
    const key = generateSemanticKey(filePath, match.englishText, existingKeys);
    existingKeys.add(key);
    return createTranslation(filePath, match, key);
  });
}

function extractFromFile(
  filePath: string,
  existingKeys: Set<string>
): Translation[] {
  const lines = readFileLines(filePath);
  const translations: Translation[] = [];

  lines.forEach((line, index) => {
    const matches = extractTranslationsFromLine(line, index + LINE_NUMBER_OFFSET);
    translations.push(...processLineMatches(filePath, matches, existingKeys));
  });

  return translations;
}

function shouldScanFile(fileName: string): boolean {
  return FILE_EXTENSIONS.some(ext => fileName.endsWith(ext));
}

function processDirectoryEntry(
  entry: fs.Dirent,
  dirPath: string,
  existingKeys: Set<string>
): Translation[] {
  const fullPath = path.join(dirPath, entry.name);

  if (entry.isDirectory()) {
    return scanDirectory(fullPath, existingKeys);
  }

  if (entry.isFile() && shouldScanFile(entry.name)) {
    return extractFromFile(fullPath, existingKeys);
  }

  return [];
}

function scanDirectory(
  dirPath: string,
  existingKeys: Set<string>
): Translation[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const translations: Translation[] = [];

  entries.forEach(entry => {
    translations.push(...processDirectoryEntry(entry, dirPath, existingKeys));
  });

  return translations;
}

function scanRootFiles(existingKeys: Set<string>): Translation[] {
  const translations: Translation[] = [];

  SCAN_ROOT_FILES.forEach(fileName => {
    if (fs.existsSync(fileName)) {
      translations.push(...extractFromFile(fileName, existingKeys));
    }
  });

  return translations;
}

function buildSummary(translations: Translation[]): ExtractionResult['summary'] {
  const byFile: Record<string, number> = {};

  translations.forEach(translation => {
    byFile[translation.file] = (byFile[translation.file] || 0) + 1;
  });

  return {
    total: translations.length,
    byFile
  };
}

function saveResults(result: ExtractionResult): void {
  const json = JSON.stringify(result, null, 2);
  fs.writeFileSync(OUTPUT_FILE_PATH, json, 'utf-8');
}

function extractAllTranslations(): ExtractionResult {
  const existingKeys = new Set<string>();
  const translations: Translation[] = [];

  translations.push(...scanRootFiles(existingKeys));

  SCAN_DIRECTORIES.forEach(dir => {
    translations.push(...scanDirectory(dir, existingKeys));
  });

  const summary = buildSummary(translations);

  return { translations, summary };
}

function printExtractionSummary(result: ExtractionResult): void {
  console.log(`✅ Extracted ${result.summary.total} translations`);
  console.log(`📁 Found in ${Object.keys(result.summary.byFile).length} files`);
  console.log(`💾 Saved to ${OUTPUT_FILE_PATH}\n`);
}

function printTopFiles(byFile: Record<string, number>, limit: number): void {
  console.log('Top files by translation count:');
  const sorted = Object.entries(byFile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);

  sorted.forEach(([file, count]) => {
    console.log(`  ${file}: ${count}`);
  });
}

function main(): void {
  console.log('🔍 Scanning codebase for translations...\n');

  const result = extractAllTranslations();

  saveResults(result);

  printExtractionSummary(result);
  printTopFiles(result.summary.byFile, TOP_FILES_TO_DISPLAY);
}

main();

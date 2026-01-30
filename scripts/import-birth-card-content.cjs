#!/usr/bin/env node
/**
 * Script to import birth card content from template TXT files into JSON data files
 *
 * Usage: node scripts/import-birth-card-content.js
 */

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../constants/templates');
const JSON_DIR = path.join(__dirname, '../constants/birthCards');

/**
 * Parse personality cards template (01-PERSONALITY-CARD-22.txt)
 */
function parsePersonalityTemplate(content) {
  const cards = [];

  // Split by card markers: "CARD X - NAME"
  const cardSections = content.split(/\n---\n\nCARD \d+ - /);

  // Skip the header section (first split)
  for (let i = 1; i < cardSections.length; i++) {
    const section = cardSections[i];

    // Extract card name from first line
    const firstLine = section.split('\n')[0];
    const nameMatch = firstLine.match(/^([A-Z\s]+)\s*\(([^)]+)\)/);
    if (!nameMatch) continue;

    const cardName = nameMatch[1].trim();
    const cardNameFr = nameMatch[2].trim();

    // Find English and French descriptions
    const englishMatch = section.match(/English Description:\n([\s\S]*?)(?=\n\nFrench Description:|\n---|\n\nCARD|$)/);
    const frenchMatch = section.match(/French Description:\n([\s\S]*?)(?=\n---|\n\nCARD|$)/);

    const descriptionEn = englishMatch ? englishMatch[1].trim() : '';
    const descriptionFr = frenchMatch ? frenchMatch[1].trim() : '';

    cards.push({
      cardName,
      cardNameFr,
      descriptionEn,
      descriptionFr
    });
  }

  return cards;
}

/**
 * Parse soul cards template (02-SOUL-CARD-9.txt)
 */
function parseSoulTemplate(content) {
  const cards = [];

  // Split by card markers
  const cardSections = content.split(/\n---\n\nCARD \d+ - /);

  for (let i = 1; i < cardSections.length; i++) {
    const section = cardSections[i];

    const firstLine = section.split('\n')[0];
    const nameMatch = firstLine.match(/^([A-Z\s]+)\s*\(([^)]+)\)/);
    if (!nameMatch) continue;

    const cardName = nameMatch[1].trim();
    const cardNameFr = nameMatch[2].trim();

    const englishMatch = section.match(/English Description:\n([\s\S]*?)(?=\n\nFrench Description:|\n---|\n\nCARD|$)/);
    const frenchMatch = section.match(/French Description:\n([\s\S]*?)(?=\n---|\n\nCARD|$)/);

    const descriptionEn = englishMatch ? englishMatch[1].trim() : '';
    const descriptionFr = frenchMatch ? frenchMatch[1].trim() : '';

    cards.push({
      cardName,
      cardNameFr,
      descriptionEn,
      descriptionFr
    });
  }

  return cards;
}

/**
 * Parse birth card pairs template (03-BIRTH-CARD-PAIRS-13.txt)
 * Format: "PAIR 1: Personality 10 (Wheel of Fortune) + Soul 1 (Magician)"
 */
function parsePairsTemplate(content) {
  const pairs = [];

  // Split by pair markers: "PAIR X:"
  const pairSections = content.split(/\n---\n\nPAIR \d+:/);

  for (let i = 1; i < pairSections.length; i++) {
    const section = pairSections[i];

    // Extract pair info from first line: "Personality 10 (Wheel of Fortune) + Soul 1 (Magician)"
    const firstLine = section.split('\n')[0].trim();
    const pairMatch = firstLine.match(/Personality \d+ \(([^)]+)\) \+ Soul \d+ \(([^)]+)\)/i);
    if (!pairMatch) continue;

    const personalityName = pairMatch[1].trim();
    const soulName = pairMatch[2].trim();

    // Use "English Description:" not "English Dynamic:"
    const englishMatch = section.match(/English Description:\n([\s\S]*?)(?=\n\nFrench Description:|\n---|\n\nPAIR|$)/);
    const frenchMatch = section.match(/French Description:\n([\s\S]*?)(?=\n---|\n\nPAIR|$)/);

    const dynamicEn = englishMatch ? englishMatch[1].trim() : '';
    const dynamicFr = frenchMatch ? frenchMatch[1].trim() : '';

    pairs.push({
      personalityName,
      soulName,
      dynamicEn,
      dynamicFr
    });
  }

  return pairs;
}

/**
 * Parse unified birth cards template (04-UNIFIED-BIRTH-CARD-9.txt)
 * Format: "UNIFIED CARD 1 - THE MAGICIAN (Le Bateleur)"
 */
function parseUnifiedTemplate(content) {
  const cards = [];

  // Split by card markers: "UNIFIED CARD X - NAME"
  const cardSections = content.split(/\n---\n\nUNIFIED CARD \d+ - /);

  for (let i = 1; i < cardSections.length; i++) {
    const section = cardSections[i];

    const firstLine = section.split('\n')[0];
    const nameMatch = firstLine.match(/^([A-Z\s]+)\s*\(([^)]+)\)/);
    if (!nameMatch) continue;

    const cardName = nameMatch[1].trim();
    const cardNameFr = nameMatch[2].trim();

    const englishMatch = section.match(/English Description:\n([\s\S]*?)(?=\n\nFrench Description:|\n---|\nUNIFIED CARD|$)/);
    const frenchMatch = section.match(/French Description:\n([\s\S]*?)(?=\n---|\nUNIFIED CARD|$)/);

    const descriptionEn = englishMatch ? englishMatch[1].trim() : '';
    const descriptionFr = frenchMatch ? frenchMatch[1].trim() : '';

    cards.push({
      cardName,
      cardNameFr,
      descriptionEn,
      descriptionFr
    });
  }

  return cards;
}

/**
 * Update JSON file with parsed content
 */
function updateJsonFile(jsonPath, parsedContent, matchFn) {
  const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let updated = 0;

  for (const item of jsonContent) {
    const match = matchFn(item, parsedContent);
    if (match) {
      if (match.descriptionEn) {
        item.descriptionEn = match.descriptionEn;
        item.descriptionFr = match.descriptionFr;
        updated++;
      } else if (match.dynamicEn) {
        item.dynamicEn = match.dynamicEn;
        item.dynamicFr = match.dynamicFr;
        updated++;
      }
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2) + '\n');
  return updated;
}

// Main execution
console.log('Importing birth card content from templates...\n');

// 1. Personality Cards
try {
  const templatePath = path.join(TEMPLATES_DIR, '01-PERSONALITY-CARD-22.txt');
  const jsonPath = path.join(JSON_DIR, 'personalityCards.json');

  if (fs.existsSync(templatePath)) {
    const content = fs.readFileSync(templatePath, 'utf8');
    const parsed = parsePersonalityTemplate(content);
    console.log(`Parsed ${parsed.length} personality cards from template`);

    const updated = updateJsonFile(jsonPath, parsed, (item, parsed) => {
      return parsed.find(p =>
        p.cardName.toUpperCase().includes(item.cardName.toUpperCase().replace('THE ', '')) ||
        item.cardName.toUpperCase().includes(p.cardName.toUpperCase().replace('THE ', ''))
      );
    });
    console.log(`Updated ${updated} entries in personalityCards.json\n`);
  }
} catch (error) {
  console.error('Error processing personality cards:', error.message);
}

// 2. Soul Cards
try {
  const templatePath = path.join(TEMPLATES_DIR, '02-SOUL-CARD-9.txt');
  const jsonPath = path.join(JSON_DIR, 'soulCards.json');

  if (fs.existsSync(templatePath)) {
    const content = fs.readFileSync(templatePath, 'utf8');
    const parsed = parseSoulTemplate(content);
    console.log(`Parsed ${parsed.length} soul cards from template`);

    const updated = updateJsonFile(jsonPath, parsed, (item, parsed) => {
      return parsed.find(p =>
        p.cardName.toUpperCase().includes(item.cardName.toUpperCase().replace('THE ', '')) ||
        item.cardName.toUpperCase().includes(p.cardName.toUpperCase().replace('THE ', ''))
      );
    });
    console.log(`Updated ${updated} entries in soulCards.json\n`);
  }
} catch (error) {
  console.error('Error processing soul cards:', error.message);
}

// 3. Birth Card Pairs
try {
  const templatePath = path.join(TEMPLATES_DIR, '03-BIRTH-CARD-PAIRS-13.txt');
  const jsonPath = path.join(JSON_DIR, 'birthCardPairs.json');

  if (fs.existsSync(templatePath)) {
    const content = fs.readFileSync(templatePath, 'utf8');
    const parsed = parsePairsTemplate(content);
    console.log(`Parsed ${parsed.length} birth card pairs from template`);

    const updated = updateJsonFile(jsonPath, parsed, (item, parsed) => {
      return parsed.find(p => {
        const pNameNorm = p.personalityName.toUpperCase().replace('THE ', '');
        const sNameNorm = p.soulName.toUpperCase().replace('THE ', '');
        const itemPNorm = item.personalityName.toUpperCase().replace('THE ', '');
        const itemSNorm = item.soulName.toUpperCase().replace('THE ', '');
        return pNameNorm.includes(itemPNorm) || itemPNorm.includes(pNameNorm) ||
               sNameNorm.includes(itemSNorm) || itemSNorm.includes(sNameNorm);
      });
    });
    console.log(`Updated ${updated} entries in birthCardPairs.json\n`);
  }
} catch (error) {
  console.error('Error processing birth card pairs:', error.message);
}

// 4. Unified Birth Cards
try {
  const templatePath = path.join(TEMPLATES_DIR, '04-UNIFIED-BIRTH-CARD-9.txt');
  const jsonPath = path.join(JSON_DIR, 'unifiedBirthCards.json');

  if (fs.existsSync(templatePath)) {
    const content = fs.readFileSync(templatePath, 'utf8');
    const parsed = parseUnifiedTemplate(content);
    console.log(`Parsed ${parsed.length} unified birth cards from template`);

    const updated = updateJsonFile(jsonPath, parsed, (item, parsed) => {
      return parsed.find(p =>
        p.cardName.toUpperCase().includes(item.cardName.toUpperCase().replace('THE ', '')) ||
        item.cardName.toUpperCase().includes(p.cardName.toUpperCase().replace('THE ', ''))
      );
    });
    console.log(`Updated ${updated} entries in unifiedBirthCards.json\n`);
  }
} catch (error) {
  console.error('Error processing unified birth cards:', error.message);
}

console.log('Import complete!');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const templatePath = path.join(__dirname, '..', 'templates', '02-SOUL-CARD-9.txt');
const jsonPath = path.join(__dirname, '..', 'birthCards', 'soulCards.json');

// Read files
const template = fs.readFileSync(templatePath, 'utf8');
const cards = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Parse template - split by card sections
const cardSections = template.split(/---\s*\n/).filter(section => section.trim());

// Card number to cardId mapping for soul cards (1-9)
const cardNumberToId = {
  1: 1,   // The Magician
  2: 2,   // The High Priestess
  3: 3,   // The Empress
  4: 4,   // The Emperor
  5: 5,   // The Hierophant
  6: 6,   // The Lovers
  7: 7,   // The Chariot
  8: 8,   // Strength
  9: 9,   // The Hermit
};

// Known section headers for soul cards (English and French variants)
const knownHeaders = new Set([
  // English
  'Your Inner Essence',
  'Your Soul Gifts',
  'Your Shadow',
  'Living From Your Essence',
  // French - various capitalizations found in template
  'Votre Essence Intérieure',
  'Votre essence intérieure',
  'Vos dons d\'âme',
  'Vos Dons d\'Âme',
  'Vos Dons d\'âme',
  'Vos dons spirituels',
  'Vos Dons de l\'Âme',
  'Votre ombre',
  'Votre Ombre',
  'Vivre en accord avec son essence',
  'Vivre en accord avec son Essence',
  'Vivre en harmonie avec son essence',
  'Vivre en harmonie avec son Essence',
]);

// Process each section
cardSections.forEach(section => {
  // Skip the header section (template description)
  if (section.includes('SOUL CARD TEMPLATE')) {
    console.log('Skipping header section');
    return;
  }

  // Extract card number from header like "CARD 1 - THE MAGICIAN"
  const headerMatch = section.match(/CARD\s+(\d+)\s*-\s*([^\n(]+)/i);
  if (!headerMatch) {
    console.log('Could not find card header in section');
    return;
  }

  const cardNumber = parseInt(headerMatch[1]);
  const cardId = cardNumberToId[cardNumber];

  if (cardId === undefined) {
    console.log(`Unknown card number: ${cardNumber}`);
    return;
  }

  // Find English description - between "English Description:" and "French Description:"
  const englishMatch = section.match(/English Description:\s*\n([\s\S]*?)(?=French Description:|$)/i);
  const frenchMatch = section.match(/French Description:\s*\n([\s\S]*?)$/i);

  if (!englishMatch || !frenchMatch) {
    console.log(`Could not extract descriptions for card ${cardNumber}`);
    return;
  }

  let englishText = englishMatch[1].trim();
  let frenchText = frenchMatch[1].trim();

  // Convert section headers to HTML h2 tags
  const convertHeaders = (text) => {
    const lines = text.split('\n');
    return lines.map(line => {
      const trimmed = line.trim();
      // Only convert if it's a known header
      if (knownHeaders.has(trimmed)) {
        return `<h2 style="font-size: 1.5rem; font-weight: 600; color: #c4b5fd; text-align: center; margin: 1.5rem 0 0.75rem 0;">${trimmed}</h2>`;
      }
      return line;
    }).join('\n');
  };

  englishText = convertHeaders(englishText);
  frenchText = convertHeaders(frenchText);

  // Replace newlines with \n for JSON (paragraphs become double newlines)
  englishText = englishText.replace(/\n\n/g, '\n\n').replace(/\n(?!\n)/g, '\n');
  frenchText = frenchText.replace(/\n\n/g, '\n\n').replace(/\n(?!\n)/g, '\n');

  // Find the card in the JSON array
  const card = cards.find(c => c.cardId === cardId);
  if (card) {
    // Update the description fields with the new soul card content
    card.descriptionEn = englishText;
    card.descriptionFr = frenchText;
    console.log(`Updated card ${cardNumber} (${card.cardName})`);
  } else {
    console.log(`Card with id ${cardId} not found in JSON`);
  }
});

// Write updated JSON
fs.writeFileSync(jsonPath, JSON.stringify(cards, null, 2));
console.log('\nJSON file updated successfully!');

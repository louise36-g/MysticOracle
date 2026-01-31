import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const templatePath = path.join(__dirname, '..', 'templates', '01-PERSONALITY-CARD-22.txt');
const jsonPath = path.join(__dirname, '..', 'birthCards', 'personalityCards.json');

// Read files
const template = fs.readFileSync(templatePath, 'utf8');
const cards = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Parse template - split by card sections
const cardSections = template.split(/---\s*\n/).filter(section => section.trim());

// Card number to cardId mapping (22 = The Fool = cardId 0)
const cardNumberToId = {
  0: 0,   // The Fool
  1: 1,   // The Magician
  2: 2,   // The High Priestess
  3: 3,   // The Empress
  4: 4,   // The Emperor
  5: 5,   // The Hierophant
  6: 6,   // The Lovers
  7: 7,   // The Chariot
  8: 8,   // Strength
  9: 9,   // The Hermit
  10: 10, // Wheel of Fortune
  11: 11, // Justice
  12: 12, // The Hanged Man
  13: 13, // Death
  14: 14, // Temperance
  15: 15, // The Devil
  16: 16, // The Tower
  17: 17, // The Star
  18: 18, // The Moon
  19: 19, // The Sun
  20: 20, // Judgement
  21: 21, // The World
  22: 0   // Card 22 is The Fool (cardId 0)
};

// Process each section
cardSections.forEach(section => {
  // Extract card number from header like "CARD 0 - THE FOOL" or "CARD 22 - THE FOOL"
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
    // Match headers like "Your Outer Expression" or "Votre expression extérieure"
    return text.replace(/^([A-Z][A-Za-zÀ-ÿ\s']+)$/gm, (match) => {
      // Only convert if it looks like a section header (short line, title case)
      if (match.length < 50 && !match.includes('.')) {
        return `<h2 style="text-align: center;">${match}</h2>`;
      }
      return match;
    });
  };

  englishText = convertHeaders(englishText);
  frenchText = convertHeaders(frenchText);

  // Replace newlines with \n for JSON (paragraphs become double newlines)
  englishText = englishText.replace(/\n\n/g, '\n\n').replace(/\n(?!\n)/g, '\n');
  frenchText = frenchText.replace(/\n\n/g, '\n\n').replace(/\n(?!\n)/g, '\n');

  // Find the card in the JSON array
  const card = cards.find(c => c.cardId === cardId);
  if (card) {
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

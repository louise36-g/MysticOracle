// constants/cardImages.ts
// Mapping of card IDs to custom image filenames

// Use API URL for images hosted on backend server
// Strip '/api' suffix if present since images are served from root, not /api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const BASE_URL = API_URL.replace(/\/api$/, '');
const IMAGE_BASE_PATH = `${BASE_URL}/uploads/reading-cards-mini`;

// Major Arcana (0-21)
const MAJOR_ARCANA_IMAGES: Record<number, string> = {
  0: '00-the-fool.jpeg',
  1: '01-the-magician.jpeg',
  2: '02-the-high-priestess.jpeg',
  3: '03-the-empress.jpeg',
  4: '04-the-emperor.jpeg',
  5: '05-the-heirophant.jpeg',
  6: '06-the-lovers.jpeg',
  7: '07-the-chariot.jpeg',
  8: '08-strength.jpeg',
  9: '09-the-hermit.jpeg',
  10: '10-the-wheel-of-fortune.jpeg',
  11: '11-justice.jpeg',
  12: '12-the-hanged-man.jpeg',
  13: '13-death.jpg',
  14: '14-temperance.jpeg',
  15: '15-the-devil.jpg',
  16: '16-the-tower.jpeg',
  17: '17-the-star.jpg',
  18: '18-the-moon.jpg',
  19: '19-the-sun.jpeg',
  20: '20-judgement.jpeg',
  21: '21-the-world.jpeg',
};

// Minor Arcana - Wands (IDs 22-35)
// Order: Ace, 2-10, Page, Knight, Queen, King
const WANDS_IMAGES: Record<number, string> = {
  22: '01-ace-of-wands.jpeg',
  23: '02-of-wands.jpeg',
  24: '03-of-wands.jpeg',
  25: '04-of-wands.jpeg',
  26: '05-of-wands.jpeg',
  27: '06-of-wands.jpeg',
  28: '07-of-wands.jpg',
  29: '08-of-wands.jpeg',
  30: '09-of-wands.jpg',
  31: '10-of-wands.jpeg',
  32: '11-page-of-wands.jpeg',
  33: '12-knight-of-wands.jpeg',
  34: '13-queen-of-wands.jpeg',
  35: '14-king-of-wands.jpeg',
};

// Minor Arcana - Cups (IDs 36-49)
const CUPS_IMAGES: Record<number, string> = {
  36: '01-ace-of-cups.jpeg',
  37: '02-of-cups.jpeg',
  38: '03-of-cups.jpeg',
  39: '04-of-cups.jpeg',
  40: '05-of-cups.jpeg',
  41: '06-of-cups.jpeg',
  42: '07-of-cups.jpg',
  43: '08-of-cups.jpeg',
  44: '09-of-cups.jpeg',
  45: '10-of-cups.jpeg',
  46: '11-page-of-cups.jpeg',
  47: '12-knight-of-cups.jpeg',
  48: '13-queen-of-cups.jpeg',
  49: '14-king-of-cups.jpeg',
};

// Minor Arcana - Swords (IDs 50-63)
const SWORDS_IMAGES: Record<number, string> = {
  50: '01-ace-of-swords.jpeg',
  51: '02-of-swords.jpeg',
  52: '03-of-swords.jpeg',
  53: '04-of-swords.jpeg',
  54: '05-of-swords.jpeg',
  55: '06-of-swords.jpeg',
  56: '07-of-swords.jpeg',
  57: '08-of-swords.jpeg',
  58: '09-of-swords.jpeg',
  59: '10-of-swords.jpeg',
  60: '11-page-of-swords.jpeg',
  61: '12-knight-of-swords.jpeg',
  62: '13-queen-of-swords.jpeg',
  63: '14-king-of-swords.jpeg',
};

// Minor Arcana - Pentacles (IDs 64-77)
const PENTACLES_IMAGES: Record<number, string> = {
  64: '01-ace-of-pentacles.jpeg',
  65: '02-of-pentacles.jpeg',
  66: '03-of-pentacles.jpeg',
  67: '04-of-pentacles.jpeg',
  68: '05-of-pentacles.jpg',
  69: '06-of-pentacles.jpg',
  70: '07-of-pentacles.jpeg',
  71: '08-of-pentacles.jpg',
  72: '09-of-pentacles.jpeg',
  73: '10-of-pentacles.jpeg',
  74: '11-page-of-pentacles.jpeg',
  75: '12-knight-of-pentacles.jpeg',
  76: '12-queen-of-pentacles.jpeg', // File uses 12 prefix (naming inconsistency)
  77: '14-king-of-pentacles.jpeg',
};

// Combined mapping
export const CARD_IMAGES: Record<number, string> = {
  ...MAJOR_ARCANA_IMAGES,
  ...WANDS_IMAGES,
  ...CUPS_IMAGES,
  ...SWORDS_IMAGES,
  ...PENTACLES_IMAGES,
};

// Cache-busting version - increment when images are updated
const IMAGE_VERSION = '2026013001';

/**
 * Get the image URL for a card (upright version)
 * Includes cache-busting query param to force refresh when images change
 */
export function getCardImageUrl(cardId: number): string {
  const filename = CARD_IMAGES[cardId];
  if (!filename) {
    return ''; // Fallback - no image
  }
  return `${IMAGE_BASE_PATH}/${filename}?v=${IMAGE_VERSION}`;
}

/**
 * Get the reversed image URL for a card
 * Returns the reversed version if it exists, otherwise returns upright
 * Includes cache-busting query param
 */
export function getCardReversedImageUrl(cardId: number): string {
  const filename = CARD_IMAGES[cardId];
  if (!filename) {
    return '';
  }
  // Convert filename to reversed version
  // e.g., "00-the-fool.jpeg" -> "00-the-fool-reversed.jpeg"
  const ext = filename.substring(filename.lastIndexOf('.'));
  const baseName = filename.substring(0, filename.lastIndexOf('.'));
  return `${IMAGE_BASE_PATH}/${baseName}-reversed${ext}?v=${IMAGE_VERSION}`;
}

/**
 * Check if this is a Major Arcana card (for birth card readings)
 */
export function isMajorArcana(cardId: number): boolean {
  return cardId >= 0 && cardId <= 21;
}

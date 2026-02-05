// constants/cardImages.ts
// Mapping of card IDs to optimized WebP image filenames

// Use API URL for images hosted on backend server
// Strip '/api' suffix if present since images are served from root, not /api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const BASE_URL = API_URL.replace(/\/api$/, '');
const IMAGE_BASE_PATH = `${BASE_URL}/cards`;

// Major Arcana (0-21)
const MAJOR_ARCANA_IMAGES: Record<number, string> = {
  0: '00-the-fool.webp',
  1: '01-the-magician.webp',
  2: '02-the-high-priestess.webp',
  3: '03-the-empress.webp',
  4: '04-the-emporer.webp',
  5: '05-the-heirophant.webp',
  6: '06-the-lovers.webp',
  7: '07-the-chariot.webp',
  8: '08-strength.webp',
  9: '09-the-hermit.webp',
  10: '10-wheel-of-fortune.webp',
  11: '11-justice.webp',
  12: '12-the-hanged-man.webp',
  13: '13-death.webp',
  14: '14-temperance.webp',
  15: '15-the-devil.webp',
  16: '16-the-tower.webp',
  17: '17-the-star.webp',
  18: '18-the-moon.webp',
  19: '19-the-sun.webp',
  20: '20-judgement.webp',
  21: '21-the-world.webp',
};

// Minor Arcana - Wands (IDs 22-35)
// Order: Ace, 2-10, Page, Knight, Queen, King
const WANDS_IMAGES: Record<number, string> = {
  22: 'ace-of-wands.webp',
  23: '02-of-wands.webp',
  24: '03-of-wands.webp',
  25: '04-of-wands.webp',
  26: '05-of-wands.webp',
  27: '06-of-wands.webp',
  28: '07-of-wands.webp',
  29: '08-of-wands.webp',
  30: '09-of-wands.webp',
  31: '10-of-wands.webp',
  32: '11-page-of-wands.webp',
  33: '12-knight-of-wands.webp',
  34: '13-queen-of-wands.webp',
  35: '14-king-of-wands.webp',
};

// Minor Arcana - Cups (IDs 36-49)
const CUPS_IMAGES: Record<number, string> = {
  36: 'ace-of-cups.webp',
  37: '02-of-cups.webp',
  38: '03-of-cups.webp',
  39: '04-of-cups.webp',
  40: '05-of-cups.webp',
  41: '06-of-cups.webp',
  42: '07-of-cups.webp',
  43: '08-of-cups.webp',
  44: '09-of-cups.webp',
  45: '10-of-cups.webp',
  46: '11-page-of-cups.webp',
  47: '12-knight-of-cups.webp',
  48: '13-queen-of-cups.webp',
  49: '14-king-of-cups.webp',
};

// Minor Arcana - Swords (IDs 50-63)
const SWORDS_IMAGES: Record<number, string> = {
  50: 'ace-of-swords.webp',
  51: '02-of-swords.webp',
  52: '03-of-swords.webp',
  53: '04-of-swords.webp',
  54: '05-of-swords.webp',
  55: '06-of-swords.webp',
  56: '07-of-swords.webp',
  57: '08-of-swords.webp',
  58: '09-of-swords.webp',
  59: '10-of-swords.webp',
  60: '11-page-of-swords.webp',
  61: '12-knight-of-swords.webp',
  62: '13-queen-of-swords.webp',
  63: '14-king-of-swords.webp',
};

// Minor Arcana - Pentacles (IDs 64-77)
const PENTACLES_IMAGES: Record<number, string> = {
  64: 'ace-of-pentacles.webp',
  65: '02-of-pentacles.webp',
  66: '03-of-pentacles.webp',
  67: '04-of-pentacles.webp',
  68: '05-of-pentacles.webp',
  69: '06-of-pentacles.webp',
  70: '07-of-pentacles.webp',
  71: '08-of-pentacles.webp',
  72: '09-of-pentacles.webp',
  73: '10-of-pentacles.webp',
  74: '11-page-of-pentacles.webp',
  75: '12-knight-of-pentacles.webp',
  76: '13-queen-of-pentacles.webp',
  77: '14-king-of-pentacles.webp',
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
const IMAGE_VERSION = '2026020501';

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
 * For WebP images, we rotate the upright image in CSS instead of using separate reversed images
 * This function now returns the same URL as upright - rotation is handled in the Card component
 */
export function getCardReversedImageUrl(cardId: number): string {
  // Return upright image - Card component handles rotation via CSS
  return getCardImageUrl(cardId);
}

/**
 * Check if this is a Major Arcana card (for birth card readings)
 */
export function isMajorArcana(cardId: number): boolean {
  return cardId >= 0 && cardId <= 21;
}

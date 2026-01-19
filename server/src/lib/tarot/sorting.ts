/**
 * Tarot Card Sorting Utilities
 *
 * Provides consistent sorting for tarot cards by card number.
 * Card numbers are stored as strings in the database, so we need
 * to parse them for proper numeric sorting.
 */

/**
 * Parse a card number string to a sortable integer
 * @param cardNumber - The card number as a string (e.g., "1", "10", "")
 * @returns Parsed integer, or 999 for invalid/empty values (sorts to end)
 */
export function parseCardNumber(cardNumber: string | null | undefined): number {
  if (!cardNumber) return 999;
  const parsed = parseInt(cardNumber, 10);
  return isNaN(parsed) ? 999 : parsed;
}

/**
 * Compare function for sorting items by card number
 * @param a - First item with cardNumber property
 * @param b - Second item with cardNumber property
 * @returns Negative if a < b, positive if a > b, zero if equal
 */
export function compareByCardNumber<T extends { cardNumber: string | null }>(
  a: T,
  b: T
): number {
  return parseCardNumber(a.cardNumber) - parseCardNumber(b.cardNumber);
}

/**
 * Sort an array of items by their card number
 * @param items - Array of items with cardNumber property
 * @returns New sorted array (does not mutate original)
 */
export function sortByCardNumber<T extends { cardNumber: string | null }>(
  items: T[]
): T[] {
  return [...items].sort(compareByCardNumber);
}

/**
 * Sort articles in place by card number (mutates array)
 * Use when you don't need to preserve the original array
 * @param items - Array of items to sort
 * @returns The same array, now sorted
 */
export function sortByCardNumberInPlace<T extends { cardNumber: string | null }>(
  items: T[]
): T[] {
  return items.sort(compareByCardNumber);
}

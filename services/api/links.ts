/**
 * Internal Linking API - Link registry for internal linking between content
 */

import { apiRequest } from './client';

// ============================================
// TYPES
// ============================================

export interface LinkRegistryItem {
  slug: string;
  title: string;
}

export interface TarotLinkItem extends LinkRegistryItem {
  cardType: string;
}

export interface SpreadLinkItem extends LinkRegistryItem {
  type: string;
}

export interface HoroscopeLinkItem extends LinkRegistryItem {
  sign: string;
}

export interface LinkRegistry {
  tarot: TarotLinkItem[];
  blog: LinkRegistryItem[];
  spread: SpreadLinkItem[];
  horoscope: HoroscopeLinkItem[];
}

// ============================================
// ENDPOINTS
// ============================================

/**
 * Fetch the link registry for internal linking
 * Returns all linkable content (tarot articles, blog posts, spreads, horoscopes)
 */
export async function fetchLinkRegistry(): Promise<LinkRegistry> {
  return apiRequest('/api/v1/internal-links/registry');
}

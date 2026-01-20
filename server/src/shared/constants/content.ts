/**
 * Content Constants
 * Static content definitions for spreads and horoscopes
 */

export interface Spread {
  slug: string;
  title: string;
  type: string;
}

export interface ZodiacSign {
  slug: string;
  title: string;
  sign: string;
}

/**
 * Available tarot spreads for internal linking
 */
export const SPREADS: Spread[] = [
  { slug: 'single-card', title: 'Single Card Reading', type: 'SINGLE' },
  { slug: 'three-card', title: 'Three Card Spread', type: 'THREE_CARD' },
  { slug: 'love-spread', title: 'Love Spread', type: 'LOVE' },
  { slug: 'career-spread', title: 'Career Spread', type: 'CAREER' },
  { slug: 'horseshoe', title: 'Horseshoe Spread', type: 'HORSESHOE' },
  { slug: 'celtic-cross', title: 'Celtic Cross', type: 'CELTIC_CROSS' },
];

/**
 * Zodiac signs for horoscope internal linking
 */
export const ZODIAC_SIGNS: ZodiacSign[] = [
  { slug: 'aries', title: 'Aries Horoscope', sign: 'aries' },
  { slug: 'taurus', title: 'Taurus Horoscope', sign: 'taurus' },
  { slug: 'gemini', title: 'Gemini Horoscope', sign: 'gemini' },
  { slug: 'cancer', title: 'Cancer Horoscope', sign: 'cancer' },
  { slug: 'leo', title: 'Leo Horoscope', sign: 'leo' },
  { slug: 'virgo', title: 'Virgo Horoscope', sign: 'virgo' },
  { slug: 'libra', title: 'Libra Horoscope', sign: 'libra' },
  { slug: 'scorpio', title: 'Scorpio Horoscope', sign: 'scorpio' },
  { slug: 'sagittarius', title: 'Sagittarius Horoscope', sign: 'sagittarius' },
  { slug: 'capricorn', title: 'Capricorn Horoscope', sign: 'capricorn' },
  { slug: 'aquarius', title: 'Aquarius Horoscope', sign: 'aquarius' },
  { slug: 'pisces', title: 'Pisces Horoscope', sign: 'pisces' },
];

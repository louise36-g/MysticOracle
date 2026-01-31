/**
 * Year Energy Seed Script
 *
 * Generates and seeds the universal year energy for a given year.
 * Uses AI to generate themes, challenges, and opportunities in EN + FR.
 *
 * Usage: npx tsx scripts/seedYearEnergy.ts [year]
 * Example: npx tsx scripts/seedYearEnergy.ts 2026
 */

import { PrismaClient } from '@prisma/client';
import { OpenRouterService } from '../src/services/openRouterService.js';

const prisma = new PrismaClient();
const openRouter = new OpenRouterService();

// Major Arcana card data with elements
const MAJOR_ARCANA: Record<number, { name: string; nameFr: string; element: string }> = {
  0: { name: 'The Fool', nameFr: 'Le Mat', element: 'Air' },
  1: { name: 'The Magician', nameFr: 'Le Bateleur', element: 'Air' },
  2: { name: 'The High Priestess', nameFr: 'La Papesse', element: 'Water' },
  3: { name: 'The Empress', nameFr: "L'Impératrice", element: 'Earth' },
  4: { name: 'The Emperor', nameFr: "L'Empereur", element: 'Fire' },
  5: { name: 'The Hierophant', nameFr: 'Le Pape', element: 'Earth' },
  6: { name: 'The Lovers', nameFr: "L'Amoureux", element: 'Air' },
  7: { name: 'The Chariot', nameFr: 'Le Chariot', element: 'Water' },
  8: { name: 'Strength', nameFr: 'La Force', element: 'Fire' },
  9: { name: 'The Hermit', nameFr: "L'Hermite", element: 'Earth' },
  10: { name: 'Wheel of Fortune', nameFr: 'La Roue de Fortune', element: 'Fire' },
  11: { name: 'Justice', nameFr: 'La Justice', element: 'Air' },
  12: { name: 'The Hanged Man', nameFr: 'Le Pendu', element: 'Water' },
  13: { name: 'Death', nameFr: "L'Arcane Sans Nom", element: 'Water' },
  14: { name: 'Temperance', nameFr: 'La Tempérance', element: 'Fire' },
  15: { name: 'The Devil', nameFr: 'Le Diable', element: 'Earth' },
  16: { name: 'The Tower', nameFr: 'La Maison Dieu', element: 'Fire' },
  17: { name: 'The Star', nameFr: "L'Étoile", element: 'Air' },
  18: { name: 'The Moon', nameFr: 'La Lune', element: 'Water' },
  19: { name: 'The Sun', nameFr: 'Le Soleil', element: 'Fire' },
  20: { name: 'Judgement', nameFr: 'Le Jugement', element: 'Fire' },
  21: { name: 'The World', nameFr: 'Le Monde', element: 'Earth' },
};

/**
 * Calculate the numerological year number (1-9)
 */
function calculateYearNumber(year: number): number {
  // Sum all digits and reduce to single digit (1-9)
  let sum = year
    .toString()
    .split('')
    .reduce((acc, digit) => acc + parseInt(digit, 10), 0);

  // Keep reducing until single digit
  while (sum > 9) {
    sum = sum
      .toString()
      .split('')
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }

  return sum;
}

/**
 * Get cycle position (1-9) in the 9-year cycle
 * 2026 is year 1 of a new cycle
 */
function getCyclePosition(year: number): number {
  // 2026 = cycle position 1
  // Calculate offset from 2026
  const baseYear = 2026;
  const offset = (year - baseYear) % 9;
  // Adjust for negative years and ensure 1-9 range
  return offset < 0 ? offset + 9 + 1 : offset + 1;
}

/**
 * Generate a single section of year energy content using AI
 */
async function generateSection(
  year: number,
  yearNumber: number,
  cardName: string,
  cardNameFr: string,
  element: string,
  cyclePosition: number,
  sectionType: 'themes' | 'challenges' | 'opportunities',
  language: 'en' | 'fr'
): Promise<string> {
  const cycleDescriptions = {
    1: {
      en: 'new beginnings, fresh starts, planting seeds',
      fr: 'nouveaux départs, nouvelles graines à planter',
    },
    2: { en: 'patience, partnerships, gestation', fr: 'patience, partenariats, gestation' },
    3: { en: 'creativity, expression, growth', fr: 'créativité, expression, croissance' },
    4: { en: 'building, foundations, hard work', fr: 'construction, fondations, travail acharné' },
    5: { en: 'change, freedom, adventure', fr: 'changement, liberté, aventure' },
    6: { en: 'responsibility, home, harmony', fr: 'responsabilité, foyer, harmonie' },
    7: {
      en: 'reflection, spirituality, inner wisdom',
      fr: 'réflexion, spiritualité, sagesse intérieure',
    },
    8: { en: 'abundance, power, manifestation', fr: 'abondance, pouvoir, manifestation' },
    9: { en: 'completion, release, transformation', fr: 'achèvement, libération, transformation' },
  };

  const cycleDesc = cycleDescriptions[cyclePosition as keyof typeof cycleDescriptions];
  const elementFr =
    element === 'Fire' ? 'Feu' : element === 'Water' ? 'Eau' : element === 'Air' ? 'Air' : 'Terre';

  let prompt: string;

  if (language === 'en') {
    const context = `Year ${year} is a Universal Year ${yearNumber}, governed by ${cardName} (${element} element). It is year ${cyclePosition} of the 9-year cycle (${cycleDesc.en}).`;

    if (sectionType === 'themes') {
      prompt = `${context}

Write 200-250 words about the major themes and energies of ${year}. What is this year fundamentally about? How does ${cardName} energy manifest collectively? What does the ${element} element bring? Write in second person ("you"), with wisdom and depth for a mystical tarot application. Start directly with the content, no headers.`;
    } else if (sectionType === 'challenges') {
      prompt = `${context}

Write 150-200 words about the shadows and challenges of ${year}. What struggles might arise under ${cardName} energy? What are the pitfalls of this ${element} year? What lessons must be learned? Write in second person ("you"), with wisdom and depth for a mystical tarot application. Start directly with the content, no headers.`;
    } else {
      prompt = `${context}

Write 150-200 words about the gifts and opportunities of ${year}. What blessings does ${cardName} offer? How can the ${element} energy be harnessed? What unique openings does this year provide? Write in second person ("you"), with wisdom and depth for a mystical tarot application. Start directly with the content, no headers.`;
    }
  } else {
    const context = `L'année ${year} est une Année Universelle ${yearNumber}, gouvernée par ${cardNameFr} (élément ${elementFr}). C'est l'année ${cyclePosition} du cycle de 9 ans (${cycleDesc.fr}).`;

    if (sectionType === 'themes') {
      prompt = `${context}

Écrivez 200-250 mots sur les thèmes majeurs et les énergies de ${year}. De quoi cette année parle-t-elle fondamentalement? Comment l'énergie de ${cardNameFr} se manifeste-t-elle collectivement? Qu'apporte l'élément ${elementFr}? Écrivez à la deuxième personne ("vous"), avec sagesse et profondeur pour une application de tarot mystique. Commencez directement avec le contenu, sans titres.`;
    } else if (sectionType === 'challenges') {
      prompt = `${context}

Écrivez 150-200 mots sur les ombres et défis de ${year}. Quelles difficultés pourraient surgir sous l'énergie de ${cardNameFr}? Quels sont les pièges de cette année ${elementFr}? Quelles leçons doivent être apprises? Écrivez à la deuxième personne ("vous"), avec sagesse et profondeur pour une application de tarot mystique. Commencez directement avec le contenu, sans titres.`;
    } else {
      prompt = `${context}

Écrivez 150-200 mots sur les dons et opportunités de ${year}. Quelles bénédictions ${cardNameFr} offre-t-il? Comment l'énergie ${elementFr} peut-elle être exploitée? Quelles ouvertures uniques cette année offre-t-elle? Écrivez à la deuxième personne ("vous"), avec sagesse et profondeur pour une application de tarot mystique. Commencez directement avec le contenu, sans titres.`;
    }
  }

  const response = await openRouter.generateTarotReading(prompt, {
    temperature: 0.8,
    maxTokens: 600,
  });

  // Clean up any headers or markers that might have been added
  const cleaned = response
    .replace(/^\*\*[^*]+\*\*\s*/gm, '') // Remove ** headers **
    .replace(/^#+\s+.+\n/gm, '') // Remove # headers
    .replace(/^===.+===\s*/gm, '') // Remove === markers ===
    .trim();

  if (cleaned.length < 100) {
    console.error(`[YearEnergy] Section ${sectionType} too short:`, cleaned);
    throw new Error(`Generated ${sectionType} content too short`);
  }

  return cleaned;
}

/**
 * Generate year energy content using AI (all sections)
 */
async function generateYearContent(
  year: number,
  yearNumber: number,
  cardName: string,
  cardNameFr: string,
  element: string,
  cyclePosition: number,
  language: 'en' | 'fr'
): Promise<{ themes: string; challenges: string; opportunities: string }> {
  console.log(`[YearEnergy] Generating ${language.toUpperCase()} themes...`);
  const themes = await generateSection(
    year,
    yearNumber,
    cardName,
    cardNameFr,
    element,
    cyclePosition,
    'themes',
    language
  );
  await new Promise(resolve => setTimeout(resolve, 1500)); // Rate limit delay

  console.log(`[YearEnergy] Generating ${language.toUpperCase()} challenges...`);
  const challenges = await generateSection(
    year,
    yearNumber,
    cardName,
    cardNameFr,
    element,
    cyclePosition,
    'challenges',
    language
  );
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log(`[YearEnergy] Generating ${language.toUpperCase()} opportunities...`);
  const opportunities = await generateSection(
    year,
    yearNumber,
    cardName,
    cardNameFr,
    element,
    cyclePosition,
    'opportunities',
    language
  );

  return { themes, challenges, opportunities };
}

/**
 * Main seed function
 */
async function seedYearEnergy(year: number) {
  console.log(`\n========================================`);
  console.log(`  Seeding Year Energy for ${year}`);
  console.log(`========================================\n`);

  // Calculate year numerology
  const yearNumber = calculateYearNumber(year);
  const cyclePosition = getCyclePosition(year);
  const card = MAJOR_ARCANA[yearNumber];

  if (!card) {
    throw new Error(`No card found for year number ${yearNumber}`);
  }

  console.log(`Year: ${year}`);
  console.log(`Year Number: ${yearNumber}`);
  console.log(`Year Card: ${card.name} (${card.nameFr})`);
  console.log(`Element: ${card.element}`);
  console.log(`Cycle Position: ${cyclePosition} of 9`);
  console.log('');

  // Check if already exists
  const existing = await prisma.yearEnergy.findUnique({
    where: { year },
  });

  if (existing) {
    console.log(`[YearEnergy] Year ${year} already exists. Updating...`);
  }

  // Generate content in both languages
  console.log('[YearEnergy] Generating AI content...\n');

  const contentEn = await generateYearContent(
    year,
    yearNumber,
    card.name,
    card.nameFr,
    card.element,
    cyclePosition,
    'en'
  );

  console.log('[YearEnergy] English content generated.');

  // Small delay between API calls
  await new Promise(resolve => setTimeout(resolve, 2000));

  const contentFr = await generateYearContent(
    year,
    yearNumber,
    card.name,
    card.nameFr,
    card.element,
    cyclePosition,
    'fr'
  );

  console.log('[YearEnergy] French content generated.\n');

  // Upsert to database
  const result = await prisma.yearEnergy.upsert({
    where: { year },
    create: {
      year,
      yearNumber,
      yearCardId: yearNumber,
      cyclePosition,
      yearElement: card.element,
      themesEn: contentEn.themes,
      themesFr: contentFr.themes,
      challengesEn: contentEn.challenges,
      challengesFr: contentFr.challenges,
      opportunitiesEn: contentEn.opportunities,
      opportunitiesFr: contentFr.opportunities,
    },
    update: {
      yearNumber,
      yearCardId: yearNumber,
      cyclePosition,
      yearElement: card.element,
      themesEn: contentEn.themes,
      themesFr: contentFr.themes,
      challengesEn: contentEn.challenges,
      challengesFr: contentFr.challenges,
      opportunitiesEn: contentEn.opportunities,
      opportunitiesFr: contentFr.opportunities,
    },
  });

  console.log(`[YearEnergy] Successfully seeded year ${year}!`);
  console.log(`[YearEnergy] Record ID: ${result.id}`);
  console.log('');

  // Preview content
  console.log('========================================');
  console.log('  PREVIEW: English Themes');
  console.log('========================================');
  console.log(contentEn.themes.substring(0, 500) + '...\n');

  console.log('========================================');
  console.log('  PREVIEW: French Themes');
  console.log('========================================');
  console.log(contentFr.themes.substring(0, 500) + '...\n');
}

// Main execution
const year = parseInt(process.argv[2], 10) || 2026;

if (isNaN(year) || year < 2000 || year > 2100) {
  console.error('Please provide a valid year between 2000 and 2100');
  process.exit(1);
}

seedYearEnergy(year)
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nError seeding year energy:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

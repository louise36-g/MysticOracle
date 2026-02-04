/**
 * Add missing French translations for navigation and common UI elements
 */
import prisma from '../src/db/prisma.js';

const translations = [
  // Navigation
  { key: 'nav.home', en: 'Home', fr: 'Accueil' },
  { key: 'nav.signIn', en: 'Sign In', fr: 'Connexion' },
  { key: 'nav.credits', en: 'Credits', fr: 'Crédits' },
  { key: 'nav.newReading', en: 'New Reading', fr: 'Nouveau Tirage' },
  { key: 'nav.howCreditsWork', en: 'How Credits Work', fr: 'Comment fonctionnent les crédits' },
  { key: 'nav.helpFaq', en: 'Help & FAQ', fr: 'Aide & FAQ' },
  { key: 'nav.myAccount', en: 'My Account', fr: 'Mon Compte' },
  { key: 'nav.switchToFrench', en: 'Switch to French', fr: 'Passer en Français' },
  { key: 'nav.switchToEnglish', en: 'Switch to English', fr: 'Passer en Anglais' },

  // Common
  { key: 'common.back', en: 'Back', fr: 'Retour' },
  { key: 'common.loading', en: 'Loading...', fr: 'Chargement...' },
  { key: 'common.error', en: 'Error', fr: 'Erreur' },
  { key: 'common.save', en: 'Save', fr: 'Enregistrer' },
  { key: 'common.cancel', en: 'Cancel', fr: 'Annuler' },
  { key: 'common.close', en: 'Close', fr: 'Fermer' },

  // SubNav - Main menu items
  { key: 'subnav.tarot.title', en: 'Tarot Reading', fr: 'Tirage des Cartes' },
  { key: 'subnav.horoscope.title', en: 'Horoscope', fr: 'Horoscope' },
  { key: 'subnav.learn.title', en: 'Learn', fr: 'Découvrir' },

  // SubNav Learn items
  { key: 'subnav.learn.about.label', en: 'About Us', fr: 'À Propos' },
  { key: 'subnav.learn.about.desc', en: 'Our story', fr: 'Notre histoire' },
  { key: 'subnav.learn.tarotCards.label', en: 'The Arcanas', fr: 'Les Arcanes' },
  { key: 'subnav.learn.tarotCards.desc', en: 'Explore all 78 cards', fr: 'Explorez les 78 cartes' },
  { key: 'subnav.learn.blog.label', en: 'Blog', fr: 'Blog' },
  { key: 'subnav.learn.blog.desc', en: 'Articles & guides', fr: 'Articles & guides' },
  {
    key: 'subnav.learn.credits.label',
    en: 'How Credits Work',
    fr: 'Comment fonctionnent les crédits',
  },
  { key: 'subnav.learn.credits.desc', en: 'Pricing & packages', fr: 'Tarifs & forfaits' },
  { key: 'subnav.learn.faq.label', en: 'Help & FAQ', fr: 'Aide & FAQ' },
  { key: 'subnav.learn.faq.desc', en: 'Common questions', fr: 'Questions fréquentes' },

  // Breadcrumbs
  { key: 'Breadcrumb.tsx.Breadcrumb.home', en: 'Home', fr: 'Accueil' },

  // Tarot Article Page
  { key: 'tarot.TarotArticlePage.related_cards', en: 'Related Cards', fr: 'Cartes Associées' },
  { key: 'tarot.TarotArticlePage.related_topics', en: 'Related Topics', fr: 'Sujets Associés' },
  { key: 'tarot.TarotArticlePage.not_found', en: 'Article Not Found', fr: 'Article Non Trouvé' },

  // Horoscope Page
  { key: 'horoscopes.HoroscopeSignPage.all_signs', en: 'All Signs', fr: 'Tous les signes' },
  { key: 'horoscopes.HoroscopeSignPage.ruling', en: 'Ruling', fr: 'Astre' },
  { key: 'horoscopes.HoroscopeSignPage.element', en: 'Element', fr: 'Élément' },
];

async function addTranslations() {
  console.log('🌍 Adding French translations...\n');

  // Get language IDs
  const enLang = await prisma.language.findUnique({ where: { code: 'en' } });
  const frLang = await prisma.language.findUnique({ where: { code: 'fr' } });

  if (!enLang || !frLang) {
    console.error('Languages not found in database. Please ensure en and fr languages exist.');
    await prisma.$disconnect();
    return;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const t of translations) {
    // Check if English translation exists
    const existingEn = await prisma.translation.findFirst({
      where: { key: t.key, languageId: enLang.id },
    });

    if (!existingEn) {
      // Create English translation
      await prisma.translation.create({
        data: { key: t.key, languageId: enLang.id, value: t.en },
      });
      console.log(`✅ Created EN: ${t.key}`);
      created++;
    }

    // Check if French translation exists
    const existingFr = await prisma.translation.findFirst({
      where: { key: t.key, languageId: frLang.id },
    });

    if (!existingFr) {
      // Create French translation
      await prisma.translation.create({
        data: { key: t.key, languageId: frLang.id, value: t.fr },
      });
      console.log(`✅ Created FR: ${t.key}`);
      created++;
    } else if (existingFr.value !== t.fr) {
      // Update if different
      await prisma.translation.update({
        where: { id: existingFr.id },
        data: { value: t.fr },
      });
      console.log(`📝 Updated FR: ${t.key}`);
      updated++;
    } else {
      skipped++;
    }
  }

  // Update cache version to invalidate client cache
  await prisma.systemSetting.upsert({
    where: { key: 'translations_version' },
    update: { value: Date.now().toString() },
    create: { key: 'translations_version', value: Date.now().toString() },
  });

  console.log('\n=== SUMMARY ===');
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log('Cache version updated');

  await prisma.$disconnect();
}

addTranslations().catch(console.error);

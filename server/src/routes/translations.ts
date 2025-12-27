import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ============================================
// PUBLIC ENDPOINTS (for fetching translations)
// ============================================

// Get all active languages
router.get('/languages', async (req, res) => {
  try {
    const languages = await prisma.language.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        nativeName: true,
        isDefault: true
      }
    });
    res.json({ languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// Get all translations for a language
router.get('/:langCode', async (req, res) => {
  try {
    const { langCode } = req.params;

    const language = await prisma.language.findUnique({
      where: { code: langCode },
      include: {
        translations: {
          select: { key: true, value: true }
        }
      }
    });

    if (!language) {
      return res.status(404).json({ error: 'Language not found' });
    }

    // Convert array to key-value object
    const translations: Record<string, string> = {};
    for (const t of language.translations) {
      translations[t.key] = t.value;
    }

    res.json({
      language: {
        code: language.code,
        name: language.name,
        nativeName: language.nativeName
      },
      translations
    });
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

// ============================================
// ADMIN ENDPOINTS (for managing translations)
// ============================================

// Get all languages with translation count (admin)
router.get('/admin/languages', requireAuth, requireAdmin, async (req, res) => {
  try {
    const languages = await prisma.language.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { translations: true } }
      }
    });
    res.json({ languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// Create language
const createLanguageSchema = z.object({
  code: z.string().min(2).max(5).regex(/^[a-z]{2,5}$/, 'Language code must be lowercase letters'),
  name: z.string().min(1),
  nativeName: z.string().min(1),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0)
});

router.post('/admin/languages', requireAuth, requireAdmin, async (req, res) => {
  try {
    const parsed = createLanguageSchema.parse(req.body);

    // If this is set as default, unset other defaults
    if (parsed.isDefault) {
      await prisma.language.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const language = await prisma.language.create({
      data: {
        code: parsed.code,
        name: parsed.name,
        nativeName: parsed.nativeName,
        isActive: parsed.isActive,
        isDefault: parsed.isDefault,
        sortOrder: parsed.sortOrder
      }
    });
    res.json({ success: true, language });
  } catch (error) {
    console.error('Error creating language:', error);
    res.status(500).json({ error: 'Failed to create language' });
  }
});

// Update language schema
const updateLanguageSchema = z.object({
  code: z.string().min(2).max(5).regex(/^[a-z]{2,5}$/, 'Language code must be lowercase letters').optional(),
  name: z.string().min(1).optional(),
  nativeName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

router.patch('/admin/languages/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateLanguageSchema.parse(req.body);

    if (data.isDefault) {
      await prisma.language.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const language = await prisma.language.update({
      where: { id },
      data
    });
    res.json({ success: true, language });
  } catch (error) {
    console.error('Error updating language:', error);
    res.status(500).json({ error: 'Failed to update language' });
  }
});

// Delete language (and all its translations)
router.delete('/admin/languages/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.language.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting language:', error);
    res.status(500).json({ error: 'Failed to delete language' });
  }
});

// Get all translations for a language (admin - with full details)
router.get('/admin/:langCode', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { langCode } = req.params;

    const language = await prisma.language.findUnique({
      where: { code: langCode },
      include: {
        translations: {
          orderBy: { key: 'asc' }
        }
      }
    });

    if (!language) {
      return res.status(404).json({ error: 'Language not found' });
    }

    res.json({ language, translations: language.translations });
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

// Create/Update translation (upsert)
const upsertTranslationSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  languageId: z.string().min(1)
});

router.post('/admin/translations', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { key, value, languageId } = upsertTranslationSchema.parse(req.body);

    const translation = await prisma.translation.upsert({
      where: {
        key_languageId: { key, languageId }
      },
      create: {
        key,
        value,
        language: { connect: { id: languageId } }
      },
      update: { value }
    });

    res.json({ success: true, translation });
  } catch (error) {
    console.error('Error upserting translation:', error);
    res.status(500).json({ error: 'Failed to save translation' });
  }
});

// Bulk upsert translations
const bulkUpsertSchema = z.object({
  languageId: z.string().min(1),
  translations: z.record(z.string())  // { key: value }
});

router.post('/admin/translations/bulk', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { languageId, translations } = bulkUpsertSchema.parse(req.body);

    const operations = Object.entries(translations).map(([key, value]) =>
      prisma.translation.upsert({
        where: { key_languageId: { key, languageId } },
        create: { key, value, language: { connect: { id: languageId } } },
        update: { value }
      })
    );

    await prisma.$transaction(operations);

    res.json({ success: true, count: Object.keys(translations).length });
  } catch (error) {
    console.error('Error bulk upserting translations:', error);
    res.status(500).json({ error: 'Failed to save translations' });
  }
});

// Delete translation
router.delete('/admin/translations/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.translation.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting translation:', error);
    res.status(500).json({ error: 'Failed to delete translation' });
  }
});

// Seed default translations
router.post('/admin/seed', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Create default languages
    const enLang = await prisma.language.upsert({
      where: { code: 'en' },
      create: { code: 'en', name: 'English', nativeName: 'English', isDefault: true, sortOrder: 0 },
      update: {}
    });

    const frLang = await prisma.language.upsert({
      where: { code: 'fr' },
      create: { code: 'fr', name: 'French', nativeName: 'Français', sortOrder: 1 },
      update: {}
    });

    // Default translations
    const defaultTranslations = {
      // Navigation
      'nav.home': { en: 'Home', fr: 'Accueil' },
      'nav.reading': { en: 'Reading', fr: 'Lecture' },
      'nav.horoscope': { en: 'Horoscope', fr: 'Horoscope' },
      'nav.profile': { en: 'Profile', fr: 'Profil' },
      'nav.admin': { en: 'Admin', fr: 'Admin' },
      'nav.credits': { en: 'credits', fr: 'crédits' },
      'nav.signIn': { en: 'Sign In', fr: 'Connexion' },
      'nav.signOut': { en: 'Sign Out', fr: 'Déconnexion' },

      // Home
      'home.title': { en: 'MysticOracle', fr: 'MysticOracle' },
      'home.subtitle': { en: 'Discover Your Destiny', fr: 'Découvrez Votre Destin' },
      'home.description': { en: 'Unveil the secrets of your destiny through the ancient wisdom of Tarot, guided by artificial intelligence.', fr: 'Dévoilez les secrets de votre destin grâce à la sagesse ancienne du Tarot, guidée par l\'intelligence artificielle.' },
      'home.startReading': { en: 'Start Your Reading', fr: 'Commencer Votre Lecture' },

      // Tarot
      'tarot.selectSpread': { en: 'Select Your Spread', fr: 'Choisissez Votre Tirage' },
      'tarot.singleCard': { en: 'Single Card', fr: 'Une Carte' },
      'tarot.threeCard': { en: 'Three Card Spread', fr: 'Tirage Trois Cartes' },
      'tarot.celticCross': { en: 'Celtic Cross', fr: 'Croix Celtique' },
      'tarot.shuffleDeck': { en: 'Shuffle the Deck', fr: 'Mélanger les Cartes' },
      'tarot.drawCards': { en: 'Draw Cards', fr: 'Tirer les Cartes' },
      'tarot.getInterpretation': { en: 'Get Interpretation', fr: 'Obtenir l\'Interprétation' },
      'tarot.askFollowUp': { en: 'Ask a follow-up question...', fr: 'Posez une question de suivi...' },
      'tarot.newReading': { en: 'New Reading', fr: 'Nouvelle Lecture' },
      'tarot.cost': { en: 'Cost', fr: 'Coût' },
      'tarot.credit': { en: 'credit', fr: 'crédit' },
      'tarot.credits': { en: 'credits', fr: 'crédits' },

      // Horoscope signs
      'horoscope.title': { en: 'Daily Horoscope', fr: 'Horoscope Quotidien' },
      'horoscope.selectSign': { en: 'Select your zodiac sign', fr: 'Sélectionnez votre signe' },
      'horoscope.aries': { en: 'Aries', fr: 'Bélier' },
      'horoscope.taurus': { en: 'Taurus', fr: 'Taureau' },
      'horoscope.gemini': { en: 'Gemini', fr: 'Gémeaux' },
      'horoscope.cancer': { en: 'Cancer', fr: 'Cancer' },
      'horoscope.leo': { en: 'Leo', fr: 'Lion' },
      'horoscope.virgo': { en: 'Virgo', fr: 'Vierge' },
      'horoscope.libra': { en: 'Libra', fr: 'Balance' },
      'horoscope.scorpio': { en: 'Scorpio', fr: 'Scorpion' },
      'horoscope.sagittarius': { en: 'Sagittarius', fr: 'Sagittaire' },
      'horoscope.capricorn': { en: 'Capricorn', fr: 'Capricorne' },
      'horoscope.aquarius': { en: 'Aquarius', fr: 'Verseau' },
      'horoscope.pisces': { en: 'Pisces', fr: 'Poissons' },

      // Profile
      'profile.title': { en: 'Your Profile', fr: 'Votre Profil' },
      'profile.credits': { en: 'Credits', fr: 'Crédits' },
      'profile.readingHistory': { en: 'Reading History', fr: 'Historique des Lectures' },
      'profile.achievements': { en: 'Achievements', fr: 'Réalisations' },
      'profile.settings': { en: 'Settings', fr: 'Paramètres' },
      'profile.dailyBonus': { en: 'Daily Bonus', fr: 'Bonus Quotidien' },
      'profile.claim': { en: 'Claim', fr: 'Réclamer' },
      'profile.claimed': { en: 'Claimed', fr: 'Réclamé' },
      'profile.streak': { en: 'Day Streak', fr: 'Jours Consécutifs' },

      // Credit Shop
      'shop.title': { en: 'Get More Credits', fr: 'Obtenez Plus de Crédits' },
      'shop.popular': { en: 'Popular', fr: 'Populaire' },
      'shop.bestValue': { en: 'Best Value', fr: 'Meilleur Rapport' },
      'shop.buyNow': { en: 'Buy Now', fr: 'Acheter' },
      'shop.securePayment': { en: 'Secure Payment', fr: 'Paiement Sécurisé' },
      'shop.payWithCard': { en: 'Pay with Card', fr: 'Payer par Carte' },
      'shop.payWithPaypal': { en: 'Pay with PayPal', fr: 'Payer avec PayPal' },

      // Common
      'common.loading': { en: 'Loading...', fr: 'Chargement...' },
      'common.error': { en: 'Error', fr: 'Erreur' },
      'common.save': { en: 'Save', fr: 'Sauvegarder' },
      'common.cancel': { en: 'Cancel', fr: 'Annuler' },
      'common.delete': { en: 'Delete', fr: 'Supprimer' },
      'common.edit': { en: 'Edit', fr: 'Modifier' },
      'common.create': { en: 'Create', fr: 'Créer' },
      'common.close': { en: 'Close', fr: 'Fermer' },
      'common.yes': { en: 'Yes', fr: 'Oui' },
      'common.no': { en: 'No', fr: 'Non' },
      'common.refresh': { en: 'Refresh', fr: 'Actualiser' },
      'common.active': { en: 'Active', fr: 'Actif' },
      'common.inactive': { en: 'Inactive', fr: 'Inactif' },

      // Admin
      'admin.title': { en: 'Admin Dashboard', fr: 'Tableau de Bord Admin' },
      'admin.overview': { en: 'Overview', fr: 'Aperçu' },
      'admin.users': { en: 'Users', fr: 'Utilisateurs' },
      'admin.transactions': { en: 'Transactions', fr: 'Transactions' },
      'admin.packages': { en: 'Packages', fr: 'Forfaits' },
      'admin.emails': { en: 'Emails', fr: 'Emails' },
      'admin.analytics': { en: 'Analytics', fr: 'Analytique' },
      'admin.health': { en: 'Health', fr: 'Santé' },
      'admin.translations': { en: 'Translations', fr: 'Traductions' },
      'admin.settings': { en: 'Settings', fr: 'Paramètres' },

      // Legal
      'legal.privacy': { en: 'Privacy Policy', fr: 'Politique de Confidentialité' },
      'legal.terms': { en: 'Terms of Service', fr: 'Conditions d\'Utilisation' },
      'legal.cookies': { en: 'Cookie Policy', fr: 'Politique des Cookies' },
      'legal.contact': { en: 'Contact', fr: 'Contact' },

      // Features
      'features.aiPowered': { en: 'AI Powered Insights', fr: 'Insights par IA' },
      'features.aiPoweredDesc': { en: 'Deep, context-aware interpretations powered by AI.', fr: 'Interprétations profondes et contextuelles alimentées par l\'IA.' },
      'features.privateSecure': { en: 'Private & Secure', fr: 'Privé & Sécurisé' },
      'features.privateSecureDesc': { en: 'Your spiritual journey is personal. We respect your privacy.', fr: 'Votre voyage spirituel est personnel. Nous respectons votre vie privée.' },
      'features.instantClarity': { en: 'Instant Clarity', fr: 'Clarté Instantanée' },
      'features.instantClarityDesc': { en: 'Get answers to life\'s pressing questions in seconds.', fr: 'Obtenez des réponses à vos questions en quelques secondes.' },

      // Errors & Messages
      'error.notEnoughCredits': { en: 'Not Enough Credits', fr: 'Crédits Insuffisants' },
      'error.lowCredits': { en: 'Running Low on Credits', fr: 'Crédits Bientôt Épuisés' },
      'error.requestFailed': { en: 'Request failed', fr: 'La requête a échoué' },
      'message.buyCredits': { en: 'Buy Credits', fr: 'Acheter des Crédits' },
      'message.later': { en: 'Later', fr: 'Plus Tard' },
    };

    // Insert all translations
    const operations = [];
    for (const [key, values] of Object.entries(defaultTranslations)) {
      operations.push(
        prisma.translation.upsert({
          where: { key_languageId: { key, languageId: enLang.id } },
          create: { key, value: values.en, language: { connect: { id: enLang.id } } },
          update: { value: values.en }
        }),
        prisma.translation.upsert({
          where: { key_languageId: { key, languageId: frLang.id } },
          create: { key, value: values.fr, language: { connect: { id: frLang.id } } },
          update: { value: values.fr }
        })
      );
    }

    await prisma.$transaction(operations);

    res.json({
      success: true,
      languages: 2,
      translations: Object.keys(defaultTranslations).length * 2
    });
  } catch (error) {
    console.error('Error seeding translations:', error);
    res.status(500).json({ error: 'Failed to seed translations' });
  }
});

export default router;

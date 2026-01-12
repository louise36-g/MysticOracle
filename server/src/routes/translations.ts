import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import cacheService, { CacheService } from '../services/cache.js';

const router = Router();

// Helper to invalidate translation caches and bump version
async function invalidateTranslationCache(): Promise<void> {
  await Promise.all([
    cacheService.flushPattern('translations:'),
    prisma.cacheVersion.upsert({
      where: { entity: 'translations' },
      create: { entity: 'translations', version: 1 },
      update: { version: { increment: 1 } }
    })
  ]);
}

// ============================================
// PUBLIC ENDPOINTS (for fetching translations)
// ============================================

// Get all active languages
router.get('/languages', async (req, res) => {
  try {
    const cacheKey = 'translations:languages';
    const cached = await cacheService.get<{ languages: any[] }>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

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

    const response = { languages };
    await cacheService.set(cacheKey, response, CacheService.TTL.TRANSLATIONS);
    res.json(response);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// Get current translation version (for client-side cache invalidation)
router.get('/version', async (req, res) => {
  try {
    const cacheKey = 'translations:version';
    const cached = await cacheService.get<number>(cacheKey);
    if (cached !== undefined) {
      return res.json({ version: cached });
    }

    const cacheVersion = await prisma.cacheVersion.findUnique({
      where: { entity: 'translations' }
    });
    const version = cacheVersion?.version || 1;

    await cacheService.set(cacheKey, version, CacheService.TTL.TRANSLATIONS);
    res.json({ version });
  } catch (error) {
    console.error('Error fetching translation version:', error);
    res.status(500).json({ error: 'Failed to fetch version' });
  }
});

// Get all translations for a language
router.get('/:langCode', async (req, res) => {
  try {
    const { langCode } = req.params;
    const cacheKey = `translations:${langCode}`;

    // Check cache first
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Fetch translations and version in parallel
    const [language, cacheVersion] = await Promise.all([
      prisma.language.findUnique({
        where: { code: langCode },
        include: {
          translations: {
            select: { key: true, value: true }
          }
        }
      }),
      prisma.cacheVersion.findUnique({
        where: { entity: 'translations' }
      })
    ]);

    if (!language) {
      return res.status(404).json({ error: 'Language not found' });
    }

    // Convert array to key-value object
    const translations: Record<string, string> = {};
    for (const t of language.translations) {
      translations[t.key] = t.value;
    }

    const response = {
      language: {
        code: language.code,
        name: language.name,
        nativeName: language.nativeName
      },
      translations,
      version: cacheVersion?.version || 1
    };

    await cacheService.set(cacheKey, response, CacheService.TTL.TRANSLATIONS);
    res.json(response);
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

    // Invalidate cache and bump version
    await invalidateTranslationCache();

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

    // Invalidate cache and bump version
    await invalidateTranslationCache();

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

    // Invalidate cache and bump version
    await invalidateTranslationCache();

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

      // Reflection
      'reflection.header': { en: 'How does this reading resonate with you?', fr: 'Comment cette lecture vous parle-t-elle?' },
      'reflection.tooltip': { en: 'Your reflections help personalize future readings', fr: 'Vos réflexions aident à personnaliser les lectures futures' },
      'reflection.placeholder': { en: 'Share your thoughts, feelings, or insights about this reading...', fr: 'Partagez vos pensées, sentiments ou intuitions sur cette lecture...' },
      'reflection.save': { en: 'Save Reflection', fr: 'Enregistrer' },
      'reflection.skip': { en: 'Skip', fr: 'Passer' },
      'reflection.saved': { en: 'Reflection saved', fr: 'Réflexion enregistrée' },
      'reflection.saving': { en: 'Saving...', fr: 'Sauvegarde...' },
      'reflection.characters': { en: 'characters', fr: 'caractères' },

      // Welcome Modal
      'welcome.step1.title': { en: 'Welcome to MysticOracle', fr: 'Bienvenue sur MysticOracle' },
      'welcome.step1.description': { en: 'Your personal guide to tarot wisdom. Each reading is crafted uniquely for you, blending ancient symbolism with modern insight.', fr: 'Votre guide personnel vers la sagesse du tarot. Chaque tirage est créé uniquement pour vous, mêlant symbolisme ancien et intuition moderne.' },
      'welcome.step2.title': { en: 'How It Works', fr: 'Comment ça marche' },
      'welcome.step2.point1': { en: 'Ask a question (or let the cards guide you)', fr: 'Posez une question (ou laissez les cartes vous guider)' },
      'welcome.step2.point2': { en: 'Choose your spread — from a single card to a full Celtic Cross', fr: 'Choisissez votre tirage — d\'une seule carte à une Croix Celtique complète' },
      'welcome.step2.point3': { en: 'Receive a personalized interpretation that speaks to your situation', fr: 'Recevez une interprétation personnalisée qui parle à votre situation' },
      'welcome.step3.title': { en: 'Your Credits', fr: 'Vos Crédits' },
      'welcome.step3.description': { en: 'You have 3 free credits to start. A single card reading costs 1 credit, larger spreads cost more. Earn extra credits through daily bonuses and referrals — or purchase more anytime.', fr: 'Vous avez 3 crédits gratuits pour commencer. Un tirage à une carte coûte 1 crédit, les tirages plus grands coûtent plus. Gagnez des crédits supplémentaires grâce aux bonus quotidiens et aux parrainages — ou achetez-en à tout moment.' },
      'welcome.step3.purchaseNow': { en: 'Purchase now', fr: 'Acheter maintenant' },
      'welcome.step3.learnMore': { en: 'Learn more', fr: 'En savoir plus' },
      'welcome.skip': { en: 'Skip', fr: 'Passer' },
      'welcome.next': { en: 'Next', fr: 'Suivant' },
      'welcome.startReading': { en: 'Start Your First Reading', fr: 'Commencer Votre Première Lecture' },

      // How Credits Work Page
      'credits.hero.title': { en: 'How Credits Work', fr: 'Comment fonctionnent les crédits' },
      'credits.hero.subtitle': { en: 'Simple, transparent, no subscriptions', fr: 'Simple, transparent, sans abonnement' },

      'credits.whatAre.title': { en: 'What Are Credits?', fr: 'Que sont les crédits ?' },
      'credits.whatAre.description': { en: 'Credits are your currency for tarot readings on MysticOracle. There are no monthly fees or subscriptions — you simply purchase credits when you need them, and they never expire. Each reading type has a fixed cost, so you always know exactly what you\'re spending.', fr: 'Les crédits sont votre monnaie pour les lectures de tarot sur MysticOracle. Il n\'y a pas de frais mensuels ni d\'abonnements — vous achetez simplement des crédits quand vous en avez besoin, et ils n\'expirent jamais. Chaque type de lecture a un coût fixe, vous savez donc toujours exactement ce que vous dépensez.' },

      'credits.costs.title': { en: 'Reading Costs', fr: 'Coûts des lectures' },
      'credits.costs.readingType': { en: 'Reading Type', fr: 'Type de lecture' },
      'credits.costs.credits': { en: 'Credits', fr: 'Crédits' },
      'credits.costs.followUp': { en: 'Follow-up Question', fr: 'Question de suivi' },
      'credits.costs.note': { en: 'More complex spreads with additional cards provide deeper insights and cost more credits.', fr: 'Les tirages plus complexes avec des cartes supplémentaires offrent des aperçus plus profonds et coûtent plus de crédits.' },
      'credits.credit': { en: 'credit', fr: 'crédit' },
      'credits.credits': { en: 'credits', fr: 'crédits' },

      'credits.earn.title': { en: 'Earning Free Credits', fr: 'Gagner des crédits gratuits' },
      'credits.earn.daily.title': { en: 'Daily Bonus', fr: 'Bonus quotidien' },
      'credits.earn.daily.description': { en: 'Visit each day to claim free credits. Build a streak for bigger rewards — 7-day streaks unlock bonus credits!', fr: 'Visitez chaque jour pour réclamer des crédits gratuits. Construisez une série pour de plus grandes récompenses — les séries de 7 jours débloquent des crédits bonus !' },
      'credits.earn.referrals.title': { en: 'Referrals', fr: 'Parrainages' },
      'credits.earn.referrals.description': { en: 'Share your referral link with friends. When they sign up and make their first reading, you both earn credits.', fr: 'Partagez votre lien de parrainage avec des amis. Quand ils s\'inscrivent et font leur première lecture, vous gagnez tous les deux des crédits.' },
      'credits.earn.achievements.title': { en: 'Achievements', fr: 'Réussites' },
      'credits.earn.achievements.description': { en: 'Complete milestones like your first reading, trying all spread types, or maintaining streaks to unlock bonus credits.', fr: 'Complétez des étapes comme votre première lecture, essayer tous les types de tirages, ou maintenir des séries pour débloquer des crédits bonus.' },

      'credits.buy.title': { en: 'Buying Credits', fr: 'Acheter des crédits' },
      'credits.buy.description': { en: 'Need more credits? Purchase them instantly through our secure checkout. We offer several packages to suit your needs, with bigger packages offering better value.', fr: 'Besoin de plus de crédits ? Achetez-les instantanément via notre paiement sécurisé. Nous proposons plusieurs forfaits adaptés à vos besoins, avec de meilleurs prix pour les gros forfaits.' },
      'credits.buy.stripe': { en: 'Credit/Debit Cards (Stripe)', fr: 'Cartes de crédit/débit (Stripe)' },
      'credits.buy.paypal': { en: 'PayPal', fr: 'PayPal' },
      'credits.buy.button': { en: 'View Credit Packages', fr: 'Voir les forfaits' },

      'credits.cta.title': { en: 'Ready to begin?', fr: 'Prêt à commencer ?' },
      'credits.cta.description': { en: 'Start your journey with a tarot reading and discover what the cards reveal for you.', fr: 'Commencez votre voyage avec une lecture de tarot et découvrez ce que les cartes révèlent pour vous.' },
      'credits.cta.button': { en: 'Start a Reading', fr: 'Commencer une lecture' },

      // FAQ Page
      'faq.hero.title': { en: 'Frequently Asked Questions', fr: 'Questions Fréquentes' },
      'faq.hero.subtitle': { en: 'Everything you need to know about MysticOracle', fr: 'Tout ce que vous devez savoir sur MysticOracle' },

      'faq.disclaimer.title': { en: 'Important Notice', fr: 'Avis Important' },
      'faq.disclaimer.text': { en: 'MysticOracle is for entertainment and personal reflection purposes only. Tarot readings provided here are generated by artificial intelligence and should not be considered professional advice (medical, legal, financial, or otherwise). The interpretations offer symbolic guidance and perspective, not predictions of the future. We encourage you to use these readings as a tool for self-reflection, not as a basis for important life decisions. Always consult qualified professionals for serious matters.', fr: 'MysticOracle est destiné uniquement au divertissement et à la réflexion personnelle. Les lectures de tarot fournies ici sont générées par intelligence artificielle et ne doivent pas être considérées comme des conseils professionnels (médicaux, juridiques, financiers ou autres). Les interprétations offrent une guidance symbolique et une perspective, pas des prédictions de l\'avenir. Nous vous encourageons à utiliser ces lectures comme un outil de réflexion personnelle, pas comme base pour des décisions importantes. Consultez toujours des professionnels qualifiés pour les questions sérieuses.' },

      'faq.gettingStarted.title': { en: 'Getting Started', fr: 'Pour Commencer' },
      'faq.gettingStarted.q1': { en: 'What is MysticOracle?', fr: 'Qu\'est-ce que MysticOracle ?' },
      'faq.gettingStarted.a1': { en: 'MysticOracle is an AI-powered tarot reading application. Each reading combines traditional tarot symbolism with personalized interpretation based on your question and the cards drawn. It\'s designed to offer guidance, perspective, and moments of reflection through the rich imagery of tarot.', fr: 'MysticOracle est une application de lecture de tarot alimentée par l\'IA. Chaque lecture combine le symbolisme traditionnel du tarot avec une interprétation personnalisée basée sur votre question et les cartes tirées. Elle est conçue pour offrir guidance, perspective et moments de réflexion à travers l\'imagerie riche du tarot.' },
      'faq.gettingStarted.q2': { en: 'Is this real tarot?', fr: 'Est-ce du vrai tarot ?' },
      'faq.gettingStarted.a2': { en: 'We use authentic tarot card meanings, traditional spreads, and genuine symbolism from the Rider-Waite-Smith tradition. The interpretations are generated by AI, crafted to be thoughtful and relevant to your situation. Think of it as tarot wisdom made accessible — the cards are real, the meanings are authentic, and the technology helps deliver personalized insights.', fr: 'Nous utilisons des significations authentiques de cartes de tarot, des tirages traditionnels et un symbolisme genuein de la tradition Rider-Waite-Smith. Les interprétations sont générées par l\'IA, conçues pour être réfléchies et pertinentes pour votre situation. Considérez-le comme la sagesse du tarot rendue accessible — les cartes sont réelles, les significations sont authentiques, et la technologie aide à fournir des aperçus personnalisés.' },
      'faq.gettingStarted.q3': { en: 'Do I need to know tarot to use this?', fr: 'Dois-je connaître le tarot pour utiliser ceci ?' },
      'faq.gettingStarted.a3': { en: 'Not at all. MysticOracle is designed for everyone, from complete beginners to experienced readers. Simply ask your question and we\'ll handle the rest. Each reading explains the cards drawn, their traditional meanings, and how they relate to your specific situation.', fr: 'Pas du tout. MysticOracle est conçu pour tout le monde, des débutants complets aux lecteurs expérimentés. Posez simplement votre question et nous nous occupons du reste. Chaque lecture explique les cartes tirées, leurs significations traditionnelles et comment elles se rapportent à votre situation spécifique.' },
      'faq.gettingStarted.q4': { en: 'Are the readings accurate predictions?', fr: 'Les lectures sont-elles des prédictions précises ?' },
      'faq.gettingStarted.a4': { en: 'MysticOracle does not predict the future. Tarot is a tool for reflection and insight, not divination. Our AI-generated interpretations offer symbolic guidance based on traditional card meanings. They\'re meant to help you think about your situation from new angles, not to tell you what will happen. The value lies in the perspective and self-reflection they inspire.', fr: 'MysticOracle ne prédit pas l\'avenir. Le tarot est un outil de réflexion et d\'insight, pas de divination. Nos interprétations générées par l\'IA offrent une guidance symbolique basée sur les significations traditionnelles des cartes. Elles sont destinées à vous aider à réfléchir à votre situation sous de nouveaux angles, pas à vous dire ce qui va arriver. La valeur réside dans la perspective et l\'auto-réflexion qu\'elles inspirent.' },
      'faq.gettingStarted.q5': { en: 'Are the interpretations generated by AI?', fr: 'Les interprétations sont-elles générées par l\'IA ?' },
      'faq.gettingStarted.a5': { en: 'Yes. All readings are generated by artificial intelligence. While we\'ve trained our system on authentic tarot meanings and interpretation techniques, AI can make mistakes or produce responses that don\'t fully resonate with your situation. Use the readings as one perspective among many, and trust your own intuition above all.', fr: 'Oui. Toutes les lectures sont générées par intelligence artificielle. Bien que nous ayons formé notre système sur des significations de tarot authentiques et des techniques d\'interprétation, l\'IA peut faire des erreurs ou produire des réponses qui ne résonnent pas complètement avec votre situation. Utilisez les lectures comme une perspective parmi d\'autres, et faites confiance à votre propre intuition avant tout.' },

      'faq.credits.title': { en: 'Credits & Payment', fr: 'Crédits & Paiement' },
      'faq.credits.q1': { en: 'How do credits work?', fr: 'Comment fonctionnent les crédits ?' },
      'faq.credits.a1': { en: 'Credits are how you pay for readings. There are no subscriptions or monthly fees — you simply buy credits when you need them, or earn them for free through daily bonuses and referrals.', fr: 'Les crédits sont la façon dont vous payez pour les lectures. Il n\'y a pas d\'abonnements ni de frais mensuels — vous achetez simplement des crédits quand vous en avez besoin, ou vous les gagnez gratuitement grâce aux bonus quotidiens et aux parrainages.' },
      'faq.credits.learnMore': { en: 'Learn more about credits', fr: 'En savoir plus sur les crédits' },
      'faq.credits.q2': { en: 'How much do readings cost?', fr: 'Combien coûtent les lectures ?' },
      'faq.credits.seeFullPricing': { en: 'See full pricing', fr: 'Voir tous les tarifs' },
      'faq.credits.q3': { en: 'Do credits expire?', fr: 'Les crédits expirent-ils ?' },
      'faq.credits.a3': { en: 'No. Your credits never expire. They\'re yours until you use them, whether that\'s tomorrow or years from now.', fr: 'Non. Vos crédits n\'expirent jamais. Ils sont à vous jusqu\'à ce que vous les utilisiez, que ce soit demain ou dans des années.' },
      'faq.credits.q4': { en: 'What payment methods do you accept?', fr: 'Quels modes de paiement acceptez-vous ?' },
      'faq.credits.a4': { en: 'We accept credit and debit cards through Stripe (Visa, Mastercard, American Express, and more) as well as PayPal. All payments are processed securely — we never see or store your payment details.', fr: 'Nous acceptons les cartes de crédit et de débit via Stripe (Visa, Mastercard, American Express, et plus) ainsi que PayPal. Tous les paiements sont traités de manière sécurisée — nous ne voyons ni ne stockons jamais vos détails de paiement.' },
      'faq.credits.q5': { en: 'Can I get a refund?', fr: 'Puis-je obtenir un remboursement ?' },
      'faq.credits.a5': { en: 'We evaluate refund requests on a case-by-case basis. If you\'re unhappy with a purchase, please contact us at', fr: 'Nous évaluons les demandes de remboursement au cas par cas. Si vous n\'êtes pas satisfait d\'un achat, veuillez nous contacter à' },
      'faq.credits.a5b': { en: 'and we\'ll do our best to help.', fr: 'et nous ferons de notre mieux pour vous aider.' },

      'faq.readings.title': { en: 'Your Readings', fr: 'Vos Lectures' },
      'faq.readings.q1': { en: 'Are my readings saved?', fr: 'Mes lectures sont-elles sauvegardées ?' },
      'faq.readings.a1': { en: 'Yes. All your readings are automatically saved to your account. You can view your complete reading history anytime from your', fr: 'Oui. Toutes vos lectures sont automatiquement sauvegardées sur votre compte. Vous pouvez consulter votre historique complet de lectures à tout moment depuis votre' },
      'faq.readings.profile': { en: 'profile page', fr: 'page de profil' },
      'faq.readings.q2': { en: 'Can I ask follow-up questions?', fr: 'Puis-je poser des questions de suivi ?' },
      'faq.readings.q3': { en: 'What spread types are available?', fr: 'Quels types de tirages sont disponibles ?' },
      'faq.readings.a3': { en: 'We offer several spread types to suit different needs:', fr: 'Nous proposons plusieurs types de tirages pour répondre à différents besoins :' },
      'faq.readings.spread1': { en: 'Single Card', fr: 'Carte Unique' },
      'faq.readings.spread1desc': { en: 'Quick guidance for simple questions', fr: 'Guidance rapide pour les questions simples' },
      'faq.readings.spread2': { en: 'Three Card', fr: 'Trois Cartes' },
      'faq.readings.spread2desc': { en: 'Past, present, and future perspective', fr: 'Perspective passé, présent et futur' },
      'faq.readings.spread3': { en: 'Horseshoe', fr: 'Fer à Cheval' },
      'faq.readings.spread3desc': { en: 'Deeper situation analysis with 7 cards', fr: 'Analyse approfondie de la situation avec 7 cartes' },
      'faq.readings.spread4': { en: 'Celtic Cross', fr: 'Croix Celtique' },
      'faq.readings.spread4desc': { en: 'Comprehensive 10-card reading for complex questions', fr: 'Lecture complète de 10 cartes pour les questions complexes' },
      'faq.readings.q4': { en: 'Can I add my own reflections to readings?', fr: 'Puis-je ajouter mes propres réflexions aux lectures ?' },
      'faq.readings.a4': { en: 'Yes. After each reading, you have the option to write your own reflections and thoughts. This helps you process the reading and creates a personal journal of your tarot journey.', fr: 'Oui. Après chaque lecture, vous avez la possibilité d\'écrire vos propres réflexions et pensées. Cela vous aide à traiter la lecture et crée un journal personnel de votre voyage tarot.' },
      'faq.readings.q5': { en: 'What languages are supported?', fr: 'Quelles langues sont prises en charge ?' },
      'faq.readings.a5': { en: 'MysticOracle is fully available in English and French. You can switch languages anytime using the flag icon in the header. Your readings will be generated in your selected language.', fr: 'MysticOracle est entièrement disponible en anglais et en français. Vous pouvez changer de langue à tout moment en utilisant l\'icône de drapeau dans l\'en-tête. Vos lectures seront générées dans la langue sélectionnée.' },

      'faq.privacy.title': { en: 'Privacy & Security', fr: 'Confidentialité & Sécurité' },
      'faq.privacy.q1': { en: 'Is my data private?', fr: 'Mes données sont-elles privées ?' },
      'faq.privacy.a1': { en: 'Yes. Your readings, questions, and personal reflections are completely private to your account. We do not share, sell, or use your data for any purpose other than providing you with the service. See our', fr: 'Oui. Vos lectures, questions et réflexions personnelles sont complètement privées sur votre compte. Nous ne partageons pas, ne vendons pas et n\'utilisons pas vos données à d\'autres fins que de vous fournir le service. Consultez notre' },
      'faq.privacy.privacyPolicy': { en: 'Privacy Policy', fr: 'Politique de Confidentialité' },
      'faq.privacy.a1b': { en: 'for complete details.', fr: 'pour les détails complets.' },
      'faq.privacy.q2': { en: 'Where is my data stored?', fr: 'Où sont stockées mes données ?' },
      'faq.privacy.a2': { en: 'Your data is stored on secure servers in the European Union (Frankfurt, Germany), in compliance with GDPR regulations. We use industry-standard encryption to protect your information.', fr: 'Vos données sont stockées sur des serveurs sécurisés dans l\'Union Européenne (Francfort, Allemagne), en conformité avec les réglementations RGPD. Nous utilisons un chiffrement aux normes de l\'industrie pour protéger vos informations.' },
      'faq.privacy.q3': { en: 'How do I delete my account?', fr: 'Comment puis-je supprimer mon compte ?' },
      'faq.privacy.a3': { en: 'To delete your account and all associated data, please contact us at', fr: 'Pour supprimer votre compte et toutes les données associées, veuillez nous contacter à' },
      'faq.privacy.a3b': { en: 'We\'ll process your request within 30 days and confirm once your data has been permanently deleted.', fr: 'Nous traiterons votre demande dans les 30 jours et confirmerons une fois vos données définitivement supprimées.' },
      'faq.privacy.q4': { en: 'Is payment information secure?', fr: 'Les informations de paiement sont-elles sécurisées ?' },
      'faq.privacy.a4': { en: 'Absolutely. All payments are processed by Stripe and PayPal — industry leaders in payment security. We never see, store, or have access to your credit card numbers or banking details.', fr: 'Absolument. Tous les paiements sont traités par Stripe et PayPal — leaders de l\'industrie en sécurité des paiements. Nous ne voyons jamais, ne stockons jamais et n\'avons jamais accès à vos numéros de carte de crédit ou détails bancaires.' },

      'faq.support.title': { en: 'Support', fr: 'Assistance' },
      'faq.support.q1': { en: 'How do I contact support?', fr: 'Comment puis-je contacter l\'assistance ?' },
      'faq.support.a1': { en: 'Email us at', fr: 'Envoyez-nous un email à' },
      'faq.support.a1b': { en: 'We typically respond within 24-48 hours.', fr: 'Nous répondons généralement dans les 24-48 heures.' },
      'faq.support.q2': { en: 'I have a payment issue', fr: 'J\'ai un problème de paiement' },
      'faq.support.a2': { en: 'We\'re sorry to hear that. Please contact us at', fr: 'Nous sommes désolés d\'apprendre cela. Veuillez nous contacter à' },
      'faq.support.a2b': { en: 'with your payment confirmation or any relevant details. We\'ll investigate and resolve the issue as quickly as possible.', fr: 'avec votre confirmation de paiement ou tout détail pertinent. Nous enquêterons et résoudrons le problème le plus rapidement possible.' },
      'faq.support.q3': { en: 'Something isn\'t working correctly', fr: 'Quelque chose ne fonctionne pas correctement' },
      'faq.support.a3': { en: 'Please email us at', fr: 'Veuillez nous envoyer un email à' },
      'faq.support.a3b': { en: 'with a description of the issue, what you were trying to do, and any error messages you saw. Screenshots are always helpful!', fr: 'avec une description du problème, ce que vous essayiez de faire et les messages d\'erreur que vous avez vus. Les captures d\'écran sont toujours utiles !' },
      'faq.support.q4': { en: 'Can I suggest a feature?', fr: 'Puis-je suggérer une fonctionnalité ?' },
      'faq.support.a4': { en: 'Absolutely! We love hearing from our users. Send your ideas to', fr: 'Absolument ! Nous adorons avoir des nouvelles de nos utilisateurs. Envoyez vos idées à' },
      'faq.support.a4b': { en: 'We read every suggestion and consider them for future updates.', fr: 'Nous lisons chaque suggestion et les considérons pour les futures mises à jour.' },

      'faq.cta.title': { en: 'Still have questions?', fr: 'Vous avez encore des questions ?' },
      'faq.cta.description': { en: 'We\'re here to help. Reach out and we\'ll get back to you as soon as possible.', fr: 'Nous sommes là pour vous aider. Contactez-nous et nous vous répondrons dès que possible.' },
      'faq.cta.button': { en: 'Contact Support', fr: 'Contacter l\'Assistance' },

      'faq.footer.disclaimer': { en: 'MysticOracle is intended for entertainment and personal insight only. Readings are AI-generated and should not replace professional advice. By using this service, you agree to our', fr: 'MysticOracle est destiné uniquement au divertissement et à l\'insight personnel. Les lectures sont générées par l\'IA et ne doivent pas remplacer les conseils professionnels. En utilisant ce service, vous acceptez nos' },
      'faq.footer.terms': { en: 'Terms of Service', fr: 'Conditions d\'Utilisation' },

      // SubNav - Navigation Menu
      'subnav.tarot.title': { en: 'Tarot Readings', fr: 'Tirages Tarot' },
      'subnav.horoscope.title': { en: 'Horoscope', fr: 'Horoscope' },
      'subnav.comingSoon.title': { en: 'Coming Soon', fr: 'Bientôt' },
      'subnav.learn.title': { en: 'Learn', fr: 'Découvrir' },

      // SubNav - Tarot Spreads
      'subnav.tarot.single.desc': { en: '1 card', fr: '1 carte' },
      'subnav.tarot.three_card.desc': { en: '3 cards', fr: '3 cartes' },
      'subnav.tarot.love.desc': { en: '5 cards', fr: '5 cartes' },
      'subnav.tarot.career.desc': { en: '5 cards', fr: '5 cartes' },
      'subnav.tarot.horseshoe.desc': { en: '7 cards', fr: '7 cartes' },
      'subnav.tarot.celtic_cross.desc': { en: '10 cards', fr: '10 cartes' },

      // SubNav - Coming Soon Items
      'subnav.comingSoon.runes.label': { en: 'Rune Reading', fr: 'Lecture des Runes' },
      'subnav.comingSoon.runes.desc': { en: 'Ancient Nordic wisdom', fr: 'Sagesse nordique ancienne' },
      'subnav.comingSoon.birthchart.label': { en: 'Birth Chart', fr: 'Thème Astral' },
      'subnav.comingSoon.birthchart.desc': { en: 'Your cosmic blueprint', fr: 'Votre empreinte cosmique' },
      'subnav.comingSoon.iching.label': { en: 'I Ching', fr: 'Yi King' },
      'subnav.comingSoon.iching.desc': { en: 'Book of Changes', fr: 'Livre des mutations' },
      'subnav.comingSoon.biofeedback.label': { en: 'Biofeedback', fr: 'Biofeedback' },
      'subnav.comingSoon.biofeedback.desc': { en: 'Mind-body connection', fr: 'Connexion corps-esprit' },

      // SubNav - Learn Items
      'subnav.learn.about.label': { en: 'About Us', fr: 'À Propos' },
      'subnav.learn.about.desc': { en: 'Our story', fr: 'Notre histoire' },
      'subnav.learn.blog.label': { en: 'Blog', fr: 'Blog' },
      'subnav.learn.blog.desc': { en: 'Articles & guides', fr: 'Articles & guides' },
      'subnav.learn.credits.label': { en: 'How Credits Work', fr: 'Comment fonctionnent les crédits' },
      'subnav.learn.credits.desc': { en: 'Pricing & packages', fr: 'Tarifs & forfaits' },
      'subnav.learn.faq.label': { en: 'Help & FAQ', fr: 'Aide & FAQ' },
      'subnav.learn.faq.desc': { en: 'Get answers', fr: 'Trouvez des réponses' },

      // About Us Page
      'about.title': { en: 'About MysticOracle', fr: 'À Propos de MysticOracle' },
      'about.subtitle': { en: 'Where ancient wisdom meets modern technology to illuminate your path.', fr: 'Là où la sagesse ancienne rencontre la technologie moderne pour éclairer votre chemin.' },
      'about.story.title': { en: 'Our Story', fr: 'Notre Histoire' },
      'about.story.p1': { en: 'MysticOracle was born from a simple belief: that the timeless wisdom of tarot should be accessible to everyone, anytime they need guidance. We created a platform that honors the rich traditions of tarot reading while embracing the possibilities of artificial intelligence.', fr: 'MysticOracle est né d\'une croyance simple : la sagesse intemporelle du tarot devrait être accessible à tous, à tout moment où ils ont besoin de guidance. Nous avons créé une plateforme qui honore les riches traditions de la lecture du tarot tout en embrassant les possibilités de l\'intelligence artificielle.' },
      'about.story.p2': { en: 'Our AI has been trained on centuries of tarot interpretation, symbolism, and meaning, allowing it to provide readings that are both insightful and personally relevant. Whether you seek clarity on love, career, or life\'s bigger questions, MysticOracle is here to guide you.', fr: 'Notre IA a été formée sur des siècles d\'interprétation, de symbolisme et de signification du tarot, lui permettant de fournir des lectures à la fois perspicaces et personnellement pertinentes. Que vous cherchiez de la clarté sur l\'amour, la carrière ou les grandes questions de la vie, MysticOracle est là pour vous guider.' },
      'about.values.title': { en: 'Our Values', fr: 'Nos Valeurs' },
      'about.values.ai.title': { en: 'AI-Powered Wisdom', fr: 'Sagesse Assistée par IA' },
      'about.values.ai.desc': { en: 'We combine ancient tarot traditions with modern AI to provide meaningful, personalized readings.', fr: 'Nous combinons les traditions anciennes du tarot avec l\'IA moderne pour offrir des lectures personnalisées et significatives.' },
      'about.values.compassion.title': { en: 'Compassionate Guidance', fr: 'Guidance Bienveillante' },
      'about.values.compassion.desc': { en: 'Every reading is delivered with empathy and care, supporting you on your personal journey.', fr: 'Chaque lecture est délivrée avec empathie et soin, vous accompagnant dans votre parcours personnel.' },
      'about.values.privacy.title': { en: 'Privacy First', fr: 'Confidentialité Avant Tout' },
      'about.values.privacy.desc': { en: 'Your spiritual journey is personal. We protect your data with the highest security standards.', fr: 'Votre voyage spirituel est personnel. Nous protégeons vos données avec les plus hauts standards de sécurité.' },
      'about.values.instant.title': { en: 'Instant Insights', fr: 'Insights Instantanés' },
      'about.values.instant.desc': { en: 'Get clarity when you need it most, with readings available 24/7 at your fingertips.', fr: 'Obtenez de la clarté quand vous en avez le plus besoin, avec des lectures disponibles 24h/24.' },
      'about.disclaimer': { en: 'MysticOracle is intended for entertainment and personal reflection purposes only. Our AI-generated readings should not be considered professional advice for medical, legal, financial, or psychological matters.', fr: 'MysticOracle est destiné uniquement à des fins de divertissement et de réflexion personnelle. Nos lectures générées par IA ne doivent pas être considérées comme des conseils professionnels pour des questions médicales, juridiques, financières ou psychologiques.' },
      'about.cta.ready': { en: 'Ready to begin your journey?', fr: 'Prêt à commencer votre voyage ?' },
      'about.cta.button': { en: 'Start Your Reading', fr: 'Commencer Votre Lecture' },

      // Blog
      'blog.title': { en: 'Mystic Insights', fr: 'Révélations Mystiques' },
      'blog.subtitle': { en: 'Explore the mystical world of tarot, astrology, and spiritual growth.', fr: 'Explorez le monde mystique du tarot, de l\'astrologie et de la croissance spirituelle.' },
      'blog.featured': { en: 'Featured Articles', fr: 'Articles à la Une' },
      'blog.all': { en: 'All Articles', fr: 'Tous les Articles' },
      'blog.filtered': { en: 'Filtered Articles', fr: 'Articles Filtrés' },
      'blog.noArticles': { en: 'No articles found.', fr: 'Aucun article trouvé.' },
      'blog.categories': { en: 'Categories', fr: 'Catégories' },
      'blog.tags': { en: 'Tags', fr: 'Tags' },
      'blog.filterBy': { en: 'Filtering by', fr: 'Filtrer par' },
      'blog.backToBlog': { en: 'Back to Blog', fr: 'Retour au Blog' },
      'blog.share': { en: 'Share', fr: 'Partager' },
      'blog.relatedArticles': { en: 'Related Articles', fr: 'Articles Connexes' },
      'blog.readMore': { en: 'Read More', fr: 'Lire la Suite' },
      'blog.minRead': { en: 'min read', fr: 'min de lecture' },
      'blog.views': { en: 'views', fr: 'vues' },
      'blog.preview': { en: 'Preview Mode', fr: 'Mode Aperçu' },
      'blog.previewNote': { en: 'This is a preview. The post is not published yet.', fr: 'Ceci est un aperçu. L\'article n\'est pas encore publié.' },

      // Admin Blog
      'admin.blog': { en: 'Blog', fr: 'Blog' },
      'admin.blog.posts': { en: 'Posts', fr: 'Articles' },
      'admin.blog.categories': { en: 'Categories', fr: 'Catégories' },
      'admin.blog.tags': { en: 'Tags', fr: 'Tags' },
      'admin.blog.media': { en: 'Media', fr: 'Médias' },
      'admin.blog.trash': { en: 'Trash', fr: 'Corbeille' },
      'admin.blog.newPost': { en: 'New Post', fr: 'Nouvel Article' },
      'admin.blog.editPost': { en: 'Edit Post', fr: 'Modifier l\'Article' },
      'admin.blog.importJson': { en: 'Import JSON', fr: 'Importer JSON' },
      'admin.blog.preview': { en: 'Preview', fr: 'Aperçu' },
      'admin.blog.view': { en: 'View', fr: 'Voir' },
      'admin.blog.restore': { en: 'Restore', fr: 'Restaurer' },
      'admin.blog.emptyTrash': { en: 'Empty Trash', fr: 'Vider la Corbeille' },
      'admin.blog.deleteForever': { en: 'Delete Forever', fr: 'Supprimer Définitivement' },

      // Confirmation dialogs
      'confirm.moveToTrash': { en: 'Move to Trash', fr: 'Déplacer vers la Corbeille' },
      'confirm.moveToTrashMsg': { en: 'This post will be moved to the trash. You can restore it later.', fr: 'Cet article sera déplacé vers la corbeille. Vous pourrez le restaurer plus tard.' },
      'confirm.deleteCategory': { en: 'Delete Category', fr: 'Supprimer la Catégorie' },
      'confirm.deleteCategoryMsg': { en: 'Are you sure you want to delete this category?', fr: 'Êtes-vous sûr de vouloir supprimer cette catégorie?' },
      'confirm.deleteTag': { en: 'Delete Tag', fr: 'Supprimer le Tag' },
      'confirm.deleteTagMsg': { en: 'Are you sure you want to delete this tag?', fr: 'Êtes-vous sûr de vouloir supprimer ce tag?' },
      'confirm.deleteImage': { en: 'Delete Image', fr: 'Supprimer l\'Image' },
      'confirm.deleteImageMsg': { en: 'Are you sure you want to delete this image?', fr: 'Êtes-vous sûr de vouloir supprimer cette image?' },
      'confirm.permanentDelete': { en: 'Permanently Delete', fr: 'Supprimer Définitivement' },
      'confirm.permanentDeleteMsg': { en: 'This will permanently delete this post. This action cannot be undone.', fr: 'Cela supprimera définitivement cet article. Cette action est irréversible.' },
      'confirm.emptyTrash': { en: 'Empty Trash', fr: 'Vider la Corbeille' },
      'confirm.emptyTrashMsg': { en: 'Permanently delete all items in trash? This cannot be undone.', fr: 'Supprimer définitivement tous les éléments de la corbeille? Cette action est irréversible.' },
      'confirm.cancel': { en: 'Cancel', fr: 'Annuler' },
      'confirm.confirm': { en: 'Confirm', fr: 'Confirmer' },

      // Status labels
      'status.draft': { en: 'Draft', fr: 'Brouillon' },
      'status.published': { en: 'Published', fr: 'Publié' },
      'status.archived': { en: 'Archived', fr: 'Archivé' },
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

    // Invalidate cache and bump version
    await invalidateTranslationCache();

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

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Languages, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TranslationEntry {
  key: string;
  en: string;
  fr: string;
}

interface TranslationSection {
  id: string;
  nameEn: string;
  nameFr: string;
  entries: TranslationEntry[];
}

const TRANSLATIONS: TranslationSection[] = [
  {
    id: 'navigation',
    nameEn: 'Navigation & Header',
    nameFr: 'Navigation & En-tête',
    entries: [
      { key: 'nav.home', en: 'Home', fr: 'Accueil' },
      { key: 'nav.reading', en: 'Reading', fr: 'Lecture' },
      { key: 'nav.horoscope', en: 'Horoscope', fr: 'Horoscope' },
      { key: 'nav.profile', en: 'Profile', fr: 'Profil' },
      { key: 'nav.admin', en: 'Admin', fr: 'Admin' },
      { key: 'nav.credits', en: 'credits', fr: 'crédits' },
      { key: 'nav.signIn', en: 'Sign In', fr: 'Connexion' },
      { key: 'nav.signOut', en: 'Sign Out', fr: 'Déconnexion' },
    ]
  },
  {
    id: 'home',
    nameEn: 'Home Page',
    nameFr: 'Page d\'Accueil',
    entries: [
      { key: 'home.title', en: 'MysticOracle', fr: 'MysticOracle' },
      { key: 'home.subtitle', en: 'Discover Your Destiny', fr: 'Découvrez Votre Destin' },
      { key: 'home.startReading', en: 'Start Reading', fr: 'Commencer la Lecture' },
      { key: 'home.dailyHoroscope', en: 'Daily Horoscope', fr: 'Horoscope Quotidien' },
    ]
  },
  {
    id: 'tarot',
    nameEn: 'Tarot Reading',
    nameFr: 'Lecture de Tarot',
    entries: [
      { key: 'tarot.selectSpread', en: 'Select Your Spread', fr: 'Choisissez Votre Tirage' },
      { key: 'tarot.singleCard', en: 'Single Card', fr: 'Une Carte' },
      { key: 'tarot.threeCard', en: 'Three Card Spread', fr: 'Tirage Trois Cartes' },
      { key: 'tarot.celticCross', en: 'Celtic Cross', fr: 'Croix Celtique' },
      { key: 'tarot.shuffleDeck', en: 'Shuffle the Deck', fr: 'Mélanger les Cartes' },
      { key: 'tarot.drawCards', en: 'Draw Cards', fr: 'Tirer les Cartes' },
      { key: 'tarot.getInterpretation', en: 'Get Interpretation', fr: 'Obtenir l\'Interprétation' },
      { key: 'tarot.askFollowUp', en: 'Ask a follow-up question...', fr: 'Posez une question de suivi...' },
      { key: 'tarot.newReading', en: 'New Reading', fr: 'Nouvelle Lecture' },
      { key: 'tarot.cost', en: 'Cost', fr: 'Coût' },
      { key: 'tarot.credit', en: 'credit', fr: 'crédit' },
      { key: 'tarot.credits', en: 'credits', fr: 'crédits' },
    ]
  },
  {
    id: 'horoscope',
    nameEn: 'Horoscope',
    nameFr: 'Horoscope',
    entries: [
      { key: 'horoscope.title', en: 'Daily Horoscope', fr: 'Horoscope Quotidien' },
      { key: 'horoscope.selectSign', en: 'Select your zodiac sign', fr: 'Sélectionnez votre signe du zodiaque' },
      { key: 'horoscope.aries', en: 'Aries', fr: 'Bélier' },
      { key: 'horoscope.taurus', en: 'Taurus', fr: 'Taureau' },
      { key: 'horoscope.gemini', en: 'Gemini', fr: 'Gémeaux' },
      { key: 'horoscope.cancer', en: 'Cancer', fr: 'Cancer' },
      { key: 'horoscope.leo', en: 'Leo', fr: 'Lion' },
      { key: 'horoscope.virgo', en: 'Virgo', fr: 'Vierge' },
      { key: 'horoscope.libra', en: 'Libra', fr: 'Balance' },
      { key: 'horoscope.scorpio', en: 'Scorpio', fr: 'Scorpion' },
      { key: 'horoscope.sagittarius', en: 'Sagittarius', fr: 'Sagittaire' },
      { key: 'horoscope.capricorn', en: 'Capricorn', fr: 'Capricorne' },
      { key: 'horoscope.aquarius', en: 'Aquarius', fr: 'Verseau' },
      { key: 'horoscope.pisces', en: 'Pisces', fr: 'Poissons' },
    ]
  },
  {
    id: 'profile',
    nameEn: 'User Profile',
    nameFr: 'Profil Utilisateur',
    entries: [
      { key: 'profile.title', en: 'Your Profile', fr: 'Votre Profil' },
      { key: 'profile.credits', en: 'Credits', fr: 'Crédits' },
      { key: 'profile.readingHistory', en: 'Reading History', fr: 'Historique des Lectures' },
      { key: 'profile.achievements', en: 'Achievements', fr: 'Réalisations' },
      { key: 'profile.settings', en: 'Settings', fr: 'Paramètres' },
      { key: 'profile.dailyBonus', en: 'Daily Bonus', fr: 'Bonus Quotidien' },
      { key: 'profile.claim', en: 'Claim', fr: 'Réclamer' },
      { key: 'profile.claimed', en: 'Claimed', fr: 'Réclamé' },
      { key: 'profile.streak', en: 'Day Streak', fr: 'Jours Consécutifs' },
    ]
  },
  {
    id: 'creditShop',
    nameEn: 'Credit Shop',
    nameFr: 'Boutique de Crédits',
    entries: [
      { key: 'shop.title', en: 'Get More Credits', fr: 'Obtenez Plus de Crédits' },
      { key: 'shop.popular', en: 'Popular', fr: 'Populaire' },
      { key: 'shop.bestValue', en: 'Best Value', fr: 'Meilleur Rapport' },
      { key: 'shop.buyNow', en: 'Buy Now', fr: 'Acheter' },
      { key: 'shop.securePayment', en: 'Secure Payment', fr: 'Paiement Sécurisé' },
      { key: 'shop.payWithCard', en: 'Pay with Card', fr: 'Payer par Carte' },
      { key: 'shop.payWithPaypal', en: 'Pay with PayPal', fr: 'Payer avec PayPal' },
    ]
  },
  {
    id: 'admin',
    nameEn: 'Admin Dashboard',
    nameFr: 'Tableau de Bord Admin',
    entries: [
      { key: 'admin.title', en: 'Admin Dashboard', fr: 'Tableau de Bord Admin' },
      { key: 'admin.overview', en: 'Overview', fr: 'Aperçu' },
      { key: 'admin.users', en: 'Users', fr: 'Utilisateurs' },
      { key: 'admin.transactions', en: 'Transactions', fr: 'Transactions' },
      { key: 'admin.packages', en: 'Packages', fr: 'Forfaits' },
      { key: 'admin.emails', en: 'Emails', fr: 'Emails' },
      { key: 'admin.analytics', en: 'Analytics', fr: 'Analytique' },
      { key: 'admin.health', en: 'Health', fr: 'Santé' },
      { key: 'admin.settings', en: 'Settings', fr: 'Paramètres' },
      { key: 'admin.translations', en: 'Translations', fr: 'Traductions' },
    ]
  },
  {
    id: 'common',
    nameEn: 'Common',
    nameFr: 'Commun',
    entries: [
      { key: 'common.loading', en: 'Loading...', fr: 'Chargement...' },
      { key: 'common.error', en: 'Error', fr: 'Erreur' },
      { key: 'common.save', en: 'Save', fr: 'Sauvegarder' },
      { key: 'common.cancel', en: 'Cancel', fr: 'Annuler' },
      { key: 'common.delete', en: 'Delete', fr: 'Supprimer' },
      { key: 'common.edit', en: 'Edit', fr: 'Modifier' },
      { key: 'common.create', en: 'Create', fr: 'Créer' },
      { key: 'common.close', en: 'Close', fr: 'Fermer' },
      { key: 'common.yes', en: 'Yes', fr: 'Oui' },
      { key: 'common.no', en: 'No', fr: 'Non' },
      { key: 'common.refresh', en: 'Refresh', fr: 'Actualiser' },
      { key: 'common.active', en: 'Active', fr: 'Actif' },
      { key: 'common.inactive', en: 'Inactive', fr: 'Inactif' },
    ]
  },
  {
    id: 'legal',
    nameEn: 'Legal Pages',
    nameFr: 'Pages Légales',
    entries: [
      { key: 'legal.privacy', en: 'Privacy Policy', fr: 'Politique de Confidentialité' },
      { key: 'legal.terms', en: 'Terms of Service', fr: 'Conditions d\'Utilisation' },
      { key: 'legal.cookies', en: 'Cookie Policy', fr: 'Politique des Cookies' },
      { key: 'legal.contact', en: 'Contact', fr: 'Contact' },
    ]
  },
];

const AdminTranslations: React.FC = () => {
  const { language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['navigation', 'common']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const filteredSections = TRANSLATIONS.map(section => ({
    ...section,
    entries: section.entries.filter(entry =>
      entry.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.fr.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.entries.length > 0);

  const totalStrings = TRANSLATIONS.reduce((acc, section) => acc + section.entries.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Languages className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-heading text-purple-200">
              {language === 'en' ? 'Translations' : 'Traductions'}
            </h2>
            <p className="text-xs text-slate-400">
              {totalStrings} {language === 'en' ? 'strings in 2 languages' : 'chaînes en 2 langues'}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'en' ? 'Search translations...' : 'Rechercher des traductions...'}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
        />
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-sm text-amber-200/80">
          {language === 'en'
            ? 'These translations are currently hardcoded in the React components. To modify them, edit the source files directly. A future update may add dynamic translation management.'
            : 'Ces traductions sont actuellement codées en dur dans les composants React. Pour les modifier, éditez directement les fichiers source. Une future mise à jour pourrait ajouter une gestion dynamique des traductions.'}
        </p>
      </div>

      {/* Translation Sections */}
      <div className="space-y-3">
        {filteredSections.map((section) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900/60 rounded-lg border border-purple-500/20 overflow-hidden"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedSections.includes(section.id) ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <span className="font-medium text-white">
                  {language === 'en' ? section.nameEn : section.nameFr}
                </span>
                <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
                  {section.entries.length}
                </span>
              </div>
            </button>

            <AnimatePresence>
              {expandedSections.includes(section.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-700"
                >
                  <div className="p-4">
                    <div className="grid grid-cols-12 gap-2 mb-2 text-xs text-slate-500 font-medium">
                      <div className="col-span-3">KEY</div>
                      <div className="col-span-4">ENGLISH</div>
                      <div className="col-span-5">FRENCH</div>
                    </div>
                    <div className="space-y-2">
                      {section.entries.map((entry) => (
                        <div
                          key={entry.key}
                          className="grid grid-cols-12 gap-2 p-2 bg-slate-800/50 rounded text-sm"
                        >
                          <div className="col-span-3 font-mono text-xs text-purple-300 truncate" title={entry.key}>
                            {entry.key}
                          </div>
                          <div className="col-span-4 text-slate-300">
                            {entry.en}
                          </div>
                          <div className="col-span-5 text-slate-300">
                            {entry.fr}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          {language === 'en' ? 'No translations found matching your search.' : 'Aucune traduction trouvée.'}
        </div>
      )}
    </div>
  );
};

export default AdminTranslations;

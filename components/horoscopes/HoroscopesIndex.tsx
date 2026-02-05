import React from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/TranslationContext';
import { ROUTES, buildRoute } from '../../routes/routes';

// Zodiac signs with slugs and symbols
const zodiacSigns = [
  { slug: 'aries', en: 'Aries', fr: 'Bélier', symbol: '\u2648', dates: 'Mar 21 - Apr 19', datesFr: '21 mars - 19 avril', element: 'fire' },
  { slug: 'taurus', en: 'Taurus', fr: 'Taureau', symbol: '\u2649', dates: 'Apr 20 - May 20', datesFr: '20 avril - 20 mai', element: 'earth' },
  { slug: 'gemini', en: 'Gemini', fr: 'Gémeaux', symbol: '\u264A', dates: 'May 21 - Jun 20', datesFr: '21 mai - 20 juin', element: 'air' },
  { slug: 'cancer', en: 'Cancer', fr: 'Cancer', symbol: '\u264B', dates: 'Jun 21 - Jul 22', datesFr: '21 juin - 22 juillet', element: 'water' },
  { slug: 'leo', en: 'Leo', fr: 'Lion', symbol: '\u264C', dates: 'Jul 23 - Aug 22', datesFr: '23 juillet - 22 août', element: 'fire' },
  { slug: 'virgo', en: 'Virgo', fr: 'Vierge', symbol: '\u264D', dates: 'Aug 23 - Sep 22', datesFr: '23 août - 22 sept', element: 'earth' },
  { slug: 'libra', en: 'Libra', fr: 'Balance', symbol: '\u264E', dates: 'Sep 23 - Oct 22', datesFr: '23 sept - 22 oct', element: 'air' },
  { slug: 'scorpio', en: 'Scorpio', fr: 'Scorpion', symbol: '\u264F', dates: 'Oct 23 - Nov 21', datesFr: '23 oct - 21 nov', element: 'water' },
  { slug: 'sagittarius', en: 'Sagittarius', fr: 'Sagittaire', symbol: '\u2650', dates: 'Nov 22 - Dec 21', datesFr: '22 nov - 21 déc', element: 'fire' },
  { slug: 'capricorn', en: 'Capricorn', fr: 'Capricorne', symbol: '\u2651', dates: 'Dec 22 - Jan 19', datesFr: '22 déc - 19 jan', element: 'earth' },
  { slug: 'aquarius', en: 'Aquarius', fr: 'Verseau', symbol: '\u2652', dates: 'Jan 20 - Feb 18', datesFr: '20 jan - 18 fév', element: 'air' },
  { slug: 'pisces', en: 'Pisces', fr: 'Poissons', symbol: '\u2653', dates: 'Feb 19 - Mar 20', datesFr: '19 fév - 20 mars', element: 'water' },
];

const elementColors = {
  fire: 'from-red-500/20 to-orange-500/20 border-orange-500/30 hover:border-orange-400/50',
  earth: 'from-green-500/20 to-emerald-500/20 border-emerald-500/30 hover:border-emerald-400/50',
  air: 'from-sky-500/20 to-blue-500/20 border-sky-500/30 hover:border-sky-400/50',
  water: 'from-blue-500/20 to-indigo-500/20 border-indigo-500/30 hover:border-indigo-400/50',
};

const elementTextColors = {
  fire: 'text-orange-300',
  earth: 'text-emerald-300',
  air: 'text-sky-300',
  water: 'text-indigo-300',
};

const HoroscopesIndex: React.FC = () => {
  const { language } = useApp();
  const { t } = useTranslation();

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://mysticoracle.com';

  return (
    <>
      <Helmet>
        <title>
          {language === 'en'
            ? 'Daily Horoscopes - All Zodiac Signs | MysticOracle'
            : 'Horoscopes du Jour - Tous les Signes | MysticOracle'}
        </title>
        <meta
          name="description"
          content={
            language === 'en'
              ? 'Get your free daily horoscope for all 12 zodiac signs. Personalized astrological guidance powered by AI for Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, and Pisces.'
              : 'Obtenez votre horoscope quotidien gratuit pour les 12 signes du zodiaque. Conseils astrologiques personnalisés par IA pour Bélier, Taureau, Gémeaux, Cancer, Lion, Vierge, Balance, Scorpion, Sagittaire, Capricorne, Verseau et Poissons.'
          }
        />
        <link rel="canonical" href={`${siteUrl}/horoscopes`} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content={
            language === 'en'
              ? 'Daily Horoscopes - All Zodiac Signs | MysticOracle'
              : 'Horoscopes du Jour - Tous les Signes | MysticOracle'
          }
        />
        <meta
          property="og:description"
          content={
            language === 'en'
              ? 'Get your free daily horoscope for all 12 zodiac signs with AI-powered astrological guidance.'
              : 'Obtenez votre horoscope quotidien gratuit pour les 12 signes du zodiaque avec des conseils astrologiques par IA.'
          }
        />
        <meta property="og:url" content={`${siteUrl}/horoscopes`} />

        {/* JSON-LD Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: language === 'en' ? 'Daily Horoscopes' : 'Horoscopes du Jour',
            description:
              language === 'en'
                ? 'Daily horoscopes for all 12 zodiac signs'
                : 'Horoscopes quotidiens pour les 12 signes du zodiaque',
            url: `${siteUrl}/horoscopes`,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: zodiacSigns.map((sign, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'Article',
                  name: `${sign.en} Horoscope`,
                  url: `${siteUrl}/horoscopes/${sign.slug}`,
                },
              })),
            },
          })}
        </script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-purple-300 mb-4">
            {t('horoscopes.HoroscopesIndex.title', language === 'en' ? 'Daily Horoscopes' : 'Horoscopes du Jour')}
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            {t(
              'horoscopes.HoroscopesIndex.subtitle',
              language === 'en'
                ? 'Select your zodiac sign to discover what the stars have in store for you today.'
                : 'Sélectionnez votre signe du zodiaque pour découvrir ce que les étoiles vous réservent aujourd\'hui.'
            )}
          </p>
        </motion.div>

        {/* Zodiac Signs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {zodiacSigns.map((sign, index) => (
            <Link
              key={sign.slug}
              to={buildRoute(ROUTES.HOROSCOPE_SIGN, { sign: sign.slug })}
              className={`
                relative group p-6 rounded-2xl border bg-gradient-to-br backdrop-blur-sm
                transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl
                ${elementColors[sign.element as keyof typeof elementColors]}
              `}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
              {/* Symbol */}
              <div className="text-5xl mb-3 text-center opacity-80 group-hover:opacity-100 transition-opacity">
                {sign.symbol}
              </div>

              {/* Sign Name */}
              <h2
                className={`text-xl font-heading font-bold text-center mb-1 ${
                  elementTextColors[sign.element as keyof typeof elementTextColors]
                }`}
              >
                {language === 'en' ? sign.en : sign.fr}
              </h2>

              {/* Dates */}
              <p className="text-xs text-slate-400 text-center">
                {language === 'en' ? sign.dates : sign.datesFr}
              </p>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Element Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-slate-400"
        >
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500/50" />
            <span>{t('horoscopes.HoroscopesIndex.fire', language === 'en' ? 'Fire' : 'Feu')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500/50" />
            <span>{t('horoscopes.HoroscopesIndex.earth', language === 'en' ? 'Earth' : 'Terre')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-500/50" />
            <span>{t('horoscopes.HoroscopesIndex.air', language === 'en' ? 'Air' : 'Air')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500/50" />
            <span>{t('horoscopes.HoroscopesIndex.water', language === 'en' ? 'Water' : 'Eau')}</span>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default HoroscopesIndex;

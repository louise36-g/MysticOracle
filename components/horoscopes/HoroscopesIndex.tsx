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

// Vibrant element styles with glowing colors
const elementStyles = {
  fire: {
    primary: '#ff8c00',
    glow: 'rgba(255, 140, 0, 0.6)',
    gradient: 'from-orange-500/40 via-amber-500/30 to-red-500/40',
    border: 'border-orange-500/40',
  },
  earth: {
    primary: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.6)',
    gradient: 'from-green-500/40 via-emerald-500/30 to-teal-500/40',
    border: 'border-emerald-500/40',
  },
  air: {
    primary: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.6)',
    gradient: 'from-sky-400/40 via-cyan-500/30 to-blue-500/40',
    border: 'border-sky-500/40',
  },
  water: {
    primary: '#a78bfa',
    glow: 'rgba(167, 139, 250, 0.6)',
    gradient: 'from-violet-400/40 via-purple-500/30 to-indigo-500/40',
    border: 'border-violet-500/40',
  },
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

        {/* Zodiac Signs Grid - 4 columns, horizontal cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {zodiacSigns.map((sign, index) => {
            const style = elementStyles[sign.element as keyof typeof elementStyles];
            return (
              <Link
                key={sign.slug}
                to={buildRoute(ROUTES.HOROSCOPE_SIGN, { sign: sign.slug })}
                className="group relative"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.04, duration: 0.4 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative py-4 px-4 rounded-xl overflow-hidden"
                >
                  {/* Card background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient}`} />

                  {/* Animated border glow on hover */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      boxShadow: `inset 0 0 0 2px ${style.primary}, 0 0 25px ${style.glow}, 0 0 50px ${style.glow}`,
                    }}
                  />

                  {/* Default border */}
                  <div
                    className="absolute inset-0 rounded-xl border-2 group-hover:border-transparent transition-colors"
                    style={{ borderColor: `${style.primary}40` }}
                  />

                  {/* Inner shine */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-xl" />

                  {/* Content - horizontal layout: name/dates left, symbol right */}
                  <div className="relative flex items-center justify-between gap-3">
                    {/* Sign name and dates */}
                    <div className="flex flex-col items-start min-w-0">
                      <h2 className="text-base font-heading font-semibold text-white group-hover:text-white transition-colors">
                        {language === 'en' ? sign.en : sign.fr}
                      </h2>
                      <p className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">
                        {language === 'en' ? sign.dates : sign.datesFr}
                      </p>
                    </div>

                    {/* Zodiac symbol with glow - right side */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="absolute inset-0 text-3xl flex items-center justify-center blur-md opacity-60 group-hover:opacity-100 transition-opacity"
                        style={{ color: style.primary }}
                      >
                        {sign.symbol}
                      </div>
                      <span
                        className="relative text-3xl block"
                        style={{
                          color: style.primary,
                          textShadow: `0 0 12px ${style.glow}`,
                        }}
                      >
                        {sign.symbol}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Element Legend with vibrant colors */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-slate-400"
        >
          {[
            { label: language === 'fr' ? 'Feu' : 'Fire', color: '#ff8c00' },
            { label: language === 'fr' ? 'Terre' : 'Earth', color: '#22c55e' },
            { label: language === 'fr' ? 'Air' : 'Air', color: '#38bdf8' },
            { label: language === 'fr' ? 'Eau' : 'Water', color: '#a78bfa' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}
              />
              <span>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </>
  );
};

export default HoroscopesIndex;

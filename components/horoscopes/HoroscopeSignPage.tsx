import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { fetchHoroscope } from '../../services/api';
import { ArrowLeft, Calendar, Sparkles, Star } from 'lucide-react';
import { ROUTES } from '../../routes/routes';

// Zodiac signs with slugs, symbols, and metadata
const zodiacSigns = [
  { slug: 'aries', en: 'Aries', fr: 'Bélier', symbol: '\u2648', dates: 'Mar 21 - Apr 19', datesFr: '21 mars - 19 avril', element: 'fire', ruling: 'Mars', rulingFr: 'Mars' },
  { slug: 'taurus', en: 'Taurus', fr: 'Taureau', symbol: '\u2649', dates: 'Apr 20 - May 20', datesFr: '20 avril - 20 mai', element: 'earth', ruling: 'Venus', rulingFr: 'Vénus' },
  { slug: 'gemini', en: 'Gemini', fr: 'Gémeaux', symbol: '\u264A', dates: 'May 21 - Jun 20', datesFr: '21 mai - 20 juin', element: 'air', ruling: 'Mercury', rulingFr: 'Mercure' },
  { slug: 'cancer', en: 'Cancer', fr: 'Cancer', symbol: '\u264B', dates: 'Jun 21 - Jul 22', datesFr: '21 juin - 22 juillet', element: 'water', ruling: 'Moon', rulingFr: 'Lune' },
  { slug: 'leo', en: 'Leo', fr: 'Lion', symbol: '\u264C', dates: 'Jul 23 - Aug 22', datesFr: '23 juillet - 22 août', element: 'fire', ruling: 'Sun', rulingFr: 'Soleil' },
  { slug: 'virgo', en: 'Virgo', fr: 'Vierge', symbol: '\u264D', dates: 'Aug 23 - Sep 22', datesFr: '23 août - 22 sept', element: 'earth', ruling: 'Mercury', rulingFr: 'Mercure' },
  { slug: 'libra', en: 'Libra', fr: 'Balance', symbol: '\u264E', dates: 'Sep 23 - Oct 22', datesFr: '23 sept - 22 oct', element: 'air', ruling: 'Venus', rulingFr: 'Vénus' },
  { slug: 'scorpio', en: 'Scorpio', fr: 'Scorpion', symbol: '\u264F', dates: 'Oct 23 - Nov 21', datesFr: '23 oct - 21 nov', element: 'water', ruling: 'Pluto', rulingFr: 'Pluton' },
  { slug: 'sagittarius', en: 'Sagittarius', fr: 'Sagittaire', symbol: '\u2650', dates: 'Nov 22 - Dec 21', datesFr: '22 nov - 21 déc', element: 'fire', ruling: 'Jupiter', rulingFr: 'Jupiter' },
  { slug: 'capricorn', en: 'Capricorn', fr: 'Capricorne', symbol: '\u2651', dates: 'Dec 22 - Jan 19', datesFr: '22 déc - 19 jan', element: 'earth', ruling: 'Saturn', rulingFr: 'Saturne' },
  { slug: 'aquarius', en: 'Aquarius', fr: 'Verseau', symbol: '\u2652', dates: 'Jan 20 - Feb 18', datesFr: '20 jan - 18 fév', element: 'air', ruling: 'Uranus', rulingFr: 'Uranus' },
  { slug: 'pisces', en: 'Pisces', fr: 'Poissons', symbol: '\u2653', dates: 'Feb 19 - Mar 20', datesFr: '19 fév - 20 mars', element: 'water', ruling: 'Neptune', rulingFr: 'Neptune' },
];

const loadingPhrases = {
  en: [
    'Connecting to the stars...',
    'Consulting the cosmos...',
    'Reading the celestial alignments...',
    'Channeling the universe...',
  ],
  fr: [
    'Connexion aux étoiles...',
    'Consultation du cosmos...',
    'Lecture des alignements célestes...',
    'Canalisation de l\'univers...',
  ],
};

const elementColors = {
  fire: { bg: 'from-red-500/10 to-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300' },
  earth: { bg: 'from-green-500/10 to-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300' },
  air: { bg: 'from-sky-500/10 to-blue-500/10', border: 'border-sky-500/30', text: 'text-sky-300' },
  water: { bg: 'from-blue-500/10 to-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-300' },
};

const HoroscopeSignPage: React.FC = () => {
  const { sign: slug } = useParams<{ sign: string }>();
  const { language } = useApp();

  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const signData = useMemo(
    () => zodiacSigns.find((s) => s.slug === slug),
    [slug]
  );

  const currentLoadingPhrases = useMemo(() => loadingPhrases[language], [language]);
  const elementStyle = signData ? elementColors[signData.element as keyof typeof elementColors] : elementColors.fire;

  // Loading animation
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % currentLoadingPhrases.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading, currentLoadingPhrases.length]);

  // Fetch horoscope on mount
  useEffect(() => {
    const loadHoroscope = async () => {
      if (!signData) {
        setError(language === 'en' ? 'Invalid zodiac sign' : 'Signe du zodiaque invalide');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const signName = language === 'en' ? signData.en : signData.fr;
        const { horoscope: reading } = await fetchHoroscope(signName, language);
        setHoroscope(reading);
      } catch (err) {
        console.error('Error fetching horoscope:', err);
        setError(
          language === 'en'
            ? 'Failed to load horoscope. Please try again.'
            : "Échec du chargement de l'horoscope. Veuillez réessayer."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadHoroscope();
  }, [slug, language, signData]);

  if (!signData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-heading text-red-400 mb-4">
          {language === 'fr' ? 'Signe non trouvé' : 'Sign Not Found'}
        </h2>
        <p className="text-slate-400 mb-8">
          {language === 'fr'
            ? "Le signe du zodiaque que vous recherchez n'existe pas."
            : 'The zodiac sign you are looking for does not exist.'}
        </p>
        <Link
          to={ROUTES.HOROSCOPES}
          className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'fr' ? 'Retour' : 'Back'}
        </Link>
      </div>
    );
  }

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://mysticoracle.com';
  const signName = language === 'en' ? signData.en : signData.fr;
  const canonicalUrl = `${siteUrl}/horoscopes/${slug}`;
  const today = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Helmet>
        <title>
          {language === 'en'
            ? `${signData.en} Daily Horoscope - ${today} | MysticOracle`
            : `Horoscope ${signData.fr} du Jour - ${today} | MysticOracle`}
        </title>
        <meta
          name="description"
          content={
            language === 'en'
              ? `Read today's ${signData.en} horoscope. Get personalized astrological guidance for ${signData.dates}. Free daily horoscope powered by AI.`
              : `Lisez l'horoscope ${signData.fr} du jour. Conseils astrologiques personnalisés pour ${signData.datesFr}. Horoscope quotidien gratuit par IA.`
          }
        />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta
          property="og:title"
          content={
            language === 'en'
              ? `${signData.en} Daily Horoscope | MysticOracle`
              : `Horoscope ${signData.fr} du Jour | MysticOracle`
          }
        />
        <meta property="og:url" content={canonicalUrl} />

        {/* JSON-LD Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: `${signData.en} Daily Horoscope`,
            datePublished: new Date().toISOString(),
            dateModified: new Date().toISOString(),
            author: {
              '@type': 'Organization',
              name: 'MysticOracle',
            },
            publisher: {
              '@type': 'Organization',
              name: 'MysticOracle',
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': canonicalUrl,
            },
          })}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          to={ROUTES.HOROSCOPES}
          className="mb-6 text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'fr' ? 'Retour' : 'Back'}
        </Link>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center p-8 rounded-2xl border bg-gradient-to-br mb-8 ${elementStyle.bg} ${elementStyle.border}`}
        >
          <div className="text-6xl mb-4">{signData.symbol}</div>
          <h1 className={`text-4xl font-heading font-bold mb-2 ${elementStyle.text}`}>{signName}</h1>
          <p className="text-slate-400 text-sm mb-4">{language === 'en' ? signData.dates : signData.datesFr}</p>

          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <span className="px-3 py-1 bg-slate-800/50 rounded-full text-slate-300 flex items-center gap-1">
              <Star className="w-3 h-3" />
              {language === 'fr' ? 'Astre' : 'Ruling'}: {language === 'fr' ? signData.rulingFr : signData.ruling}
            </span>
            <span className="px-3 py-1 bg-slate-800/50 rounded-full text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {language === 'fr' ? 'Élément' : 'Element'}:{' '}
              {language === 'en'
                ? signData.element.charAt(0).toUpperCase() + signData.element.slice(1)
                : signData.element === 'fire'
                ? 'Feu'
                : signData.element === 'earth'
                ? 'Terre'
                : signData.element === 'air'
                ? 'Air'
                : 'Eau'}
            </span>
          </div>
        </motion.header>

        {/* Date */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-8"
        >
          <Calendar className="w-4 h-4" />
          <span>{today}</span>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center p-12">
            <div className="text-xl text-purple-300 font-heading mb-4">
              {currentLoadingPhrases[loadingMessageIndex]}
            </div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center p-8 bg-red-500/10 border border-red-500/30 rounded-2xl">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              {language === 'fr' ? 'Réessayer' : 'Try Again'}
            </button>
          </div>
        )}

        {/* Horoscope Content */}
        {horoscope && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 border border-purple-500/20 rounded-2xl p-8"
          >
            <div className="prose prose-invert prose-purple max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-purple-300 mt-6 mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold text-amber-200 mt-6 mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-bold text-amber-300/90 mt-4 mb-2">{children}</h3>
                  ),
                  p: ({ children }) => <p className="mb-4 text-slate-300 leading-relaxed">{children}</p>,
                  strong: ({ children }) => <strong className="text-amber-200 font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="text-purple-200 italic">{children}</em>,
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-2 text-slate-300">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-2 text-slate-300">{children}</ol>
                  ),
                  li: ({ children }) => <li className="text-slate-300">{children}</li>,
                }}
              >
                {horoscope}
              </ReactMarkdown>
            </div>

          </motion.div>
        )}

        {/* Navigation to other signs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Link
            to={ROUTES.HOROSCOPES}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg border border-purple-500/30 transition-colors"
          >
            {language === 'fr' ? 'Tous les signes' : 'All Signs'}
          </Link>
        </motion.div>
      </div>
    </>
  );
};

export default HoroscopeSignPage;

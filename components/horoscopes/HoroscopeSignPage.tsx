import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/TranslationContext';
import { fetchHoroscope, askHoroscopeQuestion } from '../../services/apiService';
import { willNextQuestionCostCredit, incrementHoroscopeQuestionCount } from '../../services/storageService';
import Button from '../Button';
import { Send, ArrowLeft, Calendar, Sparkles, Star } from 'lucide-react';
import { ROUTES } from '../../routes/routes';

// Zodiac signs with slugs, symbols, and metadata
const zodiacSigns = [
  { slug: 'aries', en: 'Aries', fr: 'Bélier', symbol: '\u2648', dates: 'Mar 21 - Apr 19', datesFr: '21 mars - 19 avril', element: 'fire', ruling: 'Mars' },
  { slug: 'taurus', en: 'Taurus', fr: 'Taureau', symbol: '\u2649', dates: 'Apr 20 - May 20', datesFr: '20 avril - 20 mai', element: 'earth', ruling: 'Venus' },
  { slug: 'gemini', en: 'Gemini', fr: 'Gémeaux', symbol: '\u264A', dates: 'May 21 - Jun 20', datesFr: '21 mai - 20 juin', element: 'air', ruling: 'Mercury' },
  { slug: 'cancer', en: 'Cancer', fr: 'Cancer', symbol: '\u264B', dates: 'Jun 21 - Jul 22', datesFr: '21 juin - 22 juillet', element: 'water', ruling: 'Moon' },
  { slug: 'leo', en: 'Leo', fr: 'Lion', symbol: '\u264C', dates: 'Jul 23 - Aug 22', datesFr: '23 juillet - 22 août', element: 'fire', ruling: 'Sun' },
  { slug: 'virgo', en: 'Virgo', fr: 'Vierge', symbol: '\u264D', dates: 'Aug 23 - Sep 22', datesFr: '23 août - 22 sept', element: 'earth', ruling: 'Mercury' },
  { slug: 'libra', en: 'Libra', fr: 'Balance', symbol: '\u264E', dates: 'Sep 23 - Oct 22', datesFr: '23 sept - 22 oct', element: 'air', ruling: 'Venus' },
  { slug: 'scorpio', en: 'Scorpio', fr: 'Scorpion', symbol: '\u264F', dates: 'Oct 23 - Nov 21', datesFr: '23 oct - 21 nov', element: 'water', ruling: 'Pluto' },
  { slug: 'sagittarius', en: 'Sagittarius', fr: 'Sagittaire', symbol: '\u2650', dates: 'Nov 22 - Dec 21', datesFr: '22 nov - 21 déc', element: 'fire', ruling: 'Jupiter' },
  { slug: 'capricorn', en: 'Capricorn', fr: 'Capricorne', symbol: '\u2651', dates: 'Dec 22 - Jan 19', datesFr: '22 déc - 19 jan', element: 'earth', ruling: 'Saturn' },
  { slug: 'aquarius', en: 'Aquarius', fr: 'Verseau', symbol: '\u2652', dates: 'Jan 20 - Feb 18', datesFr: '20 jan - 18 fév', element: 'air', ruling: 'Uranus' },
  { slug: 'pisces', en: 'Pisces', fr: 'Poissons', symbol: '\u2653', dates: 'Feb 19 - Mar 20', datesFr: '19 fév - 20 mars', element: 'water', ruling: 'Neptune' },
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

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// Props interface removed - now using useParams for slug

// Helper to get moon phase
const getMoonPhase = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const c = Math.floor(365.25 * year);
  const e = Math.floor(30.6 * month);
  const jd = c + e + day - 694039.09;
  const phase = jd / 29.53058867;
  const phaseDay = Math.floor((phase - Math.floor(phase)) * 29.53);

  if (phaseDay < 1) return 'new';
  if (phaseDay < 7) return 'waxing_crescent';
  if (phaseDay < 8) return 'first_quarter';
  if (phaseDay < 14) return 'waxing_gibbous';
  if (phaseDay < 16) return 'full';
  if (phaseDay < 22) return 'waning_gibbous';
  if (phaseDay < 23) return 'last_quarter';
  return 'waning_crescent';
};

// Generate suggested questions based on horoscope content
const generateSuggestedQuestions = (horoscope: string, language: 'en' | 'fr'): string[] => {
  const questions: string[] = [];
  const horoscopeLower = horoscope.toLowerCase();
  const moonPhase = getMoonPhase();

  questions.push(
    language === 'en'
      ? 'Explain this reading as though I am a beginner to astrology.'
      : "Expliquez cette lecture comme si j'étais débutant en astrologie."
  );

  if (horoscopeLower.includes('venus')) {
    questions.push(
      language === 'en'
        ? "How long will Venus's current influence last?"
        : "Combien de temps durera l'influence actuelle de Vénus?"
    );
  }
  if (horoscopeLower.includes('mercury')) {
    questions.push(
      language === 'en'
        ? "What does Mercury's position mean for my decisions?"
        : 'Que signifie la position de Mercure pour mes décisions?'
    );
  }

  const moonQuestions = {
    en: {
      new: 'How can I harness the New Moon energy for new beginnings?',
      waxing_crescent: 'What should I focus on during this Waxing Crescent Moon?',
      first_quarter: 'How does the First Quarter Moon affect my decisions?',
      waxing_gibbous: 'What refinements should I make as the Moon grows fuller?',
      full: 'How is the Full Moon illuminating hidden aspects of my life?',
      waning_gibbous: 'What should I release during this Waning Gibbous Moon?',
      last_quarter: 'How can I use the Last Quarter Moon for reflection?',
      waning_crescent: 'What should I let go of before the next lunar cycle?',
    },
    fr: {
      new: "Comment exploiter l'énergie de la Nouvelle Lune?",
      waxing_crescent: 'Sur quoi me concentrer pendant cette Lune croissante?',
      first_quarter: 'Comment le Premier Quartier affecte-t-il mes décisions?',
      waxing_gibbous: 'Quels ajustements faire alors que la Lune grandit?',
      full: 'Comment la Pleine Lune éclaire-t-elle ma vie?',
      waning_gibbous: 'Que libérer pendant cette Lune gibbeuse décroissante?',
      last_quarter: 'Comment utiliser le Dernier Quartier pour la réflexion?',
      waning_crescent: 'Que laisser aller avant le prochain cycle lunaire?',
    },
  };

  if (questions.length < 3) {
    questions.push(moonQuestions[language][moonPhase as keyof typeof moonQuestions.en]);
  }

  return questions.slice(0, 3);
};

const HoroscopeSignPage: React.FC = () => {
  const { sign: slug } = useParams<{ sign: string }>();
  const { language, canAfford, user } = useApp();
  const { t } = useTranslation();
  const { getToken } = useAuth();

  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [nextQuestionCostsCredit, setNextQuestionCostsCredit] = useState(willNextQuestionCostCredit());

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
        const token = await getToken();
        const signName = language === 'en' ? signData.en : signData.fr;
        const { horoscope: reading } = await fetchHoroscope(signName, language, token);
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
  }, [slug, language, signData, getToken]);

  // Generate suggested questions when horoscope loads
  useEffect(() => {
    if (horoscope && !horoscope.startsWith('Failed')) {
      const questions = generateSuggestedQuestions(horoscope, language);
      setSuggestedQuestions(questions);
    }
  }, [horoscope, language]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleAskQuestion = useCallback(
    async (question: string) => {
      if (!question.trim() || !horoscope || !signData || isChatLoading) return;

      const willCost = willNextQuestionCostCredit();
      if (willCost && !canAfford(1)) {
        setChatHistory((prev) => [
          ...prev,
          { role: 'user', content: question },
          {
            role: 'model',
            content: t(
              'horoscopes.HoroscopeSignPage.insufficient_credits',
              "You've used your free question for this pair. Top up credits to continue."
            ),
          },
        ]);
        setUserQuestion('');
        return;
      }

      setUserQuestion('');
      setIsChatLoading(true);

      const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: question }];
      setChatHistory(updatedHistory);

      try {
        const token = await getToken();
        const signName = language === 'en' ? signData.en : signData.fr;
        const { answer, cached } = await askHoroscopeQuestion(
          signName,
          question,
          horoscope,
          updatedHistory,
          language,
          token
        );

        setChatHistory([...updatedHistory, { role: 'model', content: answer }]);
        if (!cached) {
          incrementHoroscopeQuestionCount();
        }
        setNextQuestionCostsCredit(willNextQuestionCostCredit());
      } catch (err) {
        console.error('Error generating follow-up:', err);
        setChatHistory([
          ...updatedHistory,
          {
            role: 'model',
            content:
              language === 'en'
                ? 'The stars are momentarily obscured. Please try again.'
                : 'Les étoiles sont momentanément obscurcies. Veuillez réessayer.',
          },
        ]);
      } finally {
        setIsChatLoading(false);
      }
    },
    [horoscope, signData, chatHistory, language, isChatLoading, canAfford, getToken, t]
  );

  const handleSuggestedQuestion = (question: string) => {
    handleAskQuestion(question);
    setSuggestedQuestions((prev) => prev.filter((q) => q !== question));
  };

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskQuestion(userQuestion);
  };

  if (!signData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-heading text-red-400 mb-4">
          {t('horoscopes.HoroscopeSignPage.not_found', 'Sign Not Found')}
        </h2>
        <p className="text-slate-400 mb-8">
          {language === 'en'
            ? 'The zodiac sign you are looking for does not exist.'
            : "Le signe du zodiaque que vous recherchez n'existe pas."}
        </p>
        <Link
          to={ROUTES.HOROSCOPES}
          className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back', 'Back to All Signs')}
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
          {t('horoscopes.HoroscopeSignPage.all_signs', 'All Zodiac Signs')}
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
              {t('horoscopes.HoroscopeSignPage.ruling', 'Ruling')}: {signData.ruling}
            </span>
            <span className="px-3 py-1 bg-slate-800/50 rounded-full text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t('horoscopes.HoroscopeSignPage.element', 'Element')}:{' '}
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
            <Button onClick={() => window.location.reload()}>
              {t('common.try_again', 'Try Again')}
            </Button>
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

            {/* Ask the Stars Chat Section */}
            <div className="mt-10 pt-6 border-t border-white/10">
              <h3 className="text-xl font-heading text-purple-300 mb-4 text-center">
                {t('horoscopes.HoroscopeSignPage.ask_the_stars', 'Ask the Stars')}
              </h3>

              {/* Suggested Questions */}
              {suggestedQuestions.length > 0 && chatHistory.length === 0 && (
                <div className="mb-6">
                  <p className="text-sm text-purple-300/70 mb-3 text-center">
                    {t('horoscopes.HoroscopeSignPage.suggested_questions', 'Suggested questions:')}
                  </p>
                  <div className="space-y-2">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestion(question)}
                        disabled={isChatLoading}
                        className="w-full text-left p-3 bg-purple-900/30 rounded-lg border border-purple-500/20 text-purple-200 text-sm hover:bg-purple-900/50 hover:border-purple-500/40 transition-all duration-200 disabled:opacity-50"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat History */}
              {chatHistory.length > 0 && (
                <div className="mb-4 max-h-96 overflow-y-auto space-y-4 p-4 bg-slate-900/50 rounded-lg border border-purple-500/10">
                  {chatHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`${
                        message.role === 'user'
                          ? 'ml-8 bg-purple-900/40 border-purple-500/30'
                          : 'mr-8 bg-slate-800/60 border-amber-500/20'
                      } p-4 rounded-lg border`}
                    >
                      <p
                        className={`text-xs uppercase tracking-wider mb-2 ${
                          message.role === 'user' ? 'text-purple-400' : 'text-amber-400'
                        }`}
                      >
                        {message.role === 'user'
                          ? t('horoscopes.HoroscopeSignPage.you', 'You')
                          : t('horoscopes.HoroscopeSignPage.the_stars', 'The Stars')}
                      </p>
                      <div className="text-slate-300 text-sm leading-relaxed">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="text-amber-200">{children}</strong>,
                            em: ({ children }) => <em className="text-purple-200">{children}</em>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="mr-8 bg-slate-800/60 border-amber-500/20 p-4 rounded-lg border">
                      <p className="text-xs uppercase tracking-wider mb-2 text-amber-400">
                        {t('horoscopes.HoroscopeSignPage.the_stars', 'The Stars')}
                      </p>
                      <div className="animate-pulse text-purple-300">
                        {t('horoscopes.HoroscopeSignPage.consulting', 'Consulting the cosmos...')}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* Credit cost indicator */}
              <p className="text-xs text-purple-300/60 mb-2 text-center">
                {nextQuestionCostsCredit
                  ? language === 'en'
                    ? `Next question costs 1 credit (${user?.credits ?? 0} available)`
                    : `La prochaine question coûte 1 crédit (${user?.credits ?? 0} disponibles)`
                  : language === 'en'
                  ? 'Next question is free'
                  : 'La prochaine question est gratuite'}
              </p>

              {/* Question Input */}
              <form onSubmit={handleSubmitQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Ask about planetary influences, moon phases...'
                      : 'Posez une question sur les influences planétaires...'
                  }
                  disabled={isChatLoading}
                  className="flex-1 px-4 py-3 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !userQuestion.trim()}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:opacity-50 rounded-lg transition-colors duration-200"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </form>
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
            {t('horoscopes.HoroscopeSignPage.view_all_signs', 'View All Zodiac Signs')}
          </Link>
        </motion.div>
      </div>
    </>
  );
};

export default HoroscopeSignPage;

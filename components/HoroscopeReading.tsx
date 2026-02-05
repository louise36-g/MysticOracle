
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Stars } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchHoroscope } from '../services/api';
import Button from './Button';

// Enhanced zodiac data with symbols, elements, and dates
const zodiacData = [
  { en: 'Aries', fr: 'Bélier', symbol: '♈', element: 'fire', datesEn: 'Mar 21 - Apr 19', datesFr: '21 mars - 19 avril' },
  { en: 'Taurus', fr: 'Taureau', symbol: '♉', element: 'earth', datesEn: 'Apr 20 - May 20', datesFr: '20 avril - 20 mai' },
  { en: 'Gemini', fr: 'Gémeaux', symbol: '♊', element: 'air', datesEn: 'May 21 - Jun 20', datesFr: '21 mai - 20 juin' },
  { en: 'Cancer', fr: 'Cancer', symbol: '♋', element: 'water', datesEn: 'Jun 21 - Jul 22', datesFr: '21 juin - 22 juillet' },
  { en: 'Leo', fr: 'Lion', symbol: '♌', element: 'fire', datesEn: 'Jul 23 - Aug 22', datesFr: '23 juillet - 22 août' },
  { en: 'Virgo', fr: 'Vierge', symbol: '♍', element: 'earth', datesEn: 'Aug 23 - Sep 22', datesFr: '23 août - 22 sept' },
  { en: 'Libra', fr: 'Balance', symbol: '♎', element: 'air', datesEn: 'Sep 23 - Oct 22', datesFr: '23 sept - 22 oct' },
  { en: 'Scorpio', fr: 'Scorpion', symbol: '♏', element: 'water', datesEn: 'Oct 23 - Nov 21', datesFr: '23 oct - 21 nov' },
  { en: 'Sagittarius', fr: 'Sagittaire', symbol: '♐', element: 'fire', datesEn: 'Nov 22 - Dec 21', datesFr: '22 nov - 21 déc' },
  { en: 'Capricorn', fr: 'Capricorne', symbol: '♑', element: 'earth', datesEn: 'Dec 22 - Jan 19', datesFr: '22 déc - 19 jan' },
  { en: 'Aquarius', fr: 'Verseau', symbol: '♒', element: 'air', datesEn: 'Jan 20 - Feb 18', datesFr: '20 jan - 18 fév' },
  { en: 'Pisces', fr: 'Poissons', symbol: '♓', element: 'water', datesEn: 'Feb 19 - Mar 20', datesFr: '19 fév - 20 mars' },
];

// Celestial color palette - vibrant element colors
const elementStyles = {
  fire: {
    primary: '#ff8c00', // Bright orange
    glow: 'rgba(255, 140, 0, 0.6)',
    gradient: 'from-orange-500/40 via-amber-500/30 to-red-500/40',
  },
  earth: {
    primary: '#22c55e', // Bright green
    glow: 'rgba(34, 197, 94, 0.6)',
    gradient: 'from-green-500/40 via-emerald-500/30 to-teal-500/40',
  },
  air: {
    primary: '#38bdf8', // Bright sky blue
    glow: 'rgba(56, 189, 248, 0.6)',
    gradient: 'from-sky-400/40 via-cyan-500/30 to-blue-500/40',
  },
  water: {
    primary: '#a78bfa', // Bright violet
    glow: 'rgba(167, 139, 250, 0.6)',
    gradient: 'from-violet-400/40 via-purple-500/30 to-indigo-500/40',
  },
};

// For backwards compatibility
const zodiacSigns = {
  en: zodiacData.map(z => z.en),
  fr: zodiacData.map(z => z.fr),
};

const loadingPhrases = {
  en: [
    'Connecting to the stars...',
    'Consulting the cosmos...',
    'Reading the celestial alignments...',
    'Channeling the universe...',
    'Translating starlight into wisdom...',
    'Gazing into the cosmic ether...'
  ],
  fr: [
    'Connexion aux étoiles...',
    'Consultation du cosmos...',
    'Lecture des alignements célestes...',
    'Canalisation de l\'univers...',
    'Traduction de la lumière stellaire en sagesse...',
    'Regard dans l\'éther cosmique...'
  ]
};

// Floating star component for background ambiance
const FloatingStar: React.FC<{ delay: number; duration: number; left: string; top: string; size: number }> = ({
  delay, duration, left, top, size
}) => (
  <motion.div
    className="absolute rounded-full bg-white pointer-events-none"
    style={{ left, top, width: size, height: size }}
    animate={{
      opacity: [0.2, 0.8, 0.2],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Orbital ring decoration
const OrbitalRing: React.FC<{ size: number; duration: number; opacity: number }> = ({ size, duration, opacity }) => (
  <motion.div
    className="absolute rounded-full border border-amber-500/20 pointer-events-none"
    style={{
      width: size,
      height: size,
      left: '50%',
      top: '50%',
      marginLeft: -size / 2,
      marginTop: -size / 2,
      opacity,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear" }}
  />
);

const HoroscopeReading: React.FC = () => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [selectedSignIndex, setSelectedSignIndex] = useState<number | null>(null);
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [horoscopeLanguage, setHoroscopeLanguage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const currentLoadingPhrases = useMemo(() => loadingPhrases[language], [language]);
  const currentZodiacSigns = useMemo(() => zodiacSigns[language], [language]);

  // Regenerate horoscope when language changes (if one is already displayed)
  useEffect(() => {
    if (horoscope && selectedSignIndex !== null && horoscopeLanguage !== language && !isLoading) {
      const signInNewLanguage = zodiacSigns[language][selectedSignIndex];
      regenerateHoroscope(signInNewLanguage);
    }
  }, [language]);

  const regenerateHoroscope = async (sign: string) => {
    setIsLoading(true);
    setHoroscope(null);
    try {
      const token = await getToken();
      const { horoscope: reading } = await fetchHoroscope(sign, language, token);
      setHoroscope(reading);
      setHoroscopeLanguage(language);
    } catch (error: any) {
      console.error('Error generating horoscope:', error);
      const errorMsg = error?.message || (language === 'en'
        ? 'Failed to generate horoscope. Please try again.'
        : 'Échec de la génération de l\'horoscope. Veuillez réessayer.');
      setHoroscope(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) {
      setLoadingMessageIndex(0);
      const interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % currentLoadingPhrases.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading, currentLoadingPhrases.length]);

  const handleSignSelect = useCallback(async (sign: string, index: number) => {
    setSelectedSign(sign);
    setSelectedSignIndex(index);
    setIsLoading(true);
    setHoroscope(null);

    try {
      const token = await getToken();
      const { horoscope: reading } = await fetchHoroscope(sign, language, token);
      setHoroscope(reading);
      setHoroscopeLanguage(language);
    } catch (error: any) {
      console.error('Error generating horoscope:', error);
      const errorMsg = error?.message || (language === 'en'
        ? 'Failed to generate horoscope. Please try again.'
        : 'Échec de la génération de l\'horoscope. Veuillez réessayer.');
      setHoroscope(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [language, getToken]);

  const handleBack = () => {
    setSelectedSign(null);
    setSelectedSignIndex(null);
    setHoroscope(null);
    setHoroscopeLanguage(null);
  };

  // Get the display name for the selected sign in current language
  const displaySignName = selectedSignIndex !== null ? currentZodiacSigns[selectedSignIndex] : selectedSign;
  const selectedZodiac = selectedSignIndex !== null ? zodiacData[selectedSignIndex] : null;

  // Loading state with celestial animation
  if (isLoading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center">
        {/* Animated orbital rings */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <OrbitalRing size={200} duration={20} opacity={0.3} />
          <OrbitalRing size={300} duration={30} opacity={0.2} />
          <OrbitalRing size={400} duration={40} opacity={0.1} />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          {/* Pulsing zodiac symbol */}
          {selectedZodiac && (
            <motion.div
              className="text-7xl mb-6 text-amber-400"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                textShadow: '0 0 40px rgba(251, 191, 36, 0.6), 0 0 80px rgba(251, 191, 36, 0.3)',
              }}
            >
              {selectedZodiac.symbol}
            </motion.div>
          )}

          <motion.p
            key={loadingMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xl text-amber-200/80 font-light tracking-wide"
          >
            {currentLoadingPhrases[loadingMessageIndex]}
          </motion.p>

          {/* Subtle loading dots */}
          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-amber-400/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Horoscope result display
  if (horoscope && selectedSign && selectedZodiac) {
    const style = elementStyles[selectedZodiac.element as keyof typeof elementStyles];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto px-4"
      >
        {/* Back button */}
        <motion.button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors mb-8 group"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{language === 'fr' ? 'Tous les signes' : 'All signs'}</span>
        </motion.button>

        {/* Result card */}
        <div className="relative rounded-3xl overflow-hidden">
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 via-purple-500/20 to-indigo-500/30 rounded-3xl" />

          {/* Inner content */}
          <div className="relative m-[1px] bg-gradient-to-br from-slate-900 via-slate-900/98 to-indigo-950/90 rounded-3xl p-8 md:p-12">
            {/* Header with symbol */}
            <div className="text-center mb-10">
              <motion.div
                className="inline-block text-6xl mb-4"
                style={{
                  color: style.primary,
                  textShadow: `0 0 30px ${style.glow}, 0 0 60px ${style.glow}`,
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                {selectedZodiac.symbol}
              </motion.div>

              <h2 className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 mb-2">
                {displaySignName}
              </h2>

              <div className="flex items-center justify-center gap-3 text-slate-400">
                <Stars className="w-4 h-4 text-amber-500/60" />
                <span className="text-sm uppercase tracking-[0.2em]">
                  {language === 'fr' ? 'Horoscope du Jour' : 'Daily Horoscope'}
                </span>
                <Stars className="w-4 h-4 text-amber-500/60" />
              </div>
            </div>

            {/* Horoscope content */}
            <div className="prose prose-invert prose-lg max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-heading font-bold text-amber-300 mt-8 mb-4 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-heading font-bold text-amber-200/90 mt-8 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400/60" />{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-semibold text-amber-100/80 mt-6 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="mb-5 text-slate-300 leading-relaxed">{children}</p>,
                  strong: ({ children }) => <strong className="text-amber-200 font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="text-purple-200 italic">{children}</em>,
                  ul: ({ children }) => <ul className="mb-5 space-y-2 text-slate-300">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-5 space-y-2 text-slate-300 list-decimal list-inside">{children}</ol>,
                  li: ({ children }) => <li className="text-slate-300 flex items-start gap-2"><span className="text-amber-400 mt-1.5">•</span><span>{children}</span></li>,
                }}
              >
                {horoscope}
              </ReactMarkdown>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-white/10 text-center">
              <Button onClick={handleBack} variant="outline">
                {language === 'fr' ? 'Choisir un autre signe' : 'Choose another sign'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Zodiac sign selector - the main event
  return (
    <div className="relative max-w-5xl mx-auto px-4 py-8">
      {/* Background ambiance - floating stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <FloatingStar
            key={i}
            delay={i * 0.3}
            duration={3 + (i % 3)}
            left={`${5 + (i * 4.7) % 90}%`}
            top={`${10 + (i * 7.3) % 80}%`}
            size={1 + (i % 3)}
          />
        ))}
      </div>

      {/* Decorative orbital rings */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-30">
        <div className="absolute w-[600px] h-[600px] rounded-full border border-amber-500/20" />
        <div className="absolute w-[800px] h-[800px] rounded-full border border-purple-500/10" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center mb-12"
      >
        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-500/50 to-amber-500/50" />
          <Sparkles className="w-5 h-5 text-amber-400" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent via-amber-500/50 to-amber-500/50" />
        </div>

        <h2 className="text-4xl md:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400/80 mb-4">
          {language === 'fr' ? 'Les Étoiles Vous Attendent' : 'The Stars Await You'}
        </h2>

        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          {language === 'fr'
            ? 'Sélectionnez votre signe pour révéler votre horoscope du jour'
            : 'Select your sign to reveal your daily horoscope'}
        </p>
      </motion.div>

      {/* Zodiac grid - 4 per row, rectangular buttons */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {zodiacData.map((zodiac, index) => {
          const style = elementStyles[zodiac.element as keyof typeof elementStyles];
          const signName = language === 'fr' ? zodiac.fr : zodiac.en;
          const dates = language === 'fr' ? zodiac.datesFr : zodiac.datesEn;

          return (
            <motion.button
              key={zodiac.en}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.04,
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              onClick={() => handleSignSelect(signName, index)}
              className="group relative py-4 px-4 rounded-xl cursor-pointer overflow-hidden"
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Card background layers */}
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

              {/* Inner shine effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-xl" />

              {/* Content - horizontal layout with symbol on right */}
              <div className="relative flex items-center justify-between gap-3">
                {/* Sign name and dates - left side */}
                <div className="flex flex-col items-start min-w-0">
                  <h3 className="text-base font-heading font-semibold text-white group-hover:text-white transition-colors">
                    {signName}
                  </h3>
                  <p className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">
                    {dates}
                  </p>
                </div>

                {/* Zodiac symbol with glow - right side */}
                <div className="relative flex-shrink-0">
                  {/* Glow layer */}
                  <div
                    className="absolute inset-0 text-3xl flex items-center justify-center blur-md opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ color: style.primary }}
                  >
                    {zodiac.symbol}
                  </div>
                  {/* Main symbol */}
                  <span
                    className="relative text-3xl block"
                    style={{
                      color: style.primary,
                      textShadow: `0 0 12px ${style.glow}`,
                    }}
                  >
                    {zodiac.symbol}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Element legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative flex flex-wrap justify-center gap-6 mt-10 text-sm text-slate-400"
      >
        {[
          { element: 'fire', label: language === 'fr' ? 'Feu' : 'Fire', color: '#ff8c00' },
          { element: 'earth', label: language === 'fr' ? 'Terre' : 'Earth', color: '#22c55e' },
          { element: 'air', label: language === 'fr' ? 'Air' : 'Air', color: '#38bdf8' },
          { element: 'water', label: language === 'fr' ? 'Eau' : 'Water', color: '#a78bfa' },
        ].map(({ element, label, color }) => (
          <div key={element} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            />
            <span>{label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default HoroscopeReading;

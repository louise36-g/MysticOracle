// components/HoroscopeReading.tsx
// Celestial horoscope experience with unified CelestiArcana aesthetic

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Stars, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchHoroscope } from '../services/api';
import Button from './Button';

// Enhanced zodiac data with symbols, elements, dates, and taglines
const zodiacData = [
  { en: 'Aries', fr: 'Bélier', symbol: '♈', element: 'fire', datesEn: 'Mar 21 - Apr 19', datesFr: '21 mars - 19 avril', taglineEn: 'Initiative · Momentum · Self-direction', taglineFr: 'Initiative · Élan · Autodirection' },
  { en: 'Taurus', fr: 'Taureau', symbol: '♉', element: 'earth', datesEn: 'Apr 20 - May 20', datesFr: '20 avril - 20 mai', taglineEn: 'Stability · Values · Grounded growth', taglineFr: 'Stabilité · Valeurs · Croissance ancrée' },
  { en: 'Gemini', fr: 'Gémeaux', symbol: '♊', element: 'air', datesEn: 'May 21 - Jun 20', datesFr: '21 mai - 20 juin', taglineEn: 'Communication · Curiosity · Adaptability', taglineFr: 'Communication · Curiosité · Adaptabilité' },
  { en: 'Cancer', fr: 'Cancer', symbol: '♋', element: 'water', datesEn: 'Jun 21 - Jul 22', datesFr: '21 juin - 22 juillet', taglineEn: 'Emotion · Nurturing · Inner tides', taglineFr: 'Émotion · Bienveillance · Marées intérieures' },
  { en: 'Leo', fr: 'Lion', symbol: '♌', element: 'fire', datesEn: 'Jul 23 - Aug 22', datesFr: '23 juillet - 22 août', taglineEn: 'Expression · Confidence · Creative fire', taglineFr: 'Expression · Confiance · Feu créatif' },
  { en: 'Virgo', fr: 'Vierge', symbol: '♍', element: 'earth', datesEn: 'Aug 23 - Sep 22', datesFr: '23 août - 22 sept', taglineEn: 'Refinement · Clarity · Practical insight', taglineFr: 'Raffinement · Clarté · Vision pratique' },
  { en: 'Libra', fr: 'Balance', symbol: '♎', element: 'air', datesEn: 'Sep 23 - Oct 22', datesFr: '23 sept - 22 oct', taglineEn: 'Balance · Relationships · Alignment', taglineFr: 'Équilibre · Relations · Alignement' },
  { en: 'Scorpio', fr: 'Scorpion', symbol: '♏', element: 'water', datesEn: 'Oct 23 - Nov 21', datesFr: '23 oct - 21 nov', taglineEn: 'Depth · Transformation · Intensity', taglineFr: 'Profondeur · Transformation · Intensité' },
  { en: 'Sagittarius', fr: 'Sagittaire', symbol: '♐', element: 'fire', datesEn: 'Nov 22 - Dec 21', datesFr: '22 nov - 21 déc', taglineEn: 'Expansion · Belief · Exploration', taglineFr: 'Expansion · Croyance · Exploration' },
  { en: 'Capricorn', fr: 'Capricorne', symbol: '♑', element: 'earth', datesEn: 'Dec 22 - Jan 19', datesFr: '22 déc - 19 jan', taglineEn: 'Structure · Responsibility · Long-term vision', taglineFr: 'Structure · Responsabilité · Vision à long terme' },
  { en: 'Aquarius', fr: 'Verseau', symbol: '♒', element: 'air', datesEn: 'Jan 20 - Feb 18', datesFr: '20 jan - 18 fév', taglineEn: 'Innovation · Perspective · Independence', taglineFr: 'Innovation · Perspective · Indépendance' },
  { en: 'Pisces', fr: 'Poissons', symbol: '♓', element: 'water', datesEn: 'Feb 19 - Mar 20', datesFr: '19 fév - 20 mars', taglineEn: 'Sensitivity · Intuition · Imagination', taglineFr: 'Sensibilité · Intuition · Imagination' },
];

// Unified color theme - matching CategorySelector
const unifiedTheme = {
  accent: '#a78bfa',      // Purple-400
  glow: '#8b5cf6',        // Purple-500
  ambient: '#c4b5fd',     // Purple-300
  border: '#f59e0b',      // Amber-500
  borderHover: '#fbbf24', // Amber-400
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

// Particle burst effect on sign select
const ParticleBurst: React.FC = () => {
  const particles = [...Array(12)].map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const distance = 80 + Math.random() * 40;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      scale: 0.5 + Math.random() * 0.5,
      delay: i * 0.02,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: i % 2 === 0 ? unifiedTheme.accent : unifiedTheme.border,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: 0,
            scale: particle.scale,
          }}
          transition={{
            duration: 0.8,
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

// Corner decoration component
const CornerDecoration: React.FC<{ position: 'tl' | 'tr' | 'bl' | 'br'; className?: string }> = ({ position, className = '' }) => {
  const rotations = { tl: '', tr: 'rotate-90', bl: '-rotate-90', br: 'rotate-180' };
  return (
    <svg
      className={`absolute w-6 h-6 text-white/20 ${rotations[position]} ${className}`}
      style={{
        top: position.includes('t') ? '6px' : 'auto',
        bottom: position.includes('b') ? '6px' : 'auto',
        left: position.includes('l') ? '6px' : 'auto',
        right: position.includes('r') ? '6px' : 'auto',
      }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M2 12 L2 2 L12 2" />
      <circle cx="2" cy="2" r="1.5" fill="currentColor" />
    </svg>
  );
};

const HoroscopeReading: React.FC = () => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [selectedSignIndex, setSelectedSignIndex] = useState<number | null>(null);
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [horoscopeLanguage, setHoroscopeLanguage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [showBurst, setShowBurst] = useState(false);

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
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 800);

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

  // Loading state with unified theme
  if (isLoading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center">
        {/* Background atmosphere */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[80px]" />
        </div>

        {/* Animated orbital rings with unified colors */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <motion.div
            className="absolute w-[200px] h-[200px] rounded-full border pointer-events-none"
            style={{ borderColor: `${unifiedTheme.glow}30` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full border pointer-events-none"
            style={{ borderColor: `${unifiedTheme.border}20` }}
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full border pointer-events-none"
            style={{ borderColor: `${unifiedTheme.glow}10` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          {/* Pulsing zodiac symbol */}
          {selectedZodiac && (
            <motion.div
              className="text-7xl mb-6"
              style={{ color: unifiedTheme.border }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span style={{
                textShadow: `0 0 40px ${unifiedTheme.border}99, 0 0 80px ${unifiedTheme.border}66`,
              }}>
                {selectedZodiac.symbol}
              </span>
            </motion.div>
          )}

          <motion.p
            key={loadingMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xl text-purple-200/80 font-light tracking-wide"
          >
            {currentLoadingPhrases[loadingMessageIndex]}
          </motion.p>

          {/* Loading dots with unified colors */}
          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: `${unifiedTheme.border}99` }}
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
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl mx-auto px-4"
      >
        {/* Back button */}
        <motion.button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-amber-300 hover:text-amber-200 hover:bg-white/15 hover:border-amber-400/40 transition-all mb-4 group"
          whileHover={{ x: -4 }}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">{language === 'fr' ? 'Tous les signes' : 'All signs'}</span>
        </motion.button>

        {/* Result card with gold frame */}
        <div
          className="relative rounded-2xl overflow-hidden backdrop-blur-sm"
          style={{
            border: '1px solid rgba(212, 175, 55, 0.4)',
            background: 'rgba(30, 10, 60, 0.03)',
            boxShadow: `
              0 0 20px rgba(212, 175, 55, 0.08),
              inset 0 0 30px rgba(212, 175, 55, 0.03)
            `,
          }}
        >
          {/* Floating stars */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${15 + i * 14}%`,
                  top: `${10 + (i % 3) * 30}%`,
                  color: `${unifiedTheme.ambient}15`,
                }}
                animate={{
                  opacity: [0.1, 0.25, 0.1],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{ duration: 4 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
              >
                ✧
              </motion.div>
            ))}
          </div>

          {/* Corner decorations */}
          <CornerDecoration position="tl" />
          <CornerDecoration position="tr" />
          <CornerDecoration position="bl" />
          <CornerDecoration position="br" />

          {/* Inner content */}
          <div className="relative px-6 sm:px-8 md:px-10 pt-8 pb-5">
            {/* Header with symbol */}
            <div className="text-center mb-1">
              <motion.div
                className="inline-block text-5xl mb-1"
                style={{ color: unifiedTheme.border }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <span style={{
                  textShadow: `0 0 30px ${unifiedTheme.border}99, 0 0 60px ${unifiedTheme.border}66`,
                }}>
                  {selectedZodiac.symbol}
                </span>
              </motion.div>

              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 mb-0.5">
                {displaySignName}
              </h2>

              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Stars className="w-3 h-3 text-amber-500/60" />
                <span className="text-xs uppercase tracking-[0.15em]">
                  {language === 'fr' ? 'Horoscope du Jour' : 'Daily Horoscope'}
                </span>
                <Stars className="w-3 h-3 text-amber-500/60" />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent mb-3" />

            {/* Horoscope content */}
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-lg font-heading font-bold text-amber-300 mt-5 mb-2 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-heading font-bold text-amber-200/90 mt-5 mb-1.5 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-amber-400/60" />{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-amber-100/80 mt-3 mb-1">{children}</h3>,
                  p: ({ children }) => <p className="mb-2.5 text-slate-300/90 leading-relaxed text-sm">{children}</p>,
                  strong: ({ children }) => <strong className="text-amber-200 font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="text-purple-200 italic">{children}</em>,
                  ul: ({ children }) => <ul className="mb-2.5 space-y-1 text-slate-300/90">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2.5 space-y-1 text-slate-300/90 list-decimal list-inside">{children}</ol>,
                  li: ({ children }) => <li className="text-slate-300/90 text-sm flex items-start gap-2"><span className="text-amber-400 mt-1">•</span><span>{children}</span></li>,
                }}
              >
                {horoscope}
              </ReactMarkdown>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-white/10 text-center">
              <Button onClick={handleBack} variant="outline">
                {language === 'fr' ? 'Choisir un autre signe' : 'Choose another sign'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Zodiac sign selector - unified design
  return (
    <div className="relative max-w-5xl mx-auto px-4">
      {/* Background atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[80px]" />

        {/* Floating stars */}
        {[...Array(15)].map((_, i) => (
          <FloatingStar
            key={i}
            delay={i * 0.3}
            duration={3 + (i % 3)}
            left={`${5 + (i * 6.5) % 90}%`}
            top={`${10 + (i * 7.3) % 80}%`}
            size={1 + (i % 3)}
          />
        ))}
      </div>

      {/* Particle burst */}
      {showBurst && <ParticleBurst />}

      {/* Header - matching CategorySelector style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative text-center pt-8 mb-10"
      >
        {/* Decorative sparkle divider */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-500/40 to-amber-500/60" />
          <motion.div
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
          </motion.div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent via-amber-500/40 to-amber-500/60" />
        </div>

        <h2 className="text-3xl md:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-purple-200 mb-4 tracking-wide">
          {language === 'fr' ? 'Lire les Étoiles' : 'Reading the Stars'}
        </h2>

        <p className="text-purple-200/80 text-sm md:text-base max-w-lg mx-auto leading-relaxed mb-6">
          {language === 'fr'
            ? 'Douze signes. Un cosmos. Un aperçu des énergies qui façonnent votre journée.'
            : 'Twelve signs. One cosmos. Insight into the energies shaping your day.'}
        </p>

        <p className="text-slate-400/90 text-sm max-w-2xl mx-auto leading-relaxed">
          {language === 'fr'
            ? 'L\'astrologie offre un aperçu symbolique des thèmes qui peuvent être actifs autour de vous aujourd\'hui. Laissez votre horoscope du jour vous offrir une perspective plutôt qu\'une prédiction.'
            : 'Astrology offers a symbolic snapshot of the themes that may be active around you today. Let your daily horoscope offer perspective rather than prediction.'}
        </p>
      </motion.div>

      {/* Zodiac grid - unified styling */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 pb-8"
      >
        {zodiacData.map((zodiac, index) => {
          const signName = language === 'fr' ? zodiac.fr : zodiac.en;
          const dates = language === 'fr' ? zodiac.datesFr : zodiac.datesEn;

          return (
            <motion.button
              key={zodiac.en}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.05,
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              onClick={() => handleSignSelect(signName, index)}
              className="group relative py-4 px-4 rounded-2xl cursor-pointer overflow-hidden backdrop-blur-md bg-gradient-to-br from-violet-600/25 via-purple-600/20 to-fuchsia-600/25"
              style={{
                borderWidth: 2,
                borderStyle: 'solid',
                borderColor: `${unifiedTheme.border}66`,
                boxShadow: `
                  0 8px 25px rgba(0,0,0,0.3),
                  0 0 15px ${unifiedTheme.glow}25,
                  0 0 30px ${unifiedTheme.glow}10
                `,
              }}
              whileHover={{
                scale: 1.05,
                y: -12,
              }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={(e) => {
                const el = e.target as HTMLElement;
                if (el?.style) {
                  el.style.borderColor = unifiedTheme.borderHover;
                  el.style.boxShadow = `
                    0 25px 50px rgba(0,0,0,0.5),
                    0 0 20px ${unifiedTheme.glow}50,
                    0 0 40px ${unifiedTheme.border}35,
                    0 0 80px ${unifiedTheme.glow}20,
                    inset 0 0 30px ${unifiedTheme.glow}15
                  `;
                }
              }}
              onHoverEnd={(e) => {
                const el = e.target as HTMLElement;
                if (el?.style) {
                  el.style.borderColor = `${unifiedTheme.border}66`;
                  el.style.boxShadow = `
                    0 8px 25px rgba(0,0,0,0.3),
                    0 0 15px ${unifiedTheme.glow}25,
                    0 0 30px ${unifiedTheme.glow}10
                  `;
                }
              }}
            >
              {/* Subtle glow ring */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-amber-500/20 -z-10 opacity-60" />

              {/* Border glow pulse on hover */}
              <motion.div
                className="absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-100 -z-10"
                style={{
                  background: `linear-gradient(135deg, ${unifiedTheme.border}60, ${unifiedTheme.glow}40, ${unifiedTheme.border}60)`,
                }}
                initial={false}
                whileHover={{
                  opacity: [0, 1, 0.6],
                  transition: { duration: 0.4, ease: "easeOut" }
                }}
              />

              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out rounded-2xl" />

              {/* Corner decorations on hover */}
              <CornerDecoration position="tl" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CornerDecoration position="br" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative flex items-center justify-between gap-3">
                {/* Sign info */}
                <div className="flex flex-col items-start min-w-0">
                  <h3 className="text-lg md:text-xl font-heading font-semibold text-white group-hover:text-white transition-colors">
                    {signName}
                  </h3>
                  <p className="text-xs md:text-sm text-white/50 group-hover:text-white/70 transition-colors">
                    {dates}
                  </p>
                </div>

                {/* Zodiac symbol */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 border border-white/30 group-hover:scale-110 transition-all duration-300 shadow-lg"
                  >
                    <span className="text-2xl text-white">
                      {zodiac.symbol}
                    </span>
                  </div>
                  {/* Glow behind symbol */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 opacity-50 blur-md -z-10 group-hover:opacity-80 transition-opacity duration-300" />
                </div>
              </div>

              {/* Tagline */}
              <div className="mt-3 pt-2 border-t border-white/10">
                <p className="text-xs text-white/50 group-hover:text-purple-200/80 transition-colors leading-relaxed">
                  {language === 'fr' ? zodiac.taglineFr : zodiac.taglineEn}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Element legend - aligned under columns */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="relative grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mt-2 mb-8"
      >
        {[
          { element: 'fire', label: language === 'fr' ? 'Feu' : 'Fire', signs: '♈ ♌ ♐', color: '#f97316' },
          { element: 'earth', label: language === 'fr' ? 'Terre' : 'Earth', signs: '♉ ♍ ♑', color: '#84cc16' },
          { element: 'air', label: language === 'fr' ? 'Air' : 'Air', signs: '♊ ♎ ♒', color: '#38bdf8' },
          { element: 'water', label: language === 'fr' ? 'Eau' : 'Water', signs: '♋ ♏ ♓', color: '#a78bfa' },
        ].map(({ element, label, signs, color }) => (
          <motion.div
            key={element}
            whileHover={{ scale: 1.02 }}
            className="flex flex-col items-center justify-center py-3 px-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
            style={{
              boxShadow: `0 0 25px ${color}20, inset 0 0 20px ${color}10`,
              borderColor: `${color}30`,
            }}
          >
            <span
              className="text-2xl md:text-3xl tracking-widest mb-1"
              style={{ color }}
            >
              {signs}
            </span>
            <span
              className="text-base md:text-lg font-semibold tracking-wide"
              style={{ color }}
            >
              {label}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default HoroscopeReading;

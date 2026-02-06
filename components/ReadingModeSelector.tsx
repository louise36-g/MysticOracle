
import React from 'react';
import { useApp } from '../context/AppContext';
import { Layers, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTodaysQuote } from '../constants/dailyQuotes';

interface ReadingModeSelectorProps {
  onSelect: (mode: 'tarot' | 'horoscope') => void;
}

const readingModes = [
  {
    id: 'tarot',
    titleEn: 'Tarot Reading',
    titleFr: 'Lecture de Tarot',
    descriptionEn: 'Classic card spreads for deep insights.',
    descriptionFr: 'Tirages de cartes classiques pour des insights profonds.',
    icon: Layers,
    gradient: 'from-violet-600/25 via-purple-600/20 to-fuchsia-600/25',
    borderGradient: 'from-violet-500/50 via-purple-500/50 to-fuchsia-500/50',
    iconBg: 'from-violet-500 to-purple-600',
    accentColor: 'purple',
  },
  {
    id: 'horoscope',
    titleEn: 'Daily Horoscope',
    titleFr: 'Horoscope du Jour',
    descriptionEn: 'What the stars have in store for you today.',
    descriptionFr: 'Ce que les étoiles vous réservent aujourd\'hui.',
    icon: Sparkles,
    gradient: 'from-violet-600/25 via-purple-600/20 to-fuchsia-600/25',
    borderGradient: 'from-violet-500/50 via-purple-500/50 to-fuchsia-500/50',
    iconBg: 'from-violet-500 to-purple-600',
    accentColor: 'purple',
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
    }
  }
};

const ReadingModeSelector: React.FC<ReadingModeSelectorProps> = ({ onSelect }) => {
  const { language } = useApp();
  const quote = getTodaysQuote();

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-base font-semibold text-purple-200/90 tracking-widest uppercase">
          {language === 'en' ? 'Choose your path' : 'Choisissez votre voie'}
        </h2>
      </motion.div>

      {/* Two action cards - centered, compact */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-8 max-w-md mx-auto"
      >
        {readingModes.map((mode) => (
          <motion.div
            key={mode.id}
            variants={cardVariants}
            onClick={() => onSelect(mode.id as 'tarot' | 'horoscope')}
            className={`group relative h-full bg-gradient-to-br ${mode.gradient} p-3 rounded-lg border-2 border-amber-500/40 text-center backdrop-blur-sm cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-amber-400/60 hover:shadow-amber-500/20 overflow-hidden`}
          >
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            {/* Animated border gradient on hover */}
            <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${mode.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl`} />

            {/* Subtle glow ring for all cards */}
            <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-amber-500/20 -z-10 opacity-60" />

            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
              <div className="absolute top-2 right-2 w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
              <div className="absolute bottom-3 right-4 w-0.5 h-0.5 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Centered icon */}
            <div className={`relative w-9 h-9 bg-gradient-to-br ${mode.iconBg} rounded-md flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <mode.icon className="w-4 h-4 text-white" />
              <div className={`absolute inset-0 rounded-md bg-gradient-to-br ${mode.iconBg} opacity-50 blur-md -z-10 group-hover:opacity-80 transition-opacity`} />
            </div>

            <h3 className="text-sm font-heading text-white mb-0.5 group-hover:text-purple-100 transition-colors">
              {language === 'en' ? mode.titleEn : mode.titleFr}
            </h3>
            <p className="text-slate-400 text-[11px] leading-tight group-hover:text-slate-300 transition-colors">
              {language === 'en' ? mode.descriptionEn : mode.descriptionFr}
            </p>

            {/* CTA indicator */}
            <div className="flex items-center justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-300 text-amber-300">
              <span className="text-[11px] font-medium">
                {language === 'en' ? 'Start' : 'Commencer'}
              </span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* The Whispered Oracle - Floating Quote Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-12 text-center relative"
      >
        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-500/30" />
          <motion.div
            animate={{ rotate: [0, 5, 0, -5, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg className="w-4 h-4 text-amber-400/60" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
            </svg>
          </motion.div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-500/30" />
        </div>

        {/* Section title */}
        <h3 className="text-sm font-heading font-medium tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300/80 via-purple-300/80 to-amber-300/80 mb-4">
          {language === 'en' ? 'Thought for Today' : 'Pensée du Jour'}
        </h3>

        {/* Quote text */}
        <blockquote className="max-w-xl mx-auto">
          <p className="text-slate-300/90 text-base md:text-lg italic leading-relaxed">
            "{language === 'en' ? quote.textEn : quote.textFr}"
          </p>
          <footer className="mt-3">
            <cite className="text-amber-400/70 text-sm not-italic font-medium">
              — {quote.author}
            </cite>
          </footer>
        </blockquote>
      </motion.div>
    </div>
  );
};

export default ReadingModeSelector;

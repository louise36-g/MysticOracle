
import React from 'react';
import { useApp } from '../context/AppContext';
import { Layers, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import DailyQuoteCard from './DailyQuoteCard';

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
    isPrimary: true, // Featured/primary action
  },
  {
    id: 'horoscope',
    titleEn: 'Daily Horoscope',
    titleFr: 'Horoscope du Jour',
    descriptionEn: 'What the stars have in store for you today.',
    descriptionFr: 'Ce que les étoiles vous réservent aujourd\'hui.',
    icon: Sparkles,
    gradient: 'from-amber-600/20 via-orange-600/20 to-yellow-600/20',
    borderGradient: 'from-amber-500/40 via-orange-500/40 to-yellow-500/40',
    iconBg: 'from-amber-500 to-orange-500',
    accentColor: 'amber',
    isPrimary: false,
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

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Section header - subtle and understated */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="text-sm font-medium text-slate-400 tracking-widest uppercase">
          {language === 'en' ? 'Choose your path' : 'Choisissez votre voie'}
        </h2>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid md:grid-cols-3 gap-6"
      >
        {/* Clickable reading mode cards - centered layout, compact */}
        {readingModes.map((mode, index) => (
          <motion.div
            key={mode.id}
            variants={cardVariants}
            onClick={() => onSelect(mode.id as 'tarot' | 'horoscope')}
            className={`group relative h-full bg-gradient-to-br ${mode.gradient} p-3 rounded-xl border text-center backdrop-blur-sm cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl overflow-hidden ${
              mode.isPrimary
                ? 'border-purple-500/30 hover:border-purple-400/50 shadow-lg shadow-purple-500/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            {/* Animated border gradient on hover */}
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${mode.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl`} />

            {/* Primary card subtle glow ring */}
            {mode.isPrimary && (
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-amber-500/20 -z-10 opacity-60" />
            )}

            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
              <div className="absolute top-3 right-3 w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
              <div className="absolute bottom-4 right-6 w-0.5 h-0.5 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Small centered icon */}
            <div className={`relative w-9 h-9 bg-gradient-to-br ${mode.iconBg} rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <mode.icon className="w-4 h-4 text-white" />
              <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${mode.iconBg} opacity-50 blur-md -z-10 group-hover:opacity-80 transition-opacity`} />
            </div>

            <h3 className="text-sm font-heading text-white mb-0.5 group-hover:text-purple-100 transition-colors">
              {language === 'en' ? mode.titleEn : mode.titleFr}
            </h3>
            <p className="text-slate-400 text-[11px] leading-tight group-hover:text-slate-300 transition-colors">
              {language === 'en' ? mode.descriptionEn : mode.descriptionFr}
            </p>

            {/* CTA indicator */}
            <div className={`flex items-center justify-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-300 ${
              mode.isPrimary ? 'text-amber-300' : 'text-purple-300'
            }`}>
              <span className="text-[11px] font-medium">
                {language === 'en' ? 'Start' : 'Commencer'}
              </span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </motion.div>
        ))}

        {/* Daily Quote - static, not clickable, same height as other cards */}
        <motion.div variants={cardVariants} className="h-full">
          <DailyQuoteCard className="h-full" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ReadingModeSelector;

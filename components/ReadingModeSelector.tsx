
import React from 'react';
import { useApp } from '../context/AppContext';
import { Layers, Sparkles, ArrowRight, Star } from 'lucide-react';
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
    gradient: 'from-violet-600/20 via-purple-600/20 to-fuchsia-600/20',
    borderGradient: 'from-violet-500/40 via-purple-500/40 to-fuchsia-500/40',
    iconBg: 'from-violet-500 to-purple-600',
    hoverGlow: 'hover:shadow-purple-500/20'
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
    hoverGlow: 'hover:shadow-amber-500/20'
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
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

const ReadingModeSelector: React.FC<ReadingModeSelectorProps> = ({ onSelect }) => {
  const { language } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Section header with decorative elements */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-purple-500/50" />
          <Star className="w-4 h-4 text-amber-400" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-purple-500/50" />
        </div>
        <h2 className="text-3xl md:text-4xl font-heading text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-violet-200 to-purple-200">
          {language === 'en' ? 'Choose Your Reading' : 'Choisissez Votre Lecture'}
        </h2>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid md:grid-cols-3 gap-6"
      >
        {/* Clickable reading mode cards */}
        {readingModes.map((mode, index) => (
          <motion.div
            key={mode.id}
            variants={cardVariants}
            onClick={() => onSelect(mode.id as 'tarot' | 'horoscope')}
            className={`group relative bg-gradient-to-br ${mode.gradient} p-6 rounded-2xl border border-white/10 text-center backdrop-blur-sm cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:border-purple-400/30 ${mode.hoverGlow} hover:shadow-2xl`}
          >
            {/* Animated border gradient on hover */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${mode.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl`} />

            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute top-4 right-4 w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
              <div className="absolute top-8 left-6 w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute bottom-6 right-8 w-0.5 h-0.5 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Icon with gradient background */}
            <div className={`relative w-14 h-14 bg-gradient-to-br ${mode.iconBg} rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <mode.icon className="w-7 h-7 text-white" />
              {/* Glow ring */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${mode.iconBg} opacity-50 blur-md -z-10 group-hover:opacity-80 transition-opacity`} />
            </div>

            <h3 className="text-xl font-heading text-white mb-2 group-hover:text-purple-100 transition-colors">
              {language === 'en' ? mode.titleEn : mode.titleFr}
            </h3>
            <p className="text-slate-400 text-sm mb-4 group-hover:text-slate-300 transition-colors">
              {language === 'en' ? mode.descriptionEn : mode.descriptionFr}
            </p>

            {/* CTA indicator */}
            <div className="flex items-center justify-center gap-2 text-purple-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <span className="text-sm font-medium">
                {language === 'en' ? 'Start' : 'Commencer'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>
        ))}

        {/* Daily Quote - static, not clickable */}
        <motion.div variants={cardVariants}>
          <DailyQuoteCard />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ReadingModeSelector;

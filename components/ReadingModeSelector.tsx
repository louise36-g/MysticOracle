
import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Layers, Sparkles, Sun, Hand } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTodaysQuote } from '../constants/dailyQuotes';
import { ROUTES } from '../routes/routes';

interface ReadingModeSelectorProps {
  onSelect: (mode: 'tarot' | 'horoscope' | 'daily-tarot') => void;
}

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
  const { language, t } = useApp();
  const quote = getTodaysQuote();

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Three action cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto items-center"
      >
        {/* Daily Tarot Energy Card */}
        <motion.div variants={cardVariants}>
          <Link
            to={ROUTES.DAILY_TAROT}
            className="group relative h-full px-4 py-3 rounded-xl border-[1.5px] border-[#C9A84C] hover:border-[#E8C96A] text-center backdrop-blur-sm cursor-pointer transition-all duration-500 hover:-translate-y-2 overflow-hidden block"
            style={{
              background: 'linear-gradient(135deg, #3D1F6E, #5B2D9E)',
              boxShadow: '0 2px 12px rgba(91, 45, 158, 0.5), inset 0 0 20px rgba(201, 168, 76, 0.08)',
            }}
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500/50 via-purple-500/50 to-fuchsia-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
            <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-amber-500/20 -z-10 opacity-60" />
            <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
              <div className="absolute top-2 right-2 w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="absolute bottom-3 right-4 w-0.5 h-0.5 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '1.3s' }} />
            </div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Sun className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 opacity-50 blur-md -z-10 group-hover:opacity-80 transition-opacity" />
            </div>
            <h3 className="text-base md:text-lg font-heading text-[#F5E6C8] mb-0.5 group-hover:text-white transition-colors">
              {t('reading.daily_energy', 'Daily Energy')}
            </h3>
            <p className="text-[#F5E6C8]/70 text-xs md:text-sm leading-snug group-hover:text-[#F5E6C8] transition-colors">
              {t('reading.daily_energy_desc', 'Free daily Major Arcana draw.')}
            </p>
          </Link>
        </motion.div>

        {/* Tarot Reading Card — centre, taller, brighter */}
        <motion.div variants={cardVariants}>
          <Link
            to={ROUTES.READING}
            className="group relative h-full px-4 py-5 rounded-xl border-[1.5px] border-[#C9A84C] hover:border-[#E8C96A] text-center backdrop-blur-sm cursor-pointer transition-all duration-500 hover:-translate-y-2 overflow-hidden block"
            style={{
              background: 'linear-gradient(135deg, #4A2570, #6B3A9E)',
              boxShadow: '0 2px 12px rgba(91, 45, 158, 0.5), inset 0 0 20px rgba(201, 168, 76, 0.08)',
            }}
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500/50 via-purple-500/50 to-fuchsia-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
            <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-amber-500/20 -z-10 opacity-60" />
            <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
              <div className="absolute top-2 right-2 w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
              <div className="absolute bottom-3 right-4 w-0.5 h-0.5 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Layers className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 opacity-50 blur-md -z-10 group-hover:opacity-80 transition-opacity" />
            </div>
            <h3 className="text-base md:text-lg font-heading text-[#F5E6C8] mb-0.5 group-hover:text-white transition-colors">
              {t('reading.tarot_reading', 'Tarot Reading')}
            </h3>
            <p className="text-[#F5E6C8]/70 text-xs md:text-sm leading-snug group-hover:text-[#F5E6C8] transition-colors">
              {t('reading.tarot_reading_desc', 'Tarot readings personalised for you.')}
            </p>
          </Link>
        </motion.div>

        {/* Horoscope Card */}
        <motion.div
          variants={cardVariants}
          onClick={() => onSelect('horoscope')}
          className="group relative h-full px-4 py-3 rounded-xl border-[1.5px] border-[#C9A84C] hover:border-[#E8C96A] text-center backdrop-blur-sm cursor-pointer transition-all duration-500 hover:-translate-y-2 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #3D1F6E, #5B2D9E)',
            boxShadow: '0 2px 12px rgba(91, 45, 158, 0.5), inset 0 0 20px rgba(201, 168, 76, 0.08)',
          }}
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500/50 via-purple-500/50 to-fuchsia-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
          <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-amber-500/20 -z-10 opacity-60" />
          <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
            <div className="absolute top-2 right-2 w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="absolute bottom-3 right-4 w-0.5 h-0.5 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="relative w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 opacity-50 blur-md -z-10 group-hover:opacity-80 transition-opacity" />
          </div>
          <h3 className="text-base md:text-lg font-heading text-[#F5E6C8] mb-0.5 group-hover:text-white transition-colors">
            {t('reading.daily_horoscope', 'Daily Horoscope')}
          </h3>
          <p className="text-[#F5E6C8]/70 text-xs md:text-sm leading-snug group-hover:text-[#F5E6C8] transition-colors">
            {t('reading.daily_horoscope_desc', 'Your personalised daily horoscope.')}
          </p>
        </motion.div>
      </motion.div>

      {/* Interpret My Cards CTA */}
      <motion.div
        variants={cardVariants}
        className="mt-4 max-w-md mx-auto"
      >
        <Link
          to={ROUTES.INTERPRET}
          className="group relative block rounded-xl backdrop-blur-sm cursor-pointer transition-all duration-500 hover:-translate-y-1 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #2A1245, #4A2570)',
            border: '1.5px solid #C9A84C',
            borderLeft: '4px solid #C9A84C',
            boxShadow: '0 4px 20px rgba(201, 168, 76, 0.15)',
          }}
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500/50 via-purple-500/50 to-fuchsia-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
          <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-amber-500/20 -z-10 opacity-60" />
          <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
            <div className="absolute top-2 right-2 w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            <div className="absolute bottom-3 right-4 w-0.5 h-0.5 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '1.6s' }} />
          </div>
          <div className="relative flex items-center gap-4 px-5 py-4">
            <div className="relative w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Hand className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 opacity-50 blur-md -z-10 group-hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-heading text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-400 group-hover:from-amber-200 group-hover:to-amber-300 transition-colors">
                {language === 'en' ? 'Interpret My Cards' : 'Interpréter mes cartes'}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 leading-snug group-hover:text-slate-300 transition-colors mt-0.5">
                {language === 'en'
                  ? 'Drew your own spread? Tell us what you pulled and we\'ll help you understand what the cards are saying together.'
                  : 'Vous avez tiré vos propres cartes ? Dites-nous lesquelles et nous vous aiderons à comprendre ce qu\'elles vous disent ensemble.'}
              </p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* The Whispered Oracle - Floating Quote Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-8 text-center relative"
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
          {t('reading.thought_for_today', 'Thought for Today')}
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

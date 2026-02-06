// components/DailyQuoteCard.tsx
import React from 'react';
import { Quote } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTodaysQuote } from '../constants/dailyQuotes';

interface DailyQuoteCardProps {
  className?: string;
}

const DailyQuoteCard: React.FC<DailyQuoteCardProps> = ({ className = '' }) => {
  const { language } = useApp();
  const quote = getTodaysQuote();

  return (
    <div
      className={`group relative bg-gradient-to-br from-violet-600/25 via-purple-600/20 to-fuchsia-600/25 p-3 rounded-xl border-2 border-amber-500/40 backdrop-blur-sm flex flex-col text-center overflow-hidden transition-all duration-500 hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-500/20 ${className}`}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

      {/* Animated border gradient glow on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/50 via-purple-500/50 to-fuchsia-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />

      {/* Subtle glow ring */}
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-amber-500/20 -z-10 opacity-60" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <div className="absolute top-3 right-3 w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-4 right-6 w-0.5 h-0.5 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Small centered icon - matches other cards */}
      <div className="relative w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300">
        <Quote className="w-4 h-4 text-white" />
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 opacity-50 blur-md -z-10 group-hover:opacity-80 transition-opacity" />
      </div>

      {/* Title - smaller to save space */}
      <h3 className="text-sm font-heading text-white mb-1 group-hover:text-purple-100 transition-colors">
        {language === 'en' ? 'Thought for Today' : 'Pensée du Jour'}
      </h3>

      {/* Quote text - bigger now with saved space */}
      <blockquote className="relative flex-1 text-sm text-slate-300 italic leading-relaxed mb-1">
        "{language === 'en' ? quote.textEn : quote.textFr}"
      </blockquote>

      {/* Author */}
      <cite className="text-[11px] text-purple-300/80 not-italic font-medium mt-auto">
        — {quote.author}
      </cite>
    </div>
  );
};

export default DailyQuoteCard;

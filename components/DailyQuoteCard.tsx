// components/DailyQuoteCard.tsx
import React from 'react';
import { Quote, Sparkles } from 'lucide-react';
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
      className={`group relative bg-gradient-to-br from-indigo-900/30 via-slate-900/40 to-purple-900/30 p-5 rounded-2xl border border-white/10 backdrop-blur-sm flex flex-col overflow-hidden transition-all duration-500 hover:border-indigo-400/30 hover:shadow-xl hover:shadow-indigo-500/10 ${className}`}
    >
      {/* Animated border gradient glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/40 via-purple-500/40 to-amber-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />

      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />

      {/* Floating sparkle */}
      <div className="absolute top-3 right-3 text-amber-400/30">
        <Sparkles className="w-3 h-3" />
      </div>

      {/* Header with icon and label */}
      <div className="relative flex items-center gap-3 mb-3">
        <div className="relative w-10 h-10 bg-gradient-to-br from-amber-500/40 to-orange-600/40 rounded-xl flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
          <Quote className="w-4 h-4 text-amber-400" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 opacity-30 blur-md -z-10 group-hover:opacity-60 transition-opacity" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-amber-400/90 uppercase tracking-wider font-medium">
            {language === 'en' ? 'Thought for Today' : 'Pensée du Jour'}
          </span>
          <span className="text-[10px] text-slate-500">
            {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Quote text - fills available space */}
      <div className="relative flex-1 mb-3 flex flex-col justify-center">
        <span className="absolute -top-1 -left-1 text-2xl text-purple-500/20 font-serif leading-none">"</span>
        <blockquote className="relative text-sm text-slate-200 italic leading-relaxed pl-3">
          {language === 'en' ? quote.textEn : quote.textFr}
        </blockquote>
      </div>

      {/* Author - pushed to bottom */}
      <div className="relative pt-2 border-t border-white/5 mt-auto">
        <cite className="text-xs text-purple-300/90 not-italic font-medium">
          — {quote.author}
        </cite>
      </div>
    </div>
  );
};

export default DailyQuoteCard;

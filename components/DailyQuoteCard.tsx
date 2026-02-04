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
      className={`relative bg-gradient-to-br from-indigo-900/30 via-slate-900/40 to-purple-900/30 p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-sm flex flex-col overflow-hidden transition-all duration-500 hover:border-indigo-400/40 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 ${className}`}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-tr-full" />

      {/* Floating sparkles */}
      <div className="absolute top-3 right-4 text-amber-400/30">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="absolute bottom-4 left-4 text-purple-400/20">
        <Sparkles className="w-3 h-3" />
      </div>

      {/* Header with icon and label */}
      <div className="relative flex items-center gap-3 mb-4">
        <div className="w-11 h-11 bg-gradient-to-br from-amber-500/30 to-orange-600/30 rounded-xl flex items-center justify-center border border-amber-400/20">
          <Quote className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-amber-400/90 uppercase tracking-widest font-medium">
            {language === 'en' ? 'Thought for Today' : 'Pensée du Jour'}
          </span>
          <span className="text-[10px] text-slate-500">
            {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Quote text with decorative quote marks */}
      <div className="relative flex-1 mb-4">
        <span className="absolute -top-2 -left-1 text-4xl text-purple-500/20 font-serif leading-none">"</span>
        <blockquote className="relative text-base md:text-lg text-slate-200 italic leading-relaxed pl-4">
          {language === 'en' ? quote.textEn : quote.textFr}
        </blockquote>
        <span className="absolute -bottom-4 right-0 text-4xl text-purple-500/20 font-serif leading-none">"</span>
      </div>

      {/* Author with subtle line */}
      <div className="relative pt-3 border-t border-white/5">
        <cite className="text-sm text-purple-300/90 not-italic font-medium">
          — {quote.author}
        </cite>
      </div>
    </div>
  );
};

export default DailyQuoteCard;

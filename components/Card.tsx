import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { TarotCard } from '../types';

interface CardProps {
  card?: TarotCard;
  isRevealed: boolean;
  isReversed?: boolean;
  onClick?: () => void;
  width?: number;
  height?: number;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  card,
  isRevealed,
  isReversed = false,
  onClick,
  width = 180,
  height = 300,
  className = ''
}) => {
  const { language } = useApp();
  
  const isPlaceholder = card?.image?.startsWith('placeholder:');
  const placeholderIcon = isPlaceholder ? card?.image.split(':')[1] : '';

  return (
    <div 
      className={`relative cursor-pointer group ${className}`}
      style={{ width, height, perspective: '1000px' }}
      onClick={onClick}
    >
      <motion.div
        className="w-full h-full relative"
        initial={false}
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Card Back (Visible at 0deg) */}
        <div
          className="absolute inset-0 w-full h-full rounded-xl shadow-2xl overflow-hidden"
          style={{
            backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #1e1b4b 100%)',
            border: '2px solid #fbbf24',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Outer decorative border */}
          <div className="absolute inset-2 border border-amber-500/30 rounded-lg" />

          {/* Inner decorative border */}
          <div className="absolute inset-4 border border-amber-500/20 rounded-md" />

          {/* Corner decorations */}
          <div className="absolute top-3 left-3 w-2 h-2 bg-amber-500/40 rounded-full" />
          <div className="absolute top-3 right-3 w-2 h-2 bg-amber-500/40 rounded-full" />
          <div className="absolute bottom-3 left-3 w-2 h-2 bg-amber-500/40 rounded-full" />
          <div className="absolute bottom-3 right-3 w-2 h-2 bg-amber-500/40 rounded-full" />

          {/* Center diamond pattern */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rotate-45 border-2 border-amber-500/40 bg-purple-900/50 flex items-center justify-center">
              <div className="w-10 h-10 border border-amber-500/30 bg-indigo-900/50 flex items-center justify-center">
                <div className="w-4 h-4 bg-amber-500/50 rotate-45" />
              </div>
            </div>
          </div>

          {/* Subtle shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 opacity-50" />
        </div>

        {/* Card Front (Visible at 180deg) */}
        <div 
          className="absolute inset-0 w-full h-full rounded-xl shadow-2xl bg-slate-900 overflow-hidden"
          style={{ 
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            border: '2px solid #fbbf24',
          }}
        >
          <div className="w-full h-full relative" style={{ transform: isReversed ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s' }}>
              {card ? (
                <>
                  {!isPlaceholder ? (
                    <img
                      src={card.image}
                      alt={language === 'en' ? card.nameEn : card.nameFr}
                      className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 relative overflow-hidden group-hover:bg-slate-750 transition-colors">
                        {/* Decorative Background */}
                        <div className="absolute inset-0 opacity-10 flex items-center justify-center text-9xl">
                            {placeholderIcon}
                        </div>
                        
                        {/* Center Icon */}
                        <div className="z-10 text-6xl md:text-7xl mb-4 drop-shadow-lg filter group-hover:scale-110 transition-transform duration-500">
                            {placeholderIcon}
                        </div>
                        
                        {/* Suit Name Decoration */}
                        <div className="absolute top-2 left-2 text-xs text-amber-500/50 uppercase tracking-widest">{language === 'en' ? card.keywordsEn[0] : card.keywordsFr[0]}</div>
                        <div className="absolute bottom-2 right-2 text-xs text-amber-500/50 uppercase tracking-widest rotate-180">{language === 'en' ? card.keywordsEn[0] : card.keywordsFr[0]}</div>
                    </div>
                  )}

                  <div className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 pt-12 text-center ${isPlaceholder ? '' : ''}`}>
                     <h3 className="text-amber-100 font-heading text-sm md:text-base font-bold tracking-wide drop-shadow-md leading-tight">
                        {language === 'en' ? card.nameEn : card.nameFr}
                     </h3>
                     <p className="text-[10px] text-amber-400/80 uppercase tracking-widest mt-1">
                        {language === 'en' ? card.keywordsEn[0] : card.keywordsFr[0]}
                     </p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                   <span className="text-slate-500 text-xs">...</span>
                </div>
              )}
          </div>
          
          {/* Reversed Indicator Overlay (Optional, but helpful) */}
          {isReversed && card && (
              <div 
                className="absolute top-2 right-2 bg-slate-950/80 text-amber-500 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 z-10 pointer-events-none"
                style={{ transform: 'rotateY(180deg)' }} // To counteract parent flip so text is readable? No, parent is 180deg. We are inside front. Front is visible. Text needs to be readable.
                // Actually, if the whole content div is rotated 180deg, the text will be upside down.
                // We probably want the text to be readable even if card is reversed, or just accept the physics of it.
                // Let's stick to physics: card is upside down.
              >
              </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Card;
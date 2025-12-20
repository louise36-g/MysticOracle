import React from 'react';
import { motion } from 'framer-motion';
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
          className="absolute inset-0 w-full h-full rounded-xl shadow-2xl"
          style={{ 
            backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            border: '2px solid #fbbf24', // Amber-400
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <div className="w-full h-full flex items-center justify-center opacity-30">
               <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                  <path d="M2 12h20"/>
               </svg>
          </div>
          <div className="absolute inset-2 border border-purple-400/30 rounded-lg"></div>
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
                      alt={card.nameEn} 
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
                        <div className="absolute top-2 left-2 text-xs text-amber-500/50 uppercase tracking-widest">{card.keywordsEn[0]}</div>
                        <div className="absolute bottom-2 right-2 text-xs text-amber-500/50 uppercase tracking-widest rotate-180">{card.keywordsEn[0]}</div>
                    </div>
                  )}

                  <div className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 pt-12 text-center ${isPlaceholder ? '' : ''}`}>
                     <h3 className="text-amber-100 font-heading text-sm md:text-base font-bold tracking-wide drop-shadow-md leading-tight">
                        {card.nameEn}
                     </h3>
                     <p className="text-[10px] text-amber-400/80 uppercase tracking-widest mt-1">
                        {card.keywordsEn[0]}
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
import React, { useState } from 'react';
import { getCardImageUrl } from '../../constants/cardImages';
import { FULL_DECK } from '../../constants';
import { useApp } from '../../context/AppContext';

interface CardThumbnailProps {
  cardId: number;
  isReversed?: boolean;
  showLabel?: boolean;
}

const CardThumbnail: React.FC<CardThumbnailProps> = ({
  cardId,
  isReversed = false,
  showLabel = false,
}) => {
  const { language } = useApp();
  const [isHovered, setIsHovered] = useState(false);

  const card = FULL_DECK.find(c => c.id === cardId);
  const imageUrl = getCardImageUrl(cardId);
  const cardName = (language === 'en' ? card?.nameEn : card?.nameFr) || `Card ${cardId}`;

  // Fallback to text if no card found or no image available
  if (!card || !imageUrl) {
    return (
      <span className="text-sm bg-slate-700/50 text-amber-200/90 px-3 py-1.5 rounded-lg border border-slate-600/30">
        {cardName}
        {isReversed && <span className="text-red-400/80 ml-1.5">(R)</span>}
      </span>
    );
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Image */}
      <div
        className={`
          relative overflow-hidden rounded-lg border-2 cursor-pointer
          transition-all duration-300 ease-out
          ${isHovered
            ? 'border-purple-400 shadow-lg shadow-purple-500/30 z-50'
            : 'border-slate-600/50'
          }
          ${isReversed ? 'ring-2 ring-red-400/50' : ''}
        `}
        style={{
          width: isHovered ? '120px' : '50px',
          height: isHovered ? '200px' : '83px',
          transform: isReversed ? 'rotate(180deg)' : 'none',
        }}
      >
        <img
          src={imageUrl}
          alt={cardName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Reversed indicator */}
      {isReversed && (
        <div
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold
                     w-5 h-5 rounded-full flex items-center justify-center z-10"
          style={{ transform: 'rotate(0deg)' }}
        >
          R
        </div>
      )}

      {/* Card name tooltip on hover */}
      {isHovered && (
        <div
          className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5
                     bg-slate-900/95 text-amber-200 text-sm font-medium
                     rounded-lg whitespace-nowrap z-50 shadow-xl border border-slate-600/50"
          style={{
            top: isReversed ? 'auto' : '100%',
            bottom: isReversed ? '100%' : 'auto',
            marginBottom: isReversed ? '8px' : '0',
          }}
        >
          {cardName}
          {isReversed && <span className="text-red-400 ml-1.5">(Reversed)</span>}
        </div>
      )}

      {/* Optional always-visible label */}
      {showLabel && !isHovered && (
        <div className="text-xs text-slate-400 text-center mt-1 max-w-[50px] truncate">
          {cardName?.split(' ').slice(-1)[0]}
        </div>
      )}
    </div>
  );
};

export default CardThumbnail;

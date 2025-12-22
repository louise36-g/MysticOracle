
import React from 'react';
import { useApp } from '../context/AppContext';
import { Layers, Sparkles, MessageCircle } from 'lucide-react';

interface ReadingModeSelectorProps {
  onSelect: (mode: 'tarot' | 'horoscope' | 'oracle') => void;
}

const readingModes = [
  {
    id: 'tarot',
    titleEn: 'Tarot Reading',
    titleFr: 'Lecture de Tarot',
    descriptionEn: 'Classic card spreads for deep insights.',
    descriptionFr: 'Tirages de cartes classiques pour des insights profonds.',
    icon: Layers
  },
  {
    id: 'horoscope',
    titleEn: 'Daily Horoscope',
    titleFr: 'Horoscope du Jour',
    descriptionEn: 'A look at what the stars have in store for you today.',
    descriptionFr: 'Découvrez ce que les étoiles vous réservent aujourd\'hui.',
    icon: Sparkles
  },
  {
    id: 'oracle',
    titleEn: 'Oracle Reading',
    titleFr: 'Lecture Oracle',
    descriptionEn: 'Direct answers to your most pressing questions.',
    descriptionFr: 'Des réponses directes à vos questions les plus pressantes.',
    icon: MessageCircle
  }
];

const ReadingModeSelector: React.FC<ReadingModeSelectorProps> = ({ onSelect }) => {
  const { language } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="text-3xl font-heading text-center text-purple-200 mb-8">
        {language === 'en' ? 'Choose Your Reading' : 'Choisissez Votre Lecture'}
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {readingModes.map(mode => (
          <div
            key={mode.id}
            onClick={() => onSelect(mode.id as 'tarot' | 'horoscope' | 'oracle')}
            className="bg-slate-900/40 p-6 rounded-xl border border-white/10 text-center backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400">
              <mode.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-heading text-purple-200 mb-2">
              {language === 'en' ? mode.titleEn : mode.titleFr}
            </h3>
            <p className="text-slate-400 text-sm">
              {language === 'en' ? mode.descriptionEn : mode.descriptionFr}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadingModeSelector;

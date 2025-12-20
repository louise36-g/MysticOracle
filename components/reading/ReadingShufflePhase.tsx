import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Language } from '../../types';

interface ReadingShufflePhaseProps {
  language: Language;
}

const ReadingShufflePhase: React.FC<ReadingShufflePhaseProps> = ({ language }) => {
  return (
    <div className="flex items-center justify-center min-h-[80vh] relative overflow-hidden">
      {/* Creating a visual stack of cards that animate */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`shuffle-card-${i}`}
          initial={{ x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{
            x: [0, Math.random() * 200 - 100, 0],
            y: [0, Math.random() * 200 - 100, 0],
            rotate: [0, Math.random() * 180 - 90, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, ease: "easeInOut", times: [0, 0.5, 1] }}
          className="absolute w-[140px] h-[220px] rounded-lg bg-indigo-900 border-2 border-amber-500/50 shadow-2xl backface-hidden"
          style={{ backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}
        >
          <div className="w-full h-full opacity-30 flex items-center justify-center">
            <Sparkles className="text-amber-400 w-12 h-12" />
          </div>
        </motion.div>
      ))}
      <h3 className="absolute bottom-20 text-xl font-heading text-amber-200 animate-pulse">
        {language === 'en' ? 'Shuffling the deck...' : 'Mélange des cartes...'}
      </h3>
    </div>
  );
};

export default ReadingShufflePhase;

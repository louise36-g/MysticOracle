import React, { useEffect, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  pieceCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

const DEFAULT_COLORS = [
  '#8b5cf6', // Purple
  '#fbbf24', // Amber
  '#a78bfa', // Light Purple
  '#fcd34d', // Light Amber
  '#c084fc', // Violet
  '#f59e0b', // Orange
  '#22c55e', // Green
  '#06b6d4', // Cyan
];

const Confetti: React.FC<ConfettiProps> = ({
  isActive,
  duration = 3000,
  pieceCount = 50,
  colors = DEFAULT_COLORS,
  onComplete,
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < pieceCount; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100, // Percentage across screen
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.5,
          rotation: Math.random() * 360,
          scale: 0.5 + Math.random() * 0.5,
        });
      }
      setPieces(newPieces);
      setIsVisible(true);

      // Clean up after duration
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, pieceCount, colors, duration, onComplete]);

  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{
              opacity: 1,
              y: -20,
              x: `${piece.x}vw`,
              rotate: piece.rotation,
              scale: piece.scale,
            }}
            animate={{
              opacity: [1, 1, 0],
              y: '110vh',
              rotate: piece.rotation + 720,
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: piece.delay,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="absolute top-0"
            style={{
              width: 10 + Math.random() * 10,
              height: 10 + Math.random() * 10,
            }}
          >
            {/* Confetti shape - randomly rectangle or circle */}
            {Math.random() > 0.5 ? (
              <div
                className="w-full h-full rounded-full"
                style={{ backgroundColor: piece.color }}
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: piece.color,
                  transform: `rotate(${Math.random() * 45}deg)`,
                }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default memo(Confetti);

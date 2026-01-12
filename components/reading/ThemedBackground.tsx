import React from 'react';
import { SpreadType } from '../../types';
import { SPREAD_THEMES } from './SpreadThemes';

interface ThemedBackgroundProps {
  spreadType: SpreadType;
}

const ThemedBackground: React.FC<ThemedBackgroundProps> = ({ spreadType }) => {
  const theme = SPREAD_THEMES[spreadType];

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Base gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bgGradient}`} />

      {/* Spread-specific atmospheric effects */}
      {spreadType === SpreadType.SINGLE && (
        <>
          {/* Central eye/spotlight effect */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
            <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute inset-[100px] bg-cyan-400/5 rounded-full blur-2xl" />
          </div>
          {/* Radiating circles */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute border border-cyan-500/10 rounded-full"
                style={{
                  width: `${200 + i * 150}px`,
                  height: `${200 + i * 150}px`,
                  left: `${-(100 + i * 75)}px`,
                  top: `${-(100 + i * 75)}px`,
                  animation: `pulse ${3 + i}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {spreadType === SpreadType.THREE_CARD && (
        <>
          {/* Horizontal time flow gradient - fuchsia/purple */}
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-950/30 via-purple-900/20 to-fuchsia-950/30" />
          {/* Flowing lines - fuchsia */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-fuchsia-500/30 via-purple-400/40 to-fuchsia-500/30" />
          <div className="absolute top-[48%] left-0 right-0 h-px bg-gradient-to-r from-fuchsia-500/20 via-transparent to-fuchsia-500/20" />
          <div className="absolute top-[52%] left-0 right-0 h-px bg-gradient-to-r from-fuchsia-500/20 via-transparent to-fuchsia-500/20" />
          {/* Time orbs - fuchsia/magenta tones */}
          <div className="absolute top-1/2 left-[15%] -translate-y-1/2 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/15 rounded-full blur-2xl" />
          <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl" />
        </>
      )}

      {spreadType === SpreadType.LOVE && (
        <>
          {/* Warm romantic glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-rose-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] bg-red-500/10 rounded-full blur-3xl" />
          {/* Subtle heart shapes using CSS */}
          <div className="absolute top-[20%] left-[10%] w-8 h-8 opacity-10"
               style={{
                 background: 'rgb(244, 63, 94)',
                 transform: 'rotate(-45deg)',
                 borderRadius: '50% 50% 0 50%',
               }} />
          <div className="absolute bottom-[30%] right-[15%] w-6 h-6 opacity-10"
               style={{
                 background: 'rgb(251, 113, 133)',
                 transform: 'rotate(-45deg)',
                 borderRadius: '50% 50% 0 50%',
               }} />
        </>
      )}

      {spreadType === SpreadType.CAREER && (
        <>
          {/* Upward-pointing geometric elements - bright gold */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-yellow-500/10 to-transparent" />
          {/* Warm golden ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 via-transparent to-yellow-900/10" />
          {/* Diagonal ascending lines - golden */}
          <svg className="absolute inset-0 w-full h-full opacity-15" preserveAspectRatio="none">
            <defs>
              <linearGradient id="career-line" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(253, 224, 71)" stopOpacity="0" />
                <stop offset="50%" stopColor="rgb(253, 224, 71)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="rgb(253, 224, 71)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2].map((i) => (
              <line
                key={i}
                x1={`${10 + i * 30}%`}
                y1="100%"
                x2={`${40 + i * 30}%`}
                y2="20%"
                stroke="url(#career-line)"
                strokeWidth="1.5"
              />
            ))}
          </svg>
          {/* Achievement glow at top - bright gold */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-yellow-400/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-[200px] h-[200px] bg-amber-500/10 rounded-full blur-3xl" />
        </>
      )}

      {spreadType === SpreadType.HORSESHOE && (
        <>
          {/* Arc-shaped glow - deep blue/sapphire */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px]">
            <div
              className="absolute inset-0 border-t-4 border-l-4 border-r-4 border-blue-500/20 rounded-t-full"
              style={{ borderBottom: 'none' }}
            />
          </div>
          {/* Sparkle points along the arc - sapphire */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const angle = (Math.PI * i) / 6;
            const x = 50 + Math.cos(angle) * 35;
            const y = 60 - Math.sin(angle) * 25;
            return (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-400/30 rounded-full blur-sm"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  animation: `pulse ${2 + i * 0.3}s ease-in-out infinite`,
                }}
              />
            );
          })}
          {/* Central fortune glow - sapphire blue */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-3xl" />
        </>
      )}

      {spreadType === SpreadType.CELTIC_CROSS && (
        <>
          {/* Subtle emerald/teal atmosphere - no heavy pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-teal-950/20" />
          {/* Cross glow at center - emerald */}
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-[200px] h-[400px] bg-teal-500/10 blur-3xl" />
          {/* Subtle mystical edges - emerald tone */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-950/30 via-emerald-950/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-950/30 via-emerald-950/10 to-transparent" />
          {/* Soft corner accents */}
          <div className="absolute top-[20%] left-[10%] w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[20%] right-[10%] w-40 h-40 bg-teal-500/5 rounded-full blur-3xl" />
        </>
      )}

      {/* Subtle noise texture overlay for all themes */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
};

export default ThemedBackground;

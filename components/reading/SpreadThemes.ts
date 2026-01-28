import { SpreadType } from '../../types';
import { Eye, Clock, Heart, TrendingUp, Sparkles, Compass, Layers } from 'lucide-react';
import React from 'react';

// ============================================
// SPREAD READING THEMES - Unique visual identity per spread
// ============================================
export interface SpreadTheme {
  name: string;
  taglineEn: string;
  taglineFr: string;
  icon: React.ReactNode;
  // Colors
  primary: string;       // Main accent color
  secondary: string;     // Secondary accent
  glow: string;          // Glow color for effects
  bgGradient: string;    // Background gradient
  cardBorder: string;    // Card border color
  textAccent: string;    // Text accent class
  // Background effects
  pattern?: string;      // SVG pattern URL
  atmosphereClass: string; // Additional atmosphere styling
}

export const SPREAD_THEMES: Record<SpreadType, SpreadTheme> = {
  [SpreadType.SINGLE]: {
    name: "Oracle's Eye",
    taglineEn: "One card. Infinite clarity.",
    taglineFr: "Une carte. Clarté infinie.",
    icon: React.createElement(Eye, { className: "w-5 h-5" }),
    primary: 'rgb(34, 211, 238)',      // cyan-400
    secondary: 'rgb(99, 102, 241)',     // indigo-500
    glow: 'rgba(34, 211, 238, 0.3)',
    bgGradient: 'from-indigo-950 via-slate-900 to-indigo-950',
    cardBorder: 'border-cyan-500/50',
    textAccent: 'text-cyan-300',
    atmosphereClass: 'single-card-atmosphere',
  },
  [SpreadType.THREE_CARD]: {
    name: "River of Time",
    taglineEn: "Past flows into future.",
    taglineFr: "Le passé coule vers l'avenir.",
    icon: React.createElement(Clock, { className: "w-5 h-5" }),
    primary: 'rgb(232, 121, 249)',      // fuchsia-400
    secondary: 'rgb(192, 38, 211)',     // fuchsia-600
    glow: 'rgba(232, 121, 249, 0.3)',
    bgGradient: 'from-fuchsia-950 via-purple-900 to-fuchsia-950',
    cardBorder: 'border-fuchsia-500/50',
    textAccent: 'text-fuchsia-300',
    atmosphereClass: 'three-card-atmosphere',
  },
  [SpreadType.FIVE_CARD]: {
    name: "Inner Depths",
    taglineEn: "Five cards illuminate the path within.",
    taglineFr: "Cinq cartes illuminent le chemin interieur.",
    icon: React.createElement(Layers, { className: "w-5 h-5" }),
    primary: 'rgb(168, 85, 247)',       // purple-500
    secondary: 'rgb(139, 92, 246)',     // violet-500
    glow: 'rgba(168, 85, 247, 0.3)',
    bgGradient: 'from-purple-950 via-violet-900 to-purple-950',
    cardBorder: 'border-purple-500/50',
    textAccent: 'text-purple-300',
    atmosphereClass: 'five-card-atmosphere',
  },
  [SpreadType.LOVE]: {
    name: "Heart's Sanctum",
    taglineEn: "Where hearts reveal their truth.",
    taglineFr: "Où les cœurs révèlent leur vérité.",
    icon: React.createElement(Heart, { className: "w-5 h-5" }),
    primary: 'rgb(244, 63, 94)',        // rose-500
    secondary: 'rgb(251, 113, 133)',    // rose-400
    glow: 'rgba(244, 63, 94, 0.25)',
    bgGradient: 'from-rose-950 via-pink-900 to-rose-950',
    cardBorder: 'border-rose-500/50',
    textAccent: 'text-rose-300',
    atmosphereClass: 'love-atmosphere',
  },
  [SpreadType.CAREER]: {
    name: "The Ascent",
    taglineEn: "Chart your path to success.",
    taglineFr: "Tracez votre chemin vers le succès.",
    icon: React.createElement(TrendingUp, { className: "w-5 h-5" }),
    primary: 'rgb(253, 224, 71)',       // yellow-300
    secondary: 'rgb(245, 158, 11)',     // amber-500
    glow: 'rgba(253, 224, 71, 0.35)',
    bgGradient: 'from-yellow-950 via-amber-900 to-yellow-950',
    cardBorder: 'border-yellow-400/50',
    textAccent: 'text-yellow-300',
    atmosphereClass: 'career-atmosphere',
  },
  [SpreadType.HORSESHOE]: {
    name: "Fortune's Arc",
    taglineEn: "Seven steps to destiny.",
    taglineFr: "Sept pas vers le destin.",
    icon: React.createElement(Sparkles, { className: "w-5 h-5" }),
    primary: 'rgb(96, 165, 250)',       // blue-400
    secondary: 'rgb(59, 130, 246)',     // blue-500
    glow: 'rgba(96, 165, 250, 0.3)',
    bgGradient: 'from-blue-950 via-indigo-900 to-blue-950',
    cardBorder: 'border-blue-500/50',
    textAccent: 'text-blue-300',
    atmosphereClass: 'horseshoe-atmosphere',
  },
  [SpreadType.CELTIC_CROSS]: {
    name: "Ancient Wisdom",
    taglineEn: "The complete picture revealed.",
    taglineFr: "Le tableau complet révélé.",
    icon: React.createElement(Compass, { className: "w-5 h-5" }),
    primary: 'rgb(52, 211, 153)',       // emerald-400
    secondary: 'rgb(20, 184, 166)',     // teal-500
    glow: 'rgba(52, 211, 153, 0.25)',
    bgGradient: 'from-emerald-950 via-teal-900 to-emerald-950',
    cardBorder: 'border-emerald-500/50',
    textAccent: 'text-emerald-300',
    atmosphereClass: 'celtic-atmosphere',
  },
};

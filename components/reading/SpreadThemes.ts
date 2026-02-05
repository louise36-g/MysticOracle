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
    primary: '#E8607A',                  // Luminous coral pink
    secondary: '#F08A9D',                // Light coral
    glow: 'rgba(232, 96, 122, 0.25)',
    bgGradient: 'from-[#E8607A]/20 via-[#D94D68]/10 to-[#E8607A]/20',
    cardBorder: 'border-[#E8607A]/50',
    textAccent: 'text-[#F08A9D]',
    atmosphereClass: 'love-atmosphere',
  },
  [SpreadType.CAREER]: {
    name: "The Ascent",
    taglineEn: "Chart your path to success.",
    taglineFr: "Tracez votre chemin vers le succès.",
    icon: React.createElement(TrendingUp, { className: "w-5 h-5" }),
    primary: '#D4A24C',                  // Luminous gold amber
    secondary: '#E4B86C',                // Light gold
    glow: 'rgba(212, 162, 76, 0.35)',
    bgGradient: 'from-[#D4A24C]/20 via-[#C4923C]/10 to-[#D4A24C]/20',
    cardBorder: 'border-[#D4A24C]/50',
    textAccent: 'text-[#E4B86C]',
    atmosphereClass: 'career-atmosphere',
  },
  [SpreadType.HORSESHOE]: {
    name: "Horseshoe",
    taglineEn: "Seven cards for luck and clarity.",
    taglineFr: "Sept cartes pour la chance et la clarté.",
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
    icon: React.createElement(Sparkles, { className: "w-5 h-5" }),
    primary: 'rgb(167, 139, 250)',       // violet-400
    secondary: 'rgb(139, 92, 246)',      // violet-500
    glow: 'rgba(167, 139, 250, 0.25)',
    bgGradient: 'from-violet-950 via-purple-900 to-violet-950',
    cardBorder: 'border-violet-500/50',
    textAccent: 'text-violet-300',
    atmosphereClass: 'celtic-atmosphere',
  },
};

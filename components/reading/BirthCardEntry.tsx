// components/reading/BirthCardEntry.tsx
// Birth date entry screen for the Birth Cards category
// Users enter their birth date to calculate soul, personality, and year cards

import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Coins, Calendar, ChevronLeft, Star, Sun, Moon as MoonIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BirthCardDepth, SpreadType } from '../../types';
import { BIRTH_CARD_DEPTHS, getCategory } from '../../constants/categoryConfig';
import Button from '../Button';
import ThemedBackground from './ThemedBackground';

const BirthCardEntry: React.FC = () => {
  const { depth: depthParam } = useParams<{ depth: string }>();
  const navigate = useNavigate();
  const { language, user, t } = useApp();

  const depth = parseInt(depthParam || '1', 10) as BirthCardDepth;
  const depthOption = BIRTH_CARD_DEPTHS.find((d) => d.cards === depth);
  const categoryConfig = getCategory('birth_cards');

  const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });

  // Refs for auto-focus between inputs
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Handle day input with auto-advance to month
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBirthDate({ ...birthDate, day: value });

    // Auto-advance to month when day is complete
    // Advance if: 2 digits entered, OR first digit is 4-9 (can only be single digit day)
    if (value.length === 2 || (value.length === 1 && parseInt(value) > 3)) {
      monthRef.current?.focus();
    }
  };

  // Handle month input with auto-advance to year
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBirthDate({ ...birthDate, month: value });

    // Auto-advance to year when month is complete
    // Advance if: 2 digits entered, OR first digit is 2-9 (can only be single digit month)
    if (value.length === 2 || (value.length === 1 && parseInt(value) > 1)) {
      yearRef.current?.focus();
    }
  };

  // Handle year input
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthDate({ ...birthDate, year: e.target.value });
  };

  const cost = depthOption?.cost || 1;
  const hasCredits = user && user.credits >= cost;

  // Validate date is complete and reasonable
  const isValidDate = (): boolean => {
    const day = parseInt(birthDate.day, 10);
    const month = parseInt(birthDate.month, 10);
    const year = parseInt(birthDate.year, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;

    // Basic range validation
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;

    // Check days in month (accounting for leap years)
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return false;

    return true;
  };

  const handleReveal = () => {
    if (!isValidDate() || !hasCredits) return;

    // Navigate to birth card reading with date in state
    navigate('/reading/birth-cards/reveal', {
      state: {
        birthDate,
        depth,
      },
    });
  };

  const handleBack = () => {
    navigate('/reading');
  };

  // What you'll discover based on depth
  const discoveries = {
    1: {
      en: [
        { icon: <Sun className="w-5 h-5" />, text: 'Your Personality Card - how you show up in the world' },
      ],
      fr: [
        { icon: <Sun className="w-5 h-5" />, text: "Votre Carte de Personnalite - comment vous vous presentez au monde" },
      ],
    },
    2: {
      en: [
        { icon: <Sun className="w-5 h-5" />, text: 'Your Personality Card - the energy you project' },
        { icon: <Star className="w-5 h-5" />, text: 'Your Soul Card - your core life purpose' },
      ],
      fr: [
        { icon: <Sun className="w-5 h-5" />, text: "Votre Carte de Personnalite - l'energie que vous projetez" },
        { icon: <Star className="w-5 h-5" />, text: "Votre Carte de l'Ame - votre but de vie" },
      ],
    },
    3: {
      en: [
        { icon: <Sun className="w-5 h-5" />, text: 'Your Personality Card - the energy you project' },
        { icon: <Star className="w-5 h-5" />, text: 'Your Soul Card - your core life purpose' },
        { icon: <MoonIcon className="w-5 h-5" />, text: 'Your Year Card for 2026 - this year\'s theme' },
      ],
      fr: [
        { icon: <Sun className="w-5 h-5" />, text: "Votre Carte de Personnalite - l'energie que vous projetez" },
        { icon: <Star className="w-5 h-5" />, text: "Votre Carte de l'Ame - votre but de vie" },
        { icon: <MoonIcon className="w-5 h-5" />, text: "Votre Carte de l'Annee 2026 - le theme de cette annee" },
      ],
    },
  };

  const descriptions = {
    1: {
      en: 'Your Personality Card reveals how you show up in the world - the energy you naturally project and the patterns others experience when they meet you.',
      fr: "Votre Carte de Personnalite revele comment vous vous presentez au monde - l'energie que vous projetez naturellement et les schemas que les autres percoivent en vous rencontrant.",
    },
    2: {
      en: 'Discover your Personality Card plus your Soul Card - how you appear to the world and the deeper purpose your soul came here to fulfil.',
      fr: "Decouvrez votre Carte de Personnalite plus votre Carte de l'Ame - comment vous apparaissez au monde et le but profond que votre ame est venue accomplir.",
    },
    3: {
      en: 'The complete portrait: your Personality Card, Soul Card, and your Year Card for 2026 revealing this year\'s predominant themes and lessons.',
      fr: "Le portrait complet: votre Carte de Personnalite, votre Carte de l'Ame, et votre Carte de l'Annee 2026 revelant les themes et lecons predominants de cette annee.",
    },
  };

  if (!categoryConfig || !depthOption) return null;

  const depthLabel = language === 'fr' ? depthOption.labelFr : depthOption.labelEn;
  const description = descriptions[depth as keyof typeof descriptions]?.[language] || descriptions[1].en;
  const discoveryList = discoveries[depth as keyof typeof discoveries]?.[language] || discoveries[1].en;

  return (
    <div className="min-h-screen relative">
      {/* Themed background - using Celtic Cross for mystic purple theme */}
      <ThemedBackground spreadType={SpreadType.CELTIC_CROSS} />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Back button */}
        <div className="p-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>{language === 'fr' ? 'Retour' : 'Back'}</span>
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 mb-4 shadow-lg shadow-violet-500/30"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-heading text-white mb-2">
                {language === 'fr' ? 'Cartes de Naissance' : 'Birth Cards'}
              </h1>
              <p className="text-violet-300 font-medium mb-1">{depthLabel}</p>
              <p className="text-white/60 text-sm">{description}</p>
            </div>

            {/* Birth date input */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-heading text-white">
                  {language === 'fr' ? 'Entrez votre date de naissance' : 'Enter Your Birth Date'}
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Day input */}
                <div>
                  <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">
                    {language === 'fr' ? 'Jour' : 'Day'}
                  </label>
                  <input
                    ref={dayRef}
                    type="number"
                    min="1"
                    max="31"
                    placeholder="DD"
                    value={birthDate.day}
                    onChange={handleDayChange}
                    className="w-full bg-white/5 border border-violet-500/30 rounded-lg px-3 py-2.5 text-white text-center text-lg font-mono placeholder-white/30 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/50 transition-colors"
                  />
                </div>

                {/* Month input */}
                <div>
                  <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">
                    {language === 'fr' ? 'Mois' : 'Month'}
                  </label>
                  <input
                    ref={monthRef}
                    type="number"
                    min="1"
                    max="12"
                    placeholder="MM"
                    value={birthDate.month}
                    onChange={handleMonthChange}
                    className="w-full bg-white/5 border border-violet-500/30 rounded-lg px-3 py-2.5 text-white text-center text-lg font-mono placeholder-white/30 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/50 transition-colors"
                  />
                </div>

                {/* Year input */}
                <div>
                  <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">
                    {language === 'fr' ? 'Année' : 'Year'}
                  </label>
                  <input
                    ref={yearRef}
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="YYYY"
                    value={birthDate.year}
                    onChange={handleYearChange}
                    className="w-full bg-white/5 border border-violet-500/30 rounded-lg px-3 py-2.5 text-white text-center text-lg font-mono placeholder-white/30 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/50 transition-colors"
                  />
                </div>
              </div>

              {/* Date validation feedback */}
              {(birthDate.day || birthDate.month || birthDate.year) && !isValidDate() && (
                <p className="text-amber-400 text-sm text-center">
                  {language === 'fr' ? 'Veuillez entrer une date valide' : 'Please enter a valid date'}
                </p>
              )}
            </div>

            {/* What you'll discover */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20 mb-6">
              <h2 className="text-lg font-heading text-white mb-4">
                {language === 'fr' ? 'Ce que vous découvrirez' : "What You'll Discover"}
              </h2>
              <ul className="space-y-3">
                {discoveryList.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-violet-400 flex-shrink-0 mt-0.5">{item.icon}</span>
                    <span className="text-white/80 text-sm">{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Footer with cost and action */}
            <div className="flex items-center justify-between">
              {/* Cost display */}
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span className="text-white/80">{cost}</span>
                <span className="text-white/50 text-sm">
                  {cost === 1
                    ? (language === 'fr' ? 'crédit' : 'credit')
                    : (language === 'fr' ? 'crédits' : 'credits')}
                </span>
                {user && (
                  <span className="text-white/40 text-sm ml-2">
                    ({user.credits} {language === 'fr' ? 'disponibles' : 'available'})
                  </span>
                )}
              </div>

              {/* Action button */}
              <Button
                onClick={handleReveal}
                disabled={!isValidDate() || !hasCredits}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {depth === 1
                  ? (language === 'fr' ? 'Dévoilez votre carte' : 'Reveal Your Card')
                  : (language === 'fr' ? 'Dévoilez vos cartes' : 'Reveal Your Cards')}
              </Button>
            </div>

            {/* Not enough credits warning */}
            {user && !hasCredits && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-amber-400 text-sm text-center mt-4"
              >
                {language === 'fr' ? 'Crédits insuffisants pour ce tirage' : 'Not enough credits for this reading'}
              </motion.p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BirthCardEntry;

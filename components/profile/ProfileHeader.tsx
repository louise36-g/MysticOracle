/**
 * ProfileHeader Component
 * Displays user avatar, info, credits, and quick stats
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Coins, CheckCircle, Flame, BookOpen, Award } from 'lucide-react';

interface ProfileHeaderProps {
  displayUser: {
    username: string;
    email: string;
    credits: number;
    loginStreak: number;
    joinDate: string;
    emailVerified: boolean;
    achievements: string[];
  };
  totalReadings: number;
  onCreditsClick: () => void;
  t: (key: string, fallback: string) => string;
}

const SECTION_CLASSES =
  'bg-slate-900/70 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-4 sm:p-6';

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayUser,
  totalReadings,
  onCreditsClick,
  t,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={SECTION_CLASSES}
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-amber-500 p-[3px]">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <span className="text-3xl font-heading text-purple-100">
                {displayUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          {displayUser.emailVerified && (
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 border-2 border-slate-900">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl md:text-3xl font-heading text-white mb-1">
            {displayUser.username}
          </h1>
          <p className="text-slate-400 mb-2">{displayUser.email}</p>
          <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>
              {t('UserProfile.tsx.UserProfile.member_since', 'Member since')}{' '}
              {new Date(displayUser.joinDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Credits */}
        <button
          onClick={onCreditsClick}
          className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-4 min-w-[140px] text-center
                     hover:border-amber-400/50 hover:bg-slate-800 transition-all duration-200 group"
        >
          <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">
            {t('UserProfile.tsx.UserProfile.credits', 'Credits')}
          </p>
          <p className="text-3xl font-bold text-amber-400 flex items-center justify-center gap-2 group-hover:text-amber-300 transition-colors">
            {displayUser.credits}
            <Coins className="w-5 h-5" />
          </p>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-700/40">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-orange-400 mb-1">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xl sm:text-2xl font-bold">{displayUser.loginStreak}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {t('UserProfile.tsx.UserProfile.day_streak', 'Day Streak')}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-purple-400 mb-1">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xl sm:text-2xl font-bold">{totalReadings}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {t('UserProfile.tsx.UserProfile.readings', 'Readings')}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-amber-400 mb-1">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xl sm:text-2xl font-bold">
              {displayUser.achievements.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {t('UserProfile.tsx.UserProfile.achievements', 'Achievements')}
          </p>
        </div>
      </div>
    </motion.section>
  );
};

export default ProfileHeader;

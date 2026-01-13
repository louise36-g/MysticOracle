import React, { useState } from 'react';
import {
    Star,
    Lock,
    Sparkles,
    Flame,
    Trophy,
    Compass,
    Crown,
    Share2,
    BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

interface Achievement {
    id: string;
    nameEn: string;
    nameFr: string;
    descriptionEn: string;
    descriptionFr: string;
    reward: number;
}

interface AchievementCardProps {
    achievement: Achievement;
    isUnlocked: boolean;
    progress: { current: number; target: number };
    unlockedAt?: string;
}

// Unique icon config for each achievement
const ACHIEVEMENT_ICONS: Record<string, {
    icon: React.ReactNode;
    unlockedColor: string;
    bgColor: string;
}> = {
    first_reading: {
        icon: <Sparkles className="w-8 h-8" />,
        unlockedColor: 'text-cyan-400',
        bgColor: 'from-cyan-500/30 to-cyan-600/20',
    },
    five_readings: {
        icon: <BookOpen className="w-8 h-8" />,
        unlockedColor: 'text-purple-400',
        bgColor: 'from-purple-500/30 to-purple-600/20',
    },
    ten_readings: {
        icon: <Trophy className="w-8 h-8" />,
        unlockedColor: 'text-amber-400',
        bgColor: 'from-amber-500/30 to-amber-600/20',
    },
    celtic_master: {
        icon: <Compass className="w-8 h-8" />,
        unlockedColor: 'text-emerald-400',
        bgColor: 'from-emerald-500/30 to-emerald-600/20',
    },
    all_spreads: {
        icon: <Crown className="w-8 h-8" />,
        unlockedColor: 'text-rose-400',
        bgColor: 'from-rose-500/30 to-rose-600/20',
    },
    week_streak: {
        icon: <Flame className="w-8 h-8" />,
        unlockedColor: 'text-orange-400',
        bgColor: 'from-orange-500/30 to-orange-600/20',
    },
    share_reading: {
        icon: <Share2 className="w-8 h-8" />,
        unlockedColor: 'text-blue-400',
        bgColor: 'from-blue-500/30 to-blue-600/20',
    },
};

const DEFAULT_ICON_CONFIG = {
    icon: <Star className="w-8 h-8" />,
    unlockedColor: 'text-amber-400',
    bgColor: 'from-amber-500/30 to-amber-600/20',
};

const AchievementCard: React.FC<AchievementCardProps> = ({
    achievement,
    isUnlocked,
    progress,
    unlockedAt,
}) => {
    const { t, language } = useApp();
    const [showTooltip, setShowTooltip] = useState(false);
    const progressPercent = Math.round((progress.current / progress.target) * 100);
    const name = language === 'en' ? achievement.nameEn : achievement.nameFr;
    const description = language === 'en' ? achievement.descriptionEn : achievement.descriptionFr;

    // Check if unlocked within last 24 hours
    const isNew = unlockedAt ? (() => {
        const unlockDate = new Date(unlockedAt);
        const now = new Date();
        const hoursSinceUnlock = (now.getTime() - unlockDate.getTime()) / (1000 * 60 * 60);
        return hoursSinceUnlock < 24;
    })() : false;

    // Format unlock date
    const formattedUnlockDate = unlockedAt ? new Date(unlockedAt).toLocaleDateString(
        language === 'en' ? 'en-US' : 'fr-FR',
        { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    ) : null;

    const iconConfig = ACHIEVEMENT_ICONS[achievement.id] || DEFAULT_ICON_CONFIG;

    // Debug: log if falling back to default
    if (!ACHIEVEMENT_ICONS[achievement.id]) {
        console.warn('[AchievementCard] No icon found for:', achievement.id, 'using default');
    }

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`relative p-4 rounded-xl border text-center transition-colors duration-200 flex flex-col h-[280px] ${
                isUnlocked
                    ? 'bg-gradient-to-b from-slate-800/80 to-slate-900/60 border-slate-600/50 hover:border-slate-500/60'
                    : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600/50'
            }`}
        >
            {/* Tooltip */}
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64
                                   bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl
                                   pointer-events-none"
                    >
                        <div className="text-left">
                            <p className="text-sm font-medium text-white mb-1">{name}</p>
                            <p className="text-xs text-slate-400 mb-2">{description}</p>
                            {isUnlocked && formattedUnlockDate && (
                                <p className="text-xs text-emerald-400">
                                    {t('profile.AchievementCard.unlocked', 'Unlocked: ')}
                                    {formattedUnlockDate}
                                </p>
                            )}
                            {!isUnlocked && (
                                <p className="text-xs text-amber-400">
                                    {t('profile.AchievementCard.progress', 'Progress: ')}
                                    {progress.current}/{progress.target}
                                </p>
                            )}
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                            <div className="border-8 border-transparent border-t-slate-800"></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* "New!" Badge */}
            {isNew && (
                <motion.div
                    initial={{ scale: 0, rotate: -12 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.2 }}
                    className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500
                               text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg
                               border-2 border-white/20"
                >
                    {t('profile.AchievementCard.new', 'NEW!')}
                </motion.div>
            )}

            {/* Icon */}
            <div className={`relative mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center shrink-0
                           ${isUnlocked
                               ? `bg-gradient-to-br ${iconConfig.bgColor}`
                               : 'bg-slate-700/50'
                           }`}>
                {isUnlocked ? (
                    <span className={iconConfig.unlockedColor}>
                        {iconConfig.icon}
                    </span>
                ) : (
                    <Lock className="w-6 h-6 text-slate-500" />
                )}
            </div>

            {/* Name */}
            <h4 className={`text-sm font-medium mb-2 ${
                isUnlocked ? 'text-white' : 'text-slate-300'
            }`}>
                {name}
            </h4>

            {/* Description */}
            <p className="text-xs text-slate-500 mb-4 leading-relaxed flex-grow">
                {description}
            </p>

            {/* Progress Bar (locked only) */}
            {!isUnlocked && (
                <div className="mb-4 mt-auto">
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        {progress.current}/{progress.target}
                    </p>
                </div>
            )}

            {/* Status / Reward */}
            <div className={!isUnlocked ? 'mt-auto' : ''}>
                {isUnlocked ? (
                    <div className="flex flex-col items-center gap-1.5">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                            {t('profile.AchievementCard.unlocked_2', 'Unlocked')}
                        </span>
                        <span className="text-xs text-amber-400/80">
                            +{achievement.reward} {t('profile.AchievementCard.credits', 'credits')}
                        </span>
                    </div>
                ) : (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400/80">
                        +{achievement.reward} {t('profile.AchievementCard.credits_2', 'credits')}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

export default AchievementCard;

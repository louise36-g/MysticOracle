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
    BookOpen,
    Moon,
    MessageCircle,
    Eye,
    CalendarRange,
    Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
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
        icon: <Sparkles className="w-5 h-5" />,
        unlockedColor: 'text-cyan-400',
        bgColor: 'from-cyan-500/30 to-cyan-600/20',
    },
    five_readings: {
        icon: <BookOpen className="w-5 h-5" />,
        unlockedColor: 'text-purple-400',
        bgColor: 'from-purple-500/30 to-purple-600/20',
    },
    ten_readings: {
        icon: <Trophy className="w-5 h-5" />,
        unlockedColor: 'text-amber-400',
        bgColor: 'from-amber-500/30 to-amber-600/20',
    },
    oracle: {
        icon: <Eye className="w-5 h-5" />,
        unlockedColor: 'text-violet-400',
        bgColor: 'from-violet-500/30 to-violet-600/20',
    },
    celtic_master: {
        icon: <Compass className="w-5 h-5" />,
        unlockedColor: 'text-emerald-400',
        bgColor: 'from-emerald-500/30 to-emerald-600/20',
    },
    all_spreads: {
        icon: <Crown className="w-5 h-5" />,
        unlockedColor: 'text-rose-400',
        bgColor: 'from-rose-500/30 to-rose-600/20',
    },
    week_streak: {
        icon: <Flame className="w-5 h-5" />,
        unlockedColor: 'text-orange-400',
        bgColor: 'from-orange-500/30 to-orange-600/20',
    },
    true_believer: {
        icon: <Zap className="w-5 h-5" />,
        unlockedColor: 'text-yellow-400',
        bgColor: 'from-yellow-500/30 to-yellow-600/20',
    },
    lunar_cycle: {
        icon: <CalendarRange className="w-5 h-5" />,
        unlockedColor: 'text-indigo-400',
        bgColor: 'from-indigo-500/30 to-indigo-600/20',
    },
    question_seeker: {
        icon: <MessageCircle className="w-5 h-5" />,
        unlockedColor: 'text-teal-400',
        bgColor: 'from-teal-500/30 to-teal-600/20',
    },
    full_moon_reader: {
        icon: <Moon className="w-5 h-5" />,
        unlockedColor: 'text-slate-300',
        bgColor: 'from-slate-400/30 to-slate-500/20',
    },
    share_reading: {
        icon: <Share2 className="w-5 h-5" />,
        unlockedColor: 'text-blue-400',
        bgColor: 'from-blue-500/30 to-blue-600/20',
    },
};

const DEFAULT_ICON_CONFIG = {
    icon: <Star className="w-5 h-5" />,
    unlockedColor: 'text-amber-400',
    bgColor: 'from-amber-500/30 to-amber-600/20',
};

// Constants
const HOURS_FOR_NEW_BADGE = 24;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

/**
 * Calculates hours since achievement was unlocked
 */
const calculateHoursSinceUnlock = (unlockedAt: string): number => {
    const unlockDate = new Date(unlockedAt);
    const now = new Date();
    return (now.getTime() - unlockDate.getTime()) / MILLISECONDS_PER_HOUR;
};

const AchievementCard: React.FC<AchievementCardProps> = ({
    achievement,
    isUnlocked,
    progress,
    unlockedAt,
}) => {
    const { t, language } = useApp();
    const [isFlipped, setIsFlipped] = useState(false);
    const progressPercent = Math.round((progress.current / progress.target) * 100);
    const name = language === 'en' ? achievement.nameEn : achievement.nameFr;
    const description = language === 'en' ? achievement.descriptionEn : achievement.descriptionFr;

    // Check if unlocked within last 24 hours
    const isNew = unlockedAt ? calculateHoursSinceUnlock(unlockedAt) < HOURS_FOR_NEW_BADGE : false;

    // Format unlock date (shorter format for card back)
    const formattedUnlockDate = unlockedAt ? new Date(unlockedAt).toLocaleDateString(
        language === 'en' ? 'en-US' : 'fr-FR',
        { month: 'short', day: 'numeric', year: 'numeric' }
    ) : null;

    const iconConfig = ACHIEVEMENT_ICONS[achievement.id] || DEFAULT_ICON_CONFIG;

    return (
        <div
            className="relative cursor-pointer"
            style={{ perspective: '1000px' }}
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
        >
            <motion.div
                className="relative w-full"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front of card - Badge */}
                <div
                    className={`relative p-2 rounded-lg border text-center ${
                        isUnlocked
                            ? 'bg-gradient-to-b from-slate-800/80 to-slate-900/60 border-slate-600/50'
                            : 'bg-slate-800/40 border-slate-700/40'
                    }`}
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                    {/* "New!" Badge */}
                    {isNew && (
                        <motion.div
                            initial={{ scale: 0, rotate: -12 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.2 }}
                            className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500
                                       text-white text-[8px] font-bold px-1 py-0.5 rounded-full shadow-lg
                                       border border-white/20 z-10"
                        >
                            {t('profile.AchievementCard.new', 'NEW!')}
                        </motion.div>
                    )}

                    {/* Icon */}
                    <div className={`relative mx-auto mb-1.5 w-8 h-8 rounded-full flex items-center justify-center
                                   ${isUnlocked
                                       ? `bg-gradient-to-br ${iconConfig.bgColor}`
                                       : 'bg-slate-700/50'
                                   }`}>
                        {isUnlocked ? (
                            <span className={`${iconConfig.unlockedColor} [&>svg]:w-4 [&>svg]:h-4`}>
                                {iconConfig.icon}
                            </span>
                        ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                        )}
                    </div>

                    {/* Name */}
                    <h4 className={`text-[10px] font-medium mb-1 line-clamp-1 ${
                        isUnlocked ? 'text-white' : 'text-slate-300'
                    }`}>
                        {name}
                    </h4>

                    {/* Progress Bar (locked only) */}
                    {!isUnlocked && (
                        <div className="mb-1">
                            <div className="w-full bg-slate-700/50 rounded-full h-0.5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full"
                                />
                            </div>
                            <p className="text-[9px] text-slate-500 mt-0.5">
                                {progress.current}/{progress.target}
                            </p>
                        </div>
                    )}

                    {/* Reward */}
                    <div>
                        <span className={`text-[9px] ${isUnlocked ? 'text-amber-400/80' : 'text-amber-400/60'}`}>
                            +{achievement.reward}
                        </span>
                    </div>
                </div>

                {/* Back of card - Description */}
                <div
                    className={`absolute inset-0 p-2 rounded-lg border text-center flex flex-col justify-center ${
                        isUnlocked
                            ? 'bg-gradient-to-b from-slate-700/90 to-slate-800/90 border-slate-500/50'
                            : 'bg-slate-800/90 border-slate-600/50'
                    }`}
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    {/* Description */}
                    <p className="text-[9px] text-slate-300 leading-tight mb-1.5">
                        {description}
                    </p>

                    {/* Status info */}
                    {isUnlocked && formattedUnlockDate ? (
                        <p className="text-[8px] text-emerald-400">
                            ✓ {formattedUnlockDate}
                        </p>
                    ) : (
                        <p className="text-[8px] text-amber-400">
                            {progress.current}/{progress.target}
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AchievementCard;

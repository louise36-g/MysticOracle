import React, { useState, useEffect } from 'react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import Button from './Button';
import CreditShop from './CreditShop';
import { DailyBonusCard } from './rewards';
import { Calendar, Coins, Share2, Copy, LogOut, CheckCircle, Award, History, Star, ChevronDown, MessageCircle, BookOpen, Loader2, Pencil, CreditCard, Gift, Sparkles, TrendingUp, TrendingDown, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENTS, SpreadType } from '../types';
import { SPREADS, FULL_DECK } from '../constants';
import { fetchUserReadings, ReadingData, fetchUserTransactions, Transaction } from '../services/apiService';

// Helper to get achievement progress
const getAchievementProgress = (achievementId: string, user: { totalReadings: number; loginStreak: number; spreadsUsed?: SpreadType[]; achievements?: string[] }) => {
    const totalSpreads = Object.keys(SPREADS).length;

    switch (achievementId) {
        case 'first_reading':
            return { current: Math.min(user.totalReadings, 1), target: 1 };
        case 'five_readings':
            return { current: Math.min(user.totalReadings, 5), target: 5 };
        case 'ten_readings':
            return { current: Math.min(user.totalReadings, 10), target: 10 };
        case 'celtic_master':
            return { current: user.spreadsUsed?.includes(SpreadType.CELTIC_CROSS) ? 1 : 0, target: 1 };
        case 'all_spreads':
            return { current: user.spreadsUsed?.length || 0, target: totalSpreads };
        case 'week_streak':
            return { current: Math.min(user.loginStreak, 7), target: 7 };
        case 'share_reading':
            return { current: user.achievements?.includes('share_reading') ? 1 : 0, target: 1 };
        default:
            return { current: 0, target: 1 };
    }
};

const UserProfile: React.FC = () => {
    const { user, language, logout } = useApp();
    const { user: clerkUser, isSignedIn } = useUser();
    const { signOut } = useClerk();
    const { getToken } = useAuth();

    const [isCopied, setIsCopied] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [expandedReading, setExpandedReading] = useState<string | null>(null);
    const [backendReadings, setBackendReadings] = useState<ReadingData[]>([]);
    const [isLoadingReadings, setIsLoadingReadings] = useState(true);
    const [readingsError, setReadingsError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

    // Fetch readings and transactions from backend
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoadingReadings(true);
                setIsLoadingTransactions(true);
                setReadingsError(null);
                const token = await getToken();
                if (token) {
                    const [readingsResult, transactionsResult] = await Promise.all([
                        fetchUserReadings(token, 50, 0),
                        fetchUserTransactions(token, 100, 0)
                    ]);
                    setBackendReadings(readingsResult.readings || []);
                    setTransactions(transactionsResult.transactions || []);
                }
            } catch (error) {
                console.error('Failed to load data:', error);
                setReadingsError(language === 'en' ? 'Failed to load history' : 'Échec du chargement de l\'historique');
            } finally {
                setIsLoadingReadings(false);
                setIsLoadingTransactions(false);
            }
        };

        if (isSignedIn) {
            loadData();
        }
    }, [isSignedIn, getToken, language]);

    if (!isSignedIn) return null;

    // Combine Clerk and AppContext data
    const achievementIds = user?.achievements?.map((a: any) => a.achievementId) || [];

    const displayUser = {
        username: user?.username || clerkUser?.username || clerkUser?.firstName || 'User',
        email: user?.email || clerkUser?.primaryEmailAddress?.emailAddress || '',
        credits: user?.credits ?? 3,
        loginStreak: user?.loginStreak ?? 1,
        joinDate: clerkUser?.createdAt?.toISOString() || new Date().toISOString(),
        referralCode: user?.referralCode || 'MYSTIC' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        emailVerified: clerkUser?.primaryEmailAddress?.verification?.status === 'verified',
        achievements: achievementIds,
        isAdmin: user?.isAdmin || false,
    };

    const copyReferral = () => {
        navigator.clipboard.writeText(displayUser.referralCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSignOut = () => {
        signOut();
        logout();
    };

    const validReadings = (backendReadings || []).filter(r => Array.isArray(r.cards) && r.cards.length > 0);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
            <div className="max-w-4xl mx-auto px-4 py-10">

                {/* Profile Header */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 md:p-8 mb-6"
                >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 p-[3px]">
                                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                    <span className="text-3xl font-heading text-purple-100">
                                        {displayUser.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            {displayUser.emailVerified && (
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-slate-900">
                                    <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-2xl md:text-3xl font-heading text-white mb-1">
                                {displayUser.username}
                            </h1>
                            <p className="text-slate-400 text-sm mb-3">{displayUser.email}</p>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-slate-400">
                                <Calendar className="w-3 h-3" />
                                <span>{language === 'en' ? 'Member since' : 'Membre depuis'} {new Date(displayUser.joinDate).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Credits Display */}
                        <div
                            onClick={() => setIsShopOpen(true)}
                            className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-4 min-w-[140px] text-center cursor-pointer hover:border-amber-500/50 transition-colors duration-150"
                        >
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                                {language === 'en' ? 'Credits' : 'Crédits'}
                            </p>
                            <p className="text-3xl font-bold text-amber-400 flex items-center justify-center gap-2">
                                {displayUser.credits}
                                <Coins className="w-5 h-5" />
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700/50">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                                <Flame className="w-4 h-4" />
                                <span className="text-xl font-bold">{displayUser.loginStreak}</span>
                            </div>
                            <p className="text-xs text-slate-500">{language === 'en' ? 'Day Streak' : 'Jours'}</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                                <BookOpen className="w-4 h-4" />
                                <span className="text-xl font-bold">{user?.totalReadings || 0}</span>
                            </div>
                            <p className="text-xs text-slate-500">{language === 'en' ? 'Readings' : 'Lectures'}</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                                <Award className="w-4 h-4" />
                                <span className="text-xl font-bold">{displayUser.achievements.length}</span>
                            </div>
                            <p className="text-xs text-slate-500">{language === 'en' ? 'Achievements' : 'Succès'}</p>
                        </div>
                    </div>
                </motion.section>

                {/* Daily Bonus & Referral */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <DailyBonusCard />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/20 rounded-xl p-5"
                    >
                        <h3 className="text-sm font-medium text-purple-200 mb-1 flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            {language === 'en' ? 'Referral Code' : 'Code Parrainage'}
                        </h3>
                        <p className="text-xs text-slate-400 mb-3">
                            {language === 'en' ? 'Share & both get +5 credits' : 'Partagez et gagnez +5 crédits chacun'}
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 font-mono text-purple-200 text-sm tracking-wider">
                                {displayUser.referralCode}
                            </div>
                            <button
                                onClick={copyReferral}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-3 rounded-lg transition-colors duration-150"
                            >
                                {isCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Achievements */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/20 rounded-xl p-5 mb-6"
                >
                    <h2 className="text-lg font-heading text-purple-100 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        {language === 'en' ? 'Achievements' : 'Succès'}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {ACHIEVEMENTS.map((achievement) => {
                            const isUnlocked = displayUser.achievements.includes(achievement.id);
                            const progress = getAchievementProgress(achievement.id, {
                                totalReadings: user?.totalReadings || 0,
                                loginStreak: user?.loginStreak || 0,
                                spreadsUsed: user?.spreadsUsed,
                                achievements: displayUser.achievements
                            });
                            const progressPercent = Math.round((progress.current / progress.target) * 100);

                            return (
                                <div
                                    key={achievement.id}
                                    className={`p-3 rounded-lg border text-center transition-all duration-150 ${
                                        isUnlocked
                                            ? 'bg-amber-900/20 border-amber-500/40 hover:border-amber-500/60'
                                            : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                                    }`}
                                >
                                    <Star
                                        className={`w-8 h-8 mx-auto mb-2 ${
                                            isUnlocked ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                                        }`}
                                        fill={isUnlocked ? 'currentColor' : 'none'}
                                    />
                                    <p className={`text-xs font-medium mb-1 ${isUnlocked ? 'text-amber-100' : 'text-slate-400'}`}>
                                        {language === 'en' ? achievement.nameEn : achievement.nameFr}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mb-2">
                                        {language === 'en' ? achievement.descriptionEn : achievement.descriptionFr}
                                    </p>

                                    {!isUnlocked && (
                                        <div className="mb-2">
                                            <div className="w-full bg-slate-700 rounded-full h-1">
                                                <div
                                                    className="bg-gradient-to-r from-purple-500 to-amber-500 h-1 rounded-full transition-all duration-300"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1">{progress.current}/{progress.target}</p>
                                        </div>
                                    )}

                                    <span className={`text-[10px] ${isUnlocked ? 'text-emerald-400' : 'text-amber-400/70'}`}>
                                        {isUnlocked
                                            ? (language === 'en' ? 'Unlocked' : 'Débloqué')
                                            : `+${achievement.reward} ${language === 'en' ? 'credits' : 'crédits'}`
                                        }
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.section>

                {/* Reading History */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/20 rounded-xl p-5 mb-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-heading text-purple-100 flex items-center gap-2">
                            <History className="w-5 h-5 text-purple-400" />
                            {language === 'en' ? 'Reading History' : 'Historique des Lectures'}
                        </h2>
                        <span className="text-xs text-slate-500">
                            {user?.totalReadings || 0} {language === 'en' ? 'total' : 'au total'}
                        </span>
                    </div>

                    {isLoadingReadings ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                            <span className="ml-2 text-sm text-slate-400">
                                {language === 'en' ? 'Loading...' : 'Chargement...'}
                            </span>
                        </div>
                    ) : readingsError ? (
                        <p className="text-red-400 text-center py-8 text-sm">{readingsError}</p>
                    ) : validReadings.length === 0 ? (
                        <p className="text-slate-500 text-center py-8 text-sm">
                            {language === 'en' ? 'No readings yet. Start your journey!' : 'Pas encore de lectures.'}
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {validReadings.map((reading) => {
                                const spread = SPREADS[reading.spreadType as SpreadType];
                                const isExpanded = expandedReading === reading.id;
                                const cards = Array.isArray(reading.cards) ? reading.cards : [];
                                const cardDetails = cards.map((c: any) => {
                                    const cardId = typeof c.cardId === 'string' ? parseInt(c.cardId, 10) : c.cardId;
                                    const card = FULL_DECK.find(fc => fc.id === cardId);
                                    return { ...card, isReversed: c.isReversed, position: c.position };
                                }).filter(c => c.id !== undefined);

                                return (
                                    <div
                                        key={reading.id}
                                        className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => setExpandedReading(isExpanded ? null : reading.id)}
                                            className="w-full p-4 text-left hover:bg-slate-700/30 transition-colors duration-150"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <h3 className="text-purple-200 font-medium text-sm">
                                                            {spread ? (language === 'en' ? spread.nameEn : spread.nameFr) : reading.spreadType}
                                                        </h3>
                                                        <span className="text-[10px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded">
                                                            {cardDetails.length} {language === 'en' ? 'cards' : 'cartes'}
                                                        </span>
                                                        {reading.followUps && reading.followUps.length > 0 && (
                                                            <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded flex items-center gap-1">
                                                                <MessageCircle className="w-2.5 h-2.5" />
                                                                {reading.followUps.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {reading.question && (
                                                        <p className="text-xs text-slate-500 italic line-clamp-1">"{reading.question}"</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500">
                                                        {new Date(reading.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="border-t border-slate-700/50"
                                                >
                                                    <div className="p-4 space-y-4">
                                                        {/* Cards drawn */}
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                                                                {language === 'en' ? 'Cards Drawn' : 'Cartes Tirées'}
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {cardDetails.map((card: any, i: number) => (
                                                                    <span key={i} className="text-[11px] bg-slate-700/50 text-amber-200 px-2 py-1 rounded">
                                                                        {language === 'en' ? card?.nameEn : card?.nameFr}
                                                                        {card?.isReversed && <span className="text-red-400/70 ml-1">(R)</span>}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Position meanings */}
                                                        {spread && cardDetails.length > 0 && (
                                                            <div className="grid gap-1.5">
                                                                {cardDetails.map((card: any, i: number) => {
                                                                    const positionMeaning = language === 'en'
                                                                        ? spread.positionMeaningsEn[i]
                                                                        : spread.positionMeaningsFr[i];
                                                                    return (
                                                                        <div key={i} className="flex items-center gap-2 text-[11px]">
                                                                            <span className="text-slate-500 w-24 shrink-0">{positionMeaning}:</span>
                                                                            <span className="text-purple-200">
                                                                                {language === 'en' ? card?.nameEn : card?.nameFr}
                                                                                {card?.isReversed && <span className="text-red-400/70 ml-1">(R)</span>}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* AI Interpretation */}
                                                        {reading.interpretation && (
                                                            <div className="pt-3 border-t border-slate-700/50">
                                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                                    <BookOpen className="w-3 h-3" />
                                                                    {language === 'en' ? 'Interpretation' : 'Interprétation'}
                                                                </p>
                                                                <div className="bg-slate-900/50 rounded-lg p-3 max-h-[250px] overflow-y-auto">
                                                                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                                        {reading.interpretation.split('\n').map((line, i) => {
                                                                            if (line.startsWith('**')) return <p key={i} className="font-semibold text-amber-200 mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
                                                                            if (line.startsWith('#')) return <p key={i} className="font-bold text-purple-200 mt-3 mb-1">{line.replace(/#/g, '')}</p>;
                                                                            return line.trim() ? <p key={i} className="mb-1.5">{line.replace(/\*\*/g, '')}</p> : null;
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Follow-up Questions */}
                                                        {reading.followUps && reading.followUps.length > 0 && (
                                                            <div className="pt-3 border-t border-slate-700/50">
                                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                                    <MessageCircle className="w-3 h-3" />
                                                                    {language === 'en' ? 'Follow-up Questions' : 'Questions de Suivi'}
                                                                </p>
                                                                <div className="space-y-2">
                                                                    {reading.followUps.map((followUp, i) => (
                                                                        <div key={followUp.id} className="bg-slate-900/50 rounded-lg p-3">
                                                                            <p className="text-xs text-purple-200 font-medium mb-1">
                                                                                <span className="text-purple-400 mr-1">Q{i + 1}:</span>
                                                                                {followUp.question}
                                                                            </p>
                                                                            <p className="text-xs text-slate-400 whitespace-pre-wrap">
                                                                                {followUp.answer}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* User Reflection */}
                                                        {reading.userReflection && (
                                                            <div className="pt-3 border-t border-slate-700/50">
                                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                                    <Pencil className="w-3 h-3" />
                                                                    {language === 'en' ? 'Your Reflection' : 'Votre Réflexion'}
                                                                </p>
                                                                <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-3">
                                                                    <p className="text-xs text-purple-100 italic">"{reading.userReflection}"</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.section>

                {/* Transaction History */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/20 rounded-xl p-5 mb-6"
                >
                    <h2 className="text-lg font-heading text-purple-100 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-green-400" />
                        {language === 'en' ? 'Credit History' : 'Historique des Crédits'}
                    </h2>

                    {/* Summary */}
                    {transactions && transactions.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                <p className="text-xs text-slate-500 mb-1">{language === 'en' ? 'Purchased' : 'Achetés'}</p>
                                <p className="text-lg font-bold text-green-400">
                                    +{(transactions || []).filter(t => t.type === 'PURCHASE').reduce((sum, t) => sum + t.amount, 0)}
                                </p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                <p className="text-xs text-slate-500 mb-1">{language === 'en' ? 'Earned' : 'Gagnés'}</p>
                                <p className="text-lg font-bold text-amber-400">
                                    +{(transactions || []).filter(t => ['DAILY_BONUS', 'ACHIEVEMENT', 'REFERRAL_BONUS', 'REFUND'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0)}
                                </p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                <p className="text-xs text-slate-500 mb-1">{language === 'en' ? 'Spent' : 'Dépensés'}</p>
                                <p className="text-lg font-bold text-red-400">
                                    {(transactions || []).filter(t => ['READING', 'QUESTION'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0)}
                                </p>
                            </div>
                        </div>
                    )}

                    {isLoadingTransactions ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                            <span className="ml-2 text-sm text-slate-400">
                                {language === 'en' ? 'Loading...' : 'Chargement...'}
                            </span>
                        </div>
                    ) : !transactions || transactions.length === 0 ? (
                        <p className="text-slate-500 text-center py-8 text-sm">
                            {language === 'en' ? 'No transactions yet.' : 'Pas encore de transactions.'}
                        </p>
                    ) : (
                        <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
                            {(transactions || []).map((transaction) => {
                                const isPositive = transaction.amount > 0;
                                const getIcon = () => {
                                    switch (transaction.type) {
                                        case 'PURCHASE': return <CreditCard className="w-3.5 h-3.5 text-green-400" />;
                                        case 'DAILY_BONUS': return <Gift className="w-3.5 h-3.5 text-amber-400" />;
                                        case 'ACHIEVEMENT': return <Award className="w-3.5 h-3.5 text-purple-400" />;
                                        case 'REFERRAL_BONUS': return <Share2 className="w-3.5 h-3.5 text-blue-400" />;
                                        case 'READING': return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
                                        case 'QUESTION': return <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />;
                                        case 'REFUND': return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
                                        default: return <Coins className="w-3.5 h-3.5 text-slate-400" />;
                                    }
                                };
                                const getLabel = () => {
                                    switch (transaction.type) {
                                        case 'PURCHASE': return language === 'en' ? 'Purchase' : 'Achat';
                                        case 'DAILY_BONUS': return language === 'en' ? 'Daily Bonus' : 'Bonus quotidien';
                                        case 'ACHIEVEMENT': return language === 'en' ? 'Achievement' : 'Succès';
                                        case 'REFERRAL_BONUS': return language === 'en' ? 'Referral' : 'Parrainage';
                                        case 'READING': return language === 'en' ? 'Reading' : 'Lecture';
                                        case 'QUESTION': return language === 'en' ? 'Question' : 'Question';
                                        case 'REFUND': return language === 'en' ? 'Refund' : 'Remboursement';
                                        default: return transaction.type;
                                    }
                                };

                                return (
                                    <div
                                        key={transaction.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${
                                            isPositive
                                                ? 'bg-green-900/10 border-green-500/20'
                                                : 'bg-slate-800/30 border-slate-700/30'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-full ${isPositive ? 'bg-green-900/30' : 'bg-slate-700/50'}`}>
                                                {getIcon()}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-200">{getLabel()}</p>
                                                <p className="text-[10px] text-slate-500">{transaction.description}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold flex items-center gap-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {isPositive ? '+' : ''}{transaction.amount}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {new Date(transaction.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.section>

                {/* Logout */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                    className="flex justify-center pt-4"
                >
                    <Button
                        variant="outline"
                        onClick={handleSignOut}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-900/30"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {language === 'en' ? 'Log Out' : 'Déconnexion'}
                    </Button>
                </motion.div>

                {/* Credit Shop Modal */}
                <CreditShop isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
            </div>
        </div>
    );
};

export default UserProfile;

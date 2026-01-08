import React, { useState, useEffect } from 'react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import Button from './Button';
import CreditShop from './CreditShop';
import { DailyBonusCard } from './rewards';
import { Calendar, Coins, Share2, Copy, LogOut, CheckCircle, Award, History, Star, User as UserIcon, ChevronDown, ChevronUp, MessageCircle, BookOpen, Loader2, Pencil, CreditCard, Gift, Sparkles, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
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
                    setBackendReadings(readingsResult.readings);
                    setTransactions(transactionsResult.transactions);
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
    const displayUser = {
        username: user?.username || clerkUser?.username || clerkUser?.firstName || 'User',
        email: user?.email || clerkUser?.primaryEmailAddress?.emailAddress || '',
        credits: user?.credits ?? 3,
        loginStreak: user?.loginStreak ?? 1,
        joinDate: clerkUser?.createdAt?.toISOString() || new Date().toISOString(),
        referralCode: user?.referralCode || 'MYSTIC' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        emailVerified: clerkUser?.primaryEmailAddress?.verification?.status === 'verified',
        achievements: user?.achievements || [],
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

    return (
        <div className="max-w-4xl mx-auto p-4 pt-10 pb-20">
            {/* Header Section */}
            <div className="bg-slate-900/80 border border-purple-500/20 rounded-2xl p-6 md:p-8 mb-8 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <UserIcon className="w-48 h-48 text-purple-500" />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-purple-600 p-1">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                            <span className="text-3xl font-heading text-amber-100">{displayUser.username.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-3xl font-heading text-white mb-1">
                            {displayUser.username}
                        </h1>
                        <p className="text-slate-400">{displayUser.email}</p>
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-4 text-sm text-slate-300">
                            <span className="flex items-center gap-1 bg-slate-800/50 px-3 py-1 rounded-full">
                                <Calendar className="w-3 h-3" />
                                Since {new Date(displayUser.joinDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1 bg-slate-800/50 px-3 py-1 rounded-full text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[150px]">
                        <div className="bg-slate-950/50 rounded-lg p-3 text-center border border-purple-500/30">
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Balance</p>
                            <p className="text-2xl font-bold text-amber-400 flex items-center justify-center gap-1">
                                {displayUser.credits} <Coins className="w-5 h-5" />
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsShopOpen(true)}
                        >
                             {language === 'en' ? 'Get Credits' : 'Acheter Crédits'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Daily Bonus Card */}
                <DailyBonusCard />

                {/* Referral Card */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/20 p-6 rounded-xl"
                >
                    <h3 className="text-lg font-heading text-blue-100 mb-1 flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        {language === 'en' ? 'Referral Code' : 'Code de Parrainage'}
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">
                        {language === 'en' ? 'Share and earn +5 credits each!' : 'Partagez et gagnez +5 crédits chacun !'}
                    </p>
                    <div className="flex gap-2">
                        <div className="bg-slate-950 border border-blue-500/30 rounded px-3 py-1 font-mono text-blue-200 tracking-widest select-all">
                            {displayUser.referralCode}
                        </div>
                        <button
                            onClick={copyReferral}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded transition-colors"
                        >
                            {isCopied ? <span className="text-xs font-bold">✓</span> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Achievements Section */}
            <div className="bg-slate-900/60 border border-purple-500/20 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-heading text-purple-200 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    {language === 'en' ? 'Achievements' : 'Réalisations'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ACHIEVEMENTS.map(achievement => {
                        const isUnlocked = displayUser.achievements?.includes(achievement.id);
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
                                className={`p-3 rounded-lg border text-center transition-all ${
                                    isUnlocked
                                        ? 'bg-amber-900/20 border-amber-500/30'
                                        : 'bg-slate-800/30 border-slate-700/30'
                                }`}
                            >
                                <Star className={`w-6 h-6 mx-auto mb-2 ${isUnlocked ? 'text-amber-400' : 'text-slate-600'}`} />
                                <p className={`text-sm font-medium ${isUnlocked ? 'text-amber-100' : 'text-slate-400'}`}>
                                    {language === 'en' ? achievement.nameEn : achievement.nameFr}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {language === 'en' ? achievement.descriptionEn : achievement.descriptionFr}
                                </p>

                                {/* Progress bar */}
                                {!isUnlocked && (
                                    <div className="mt-2">
                                        <div className="w-full bg-slate-700 rounded-full h-1.5 mb-1">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-amber-500 h-1.5 rounded-full transition-all duration-300"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {progress.current}/{progress.target}
                                        </p>
                                    </div>
                                )}

                                <p className={`text-xs mt-2 ${isUnlocked ? 'text-green-400' : 'text-amber-500'}`}>
                                    {isUnlocked ? (language === 'en' ? 'Unlocked!' : 'Débloqué!') : `+${achievement.reward} ${language === 'en' ? 'credits' : 'crédits'}`}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Reading History Section */}
            <div className="bg-slate-900/60 border border-purple-500/20 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-heading text-purple-200 mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-400" />
                    {language === 'en' ? 'Reading History' : 'Historique des Lectures'}
                    <span className="text-sm text-slate-400 ml-auto">
                        {user?.totalReadings || 0} {language === 'en' ? 'total readings' : 'lectures au total'}
                    </span>
                </h2>
                {isLoadingReadings ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                        <span className="ml-2 text-slate-400">
                            {language === 'en' ? 'Loading readings...' : 'Chargement des lectures...'}
                        </span>
                    </div>
                ) : readingsError ? (
                    <p className="text-red-400 text-center py-8">{readingsError}</p>
                ) : backendReadings.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                        {language === 'en' ? 'No readings yet. Start your journey!' : 'Pas encore de lectures. Commencez votre voyage!'}
                    </p>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {backendReadings
                            // Filter out invalid readings (0 cards = incomplete/invalid reading)
                            .filter(r => Array.isArray(r.cards) && r.cards.length > 0)
                            .map((reading, index) => {
                            const spread = SPREADS[reading.spreadType as SpreadType];
                            const isExpanded = expandedReading === reading.id;
                            const cards = Array.isArray(reading.cards) ? reading.cards : [];
                            const cardDetails = cards.map((c: any) => {
                                const card = FULL_DECK.find(fc => fc.id === c.cardId);
                                return { ...card, isReversed: c.isReversed, position: c.position };
                            }).filter(c => c.id);

                            return (
                                <motion.div
                                    key={reading.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="bg-slate-800/50 rounded-lg border border-slate-700/30 overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedReading(isExpanded ? null : reading.id)}
                                        className="w-full p-4 text-left hover:bg-slate-700/20 transition-colors"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-purple-200 font-medium">
                                                        {spread ? (language === 'en' ? spread.nameEn : spread.nameFr) : reading.spreadType}
                                                    </h3>
                                                    <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded">
                                                        {cardDetails.length} {language === 'en' ? 'cards' : 'cartes'}
                                                    </span>
                                                    {reading.followUps && reading.followUps.length > 0 && (
                                                        <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded flex items-center gap-1">
                                                            <MessageCircle className="w-3 h-3" />
                                                            {reading.followUps.length} {language === 'en' ? 'Q&A' : 'Q&R'}
                                                        </span>
                                                    )}
                                                    {reading.userReflection && (
                                                        <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
                                                            <Pencil className="w-3 h-3" />
                                                            {language === 'en' ? 'Reflection' : 'Réflexion'}
                                                        </span>
                                                    )}
                                                </div>
                                                {reading.question && (
                                                    <p className="text-sm text-slate-400 italic mt-1 line-clamp-1">"{reading.question}"</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">
                                                    {new Date(reading.createdAt).toLocaleDateString()}
                                                </span>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="border-t border-slate-700/30"
                                            >
                                                <div className="p-4 space-y-4">
                                                    {/* Cards drawn */}
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                                                            {language === 'en' ? 'Cards Drawn' : 'Cartes Tirées'}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {cardDetails.map((card: any, i: number) => (
                                                                <span
                                                                    key={i}
                                                                    className="text-xs bg-slate-700/50 text-amber-200 px-2 py-1 rounded border border-amber-500/20"
                                                                >
                                                                    {language === 'en' ? card?.nameEn : card?.nameFr}
                                                                    {card?.isReversed && <span className="text-amber-500/70 ml-1">(R)</span>}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Position meanings */}
                                                    {spread && cardDetails.length > 0 && (
                                                        <div className="grid gap-2">
                                                            {cardDetails.map((card: any, i: number) => {
                                                                const positionMeaning = language === 'en'
                                                                    ? spread.positionMeaningsEn[i]
                                                                    : spread.positionMeaningsFr[i];
                                                                return (
                                                                    <div key={i} className="flex items-center gap-2 text-xs">
                                                                        <span className="text-slate-500 w-28 shrink-0">{positionMeaning}:</span>
                                                                        <span className="text-purple-200">
                                                                            {language === 'en' ? card?.nameEn : card?.nameFr}
                                                                            {card?.isReversed && <span className="text-amber-500/70 ml-1">({language === 'en' ? 'Reversed' : 'Renversée'})</span>}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* AI Interpretation */}
                                                    {reading.interpretation && (
                                                        <div className="mt-4 pt-4 border-t border-slate-700/30">
                                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                                <BookOpen className="w-3 h-3" />
                                                                {language === 'en' ? 'Oracle\'s Interpretation' : 'Interprétation de l\'Oracle'}
                                                            </p>
                                                            <div className="bg-slate-900/50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                                                                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                                    {reading.interpretation.split('\n').map((line, i) => {
                                                                        if (line.startsWith('**')) return <p key={i} className="font-semibold text-amber-200 mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
                                                                        if (line.startsWith('#')) return <p key={i} className="font-bold text-purple-300 mt-4 mb-2">{line.replace(/#/g, '')}</p>;
                                                                        return line.trim() ? <p key={i} className="mb-2">{line.replace(/\*\*/g, '')}</p> : null;
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Follow-up Questions & Answers */}
                                                    {reading.followUps && reading.followUps.length > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-slate-700/30">
                                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                                                <MessageCircle className="w-3 h-3" />
                                                                {language === 'en' ? 'Follow-up Questions' : 'Questions de Suivi'}
                                                            </p>
                                                            <div className="space-y-3">
                                                                {reading.followUps.map((followUp, i) => (
                                                                    <div key={followUp.id} className="bg-slate-900/50 rounded-lg p-3">
                                                                        <p className="text-sm text-purple-200 font-medium mb-2">
                                                                            <span className="text-purple-400 mr-2">Q{i + 1}:</span>
                                                                            {followUp.question}
                                                                        </p>
                                                                        <p className="text-sm text-slate-300 pl-6 whitespace-pre-wrap">
                                                                            {followUp.answer}
                                                                        </p>
                                                                        <p className="text-xs text-slate-500 mt-2 pl-6">
                                                                            {new Date(followUp.createdAt).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* User Reflection */}
                                                    {reading.userReflection && (
                                                        <div className="mt-4 pt-4 border-t border-slate-700/30">
                                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                                <Pencil className="w-3 h-3" />
                                                                {language === 'en' ? 'Your Reflection' : 'Votre Réflexion'}
                                                            </p>
                                                            <div className="bg-gradient-to-br from-purple-900/20 to-slate-900/50 rounded-lg p-4 border border-purple-500/20">
                                                                <p className="text-sm text-purple-100 italic whitespace-pre-wrap leading-relaxed">
                                                                    "{reading.userReflection}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Transaction History Section */}
            <div className="bg-slate-900/60 border border-purple-500/20 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-heading text-purple-200 mb-4 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-green-400" />
                    {language === 'en' ? 'Credit History' : 'Historique des Crédits'}
                </h2>
                {isLoadingTransactions ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                        <span className="ml-2 text-slate-400">
                            {language === 'en' ? 'Loading transactions...' : 'Chargement des transactions...'}
                        </span>
                    </div>
                ) : transactions.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                        {language === 'en' ? 'No transactions yet.' : 'Pas encore de transactions.'}
                    </p>
                ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {transactions.map((transaction, index) => {
                            const isPositive = transaction.amount > 0;
                            const getTransactionIcon = () => {
                                switch (transaction.type) {
                                    case 'PURCHASE':
                                        return <CreditCard className="w-4 h-4 text-green-400" />;
                                    case 'DAILY_BONUS':
                                        return <Gift className="w-4 h-4 text-amber-400" />;
                                    case 'ACHIEVEMENT':
                                        return <Award className="w-4 h-4 text-purple-400" />;
                                    case 'REFERRAL_BONUS':
                                        return <Share2 className="w-4 h-4 text-blue-400" />;
                                    case 'READING':
                                        return <Sparkles className="w-4 h-4 text-pink-400" />;
                                    case 'QUESTION':
                                        return <MessageCircle className="w-4 h-4 text-cyan-400" />;
                                    case 'REFUND':
                                        return <TrendingUp className="w-4 h-4 text-green-400" />;
                                    default:
                                        return <Coins className="w-4 h-4 text-slate-400" />;
                                }
                            };

                            const getTransactionLabel = () => {
                                switch (transaction.type) {
                                    case 'PURCHASE':
                                        return language === 'en' ? 'Credit Purchase' : 'Achat de crédits';
                                    case 'DAILY_BONUS':
                                        return language === 'en' ? 'Daily Bonus' : 'Bonus quotidien';
                                    case 'ACHIEVEMENT':
                                        return language === 'en' ? 'Achievement Reward' : 'Récompense';
                                    case 'REFERRAL_BONUS':
                                        return language === 'en' ? 'Referral Bonus' : 'Bonus parrainage';
                                    case 'READING':
                                        return language === 'en' ? 'Tarot Reading' : 'Lecture de Tarot';
                                    case 'QUESTION':
                                        return language === 'en' ? 'Follow-up Question' : 'Question de suivi';
                                    case 'REFUND':
                                        return language === 'en' ? 'Refund' : 'Remboursement';
                                    default:
                                        return transaction.type;
                                }
                            };

                            return (
                                <motion.div
                                    key={transaction.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                        isPositive
                                            ? 'bg-green-900/10 border-green-500/20'
                                            : 'bg-slate-800/30 border-slate-700/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${
                                            isPositive ? 'bg-green-900/30' : 'bg-slate-800/50'
                                        }`}>
                                            {getTransactionIcon()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">
                                                {getTransactionLabel()}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {transaction.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold flex items-center gap-1 ${
                                            isPositive ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {isPositive ? (
                                                <TrendingUp className="w-3 h-3" />
                                            ) : (
                                                <TrendingDown className="w-3 h-3" />
                                            )}
                                            {isPositive ? '+' : ''}{transaction.amount}
                                            <Coins className="w-3 h-3 ml-0.5" />
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(transaction.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Summary Stats */}
                {transactions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700/30 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                {language === 'en' ? 'Purchased' : 'Achetés'}
                            </p>
                            <p className="text-lg font-bold text-green-400">
                                +{transactions.filter(t => t.type === 'PURCHASE').reduce((sum, t) => sum + t.amount, 0)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                {language === 'en' ? 'Earned' : 'Gagnés'}
                            </p>
                            <p className="text-lg font-bold text-amber-400">
                                +{transactions.filter(t => ['DAILY_BONUS', 'ACHIEVEMENT', 'REFERRAL_BONUS', 'REFUND'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                {language === 'en' ? 'Spent' : 'Dépensés'}
                            </p>
                            <p className="text-lg font-bold text-red-400">
                                {transactions.filter(t => ['READING', 'QUESTION'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Account Actions */}
            <div className="border-t border-white/10 pt-8 flex justify-center">
                 <Button variant="outline" onClick={handleSignOut} className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-900/30">
                     <LogOut className="w-4 h-4 mr-2" />
                     {language === 'en' ? 'Log Out' : 'Déconnexion'}
                 </Button>
            </div>

            {/* Credit Shop Modal */}
            <CreditShop isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
        </div>
    );
};

export default UserProfile;

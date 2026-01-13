import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import Button from './Button';
import CreditShop from './CreditShop';
import { DailyBonusCard } from './rewards';
import { Calendar, Coins, Share2, Copy, LogOut, CheckCircle, Award, History, BookOpen, Loader2, CreditCard, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { ACHIEVEMENTS, SpreadType } from '../types';
import { SPREADS } from '../constants';
import { fetchUserReadings, ReadingData, fetchUserTransactions, Transaction } from '../services/apiService';
import { ReadingFilters, ReadingHistoryCard, AchievementCard, TransactionItem, SortOption } from './profile';

// Constants
const SECTION_CLASSES = "bg-slate-900/70 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-6";
const STAGGER_DELAY = 0.08;

// Achievement progress helper
const getAchievementProgress = (
    achievementId: string,
    user: { totalReadings: number; loginStreak: number; spreadsUsed?: SpreadType[]; achievements?: string[] }
) => {
    const totalSpreads = Object.keys(SPREADS).length;
    switch (achievementId) {
        case 'first_reading': return { current: Math.min(user.totalReadings, 1), target: 1 };
        case 'five_readings': return { current: Math.min(user.totalReadings, 5), target: 5 };
        case 'ten_readings': return { current: Math.min(user.totalReadings, 10), target: 10 };
        case 'celtic_master': return { current: user.spreadsUsed?.includes(SpreadType.CELTIC_CROSS) ? 1 : 0, target: 1 };
        case 'all_spreads': return { current: user.spreadsUsed?.length || 0, target: totalSpreads };
        case 'week_streak': return { current: Math.min(user.loginStreak, 7), target: 7 };
        case 'share_reading': return { current: user.achievements?.includes('share_reading') ? 1 : 0, target: 1 };
        default: return { current: 0, target: 1 };
    }
};

const UserProfile: React.FC = () => {
    const { user, language, logout } = useApp();
    const { user: clerkUser, isSignedIn } = useUser();
    const { signOut } = useClerk();
    const { getToken } = useAuth();

    // UI State
    const [isCopied, setIsCopied] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [expandedReading, setExpandedReading] = useState<string | null>(null);

    // Data State
    const [backendReadings, setBackendReadings] = useState<ReadingData[]>([]);
    const [isLoadingReadings, setIsLoadingReadings] = useState(true);
    const [readingsError, setReadingsError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [spreadFilter, setSpreadFilter] = useState<SpreadType | 'all'>('all');
    const [sortOrder, setSortOrder] = useState<SortOption>('newest');

    // Fetch data on mount
    useEffect(() => {
        const loadData = async () => {
            if (!isSignedIn) return;
            try {
                setIsLoadingReadings(true);
                setIsLoadingTransactions(true);
                setReadingsError(null);
                const token = await getToken();
                if (token) {
                    const [readingsResult, transactionsResult] = await Promise.all([
                        fetchUserReadings(token, 100, 0),
                        fetchUserTransactions(token, 100, 0)
                    ]);
                    setBackendReadings(readingsResult.data || []);
                    setTransactions(transactionsResult.data || []);
                }
            } catch (error) {
                console.error('Failed to load data:', error);
                setReadingsError(language === 'en' ? 'Failed to load history' : 'Échec du chargement');
            } finally {
                setIsLoadingReadings(false);
                setIsLoadingTransactions(false);
            }
        };
        loadData();
    }, [isSignedIn, getToken, language]);

    // Filter and sort readings
    const filteredReadings = useMemo(() => {
        let result = [...(backendReadings || [])];

        // Apply spread filter (case-insensitive - backend uses UPPERCASE, frontend uses lowercase)
        if (spreadFilter !== 'all') {
            result = result.filter(r => r.spreadType?.toLowerCase() === spreadFilter.toLowerCase());
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.question?.toLowerCase().includes(query) ||
                r.interpretation?.toLowerCase().includes(query)
            );
        }

        // Apply sort
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [backendReadings, spreadFilter, searchQuery, sortOrder]);

    const totalValidReadings = (backendReadings || []).length;

    if (!isSignedIn) return null;

    // Combine user data
    // user.achievements is already an array of achievement ID strings from AppContext
    const achievementIds = user?.achievements || [];
    const displayUser = {
        username: user?.username || clerkUser?.username || clerkUser?.firstName || 'User',
        email: user?.email || clerkUser?.primaryEmailAddress?.emailAddress || '',
        credits: user?.credits ?? 3,
        loginStreak: user?.loginStreak ?? 1,
        joinDate: clerkUser?.createdAt?.toISOString() || new Date().toISOString(),
        referralCode: user?.referralCode || 'MYSTIC' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        emailVerified: clerkUser?.primaryEmailAddress?.verification?.status === 'verified',
        achievements: achievementIds,
    };

    const copyReferral = () => {
        navigator.clipboard.writeText(displayUser.referralCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSignOut = () => { signOut(); logout(); };

    // Transaction summary calculations
    const purchasedCredits = (transactions || []).filter(t => t.type === 'PURCHASE').reduce((sum, t) => sum + t.amount, 0);
    const earnedCredits = (transactions || []).filter(t => ['DAILY_BONUS', 'ACHIEVEMENT', 'REFERRAL_BONUS', 'REFUND'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);
    const spentCredits = (transactions || []).filter(t => ['READING', 'QUESTION'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-950">
            <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">

                {/* Profile Header */}
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
                            <h1 className="text-2xl md:text-3xl font-heading text-white mb-1">{displayUser.username}</h1>
                            <p className="text-slate-400 mb-2">{displayUser.email}</p>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-500">
                                <Calendar className="w-4 h-4" />
                                <span>{language === 'en' ? 'Member since' : 'Membre depuis'} {new Date(displayUser.joinDate).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Credits */}
                        <button
                            onClick={() => setIsShopOpen(true)}
                            className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-4 min-w-[140px] text-center
                                       hover:border-amber-400/50 hover:bg-slate-800 transition-all duration-200 group"
                        >
                            <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">
                                {language === 'en' ? 'Credits' : 'Crédits'}
                            </p>
                            <p className="text-3xl font-bold text-amber-400 flex items-center justify-center gap-2 group-hover:text-amber-300 transition-colors">
                                {displayUser.credits}
                                <Coins className="w-5 h-5" />
                            </p>
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700/40">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5 text-orange-400 mb-1">
                                <Flame className="w-5 h-5" />
                                <span className="text-2xl font-bold">{displayUser.loginStreak}</span>
                            </div>
                            <p className="text-sm text-slate-500">{language === 'en' ? 'Day Streak' : 'Jours consécutifs'}</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5 text-purple-400 mb-1">
                                <BookOpen className="w-5 h-5" />
                                <span className="text-2xl font-bold">{user?.totalReadings || 0}</span>
                            </div>
                            <p className="text-sm text-slate-500">{language === 'en' ? 'Readings' : 'Lectures'}</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1">
                                <Award className="w-5 h-5" />
                                <span className="text-2xl font-bold">{displayUser.achievements.length}</span>
                            </div>
                            <p className="text-sm text-slate-500">{language === 'en' ? 'Achievements' : 'Succès'}</p>
                        </div>
                    </div>
                </motion.section>

                {/* Daily Bonus & Referral */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: STAGGER_DELAY }}>
                        <DailyBonusCard />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: STAGGER_DELAY * 2 }}
                        className={SECTION_CLASSES}
                    >
                        <h3 className="text-base font-medium text-purple-200 mb-1 flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            {language === 'en' ? 'Referral Code' : 'Code Parrainage'}
                        </h3>
                        <p className="text-sm text-slate-400 mb-3">
                            {language === 'en' ? 'Share & both get +5 credits' : 'Partagez et gagnez +5 crédits chacun'}
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 font-mono text-purple-200 tracking-wider">
                                {displayUser.referralCode}
                            </div>
                            <button
                                onClick={copyReferral}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-lg transition-colors duration-200"
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
                    transition={{ duration: 0.4, delay: STAGGER_DELAY * 3 }}
                    className={SECTION_CLASSES}
                >
                    <h2 className="text-lg font-heading text-purple-100 mb-5 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        {language === 'en' ? 'Achievements' : 'Succès'}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {ACHIEVEMENTS.map((achievement) => (
                            <AchievementCard
                                key={achievement.id}
                                achievement={achievement}
                                isUnlocked={displayUser.achievements.includes(achievement.id)}
                                progress={getAchievementProgress(achievement.id, {
                                    totalReadings: user?.totalReadings || 0,
                                    loginStreak: user?.loginStreak || 0,
                                    spreadsUsed: user?.spreadsUsed,
                                    achievements: displayUser.achievements
                                })}
                                language={language}
                            />
                        ))}
                    </div>
                </motion.section>

                {/* Reading History */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: STAGGER_DELAY * 4 }}
                    className={SECTION_CLASSES}
                >
                    <h2 className="text-lg font-heading text-purple-100 mb-5 flex items-center gap-2">
                        <History className="w-5 h-5 text-purple-400" />
                        {language === 'en' ? 'Reading History' : 'Historique des Lectures'}
                    </h2>

                    {/* Filters */}
                    <div className="mb-5">
                        <ReadingFilters
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            spreadFilter={spreadFilter}
                            onSpreadFilterChange={setSpreadFilter}
                            sortOrder={sortOrder}
                            onSortChange={setSortOrder}
                            language={language}
                            resultCount={filteredReadings.length}
                            totalCount={totalValidReadings}
                        />
                    </div>

                    {/* Reading List */}
                    {isLoadingReadings ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                            <span className="ml-3 text-slate-400">{language === 'en' ? 'Loading...' : 'Chargement...'}</span>
                        </div>
                    ) : readingsError ? (
                        <p className="text-red-400 text-center py-12">{readingsError}</p>
                    ) : filteredReadings.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500">
                                {totalValidReadings === 0
                                    ? (language === 'en' ? 'No readings yet. Start your journey!' : 'Pas encore de lectures.')
                                    : (language === 'en' ? 'No readings match your filters.' : 'Aucune lecture ne correspond.')
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                            {filteredReadings.map((reading) => (
                                <ReadingHistoryCard
                                    key={reading.id}
                                    reading={reading}
                                    isExpanded={expandedReading === reading.id}
                                    onToggle={() => setExpandedReading(expandedReading === reading.id ? null : reading.id)}
                                    language={language}
                                />
                            ))}
                        </div>
                    )}
                </motion.section>

                {/* Transaction History */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: STAGGER_DELAY * 5 }}
                    className={SECTION_CLASSES}
                >
                    <h2 className="text-lg font-heading text-purple-100 mb-5 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-green-400" />
                        {language === 'en' ? 'Credit History' : 'Historique des Crédits'}
                    </h2>

                    {/* Summary */}
                    {transactions && transactions.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-5">
                            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                <p className="text-sm text-slate-500 mb-1">{language === 'en' ? 'Purchased' : 'Achetés'}</p>
                                <p className="text-xl font-bold text-green-400">+{purchasedCredits}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                <p className="text-sm text-slate-500 mb-1">{language === 'en' ? 'Earned' : 'Gagnés'}</p>
                                <p className="text-xl font-bold text-amber-400">+{earnedCredits}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                <p className="text-sm text-slate-500 mb-1">{language === 'en' ? 'Spent' : 'Dépensés'}</p>
                                <p className="text-xl font-bold text-red-400">{spentCredits}</p>
                            </div>
                        </div>
                    )}

                    {/* Transaction List */}
                    {isLoadingTransactions ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                            <span className="ml-3 text-slate-400">{language === 'en' ? 'Loading...' : 'Chargement...'}</span>
                        </div>
                    ) : !transactions || transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <Coins className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500">{language === 'en' ? 'No transactions yet.' : 'Pas encore de transactions.'}</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {transactions.map((transaction) => (
                                <TransactionItem key={transaction.id} transaction={transaction} language={language} />
                            ))}
                        </div>
                    )}
                </motion.section>

                {/* Logout */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: STAGGER_DELAY * 6 }}
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

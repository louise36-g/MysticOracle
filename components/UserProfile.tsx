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
import { fetchUserReadings, ReadingData, fetchUserTransactions, Transaction } from '../services/api';
import { ReadingFilters, ReadingHistoryCard, ReadingHistoryAccordion, AchievementCard, TransactionItem, TransactionFilters, EmptyState, SortOption, TransactionTypeFilter } from './profile';
import { getAchievementsWithProgress, debugAchievementStatus } from '../utils/achievementService';
import { filterByDateRange, type DateRangeOption } from '../utils/dateFilters';
import { createShareUrl, type SharePlatform } from '../utils/socialShare';

// Constants
const SECTION_CLASSES = "bg-slate-900/70 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-4 sm:p-6";
const STAGGER_DELAY = 0.08;

const UserProfile: React.FC = () => {
    const { user, logout, t, language } = useApp();
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

    // Reading Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [spreadFilter, setSpreadFilter] = useState<SpreadType | 'all'>('all');
    const [sortOrder, setSortOrder] = useState<SortOption>('newest');
    const [dateRange, setDateRange] = useState<DateRangeOption>('all');

    // Transaction Filter State
    const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionTypeFilter>('all');
    const [transactionDateRange, setTransactionDateRange] = useState<DateRangeOption>('all');

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
                setReadingsError(t('UserProfile.tsx.UserProfile.failed_to_load', 'Failed to load history'));
            } finally {
                setIsLoadingReadings(false);
                setIsLoadingTransactions(false);
            }
        };
        loadData();
    }, [isSignedIn, getToken, t]);

    // Helper functions for reading filtering
    const searchMatchesReading = (reading: ReadingData, query: string): boolean => {
        const searchLower = query.toLowerCase();
        return reading.question?.toLowerCase().includes(searchLower) ||
               reading.interpretation?.toLowerCase().includes(searchLower) ||
               false;
    };

    const sortReadings = (readings: ReadingData[], order: SortOption): ReadingData[] => {
        const sorted = [...readings];
        sorted.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return order === 'newest' ? dateB - dateA : dateA - dateB;
        });
        return sorted;
    };

    // Filter and sort readings
    const filteredReadings = useMemo(() => {
        let result = [...(backendReadings || [])];

        // Apply date range filter
        result = filterByDateRange(result, dateRange, 'createdAt');

        // Apply spread filter (case-insensitive - backend uses UPPERCASE, frontend uses lowercase)
        if (spreadFilter !== 'all') {
            result = result.filter(r => r.spreadType?.toLowerCase() === spreadFilter.toLowerCase());
        }

        // Apply search filter
        if (searchQuery.trim()) {
            result = result.filter(r => searchMatchesReading(r, searchQuery));
        }

        // Apply sort
        result = sortReadings(result, sortOrder);

        return result;
    }, [backendReadings, spreadFilter, searchQuery, sortOrder, dateRange]);

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        let result = [...(transactions || [])];

        // Apply type filter
        if (transactionTypeFilter !== 'all') {
            if (transactionTypeFilter === 'purchases') {
                result = result.filter(t => t.type === 'PURCHASE');
            } else if (transactionTypeFilter === 'bonuses') {
                result = result.filter(t => ['DAILY_BONUS', 'ACHIEVEMENT', 'REFERRAL_BONUS', 'REFUND'].includes(t.type));
            } else if (transactionTypeFilter === 'readings') {
                result = result.filter(t => ['READING', 'QUESTION'].includes(t.type));
            }
        }

        // Apply date range filter
        result = filterByDateRange(result, transactionDateRange, 'createdAt');

        return result;
    }, [transactions, transactionTypeFilter, transactionDateRange]);

    const totalValidReadings = (backendReadings || []).length;

    // Calculate achievements with progress using the service
    const achievementsWithProgress = useMemo(() => {
        if (!user) return [];

        try {
            const userData = {
                totalReadings: user.totalReadings || 0,
                loginStreak: user.loginStreak || 0,
                unlockedAchievements: user.achievements || [],
                readings: backendReadings || [],
            };

            // Debug achievement status in development (disabled - check console manually if needed)
            // if (process.env.NODE_ENV === 'development') {
            //     debugAchievementStatus(userData);
            // }

            return getAchievementsWithProgress(userData);
        } catch (error) {
            console.error('[UserProfile] Error calculating achievements:', error);
            return ACHIEVEMENTS.map(achievement => ({
                ...achievement,
                isUnlocked: user.achievements?.includes(achievement.id) || false,
                progress: { current: 0, target: 1 },
            }));
        }
    }, [user, backendReadings]);

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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-4 sm:space-y-6">

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
                                <span>{t('UserProfile.tsx.UserProfile.member_since', 'Member since')} {new Date(displayUser.joinDate).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Credits */}
                        <button
                            onClick={() => setIsShopOpen(true)}
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
                            <p className="text-xs sm:text-sm text-slate-500">{t('UserProfile.tsx.UserProfile.day_streak', 'Day Streak')}</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-purple-400 mb-1">
                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-xl sm:text-2xl font-bold">{user?.totalReadings || 0}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500">{t('UserProfile.tsx.UserProfile.readings', 'Readings')}</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-amber-400 mb-1">
                                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-xl sm:text-2xl font-bold">{displayUser.achievements.length}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500">{t('UserProfile.tsx.UserProfile.achievements', 'Achievements')}</p>
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
                            {t('UserProfile.tsx.UserProfile.referral_code', 'Referral Code')}
                        </h3>
                        <p className="text-sm text-slate-400 mb-3">
                            {t('UserProfile.tsx.UserProfile.share_both_get', 'Share & both get +5 credits')}
                        </p>
                        <div className="flex gap-2 mb-3">
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

                        {/* Social Share Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const text = language === 'en'
                                        ? `Join me on MysticOracle and get 5 free credits! Use code: ${displayUser.referralCode}`
                                        : `Rejoignez-moi sur MysticOracle et obtenez 5 crédits gratuits ! Code: ${displayUser.referralCode}`;
                                    window.open(createShareUrl('whatsapp', text), '_blank');
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500
                                           text-white rounded-lg transition-colors duration-200 text-sm"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                WhatsApp
                            </button>
                            <button
                                onClick={() => {
                                    const text = language === 'en'
                                        ? `Join me on MysticOracle! Use code ${displayUser.referralCode} for 5 free credits 🔮✨`
                                        : `Rejoignez-moi sur MysticOracle ! Code ${displayUser.referralCode} pour 5 crédits gratuits 🔮✨`;
                                    window.open(createShareUrl('twitter', text), '_blank');
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-400
                                           text-white rounded-lg transition-colors duration-200 text-sm"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                X (Twitter)
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
                        {t('UserProfile.tsx.UserProfile.achievements_2', 'Achievements')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {achievementsWithProgress.map((achievement) => {
                            // Find unlock date from backend data
                            const userAchievement = user?.achievementsData?.find(
                                (a: any) => a.achievementId === achievement.id
                            );
                            return (
                                <AchievementCard
                                    key={achievement.id}
                                    achievement={achievement}
                                    isUnlocked={achievement.isUnlocked}
                                    progress={achievement.progress}
                                    unlockedAt={userAchievement?.unlockedAt}
                                />
                            );
                        })}
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
                        {t('UserProfile.tsx.UserProfile.reading_history', 'Reading History')}
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
                            dateRange={dateRange}
                            onDateRangeChange={setDateRange}
                            resultCount={filteredReadings.length}
                            totalCount={totalValidReadings}
                        />
                    </div>

                    {/* Reading List - Accordion View */}
                    {isLoadingReadings ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                            <span className="ml-3 text-slate-400">{t('UserProfile.tsx.UserProfile.loading', 'Loading...')}</span>
                        </div>
                    ) : readingsError ? (
                        <p className="text-red-400 text-center py-12">{readingsError}</p>
                    ) : filteredReadings.length === 0 ? (
                        <EmptyState
                            type={totalValidReadings === 0 ? 'readings' : 'filtered'}
                            onAction={totalValidReadings === 0 ? undefined : () => {
                                setSearchQuery('');
                                setSpreadFilter('all');
                                setDateRange('all');
                            }}
                        />
                    ) : (
                        <div className="max-h-[700px] overflow-y-auto pr-1">
                            <ReadingHistoryAccordion
                                readings={filteredReadings}
                                expandedReading={expandedReading}
                                onToggleReading={(id) => setExpandedReading(expandedReading === id ? null : id)}
                            />
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
                        {t('UserProfile.tsx.UserProfile.credit_history', 'Credit History')}
                    </h2>

                    {/* Low Credits Warning */}
                    {displayUser.credits < 3 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-5 p-4 rounded-lg bg-gradient-to-r from-amber-900/30 to-orange-900/30
                                       border border-amber-500/30 flex items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-3">
                                <Coins className="w-5 h-5 text-amber-400" />
                                <div>
                                    <p className="text-sm font-medium text-amber-200">
                                        {t('UserProfile.tsx.UserProfile.low_on_credits', 'Low on Credits')}
                                    </p>
                                    <p className="text-xs text-amber-300/70">
                                        {t('UserProfile.tsx.UserProfile.get_more_credits', 'Get more credits to continue your readings')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsShopOpen(true)}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg
                                           transition-colors duration-200 text-sm font-medium whitespace-nowrap"
                            >
                                {t('UserProfile.tsx.UserProfile.get_credits', 'Get Credits')}
                            </button>
                        </motion.div>
                    )}

                    {/* Filters */}
                    {transactions && transactions.length > 0 && (
                        <div className="mb-5">
                            <TransactionFilters
                                typeFilter={transactionTypeFilter}
                                onTypeFilterChange={setTransactionTypeFilter}
                                dateRange={transactionDateRange}
                                onDateRangeChange={setTransactionDateRange}
                                resultCount={filteredTransactions.length}
                                totalCount={transactions.length}
                            />
                        </div>
                    )}

                    {/* Summary */}
                    {transactions && transactions.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-5">
                            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                <p className="text-sm text-slate-500 mb-1">{t('UserProfile.tsx.UserProfile.purchased', 'Purchased')}</p>
                                <p className="text-xl font-bold text-green-400">+{purchasedCredits}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                <p className="text-sm text-slate-500 mb-1">{t('UserProfile.tsx.UserProfile.earned', 'Earned')}</p>
                                <p className="text-xl font-bold text-amber-400">+{earnedCredits}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                <p className="text-sm text-slate-500 mb-1">{t('UserProfile.tsx.UserProfile.spent', 'Spent')}</p>
                                <p className="text-xl font-bold text-red-400">{spentCredits}</p>
                            </div>
                        </div>
                    )}

                    {/* Transaction List */}
                    {isLoadingTransactions ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                            <span className="ml-3 text-slate-400">{t('UserProfile.tsx.UserProfile.loading_2', 'Loading...')}</span>
                        </div>
                    ) : !transactions || transactions.length === 0 ? (
                        <EmptyState
                            type="transactions"
                        />
                    ) : filteredTransactions.length === 0 ? (
                        <EmptyState
                            type="filtered"
                            onAction={() => {
                                setTransactionTypeFilter('all');
                                setTransactionDateRange('all');
                            }}
                        />
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {filteredTransactions.map((transaction) => (
                                <TransactionItem key={transaction.id} transaction={transaction} />
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
                        {t('UserProfile.tsx.UserProfile.log_out', 'Log Out')}
                    </Button>
                </motion.div>

                {/* Credit Shop Modal */}
                <CreditShop isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
            </div>
        </div>
    );
};

export default UserProfile;

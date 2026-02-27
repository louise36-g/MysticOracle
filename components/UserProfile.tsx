import React, { useState, useMemo, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import Button from './Button';
import CreditShop from './CreditShop';
import Toast from './ui/Toast';
import { Calendar, Coins, LogOut, CheckCircle, Award, History, BookOpen, Loader2, CreditCard, Flame, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENTS } from '../types';
import { ReadingTypeFilter, AchievementCard, TransactionFilters, MonthlyReadingAccordion, MonthlyTransactionAccordion, EmptyState, ReferralSection } from './profile';
import { getAchievementsWithProgress } from '../utils/achievementService';
import { useProfileData } from '../hooks';

// Constants
const SECTION_CLASSES = "bg-slate-900/70 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-4 sm:p-6";
const STAGGER_DELAY = 0.08;

const UserProfile: React.FC = () => {
    const { user, logout, t, language } = useApp();
    const { user: clerkUser, isSignedIn } = useUser();
    const { signOut } = useClerk();

    // UI State
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [expandedReading, setExpandedReading] = useState<string | null>(null);
    const [achievementsExpanded, setAchievementsExpanded] = useState(false);
    const [readingsExpanded, setReadingsExpanded] = useState(false);
    const [creditsExpanded, setCreditsExpanded] = useState(false);

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'bonus' | 'copy' | 'error'; visible: boolean }>({
        message: '',
        type: 'success',
        visible: false,
    });

    // Show toast helper
    const showToast = useCallback((message: string, type: 'success' | 'bonus' | 'copy' | 'error' = 'success') => {
        setToast({ message, type, visible: true });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    // Profile data hook - handles readings and transactions
    const {
        readings: backendReadings,
        filteredReadings,
        isLoadingReadings,
        readingsError,
        readingTypeFilter,
        setReadingTypeFilter,
        transactions,
        filteredTransactions,
        isLoadingTransactions,
        transactionTypeFilter,
        setTransactionTypeFilter,
        purchasedCredits,
        earnedCredits,
        spentCredits,
    } = useProfileData({
        isSignedIn: isSignedIn ?? false,
        language: language as 'en' | 'fr',
        t,
    });

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

    const handleSignOut = async () => {
        // Clear app-specific localStorage
        localStorage.removeItem('celestiarcana_user');
        localStorage.removeItem('celestiarcana_credits');
        localStorage.removeItem('reading_draft');

        // Clear any cached data
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('clerk') || key.startsWith('__clerk')) {
                localStorage.removeItem(key);
            }
        });

        // Clear session storage
        sessionStorage.clear();

        // Sign out from Clerk and clear app state
        await signOut();
        logout();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-4 sm:space-y-6">

                {/* Compact Profile Header */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={SECTION_CLASSES}
                >
                    <div className="flex items-center gap-4">
                        {/* Smaller Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-amber-500 p-[2px]">
                                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                    <span className="text-xl font-heading text-purple-100">
                                        {displayUser.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            {displayUser.emailVerified && (
                                <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-1 border-2 border-slate-900">
                                    <CheckCircle className="w-2.5 h-2.5 text-white" />
                                </div>
                            )}
                        </div>

                        {/* User Info + Inline Stats */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg font-heading text-white truncate">{displayUser.username}</h1>
                                {/* Inline stat pills */}
                                <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                                        <Flame className="w-3 h-3" />{displayUser.loginStreak}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                                        <BookOpen className="w-3 h-3" />{user?.totalReadings || 0}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                                        <Award className="w-3 h-3" />{displayUser.achievements.length}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 truncate">{displayUser.email}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                {t('UserProfile.tsx.UserProfile.member_since', 'Member since')} {new Date(displayUser.joinDate).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Credits Button - Compact */}
                        <button
                            onClick={() => setIsShopOpen(true)}
                            className="shrink-0 bg-slate-800/80 border border-amber-500/30 rounded-lg px-3 py-2
                                       hover:border-amber-400/50 hover:bg-slate-800 transition-all duration-200 group"
                        >
                            <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                                <span className="text-xl font-bold text-amber-400 group-hover:text-amber-300">
                                    {displayUser.credits}
                                </span>
                            </div>
                        </button>
                    </div>
                </motion.section>

                {/* Referral & Invite Section */}
                <ReferralSection
                    referralCode={displayUser.referralCode}
                    language={language as 'en' | 'fr'}
                    animationDelay={STAGGER_DELAY * 2}
                    t={t}
                />

                {/* Collapsible Achievements */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: STAGGER_DELAY * 3 }}
                    className={SECTION_CLASSES}
                >
                    <button
                        onClick={() => setAchievementsExpanded(!achievementsExpanded)}
                        className="w-full flex items-center justify-between py-1"
                    >
                        <h2 className="text-base font-heading text-purple-100 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-400" />
                            {t('UserProfile.tsx.UserProfile.achievements_2', 'Achievements')}
                            <span className="text-xs text-slate-500 font-normal">
                                ({achievementsWithProgress.filter(a => a.isUnlocked).length}/{achievementsWithProgress.length})
                            </span>
                        </h2>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                            achievementsExpanded ? 'rotate-180' : ''
                        }`} />
                    </button>

                    <AnimatePresence>
                        {achievementsExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-4 border-t border-slate-700/40 mt-3">
                                    {achievementsWithProgress.map((achievement) => {
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
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.section>

                {/* Reading History */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: STAGGER_DELAY * 4 }}
                    className={SECTION_CLASSES}
                >
                    <button
                        onClick={() => setReadingsExpanded(!readingsExpanded)}
                        className="w-full flex items-center justify-between py-1"
                    >
                        <h2 className="text-base font-heading text-purple-100 flex items-center gap-2">
                            <History className="w-4 h-4 text-purple-400" />
                            {t('UserProfile.tsx.UserProfile.reading_history', 'Reading History')}
                            <span className="text-xs text-slate-500 font-normal">
                                ({backendReadings.length})
                            </span>
                        </h2>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                            readingsExpanded ? 'rotate-180' : ''
                        }`} />
                    </button>

                    <AnimatePresence>
                        {readingsExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 border-t border-slate-700/40 mt-3">
                                    {/* Filter */}
                                    <div className="flex items-center justify-end mb-4">
                                        <ReadingTypeFilter
                                            value={readingTypeFilter}
                                            onChange={setReadingTypeFilter}
                                        />
                                    </div>

                                    {/* Reading List */}
                                    {isLoadingReadings ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                                            <span className="ml-3 text-slate-400">{t('UserProfile.tsx.UserProfile.loading', 'Loading...')}</span>
                                        </div>
                                    ) : readingsError ? (
                                        <p className="text-red-400 text-center py-12">{readingsError}</p>
                                    ) : filteredReadings.length === 0 ? (
                                        <EmptyState
                                            type={backendReadings.length === 0 ? 'readings' : 'filtered'}
                                            onAction={backendReadings.length === 0 ? undefined : () => setReadingTypeFilter('all')}
                                        />
                                    ) : (
                                        <div className="max-h-[700px] overflow-y-auto pr-1">
                                            <MonthlyReadingAccordion
                                                readings={filteredReadings}
                                                expandedReading={expandedReading}
                                                onToggleReading={(id) => setExpandedReading(expandedReading === id ? null : id)}
                                                filterType={readingTypeFilter}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.section>

                {/* Transaction History */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: STAGGER_DELAY * 5 }}
                    className={SECTION_CLASSES}
                >
                    <button
                        onClick={() => setCreditsExpanded(!creditsExpanded)}
                        className="w-full flex items-center justify-between py-1"
                    >
                        <h2 className="text-base font-heading text-purple-100 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-green-400" />
                            {t('UserProfile.tsx.UserProfile.credit_history', 'Credit History')}
                            {transactions && transactions.length > 0 && (
                                <span className="text-xs text-slate-500 font-normal">
                                    ({transactions.length})
                                </span>
                            )}
                        </h2>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                            creditsExpanded ? 'rotate-180' : ''
                        }`} />
                    </button>

                    <AnimatePresence>
                        {creditsExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 border-t border-slate-700/40 mt-3">
                                    {/* Filter */}
                                    {transactions && transactions.length > 0 && (
                                        <div className="flex items-center justify-end mb-4">
                                            <TransactionFilters
                                                typeFilter={transactionTypeFilter}
                                                onTypeFilterChange={setTransactionTypeFilter}
                                            />
                                        </div>
                                    )}

                                    {/* Low Credits Warning */}
                                    {displayUser.credits < 3 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mb-5 p-3 rounded-lg bg-gradient-to-r from-amber-900/30 to-orange-900/30
                                                       border border-amber-500/30 flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Coins className="w-4 h-4 text-amber-400" />
                                                <p className="text-sm text-amber-200">
                                                    {t('UserProfile.tsx.UserProfile.low_on_credits', 'Low on Credits')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setIsShopOpen(true)}
                                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg
                                                           transition-colors duration-200 text-xs font-medium whitespace-nowrap"
                                            >
                                                {t('UserProfile.tsx.UserProfile.get_credits', 'Get Credits')}
                                            </button>
                                        </motion.div>
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
                                        <EmptyState type="transactions" />
                                    ) : filteredTransactions.length === 0 ? (
                                        <EmptyState
                                            type="filtered"
                                            onAction={() => setTransactionTypeFilter('all')}
                                        />
                                    ) : (
                                        <div className="max-h-[500px] overflow-y-auto pr-1">
                                            <MonthlyTransactionAccordion transactions={filteredTransactions} />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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

                {/* Toast Notifications */}
                <Toast
                    message={toast.message}
                    type={toast.type}
                    isVisible={toast.visible}
                    onClose={hideToast}
                />
            </div>
        </div>
    );
};

export default UserProfile;

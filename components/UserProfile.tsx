import React, { useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import Button from './Button';
import CreditShop from './CreditShop';
import { Flame, Calendar, Coins, Share2, Copy, LogOut, CheckCircle, Award, History, Star, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { ACHIEVEMENTS, SpreadType } from '../types';
import { SPREADS } from '../constants';

const UserProfile: React.FC = () => {
    const { user, language, logout, history } = useApp();
    const { user: clerkUser, isSignedIn } = useUser();
    const { signOut } = useClerk();

    const [isCopied, setIsCopied] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(false);

    if (!isSignedIn) return null;

    // Combine Clerk and AppContext data
    const displayUser = {
        username: user?.username || clerkUser?.username || clerkUser?.firstName || 'User',
        email: user?.email || clerkUser?.primaryEmailAddress?.emailAddress || '',
        credits: user?.credits ?? 10,
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
                {/* Streak Card */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-gradient-to-br from-orange-900/20 to-slate-900 border border-orange-500/20 p-6 rounded-xl flex items-center gap-4"
                >
                    <div className="w-12 h-12 bg-orange-900/30 rounded-full flex items-center justify-center text-orange-500">
                        <Flame className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-heading text-orange-100">
                            {displayUser.loginStreak} {language === 'en' ? 'Day Streak' : 'Jours de Suite'}
                        </h3>
                        <p className="text-sm text-slate-400">
                            {language === 'en'
                                ? 'Come back tomorrow for +2 credits'
                                : 'Revenez demain pour +2 crédits'}
                        </p>
                    </div>
                </motion.div>

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
                        return (
                            <div
                                key={achievement.id}
                                className={`p-3 rounded-lg border text-center transition-all ${
                                    isUnlocked
                                        ? 'bg-amber-900/20 border-amber-500/30'
                                        : 'bg-slate-800/30 border-slate-700/30 opacity-50'
                                }`}
                            >
                                <Star className={`w-6 h-6 mx-auto mb-2 ${isUnlocked ? 'text-amber-400' : 'text-slate-600'}`} />
                                <p className={`text-sm font-medium ${isUnlocked ? 'text-amber-100' : 'text-slate-500'}`}>
                                    {language === 'en' ? achievement.nameEn : achievement.nameFr}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {language === 'en' ? achievement.descriptionEn : achievement.descriptionFr}
                                </p>
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
                {history.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                        {language === 'en' ? 'No readings yet. Start your journey!' : 'Pas encore de lectures. Commencez votre voyage!'}
                    </p>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {history.slice(0, 10).map((reading, index) => {
                            const spread = SPREADS[reading.spreadType as SpreadType];
                            return (
                                <motion.div
                                    key={reading.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-purple-200 font-medium">
                                                {spread ? (language === 'en' ? spread.nameEn : spread.nameFr) : reading.spreadType}
                                            </h3>
                                            {reading.question && (
                                                <p className="text-sm text-slate-400 italic mt-1">"{reading.question}"</p>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500">
                                            {new Date(reading.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="text-xs text-slate-500">
                                            {reading.cards.length} {language === 'en' ? 'cards' : 'cartes'}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
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

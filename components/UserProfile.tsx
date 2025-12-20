
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Button from './Button';
import { User, Flame, Calendar, Coins, Share2, Copy, LogOut, Edit2, Shield, User as UserIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const UserProfile: React.FC = () => {
    const { user, language, logout, updateProfile, verifyEmail, resendVerification } = useApp();
    const [isEditing, setIsEditing] = useState(false);
    const [editUsername, setEditUsername] = useState(user?.username || '');
    const [editEmail, setEditEmail] = useState(user?.email || '');
    const [isCopied, setIsCopied] = useState(false);
    
    // Verification state
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyMsg, setVerifyMsg] = useState('');

    if (!user) return null;

    const copyReferral = () => {
        navigator.clipboard.writeText(user.referralCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSave = async () => {
        if (editUsername !== user.username || editEmail !== user.email) {
            const res = await updateProfile({ username: editUsername, email: editEmail });
            if (res.success) {
                setIsEditing(false);
            } else {
                alert(res.message);
            }
        } else {
            setIsEditing(false);
        }
    };

    const handleVerify = async () => {
        if (!verificationCode) return;
        setIsVerifying(true);
        // For simulation, we check if the input matches the token in memory/db. 
        // In real app, this would be a link click. Here we simulate "Paste code from email".
        // To make it testable in this UI, we will just use the token stored in user object if checking purely locally, 
        // but since we don't expose user.verificationToken to UI easily, let's just simulate the flow:
        // The user would typically click a link which calls verifyEmail(token). 
        // For this manual entry form, we expect them to paste the token.
        
        const res = await verifyEmail(verificationCode);
        setVerifyMsg(res.message || '');
        setIsVerifying(false);
    };

    const handleResend = async () => {
        const res = await resendVerification();
        alert(res.message + ` (Check console for simulated email)`);
    };

    return (
        <div className="max-w-4xl mx-auto p-4 pt-10 pb-20">
            {/* Verification Warning Banner */}
            {!user.emailVerified && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-900/30 border border-amber-500/50 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-heading text-amber-100 text-lg">
                                {language === 'en' ? 'Verification Required' : 'Vérification Requise'}
                            </h3>
                            <p className="text-sm text-slate-300">
                                {language === 'en' 
                                  ? 'Verify your email to unlock referrals, purchase credits, and continue your journey.' 
                                  : 'Vérifiez votre email pour débloquer le parrainage, acheter des crédits et continuer.'}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <input 
                                    type="text" 
                                    placeholder={language === 'en' ? "Paste Token" : "Coller le Jeton"}
                                    className="bg-slate-900 border border-amber-500/30 rounded px-2 py-1 text-sm text-white w-32"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                />
                                <Button size="sm" onClick={handleVerify} isLoading={isVerifying}>
                                    {language === 'en' ? 'Verify' : 'Vérifier'}
                                </Button>
                                <button onClick={handleResend} className="text-xs text-amber-400 hover:underline ml-2">
                                    {language === 'en' ? 'Resend Code' : 'Renvoyer'}
                                </button>
                            </div>
                            {verifyMsg && <p className="text-xs text-green-400 mt-1">{verifyMsg}</p>}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Header Section */}
            <div className="bg-slate-900/80 border border-purple-500/20 rounded-2xl p-6 md:p-8 mb-8 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <UserIcon className="w-48 h-48 text-purple-500" />
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-purple-600 p-1">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                            <span className="text-3xl font-heading text-amber-100">{user.username.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                    
                    <div className="text-center md:text-left flex-1">
                        {isEditing ? (
                            <div className="space-y-2 max-w-sm">
                                <input 
                                    className="w-full bg-slate-950 border border-purple-500/30 rounded p-2 text-white" 
                                    value={editUsername} 
                                    onChange={e => setEditUsername(e.target.value)}
                                />
                                <input 
                                    className="w-full bg-slate-950 border border-purple-500/30 rounded p-2 text-white" 
                                    value={editEmail} 
                                    onChange={e => setEditEmail(e.target.value)}
                                />
                                <div className="flex gap-2 mt-2">
                                    <Button size="sm" onClick={handleSave}>Save</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-heading text-white mb-1 flex items-center justify-center md:justify-start gap-2">
                                    {user.username}
                                    <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-amber-400 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </h1>
                                <p className="text-slate-400">{user.email}</p>
                                <div className="flex items-center justify-center md:justify-start gap-4 mt-4 text-sm text-slate-300">
                                    <span className="flex items-center gap-1 bg-slate-800/50 px-3 py-1 rounded-full">
                                        <Calendar className="w-3 h-3" />
                                        Since {new Date(user.joinDate).toLocaleDateString()}
                                    </span>
                                    <span className={`flex items-center gap-1 bg-slate-800/50 px-3 py-1 rounded-full ${user.emailVerified ? 'text-green-400' : 'text-amber-500'}`}>
                                        {user.emailVerified ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                        {user.emailVerified ? 'Verified' : 'Unverified'}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 min-w-[150px]">
                        <div className="bg-slate-950/50 rounded-lg p-3 text-center border border-purple-500/30">
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Balance</p>
                            <p className="text-2xl font-bold text-amber-400 flex items-center justify-center gap-1">
                                {user.credits} <Coins className="w-5 h-5" />
                            </p>
                        </div>
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            disabled={!user.emailVerified} 
                            title={!user.emailVerified ? "Verify email to purchase" : ""}
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
                            {user.loginStreak} {language === 'en' ? 'Day Streak' : 'Jours de Suite'}
                        </h3>
                        <p className="text-sm text-slate-400">
                            {language === 'en' 
                                ? 'Come back tomorrow for +2 credits' 
                                : 'Revenez demain pour +2 crédits'}
                        </p>
                    </div>
                </motion.div>

                {/* Referral Card (Locked if unverified) */}
                <motion.div 
                    whileHover={user.emailVerified ? { y: -5 } : {}}
                    className={`bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/20 p-6 rounded-xl relative overflow-hidden ${!user.emailVerified ? 'opacity-70 grayscale' : ''}`}
                >
                    {!user.emailVerified && (
                        <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center z-20 backdrop-blur-sm">
                            <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-slate-400" />
                                <span className="text-xs text-slate-300">Verify email to unlock</span>
                            </div>
                        </div>
                    )}

                    <div className="relative z-10">
                         <h3 className="text-lg font-heading text-blue-100 mb-1 flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            {language === 'en' ? 'Referral Code' : 'Code de Parrainage'}
                         </h3>
                         <p className="text-xs text-slate-400 mb-3">
                             {language === 'en' ? 'Share and earn +5 credits each!' : 'Partagez et gagnez +5 crédits chacun !'}
                         </p>
                         <div className="flex gap-2">
                             <div className="bg-slate-950 border border-blue-500/30 rounded px-3 py-1 font-mono text-blue-200 tracking-widest select-all">
                                 {user.referralCode}
                             </div>
                             <button 
                                onClick={copyReferral}
                                disabled={!user.emailVerified}
                                className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded transition-colors disabled:opacity-50"
                             >
                                 {isCopied ? <span className="text-xs font-bold">✓</span> : <Copy className="w-4 h-4" />}
                             </button>
                         </div>
                    </div>
                </motion.div>
            </div>

            {/* Account Actions */}
            <div className="border-t border-white/10 pt-8 flex justify-center">
                 <Button variant="outline" onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-900/30">
                     <LogOut className="w-4 h-4 mr-2" />
                     {language === 'en' ? 'Log Out' : 'Déconnexion'}
                 </Button>
            </div>
        </div>
    );
};

// Helper component for Lock icon
const Lock = ({ className }: { className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

export default UserProfile;

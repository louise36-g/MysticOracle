
import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import Button from './Button';
import { Mail, Lock, User as UserIcon, AlertCircle, Gift, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
    onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
    const { login, register, language } = useApp();
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [referral, setReferral] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (mode === 'login') {
                const res = await login(email, password);
                if (res.success) {
                    onSuccess();
                } else {
                    setError(res.message || "Login failed");
                }
            } else if (mode === 'register') {
                // Basic Validation
                if (password !== confirmPw) {
                    setError(language === 'en' ? "Passwords do not match" : "Les mots de passe ne correspondent pas");
                    setIsLoading(false);
                    return;
                }
                if (password.length < 8) {
                    setError(language === 'en' ? "Password must be at least 8 characters" : "Le mot de passe doit contenir au moins 8 caractères");
                    setIsLoading(false);
                    return;
                }

                const res = await register(username, email, password, referral);
                if (res.success) {
                    onSuccess();
                } else {
                    setError(res.message || "Registration failed");
                }
            } else {
                // Forgot Password Simulation
                setTimeout(() => {
                    alert(language === 'en' ? "Password reset link sent to your email!" : "Lien de réinitialisation envoyé à votre email !");
                    setMode('login');
                    setIsLoading(false);
                }, 1000);
                return;
            }
        } catch (err) {
            setError("An unexpected error occurred");
        }
        setIsLoading(false);
    }, [mode, login, email, password, confirmPw, language, register, username, referral, onSuccess]);

    const togglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const toggleConfirmPwVisibility = useCallback(() => {
        setShowConfirmPw(prev => !prev);
    }, []);

    const switchToRegister = useCallback(() => setMode('register'), []);
    const switchToLogin = useCallback(() => setMode('login'), []);
    const switchToForgot = useCallback(() => setMode('forgot'), []);

    return (
        <div className="w-full max-w-md bg-slate-900/80 p-8 rounded-2xl border border-purple-500/20 backdrop-blur-md shadow-2xl relative overflow-hidden">
             {/* Mystical Background Element */}
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl"></div>
             <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-600/20 rounded-full blur-2xl"></div>

             <div className="relative z-10">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-heading text-amber-100 mb-2">
                        {mode === 'login' && (language === 'en' ? 'Welcome Back' : 'Bon Retour')}
                        {mode === 'register' && (language === 'en' ? 'Begin Your Journey' : 'Commencez Votre Voyage')}
                        {mode === 'forgot' && (language === 'en' ? 'Recover Account' : 'Récupération')}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {mode === 'login' && (language === 'en' ? 'The cards have been waiting for you.' : 'Les cartes vous attendaient.')}
                        {mode === 'register' && (language === 'en' ? 'Create an account to track your destiny.' : 'Créez un compte pour suivre votre destin.')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence mode='wait'>
                        {mode === 'register' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-4 overflow-hidden"
                            >
                                <div className="relative group">
                                    <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                                    <input 
                                        type="text" 
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder={language === 'en' ? "Choose a Username" : "Choisissez un Nom d'utilisateur"}
                                        className="w-full bg-slate-950 border border-purple-900/50 rounded-lg py-3 pl-10 pr-4 text-white focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                        <input 
                            type="email" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Email Address"
                            className="w-full bg-slate-950 border border-purple-900/50 rounded-lg py-3 pl-10 pr-4 text-white focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 outline-none transition-all"
                            required
                        />
                    </div>

                    {mode !== 'forgot' && (
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder={language === 'en' ? "Password" : "Mot de passe"}
                                className="w-full bg-slate-950 border border-purple-900/50 rounded-lg py-3 pl-10 pr-10 text-white focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 outline-none transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-3.5 text-slate-500 hover:text-amber-400 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    )}

                    {mode === 'login' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-purple-900/50 bg-slate-950 text-amber-400 focus:ring-amber-400/50 focus:ring-offset-0 cursor-pointer"
                            />
                            <label htmlFor="rememberMe" className="text-slate-400 text-sm cursor-pointer select-none">
                                {language === 'en' ? 'Remember me' : 'Se souvenir de moi'}
                            </label>
                        </div>
                    )}

                    <AnimatePresence mode='wait'>
                        {mode === 'register' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-4 overflow-hidden"
                            >
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                                    <input
                                        type={showConfirmPw ? "text" : "password"}
                                        value={confirmPw}
                                        onChange={e => setConfirmPw(e.target.value)}
                                        placeholder={language === 'en' ? "Confirm Password" : "Confirmer le mot de passe"}
                                        className="w-full bg-slate-950 border border-purple-900/50 rounded-lg py-3 pl-10 pr-10 text-white focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 outline-none transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleConfirmPwVisibility}
                                        className="absolute right-3 top-3.5 text-slate-500 hover:text-amber-400 transition-colors"
                                    >
                                        {showConfirmPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="relative group">
                                    <Gift className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                                    <input 
                                        type="text" 
                                        value={referral}
                                        onChange={e => setReferral(e.target.value)}
                                        placeholder={language === 'en' ? "Referral Code (Optional)" : "Code de parrainage (Optionnel)"}
                                        className="w-full bg-slate-950 border border-purple-900/50 rounded-lg py-3 pl-10 pr-4 text-white focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 outline-none transition-all"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded p-3 flex items-center gap-2 text-red-200 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                        {mode === 'login' && (language === 'en' ? 'Enter Portal' : 'Entrer')}
                        {mode === 'register' && (language === 'en' ? 'Create Account' : 'Créer un Compte')}
                        {mode === 'forgot' && (language === 'en' ? 'Send Reset Link' : 'Envoyer le lien')}
                    </Button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-2 text-sm text-slate-400">
                    {mode === 'login' ? (
                        <>
                            <p>
                                {language === 'en' ? "New here?" : "Nouveau ici ?"}
                                <button onClick={switchToRegister} className="ml-2 text-amber-400 hover:text-amber-300 font-bold hover:underline">
                                    {language === 'en' ? "Create Account" : "Créer un Compte"}
                                </button>
                            </p>
                            <button onClick={switchToForgot} className="text-slate-500 hover:text-slate-300">
                                {language === 'en' ? "Lost your key?" : "Clé perdue ?"}
                            </button>
                        </>
                    ) : (
                        <p>
                            {language === 'en' ? "Already initialized?" : "Déjà initié ?"}
                            <button onClick={switchToLogin} className="ml-2 text-amber-400 hover:text-amber-300 font-bold hover:underline">
                                {language === 'en' ? "Sign In" : "Se Connecter"}
                            </button>
                        </p>
                    )}
                </div>
             </div>
        </div>
    );
};

export default AuthModal;

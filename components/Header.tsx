import React, { useState, useCallback } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { Moon, Menu, X, Shield, User } from 'lucide-react';
import FlagFR from './icons/FlagFR';
import FlagEN from './icons/FlagEN';
import Button from './Button';

interface HeaderProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  const { user, language, setLanguage, logout } = useApp();
  const { user: clerkUser, isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use Clerk user data if AppContext user not synced yet
  const displayName = user?.username || clerkUser?.username || clerkUser?.firstName || 'User';
  const userCredits = user?.credits ?? 10; // Default 10 credits for new users
  const isAdmin = user?.isAdmin || false;

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  }, [language, setLanguage]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const navigateHome = useCallback(() => onNavigate('home'), [onNavigate]);
  const navigateProfile = useCallback(() => onNavigate('profile'), [onNavigate]);
  const navigateLogin = useCallback(() => onNavigate('login'), [onNavigate]);
  const navigateAdmin = useCallback(() => onNavigate('admin'), [onNavigate]);

  const handleMobileHome = useCallback(() => {
    onNavigate('home');
    setIsMobileMenuOpen(false);
  }, [onNavigate]);

  const handleMobileProfile = useCallback(() => {
    onNavigate('profile');
    setIsMobileMenuOpen(false);
  }, [onNavigate]);

  const handleMobileLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'fr' : 'en');
    setIsMobileMenuOpen(false);
  }, [language, setLanguage]);

  const handleMobileLogout = useCallback(() => {
    logout();
    setIsMobileMenuOpen(false);
  }, [logout]);

  const handleMobileLogin = useCallback(() => {
    onNavigate('login');
    setIsMobileMenuOpen(false);
  }, [onNavigate]);

  const handleMobileAdmin = useCallback(() => {
    onNavigate('admin');
    setIsMobileMenuOpen(false);
  }, [onNavigate]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={navigateHome}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-purple-600 flex items-center justify-center">
            <Moon className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-100 to-purple-200">
            MysticOracle
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={navigateHome}
            className={`text-sm font-medium transition-colors ${currentView === 'home' ? 'text-amber-400' : 'text-slate-300 hover:text-white'}`}
          >
            {language === 'en' ? 'Home' : 'Accueil'}
          </button>
          
          {isSignedIn && (
             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-sm font-bold text-purple-100">{userCredits} {language === 'en' ? 'Credits' : 'Crédits'}</span>
             </div>
          )}

          {isAdmin && (
            <button
              onClick={navigateAdmin}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${currentView === 'admin' ? 'text-amber-400' : 'text-slate-300 hover:text-white'}`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
          )}

          <button
            onClick={toggleLanguage}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
            title="Switch Language"
          >
            {language === 'en' ? <FlagEN className="w-5 h-5" /> : <FlagFR className="w-5 h-5" />}
          </button>

          {/* Clerk Auth Components */}
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="primary" size="sm">
                {language === 'en' ? 'Sign In' : 'Connexion'}
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-4">
              <button
                onClick={navigateProfile}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${currentView === 'profile' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'}`}
              >
                <User className="w-4 h-4" />
                <span className="text-sm">{displayName}</span>
              </button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8'
                  }
                }}
              />
            </div>
          </SignedIn>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-slate-300"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-white/10 p-4 space-y-4">
           {isSignedIn && (
             <div
                className="flex items-center justify-between bg-purple-900/20 p-3 rounded-lg cursor-pointer"
                onClick={handleMobileProfile}
             >
                <span className="text-slate-300 font-bold">{displayName}</span>
                <span className="font-bold text-amber-400">{userCredits} {language === 'en' ? 'Credits' : 'Crédits'}</span>
             </div>
          )}
          <button
            className="block w-full text-left py-2 text-slate-300"
            onClick={handleMobileHome}
          >
            {language === 'en' ? 'Home' : 'Accueil'}
          </button>

          {isSignedIn && (
              <button
                className="block w-full text-left py-2 text-slate-300"
                onClick={handleMobileProfile}
              >
                {language === 'en' ? 'My Account' : 'Mon Compte'}
              </button>
          )}

          {isAdmin && (
              <button
                className="flex items-center gap-2 w-full text-left py-2 text-amber-400"
                onClick={handleMobileAdmin}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
          )}

          <button
            className="flex items-center gap-2 w-full text-left py-2 text-slate-300"
            onClick={handleMobileLanguage}
          >
             {language === 'en' ? (
                <>
                   <FlagFR className="w-5 h-5" />
                   <span>Switch to French</span>
                </>
             ) : (
                <>
                   <FlagEN className="w-5 h-5" />
                   <span>Passer en Anglais</span>
                </>
             )}
          </button>
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="w-full" variant="primary">
                {language === 'en' ? 'Sign In' : 'Connexion'}
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center justify-center py-2">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10'
                  }
                }}
              />
            </div>
          </SignedIn>
        </div>
      )}
    </header>
  );
};

export default Header;

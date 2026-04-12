import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Language, ReadingHistoryItem, SpreadType } from '../types';
import * as api from '../services/api';
import { useTranslation } from './TranslationContext';
import { cleanupDeprecatedStorage } from '../services/storageService';

/**
 * DEV MODE - Controls credit bypass for development
 * Set via VITE_DEV_MODE environment variable
 */
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

/**
 * Language persistence key for localStorage
 */
const LANGUAGE_STORAGE_KEY = 'celestiarcana-language';

/**
 * Detect initial language preference
 * Priority: 1. URL path (/fr/ prefix) 2. localStorage 3. Browser language 4. English default
 */
const detectInitialLanguage = (): Language => {
  // 1. Check URL path first — this is the source of truth for SEO
  try {
    const path = window.location.pathname;
    if (path === '/fr' || path.startsWith('/fr/')) {
      return 'fr';
    }
  } catch {
    // window might not be available (SSR)
  }

  // 2. Check localStorage (user's previous choice)
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') {
      return saved;
    }
  } catch {
    // localStorage might not be available
  }

  // 3. Check browser language - if French, use French
  try {
    const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
    if (browserLang.toLowerCase().startsWith('fr')) {
      return 'fr';
    }
  } catch {
    // navigator might not be available (SSR)
  }

  // 4. Default to English
  return 'en';
};

interface User {
  id: string;
  email: string;
  username: string;
  credits: number;
  totalReadings: number;
  totalQuestionsAsked: number;
  loginStreak: number;
  lastLoginDate: string;
  welcomeCompleted: boolean;
  referralCode: string;
  referredById: string | null;
  isAdmin: boolean;
  language: Language;
  achievements: string[];
  achievementsData?: Array<{ achievementId: string; unlockedAt: string }>;
  spreadsUsed: SpreadType[];
  hasUsedFreeInterpretation: boolean;
}

interface AchievementNotification {
  id: string;
  nameEn: string;
  nameFr: string;
  reward: number;
}

interface AppContextType {
  user: User | null;
  language: Language;
  isLoading: boolean;
  setLanguage: (lang: Language) => void;

  // Translations
  t: (key: string, fallback?: string, variables?: Record<string, string | number>) => string;
  refreshTranslationsCache: () => Promise<void>;

  // No more login/register - Clerk handles that
  logout: () => void;
  refreshUser: () => Promise<void>;

  // Credits
  addCredits: (amount: number) => void;
  canAfford: (amount: number) => boolean; // Validates only - backend does actual deduction

  // History
  history: ReadingHistoryItem[];
  addToHistory: (item: ReadingHistoryItem) => void;

  // Achievements
  achievementNotifications: AchievementNotification[];
  clearAchievementNotifications: () => void;

  // Daily bonus
  claimDailyBonus: () => Promise<{ success: boolean; amount: number }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const { isSignedIn, getToken } = useAuth();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { setLanguage: setTranslationLanguage, t, refresh: refreshTranslationContext } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null);
  // Keep ref in sync so setLanguage can read current user without it being a dep
  userRef.current = user;
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [achievementNotifications, setAchievementNotifications] = useState<AchievementNotification[]>([]);

  // Clean up deprecated localStorage keys on mount + sync HTML lang attribute
  useEffect(() => {
    cleanupDeprecatedStorage();
    document.documentElement.lang = language;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Delegate to TranslationContext's refresh (useful after admin mutations)
  const refreshTranslationsCache = useCallback(async () => {
    await refreshTranslationContext();
  }, [refreshTranslationContext]);

  // Fetch user from backend
  const fetchUserFromBackend = useCallback(async (skipHistory = false) => {
    if (!isSignedIn) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const profile = await api.fetchUserProfile(token);

      // Map API response to frontend User type
      const mappedUser: User = {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        credits: profile.credits,
        totalReadings: profile.totalReadings,
        totalQuestionsAsked: profile.totalQuestions,
        loginStreak: profile.loginStreak,
        lastLoginDate: profile.lastLoginDate,
        welcomeCompleted: profile.welcomeCompleted,
        referralCode: profile.referralCode,
        referredById: profile.referredById || null,
        isAdmin: profile.isAdmin,
        language: profile.language as Language,
        achievements: (profile.achievements || []).map((a: any) => a.achievementId),
        achievementsData: (profile.achievements || []).map((a: any) => ({
          achievementId: a.achievementId,
          unlockedAt: a.unlockedAt,
        })),
        spreadsUsed: [], // TODO: Add to backend if needed
        hasUsedFreeInterpretation: profile.hasUsedFreeInterpretation ?? false,
      };

      setUser(mappedUser);
      // Don't override language from user profile — URL path is the source of truth.
      // LanguageLayout sets the correct language based on /fr/ prefix.

      // Fetch reading history (skip on refreshUser calls to speed up credit updates)
      if (!skipHistory) {
        const result = await api.fetchUserReadings(token);
        const readings = result.data || [];
        const mappedHistory: ReadingHistoryItem[] = readings.map(r => ({
          id: r.id,
          date: r.createdAt,
          spreadType: r.spreadType as SpreadType,
          question: r.question,
          cards: r.cards,
          interpretation: r.interpretation,
        }));
        setHistory(mappedHistory);
      }

    } catch (error) {
      console.error('[AppContext] Error fetching user from backend:', error);
      // User might not exist in our DB yet (Clerk webhook will create them)
      // Only create a temporary user object if we don't already have user data
      // This prevents overwriting valid credits (e.g., 76) with fallback (3) on refresh failures
      if (clerkUser) {
        const username = clerkUser.username || clerkUser.firstName || 'User';
        const adminUsernames = ['mooks', 'louise', 'louisegriffin'];

        setUser((prevUser) => {
          // If we already have user data with credits, preserve it instead of overwriting
          if (prevUser && prevUser.id === clerkUser.id && prevUser.credits !== undefined) {
            return prevUser;
          }

          // Only use fallback for brand new users (no existing data)
          return {
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            username,
            credits: 3,
            totalReadings: 0,
            totalQuestionsAsked: 0,
            loginStreak: 1,
            lastLoginDate: new Date().toISOString(),
            welcomeCompleted: false,
            referralCode: '',
            referredById: null,
            isAdmin: adminUsernames.includes(username.toLowerCase()),
            language: 'en',
            achievements: [],
            spreadsUsed: [],
            hasUsedFreeInterpretation: false,
          };
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken, clerkUser]);

  // Fetch user when auth state changes
  useEffect(() => {
    if (clerkLoaded) {
      fetchUserFromBackend();
    }
  }, [clerkLoaded, isSignedIn, fetchUserFromBackend]);

  const refreshUser = useCallback(async () => {
    // Skip history fetch for faster credit updates
    await fetchUserFromBackend(true);
  }, [fetchUserFromBackend]);

  // Note: Referral code auto-redeem removed — handled by WelcomeModal (first step).
  // Stored codes from ?ref= URLs are picked up and pre-populated by WelcomeModal.

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    setTranslationLanguage(lang);
    document.documentElement.lang = lang;

    // Always save to localStorage (for anonymous users and as backup)
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      // localStorage might not be available
    }

    // For logged-in users, also save to database.
    // Use userRef so this callback doesn't depend on `user` state —
    // that would cause LanguageLayout's effect to re-fire on every profile load.
    if (userRef.current && isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          await api.updateUserProfile(token, { language: lang });
          // Only update state if language actually changed, to avoid unnecessary re-renders
          setUser(prev => {
            if (!prev || prev.language === lang) return prev;
            return { ...prev, language: lang };
          });
          userRef.current = userRef.current ? { ...userRef.current, language: lang } : null;
        }
      } catch (error) {
        console.error('Error updating language:', error);
      }
    }
  }, [isSignedIn, getToken, setTranslationLanguage]);

  const logout = useCallback(() => {
    // Clerk handles the actual logout, we just clear local state
    setUser(null);
    setHistory([]);
  }, []);

  // Credits
  const addCredits = useCallback((amount: number) => {
    setUser(prev => prev ? { ...prev, credits: prev.credits + amount } : null);
  }, []);

  // Renamed from deductCredits - this only validates, doesn't deduct
  // Backend handles actual credit deduction when reading is saved
  const canAfford = useCallback((amount: number): boolean => {
    if (DEV_MODE) return true;
    if (!user) return false;
    return user.credits >= amount;
  }, [user]);

  // History - local state only, backend save handled by component
  const addToHistory = useCallback((item: ReadingHistoryItem) => {
    // Add to local state only - backend save is handled by ActiveReading.startReading
    // which has access to properly formatted card data and correct credit costs
    setHistory(prev => [item, ...prev]);
    setUser(prev => prev ? {
      ...prev,
      totalReadings: prev.totalReadings + 1
    } : null);
  }, []);

  // Daily Bonus
  const claimDailyBonus = useCallback(async (): Promise<{ success: boolean; amount: number }> => {
    if (!isSignedIn) return { success: false, amount: 0 };

    try {
      const token = await getToken();
      if (!token) return { success: false, amount: 0 };

      const result = await api.claimDailyBonus(token);

      if (result.success) {
        setUser(prev => prev ? {
          ...prev,
          credits: result.newBalance,
          loginStreak: result.streak,
          lastLoginDate: new Date().toISOString()
        } : null);
        return { success: true, amount: result.creditsAwarded };
      }

      return { success: false, amount: 0 };
    } catch (error) {
      console.error('Error claiming daily bonus:', error);
      return { success: false, amount: 0 };
    }
  }, [isSignedIn, getToken]);

  const clearAchievementNotifications = useCallback(() => {
    setAchievementNotifications([]);
  }, []);

  const contextValue = useMemo<AppContextType>(() => ({
    user,
    language,
    isLoading,
    setLanguage,
    t,
    refreshTranslationsCache,
    logout,
    refreshUser,
    addCredits,
    canAfford,
    history,
    addToHistory,
    achievementNotifications,
    clearAchievementNotifications,
    claimDailyBonus,
  }), [
    user, language, isLoading, setLanguage, t, refreshTranslationsCache,
    logout, refreshUser, addCredits, canAfford, history, addToHistory,
    achievementNotifications, clearAchievementNotifications, claimDailyBonus,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

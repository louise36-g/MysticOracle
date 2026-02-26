import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Language, ReadingHistoryItem, SpreadType } from '../types';
import * as api from '../services/api';
import { loadTranslations, translate, refreshTranslations } from '../services/translationService';
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
 * Priority: 1. localStorage (user's previous choice) 2. Browser language 3. English default
 */
const detectInitialLanguage = (): Language => {
  // 1. Check localStorage first (user's previous choice)
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') {
      return saved;
    }
  } catch (e) {
    // localStorage might not be available
  }

  // 2. Check browser language - if French, use French
  try {
    const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
    if (browserLang.toLowerCase().startsWith('fr')) {
      return 'fr';
    }
  } catch (e) {
    // navigator might not be available (SSR)
  }

  // 3. Default to English
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
  t: (key: string, fallback?: string) => string;
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

  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [achievementNotifications, setAchievementNotifications] = useState<AchievementNotification[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  // Clean up deprecated localStorage keys on mount
  useEffect(() => {
    cleanupDeprecatedStorage();
  }, []);

  // Load translations when language changes
  useEffect(() => {
    let isMounted = true;

    const loadLang = async () => {
      const data = await loadTranslations(language);
      if (isMounted) {
        setTranslations(data);
      }
    };

    loadLang();

    // Listen for background translation updates
    const handleTranslationsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ language: Language }>;
      if (customEvent.detail.language === language && isMounted) {
        loadTranslations(language).then(setTranslations);
      }
    };

    window.addEventListener('translations-updated', handleTranslationsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('translations-updated', handleTranslationsUpdated);
    };
  }, [language]);

  // Translation function
  const t = useCallback(
    (key: string, fallback?: string): string => {
      return translate(translations, key, fallback);
    },
    [translations]
  );

  // Refresh translations cache (useful after admin mutations)
  const refreshTranslationsCache = useCallback(async () => {
    const data = await refreshTranslations(language);
    setTranslations(data);
  }, [language]);

  // Fetch user from backend
  const fetchUserFromBackend = useCallback(async (skipHistory = false) => {
    console.log('[AppContext] fetchUserFromBackend called, isSignedIn:', isSignedIn);
    if (!isSignedIn) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        console.log('[AppContext] No token available');
        setUser(null);
        setIsLoading(false);
        return;
      }

      console.log('[AppContext] Fetching user profile...');
      const profile = await api.fetchUserProfile(token);
      console.log('[AppContext] Profile received, credits:', profile.credits);

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
      };

      console.log('[AppContext] Setting user with credits:', mappedUser.credits);
      setUser(mappedUser);
      setLanguageState(mappedUser.language);

      // Sync user's language preference to localStorage
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, mappedUser.language);
      } catch (e) {
        // localStorage might not be available
      }

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
            console.log('[AppContext] Preserving existing user data, credits:', prevUser.credits);
            return prevUser;
          }

          // Only use fallback for brand new users (no existing data)
          console.log('[AppContext] Creating temporary user (new user, webhook pending)');
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
    console.log('[AppContext] refreshUser called');
    // Skip history fetch for faster credit updates
    await fetchUserFromBackend(true);
    console.log('[AppContext] refreshUser completed');
  }, [fetchUserFromBackend]);

  // Note: Referral code auto-redeem removed — handled by WelcomeModal (first step).
  // Stored codes from ?ref= URLs are picked up and pre-populated by WelcomeModal.

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);

    // Always save to localStorage (for anonymous users and as backup)
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      // localStorage might not be available
    }

    // For logged-in users, also save to database
    if (user && isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          await api.updateUserProfile(token, { language: lang });
          setUser(prev => prev ? { ...prev, language: lang } : null);
        }
      } catch (error) {
        console.error('Error updating language:', error);
      }
    }
  }, [user, isSignedIn, getToken]);

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

  return (
    <AppContext.Provider value={{
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
    }}>
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

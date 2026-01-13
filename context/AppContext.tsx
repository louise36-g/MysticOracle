import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Language, ReadingHistoryItem, SpreadType } from '../types';
import * as api from '../services/apiService';
import { loadTranslations, translate, refreshTranslations } from '../services/translationService';
import { cleanupDeprecatedStorage } from '../services/storageService';

/**
 * DEV MODE - Controls credit bypass for development
 * Set via VITE_DEV_MODE environment variable
 */
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

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
  isAdmin: boolean;
  language: Language;
  achievements: string[];
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
  deductCredits: (amount: number) => Promise<{ success: boolean; message?: string }>;

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
  const [language, setLanguageState] = useState<Language>('en');
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
        isAdmin: profile.isAdmin,
        language: profile.language as Language,
        achievements: (profile.achievements || []).map(a => a.achievementId),
        spreadsUsed: [], // TODO: Add to backend if needed
      };

      console.log('[AppContext] Setting user with credits:', mappedUser.credits);
      setUser(mappedUser);
      setLanguageState(mappedUser.language);

      // Fetch reading history (skip on refreshUser calls to speed up credit updates)
      if (!skipHistory) {
        const { readings } = await api.fetchUserReadings(token);
        const mappedHistory: ReadingHistoryItem[] = (readings || []).map(r => ({
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
      // Create a temporary user object from Clerk data
      if (clerkUser) {
        const username = clerkUser.username || clerkUser.firstName || 'User';
        const adminUsernames = ['mooks', 'louise', 'louisegriffin'];
        setUser({
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
          isAdmin: adminUsernames.includes(username.toLowerCase()),
          language: 'en',
          achievements: [],
          spreadsUsed: [],
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

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
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

  const deductCredits = useCallback(async (amount: number): Promise<{ success: boolean; message?: string }> => {
    // DEV MODE: Bypass all credit checks
    if (DEV_MODE) {
      return { success: true };
    }

    if (!user) return { success: false, message: 'User not found' };

    if (user.credits < amount) {
      return {
        success: false,
        message: language === 'en' ? 'Insufficient credits' : 'Crédits insuffisants'
      };
    }

    // Credits are validated here but actually deducted on the backend when saving the reading
    // This prevents double-deduction and ensures credits are only spent for completed readings
    return { success: true };
  }, [user, language]);

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
      deductCredits,
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

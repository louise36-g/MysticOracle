import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Language, ReadingHistoryItem, AccountStatus, ACHIEVEMENTS, SpreadType } from '../types';
import { storageService } from '../services/storageService';
import { generateSecureToken, generateReferralCode, hashPassword, verifyPassword, generateVerificationToken } from '../utils/crypto';
import { isFreeEmailProvider } from '../utils/validation';

/**
 * DEV MODE for client Mooks - Set to false for production
 * When true:
 * - Unlimited readings (no credit deduction)
 * - Auto-verified email (no token required)
 * - No verification gates
 * - All features unlocked
 */
const DEV_MODE = true;

// All spread types for achievement tracking
const ALL_SPREAD_TYPES = Object.values(SpreadType);

interface AuthResponse {
  success: boolean;
  message?: string;
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

  // Auth
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (username: string, email: string, password: string, referralCode?: string) => Promise<AuthResponse>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<AuthResponse>;
  changePassword: (oldPw: string, newPw: string) => Promise<AuthResponse>;
  verifyEmail: (token: string) => Promise<AuthResponse>;
  resendVerification: () => Promise<AuthResponse>;

  // Credits & Game
  addCredits: (amount: number) => void;
  deductCredits: (amount: number) => { success: boolean; message?: string };
  incrementQuestionsAsked: () => void;

  // History & Achievements
  history: ReadingHistoryItem[];
  addToHistory: (item: ReadingHistoryItem) => void;
  checkAchievements: (spreadType?: SpreadType) => AchievementNotification[];
  claimDailyBonus: () => { success: boolean; amount: number };
  shareReading: () => { success: boolean; credits: number };
  achievementNotifications: AchievementNotification[];
  clearAchievementNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [achievementNotifications, setAchievementNotifications] = useState<AchievementNotification[]>([]);

  // Update user in both state and storage
  const updateUser = useCallback((updatedUser: User) => {
    storageService.updateUser(updatedUser);
    setUser(updatedUser);
    storageService.setActiveSession(updatedUser);
  }, []);

  // Check and apply daily login bonus
  const checkDailyBonus = useCallback((currentUser: User) => {
    const today = new Date().toDateString();
    const lastLogin = new Date(currentUser.lastLoginDate).toDateString();

    if (today !== lastLogin) {
      let newStreak = currentUser.loginStreak;

      // Check if consecutive day (yesterday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (new Date(currentUser.lastLoginDate).toDateString() === yesterday.toDateString()) {
        newStreak += 1;
      } else {
        newStreak = 1; // Reset streak
      }

      // Award Credits
      let bonusCredits = 2; // Base daily bonus
      if (newStreak % 7 === 0) bonusCredits += 5; // Weekly streak bonus

      const updatedUser: User = {
        ...currentUser,
        credits: currentUser.credits + bonusCredits,
        lastLoginDate: new Date().toISOString(),
        loginStreak: newStreak
      };

      updateUser(updatedUser);
      console.log(`Daily bonus! +${bonusCredits} credits.`);
    }
  }, [updateUser]);

  // Load session on mount
  useEffect(() => {
    const storedUser = storageService.getActiveSession();
    if (storedUser) {
      // Refresh user data from DB to get latest credits/streak
      const freshUser = storageService.getUserById(storedUser.id);
      if (freshUser) {
        setUser(freshUser);
        setLanguageState(freshUser.language);
        checkDailyBonus(freshUser);

        // Load history specific to user
        const userHistory = storageService.getReadingsByUserId(freshUser.id);
        setHistory(userHistory);
      }
    }
    setIsLoading(false);
  }, [checkDailyBonus]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (user) {
      const updated = { ...user, language: lang };
      updateUser(updated);
    }
  }, [user, updateUser]);

  // --- Auth Functions ---

  const register = useCallback(async (
    username: string,
    email: string,
    password: string,
    referralCode?: string
  ): Promise<AuthResponse> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate delay

    // Rate Limiting Check
    const canRegister = storageService.canRegister();
    if (!canRegister.allowed) {
      setIsLoading(false);
      return {
        success: false,
        message: language === 'en'
          ? canRegister.reason || "Registration limit reached."
          : "Limite d'inscription atteinte."
      };
    }

    const users = storageService.getUsers();

    // Check duplicates
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      setIsLoading(false);
      return {
        success: false,
        message: language === 'en' ? "Email already registered." : "Email déjà enregistré."
      };
    }
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      setIsLoading(false);
      return {
        success: false,
        message: language === 'en' ? "Username already taken." : "Nom d'utilisateur déjà pris."
      };
    }

    // Reputation Analysis
    const isFreeEmail = isFreeEmailProvider(email);
    let accountStatus: AccountStatus = 'active';

    // Flag if rapid creation
    const recentCount = storageService.getRecentRegistrationCount(2 * 60 * 1000);
    if (recentCount > 0) {
      accountStatus = 'flagged';
    }

    // Referral Logic
    let initialCredits = 10; // Welcome Bonus
    let referrerId: string | undefined = undefined;

    if (referralCode) {
      const referrer = storageService.getUserByReferralCode(referralCode);
      if (referrer && referrer.emailVerified && referrer.accountStatus === 'active') {
        // Award referrer bonus
        const updatedReferrer = { ...referrer, credits: referrer.credits + 5 };
        storageService.updateUser(updatedReferrer);
        initialCredits += 5; // New User Referral Bonus
        referrerId = referrer.id;
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verification = generateVerificationToken();

    // Create User
    const newUser: User = {
      id: 'u_' + Date.now() + '_' + generateSecureToken(4),
      username,
      email,
      passwordHash,
      credits: initialCredits,
      totalQuestionsAsked: 0,
      totalReadings: 0,
      referralCode: generateReferralCode(username),
      referredBy: referrerId,
      joinDate: new Date().toISOString(),
      lastLoginDate: new Date().toISOString(),
      loginStreak: 1,
      language: language,
      emailVerified: DEV_MODE || username.toLowerCase() === 'mooks', // Auto-verify for DEV_MODE or Mooks
      accountStatus: accountStatus,
      verificationToken: (DEV_MODE || username.toLowerCase() === 'mooks') ? undefined : verification.token,
      verificationTokenExpires: (DEV_MODE || username.toLowerCase() === 'mooks') ? undefined : verification.expiresAt,
      verificationAttempts: 0,
      achievements: [],
      spreadsUsed: [],
      isAdmin: username.toLowerCase() === 'mooks' // Auto-admin for Mooks
    };

    // Save
    storageService.addUser(newUser);
    storageService.logDeviceRegistration();

    // Auto-login
    setUser(newUser);
    storageService.setActiveSession(newUser);

    setIsLoading(false);
    return { success: true };
  }, [language]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const foundUser = storageService.getUserByEmail(email);

    if (foundUser) {
      const isValidPassword = await verifyPassword(password, foundUser.passwordHash);

      if (!isValidPassword) {
        setIsLoading(false);
        return { success: false, message: "Invalid email or password." };
      }

      if (foundUser.accountStatus === 'suspended') {
        setIsLoading(false);
        return { success: false, message: "Account suspended. Please contact support." };
      }

      checkDailyBonus(foundUser);

      // Refresh user from storage after bonus check
      let refreshedUser = storageService.getUserById(foundUser.id);
      if (refreshedUser) {
        // Auto-upgrade Mooks to admin if not already
        if (refreshedUser.username.toLowerCase() === 'mooks' && !refreshedUser.isAdmin) {
          refreshedUser = { ...refreshedUser, isAdmin: true };
          storageService.updateUser(refreshedUser);
        }
        setUser(refreshedUser);
        storageService.setActiveSession(refreshedUser);
      }

      setIsLoading(false);
      return { success: true };
    } else {
      setIsLoading(false);
      return { success: false, message: "Invalid email or password." };
    }
  }, [checkDailyBonus]);

  const logout = useCallback(() => {
    setUser(null);
    storageService.setActiveSession(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>): Promise<AuthResponse> => {
    if (!user) return { success: false, message: "Not logged in" };

    const users = storageService.getUsers();

    if (data.email && data.email !== user.email) {
      if (users.some(u => u.email.toLowerCase() === data.email!.toLowerCase())) {
        return { success: false, message: "Email already taken" };
      }
      // Reset verification if email changes
      const verification = generateVerificationToken();
      data.emailVerified = false;
      data.verificationToken = verification.token;
      data.verificationTokenExpires = verification.expiresAt;
    }

    if (data.username && data.username !== user.username) {
      if (users.some(u => u.username.toLowerCase() === data.username!.toLowerCase())) {
        return { success: false, message: "Username already taken" };
      }
    }

    const updatedUser = { ...user, ...data };
    updateUser(updatedUser);
    return { success: true };
  }, [user, updateUser]);

  const changePassword = useCallback(async (oldPw: string, newPw: string): Promise<AuthResponse> => {
    if (!user) return { success: false, message: "Not logged in" };

    const isValid = await verifyPassword(oldPw, user.passwordHash);
    if (!isValid) return { success: false, message: "Incorrect current password" };

    const newHash = await hashPassword(newPw);
    const updatedUser = { ...user, passwordHash: newHash };
    updateUser(updatedUser);
    return { success: true };
  }, [user, updateUser]);

  // --- Verification Logic ---

  const verifyEmail = useCallback(async (token: string): Promise<AuthResponse> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));

    if (!user) {
      setIsLoading(false);
      return { success: false, message: "Not logged in" };
    }

    if (user.verificationToken !== token) {
      setIsLoading(false);
      return { success: false, message: "Invalid token" };
    }

    if (user.verificationTokenExpires && Date.now() > user.verificationTokenExpires) {
      setIsLoading(false);
      return { success: false, message: "Token expired" };
    }

    // Success - Verify and Award Bonus
    const updatedUser: User = {
      ...user,
      emailVerified: true,
      verificationToken: undefined,
      credits: user.credits + 2 // Verification bonus
    };
    updateUser(updatedUser);

    setIsLoading(false);
    return { success: true, message: "Email verified! +2 Credits" };
  }, [user, updateUser]);

  const resendVerification = useCallback(async (): Promise<AuthResponse> => {
    if (!user) return { success: false, message: "Not logged in" };

    const now = Date.now();
    let attempts = user.verificationAttempts;

    // Reset attempts if > 24h since last attempt
    if (user.lastVerificationAttempt && (now - user.lastVerificationAttempt > 24 * 60 * 60 * 1000)) {
      attempts = 0;
    }

    if (attempts >= 3) {
      return { success: false, message: "Too many attempts. Try again later." };
    }

    const verification = generateVerificationToken();
    const updatedUser: User = {
      ...user,
      verificationToken: verification.token,
      verificationTokenExpires: verification.expiresAt,
      verificationAttempts: attempts + 1,
      lastVerificationAttempt: now
    };

    updateUser(updatedUser);

    // Simulate Email Sending
    console.log(`[SIMULATION] Email Sent to ${user.email}. Link: /verify?token=${verification.token}`);

    return { success: true, message: "Verification code sent" };
  }, [user, updateUser]);

  // --- Credits & Game Logic ---

  const addCredits = useCallback((amount: number) => {
    if (!user) return;
    const updatedUser = { ...user, credits: user.credits + amount };
    updateUser(updatedUser);
  }, [user, updateUser]);

  const deductCredits = useCallback((amount: number): { success: boolean; message?: string } => {
    // DEV MODE: Bypass all credit and verification checks
    if (DEV_MODE) {
      return { success: true };
    }

    if (!user) return { success: false, message: "User not found" };

    // Gating: Unverified users (skipped in DEV_MODE above)
    if (!user.emailVerified) {
      if (history.length >= 1) {
        return {
          success: false,
          message: language === 'en'
            ? "Verification required. You have used your one-time free reading."
            : "Vérification requise. Vous avez utilisé votre lecture gratuite unique."
        };
      }
    }

    if (user.credits < amount) {
      return {
        success: false,
        message: language === 'en' ? "Insufficient credits" : "Crédits insuffisants"
      };
    }

    const updatedUser = { ...user, credits: user.credits - amount };
    updateUser(updatedUser);
    return { success: true };
  }, [user, history.length, language, updateUser]);

  const incrementQuestionsAsked = useCallback(() => {
    if (!user) return;
    const updatedUser = { ...user, totalQuestionsAsked: (user.totalQuestionsAsked || 0) + 1 };
    updateUser(updatedUser);
  }, [user, updateUser]);

  const addToHistory = useCallback((item: ReadingHistoryItem) => {
    if (!user) return;
    const itemWithUser = { ...item, userId: user.id };
    storageService.addReading(itemWithUser);
    setHistory(prev => [item, ...prev]);

    // Update total readings count and spreads used
    const newSpreadsUsed = user.spreadsUsed.includes(item.spreadType)
      ? user.spreadsUsed
      : [...user.spreadsUsed, item.spreadType];

    const updatedUser = {
      ...user,
      totalReadings: (user.totalReadings || 0) + 1,
      spreadsUsed: newSpreadsUsed
    };
    updateUser(updatedUser);
  }, [user, updateUser]);

  // Check and award achievements
  const checkAchievements = useCallback((spreadType?: SpreadType): AchievementNotification[] => {
    if (!user) return [];

    const newAchievements: AchievementNotification[] = [];
    const userAchievements = user.achievements || [];
    let totalCreditsEarned = 0;
    const achievementsToAdd: string[] = [];

    // First reading
    if (!userAchievements.includes('first_reading') && (user.totalReadings || 0) >= 1) {
      const achievement = ACHIEVEMENTS.find(a => a.id === 'first_reading');
      if (achievement) {
        newAchievements.push({ ...achievement, reward: achievement.reward });
        achievementsToAdd.push('first_reading');
        totalCreditsEarned += achievement.reward;
      }
    }

    // 5 readings
    if (!userAchievements.includes('five_readings') && (user.totalReadings || 0) >= 5) {
      const achievement = ACHIEVEMENTS.find(a => a.id === 'five_readings');
      if (achievement) {
        newAchievements.push({ ...achievement, reward: achievement.reward });
        achievementsToAdd.push('five_readings');
        totalCreditsEarned += achievement.reward;
      }
    }

    // 10 readings
    if (!userAchievements.includes('ten_readings') && (user.totalReadings || 0) >= 10) {
      const achievement = ACHIEVEMENTS.find(a => a.id === 'ten_readings');
      if (achievement) {
        newAchievements.push({ ...achievement, reward: achievement.reward });
        achievementsToAdd.push('ten_readings');
        totalCreditsEarned += achievement.reward;
      }
    }

    // Celtic Cross master
    if (!userAchievements.includes('celtic_master') && spreadType === SpreadType.CELTIC_CROSS) {
      const achievement = ACHIEVEMENTS.find(a => a.id === 'celtic_master');
      if (achievement) {
        newAchievements.push({ ...achievement, reward: achievement.reward });
        achievementsToAdd.push('celtic_master');
        totalCreditsEarned += achievement.reward;
      }
    }

    // All spreads explorer
    const spreadsUsed = user.spreadsUsed || [];
    if (!userAchievements.includes('all_spreads') && ALL_SPREAD_TYPES.every(s => spreadsUsed.includes(s))) {
      const achievement = ACHIEVEMENTS.find(a => a.id === 'all_spreads');
      if (achievement) {
        newAchievements.push({ ...achievement, reward: achievement.reward });
        achievementsToAdd.push('all_spreads');
        totalCreditsEarned += achievement.reward;
      }
    }

    // Week streak
    if (!userAchievements.includes('week_streak') && user.loginStreak >= 7) {
      const achievement = ACHIEVEMENTS.find(a => a.id === 'week_streak');
      if (achievement) {
        newAchievements.push({ ...achievement, reward: achievement.reward });
        achievementsToAdd.push('week_streak');
        totalCreditsEarned += achievement.reward;
      }
    }

    // Update user with new achievements and credits
    if (achievementsToAdd.length > 0) {
      const updatedUser = {
        ...user,
        achievements: [...userAchievements, ...achievementsToAdd],
        credits: user.credits + totalCreditsEarned
      };
      updateUser(updatedUser);
      setAchievementNotifications(prev => [...prev, ...newAchievements]);
    }

    return newAchievements;
  }, [user, updateUser]);

  // Claim daily bonus (can be called explicitly)
  const claimDailyBonus = useCallback((): { success: boolean; amount: number } => {
    if (!user) return { success: false, amount: 0 };

    const today = new Date().toDateString();
    const lastLogin = new Date(user.lastLoginDate).toDateString();

    if (today === lastLogin) {
      return { success: false, amount: 0 }; // Already claimed today
    }

    let bonusCredits = 2;
    if (user.loginStreak % 7 === 0) bonusCredits += 5;

    const updatedUser = {
      ...user,
      credits: user.credits + bonusCredits,
      lastLoginDate: new Date().toISOString()
    };
    updateUser(updatedUser);

    return { success: true, amount: bonusCredits };
  }, [user, updateUser]);

  // Share reading for bonus credits
  const shareReading = useCallback((): { success: boolean; credits: number } => {
    if (!user) return { success: false, credits: 0 };

    const userAchievements = user.achievements || [];

    // First time sharing gives achievement bonus
    if (!userAchievements.includes('share_reading')) {
      const achievement = ACHIEVEMENTS.find(a => a.id === 'share_reading');
      const reward = achievement?.reward || 3;

      const updatedUser = {
        ...user,
        credits: user.credits + reward,
        achievements: [...userAchievements, 'share_reading']
      };
      updateUser(updatedUser);

      if (achievement) {
        setAchievementNotifications(prev => [...prev, { ...achievement, reward }]);
      }

      return { success: true, credits: reward };
    }

    // Subsequent shares give 1 credit (max once per day could be added)
    const updatedUser = {
      ...user,
      credits: user.credits + 1
    };
    updateUser(updatedUser);

    return { success: true, credits: 1 };
  }, [user, updateUser]);

  const clearAchievementNotifications = useCallback(() => {
    setAchievementNotifications([]);
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      language,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      verifyEmail,
      resendVerification,
      setLanguage,
      addCredits,
      deductCredits,
      incrementQuestionsAsked,
      history,
      addToHistory,
      checkAchievements,
      claimDailyBonus,
      shareReading,
      achievementNotifications,
      clearAchievementNotifications
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

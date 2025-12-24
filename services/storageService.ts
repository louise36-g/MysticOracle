import { User, ReadingHistoryItem, AccountStatus } from '../types';

// Storage keys
const STORAGE_KEYS = {
  USERS_DB: 'mystic_users_db',
  READINGS_DB: 'mystic_readings_db',
  ACTIVE_SESSION: 'mystic_active_session',
  DEVICE_REG_LOG: 'mystic_device_reg_log',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

interface DeviceRegistration {
  timestamp: number;
}

/**
 * Type-safe localStorage wrapper with JSON parsing
 */
class StorageService {
  private get<T>(key: StorageKey, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      console.error(`Failed to parse storage key: ${key}`);
      return defaultValue;
    }
  }

  private set<T>(key: StorageKey, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set storage key: ${key}`, error);
    }
  }

  // Users DB
  getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS_DB, []);
  }

  saveUsers(users: User[]): void {
    this.set(STORAGE_KEYS.USERS_DB, users);
  }

  getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserByReferralCode(code: string): User | undefined {
    return this.getUsers().find(u => u.referralCode === code);
  }

  updateUser(updatedUser: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      this.saveUsers(users);
    }
  }

  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  }

  // Active Session
  getActiveSession(): User | null {
    return this.get<User | null>(STORAGE_KEYS.ACTIVE_SESSION, null);
  }

  setActiveSession(user: User | null): void {
    if (user) {
      this.set(STORAGE_KEYS.ACTIVE_SESSION, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    }
  }

  // Readings DB
  getReadings(): ReadingHistoryItem[] {
    return this.get<ReadingHistoryItem[]>(STORAGE_KEYS.READINGS_DB, []);
  }

  getReadingsByUserId(userId: string): ReadingHistoryItem[] {
    return this.getReadings().filter(r => r.userId === userId);
  }

  addReading(reading: ReadingHistoryItem): void {
    const readings = this.getReadings();
    readings.push(reading);
    this.set(STORAGE_KEYS.READINGS_DB, readings);
  }

  // Device Registration Log (for rate limiting)
  getDeviceRegistrations(): DeviceRegistration[] {
    return this.get<DeviceRegistration[]>(STORAGE_KEYS.DEVICE_REG_LOG, []);
  }

  logDeviceRegistration(): void {
    const logs = this.getDeviceRegistrations();
    logs.push({ timestamp: Date.now() });
    this.set(STORAGE_KEYS.DEVICE_REG_LOG, logs);
  }

  getRecentRegistrationCount(withinMs: number): number {
    const logs = this.getDeviceRegistrations();
    const cutoff = Date.now() - withinMs;
    return logs.filter(log => log.timestamp > cutoff).length;
  }

  // Rate limiting checks
  canRegister(): { allowed: boolean; reason?: string } {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const MONTH_MS = 30 * DAY_MS;

    const dailyCount = this.getRecentRegistrationCount(DAY_MS);
    const monthlyCount = this.getRecentRegistrationCount(MONTH_MS);

    if (dailyCount >= 3) {
      return { allowed: false, reason: 'Daily registration limit reached' };
    }
    if (monthlyCount >= 10) {
      return { allowed: false, reason: 'Monthly registration limit reached' };
    }
    return { allowed: true };
  }
}

export const storageService = new StorageService();
export { STORAGE_KEYS };

// Horoscope caching functions
const getHoroscopeCacheKey = (sign: string, language: string): string => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `horoscope_${sign}_${language}_${today}`;
};

export const getCachedHoroscope = (sign: string, language: string): string | null => {
  const key = getHoroscopeCacheKey(sign, language);
  return localStorage.getItem(key);
};

export const cacheHoroscope = (sign: string, language: string, horoscope: string): void => {
  const key = getHoroscopeCacheKey(sign, language);
  localStorage.setItem(key, horoscope);
};

// Horoscope follow-up Q&A caching
interface CachedQA {
  question: string;
  answer: string;
}

const getHoroscopeQACacheKey = (sign: string, language: string): string => {
  const today = new Date().toISOString().split('T')[0];
  return `horoscope_qa_${sign}_${language}_${today}`;
};

export const getCachedHoroscopeQA = (sign: string, language: string): CachedQA[] => {
  const key = getHoroscopeQACacheKey(sign, language);
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

export const findCachedAnswer = (sign: string, language: string, question: string): string | null => {
  const cached = getCachedHoroscopeQA(sign, language);
  const normalizedQuestion = question.trim().toLowerCase();
  const match = cached.find(qa => qa.question.trim().toLowerCase() === normalizedQuestion);
  return match?.answer || null;
};

export const cacheHoroscopeQA = (sign: string, language: string, question: string, answer: string): void => {
  const key = getHoroscopeQACacheKey(sign, language);
  const cached = getCachedHoroscopeQA(sign, language);
  cached.push({ question: question.trim(), answer });
  localStorage.setItem(key, JSON.stringify(cached));
};

// Horoscope question counter for billing (2 questions = 1 credit)
const getHoroscopeQuestionCountKey = (): string => {
  const today = new Date().toISOString().split('T')[0];
  return `horoscope_question_count_${today}`;
};

export const getHoroscopeQuestionCount = (): number => {
  const key = getHoroscopeQuestionCountKey();
  const count = localStorage.getItem(key);
  return count ? parseInt(count, 10) : 0;
};

export const incrementHoroscopeQuestionCount = (): number => {
  const key = getHoroscopeQuestionCountKey();
  const newCount = getHoroscopeQuestionCount() + 1;
  localStorage.setItem(key, newCount.toString());
  return newCount;
};

// Check if next question will cost a credit (every 2nd question costs 1 credit)
export const willNextQuestionCostCredit = (): boolean => {
  const count = getHoroscopeQuestionCount();
  // Questions 2, 4, 6, 8... cost a credit (when count+1 is even)
  return (count + 1) % 2 === 0;
};

// Admin functions
export const getAllUsers = (): User[] => {
  return storageService.getUsers();
};

export const getAllReadings = (): ReadingHistoryItem[] => {
  return storageService.getReadings();
};

export const updateUserStatus = (userId: string, status: AccountStatus): boolean => {
  const users = storageService.getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return false;

  users[userIndex].accountStatus = status;
  storageService.saveUsers(users);
  return true;
};

export const adjustUserCredits = (userId: string, amount: number): boolean => {
  const users = storageService.getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return false;

  users[userIndex].credits = Math.max(0, users[userIndex].credits + amount);
  storageService.saveUsers(users);
  return true;
};

export const setUserAdmin = (userId: string, isAdmin: boolean): boolean => {
  const users = storageService.getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return false;

  users[userIndex].isAdmin = isAdmin;
  storageService.saveUsers(users);
  return true;
};

export const getAdminStats = () => {
  const users = storageService.getUsers();
  const readings = storageService.getReadings();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  const activeUsers = users.filter(u => {
    const lastLogin = new Date(u.lastLoginDate).getTime();
    return now - lastLogin < weekMs;
  });

  const newUsersToday = users.filter(u => {
    const joinDate = new Date(u.joinDate).getTime();
    return now - joinDate < dayMs;
  });

  const newUsersThisWeek = users.filter(u => {
    const joinDate = new Date(u.joinDate).getTime();
    return now - joinDate < weekMs;
  });

  const totalCredits = users.reduce((sum, u) => sum + u.credits, 0);
  const totalReadings = readings.length;

  const readingsBySpread: Record<string, number> = {};
  readings.forEach(r => {
    readingsBySpread[r.spreadType] = (readingsBySpread[r.spreadType] || 0) + 1;
  });

  return {
    totalUsers: users.length,
    activeUsers: activeUsers.length,
    newUsersToday: newUsersToday.length,
    newUsersThisWeek: newUsersThisWeek.length,
    totalCredits,
    totalReadings,
    readingsBySpread
  };
};

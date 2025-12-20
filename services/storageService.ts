import { User, ReadingHistoryItem } from '../types';

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

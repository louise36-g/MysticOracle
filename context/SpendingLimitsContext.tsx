import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';

// Types
export interface SpendingLimits {
  daily: number | null;    // null = no limit
  weekly: number | null;
  monthly: number | null;
}

export interface SpendingRecord {
  amount: number;
  timestamp: number;
  packageName: string;
}

export interface SelfExclusion {
  enabled: boolean;
  endDate: number | null;  // Unix timestamp
  reason?: string;
}

export interface PendingLimitChange {
  field: keyof SpendingLimits;
  newValue: number | null;
  requestedAt: number;
  effectiveAt: number;  // 24 hours after request
}

interface SpendingLimitsState {
  limits: SpendingLimits;
  spending: SpendingRecord[];
  selfExclusion: SelfExclusion;
  pendingChanges: PendingLimitChange[];
  consecutivePurchases: number;
  lastPurchaseTime: number | null;
}

interface SpendingLimitsContextType {
  // State
  limits: SpendingLimits;
  selfExclusion: SelfExclusion;
  pendingChanges: PendingLimitChange[];

  // Computed values
  spentToday: number;
  spentThisWeek: number;
  spentThisMonth: number;

  // Limit checks
  canSpend: (amount: number) => { allowed: boolean; reason?: string; warningLevel?: 'soft' | 'hard' };
  getLimitStatus: () => { daily: LimitStatus; weekly: LimitStatus; monthly: LimitStatus };

  // Actions
  setLimit: (field: keyof SpendingLimits, value: number | null) => { success: boolean; message: string; effectiveAt?: number };
  recordPurchase: (amount: number, packageName: string) => void;

  // Self-exclusion
  enableSelfExclusion: (days: number, reason?: string) => void;
  disableSelfExclusion: () => { success: boolean; message: string };

  // Take a break
  shouldShowBreakReminder: boolean;
  dismissBreakReminder: () => void;

  // Export
  exportSpendingHistory: () => string;

  // Problem gambling resources
  getProblemGamblingResources: () => { name: string; url: string; phone?: string }[];
}

interface LimitStatus {
  limit: number | null;
  spent: number;
  remaining: number | null;
  percentage: number;
  warning: 'none' | 'soft' | 'hard';
}

const SpendingLimitsContext = createContext<SpendingLimitsContextType | null>(null);

const STORAGE_KEY_PREFIX = 'mysticoracle_spending_';
const COOLING_OFF_HOURS = 24;
const CONSECUTIVE_PURCHASE_THRESHOLD = 3;
const CONSECUTIVE_PURCHASE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// Helper to get start of day/week/month
const getStartOfDay = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
};

const getStartOfWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  now.setDate(diff);
  now.setHours(0, 0, 0, 0);
  return now.getTime();
};

const getStartOfMonth = () => {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now.getTime();
};

const DEFAULT_STATE: SpendingLimitsState = {
  limits: { daily: null, weekly: null, monthly: null },
  spending: [],
  selfExclusion: { enabled: false, endDate: null },
  pendingChanges: [],
  consecutivePurchases: 0,
  lastPurchaseTime: null,
};

export const SpendingLimitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [state, setState] = useState<SpendingLimitsState>(DEFAULT_STATE);
  const [breakReminderDismissed, setBreakReminderDismissed] = useState(false);

  const storageKey = user?.id ? `${STORAGE_KEY_PREFIX}${user.id}` : null;

  // Load state from localStorage
  useEffect(() => {
    if (!storageKey) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean up old spending records (keep last 90 days)
        const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        parsed.spending = (parsed.spending || []).filter(
          (r: SpendingRecord) => r.timestamp > ninetyDaysAgo
        );
        // Apply any pending changes that are now effective
        const now = Date.now();
        const stillPending: PendingLimitChange[] = [];
        (parsed.pendingChanges || []).forEach((change: PendingLimitChange) => {
          if (change.effectiveAt <= now) {
            parsed.limits[change.field] = change.newValue;
          } else {
            stillPending.push(change);
          }
        });
        parsed.pendingChanges = stillPending;

        setState({ ...DEFAULT_STATE, ...parsed });
      }
    } catch (e) {
      console.error('Failed to load spending limits:', e);
    }
  }, [storageKey]);

  // Save state to localStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save spending limits:', e);
    }
  }, [state, storageKey]);

  // Calculate spending totals
  const spentToday = useMemo(() => {
    const startOfDay = getStartOfDay();
    return state.spending
      .filter(r => r.timestamp >= startOfDay)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [state.spending]);

  const spentThisWeek = useMemo(() => {
    const startOfWeek = getStartOfWeek();
    return state.spending
      .filter(r => r.timestamp >= startOfWeek)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [state.spending]);

  const spentThisMonth = useMemo(() => {
    const startOfMonth = getStartOfMonth();
    return state.spending
      .filter(r => r.timestamp >= startOfMonth)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [state.spending]);

  // Check if self-exclusion is active
  const isSelfExclusionActive = useMemo(() => {
    if (!state.selfExclusion.enabled) return false;
    if (!state.selfExclusion.endDate) return true; // Indefinite
    return Date.now() < state.selfExclusion.endDate;
  }, [state.selfExclusion]);

  // Get limit status for each period
  const getLimitStatus = useCallback((): { daily: LimitStatus; weekly: LimitStatus; monthly: LimitStatus } => {
    const calculate = (limit: number | null, spent: number): LimitStatus => {
      if (limit === null) {
        return { limit: null, spent, remaining: null, percentage: 0, warning: 'none' };
      }
      const remaining = Math.max(0, limit - spent);
      const percentage = (spent / limit) * 100;
      let warning: 'none' | 'soft' | 'hard' = 'none';
      if (percentage >= 100) warning = 'hard';
      else if (percentage >= 80) warning = 'soft';
      return { limit, spent, remaining, percentage, warning };
    };

    return {
      daily: calculate(state.limits.daily, spentToday),
      weekly: calculate(state.limits.weekly, spentThisWeek),
      monthly: calculate(state.limits.monthly, spentThisMonth),
    };
  }, [state.limits, spentToday, spentThisWeek, spentThisMonth]);

  // Check if a purchase is allowed
  const canSpend = useCallback((amount: number): { allowed: boolean; reason?: string; warningLevel?: 'soft' | 'hard' } => {
    // Check self-exclusion first
    if (isSelfExclusionActive) {
      const endDate = state.selfExclusion.endDate
        ? new Date(state.selfExclusion.endDate).toLocaleDateString()
        : 'indefinitely';
      return {
        allowed: false,
        reason: `Purchases are paused until ${endDate}. This is a self-imposed break to help you enjoy responsibly.`,
        warningLevel: 'hard'
      };
    }

    // Check each limit
    const status = getLimitStatus();

    // Daily limit
    if (status.daily.limit !== null && spentToday + amount > status.daily.limit) {
      return {
        allowed: false,
        reason: `This purchase would exceed your daily limit of €${status.daily.limit}. You've spent €${spentToday.toFixed(2)} today.`,
        warningLevel: 'hard'
      };
    }

    // Weekly limit
    if (status.weekly.limit !== null && spentThisWeek + amount > status.weekly.limit) {
      return {
        allowed: false,
        reason: `This purchase would exceed your weekly limit of €${status.weekly.limit}. You've spent €${spentThisWeek.toFixed(2)} this week.`,
        warningLevel: 'hard'
      };
    }

    // Monthly limit
    if (status.monthly.limit !== null && spentThisMonth + amount > status.monthly.limit) {
      return {
        allowed: false,
        reason: `This purchase would exceed your monthly limit of €${status.monthly.limit}. You've spent €${spentThisMonth.toFixed(2)} this month.`,
        warningLevel: 'hard'
      };
    }

    // Soft warnings (approaching limits)
    const warnings: string[] = [];
    if (status.daily.warning === 'soft') {
      warnings.push(`You're approaching your daily limit (${status.daily.percentage.toFixed(0)}% used)`);
    }
    if (status.weekly.warning === 'soft') {
      warnings.push(`You're approaching your weekly limit (${status.weekly.percentage.toFixed(0)}% used)`);
    }
    if (status.monthly.warning === 'soft') {
      warnings.push(`You're approaching your monthly limit (${status.monthly.percentage.toFixed(0)}% used)`);
    }

    if (warnings.length > 0) {
      return {
        allowed: true,
        reason: warnings.join('. '),
        warningLevel: 'soft'
      };
    }

    return { allowed: true };
  }, [isSelfExclusionActive, state.selfExclusion.endDate, getLimitStatus, spentToday, spentThisWeek, spentThisMonth]);

  // Set a spending limit (takes effect immediately)
  const setLimit = useCallback((field: keyof SpendingLimits, value: number | null): { success: boolean; message: string; effectiveAt?: number } => {
    // All limit changes take effect immediately
    setState(prev => ({
      ...prev,
      limits: { ...prev.limits, [field]: value },
      // Clear any pending changes for this field
      pendingChanges: prev.pendingChanges.filter(c => c.field !== field)
    }));

    return {
      success: true,
      message: value === null
        ? `${field.charAt(0).toUpperCase() + field.slice(1)} limit removed.`
        : `${field.charAt(0).toUpperCase() + field.slice(1)} limit set to €${value}.`
    };
  }, []);

  // Record a purchase
  const recordPurchase = useCallback((amount: number, packageName: string) => {
    const now = Date.now();

    setState(prev => {
      // Check if this is a consecutive purchase
      let consecutivePurchases = prev.consecutivePurchases;
      if (prev.lastPurchaseTime && (now - prev.lastPurchaseTime) < CONSECUTIVE_PURCHASE_WINDOW_MS) {
        consecutivePurchases++;
      } else {
        consecutivePurchases = 1;
      }

      return {
        ...prev,
        spending: [...prev.spending, { amount, timestamp: now, packageName }],
        consecutivePurchases,
        lastPurchaseTime: now
      };
    });
  }, []);

  // Self-exclusion
  const enableSelfExclusion = useCallback((days: number, reason?: string) => {
    const endDate = days > 0 ? Date.now() + (days * 24 * 60 * 60 * 1000) : null;
    setState(prev => ({
      ...prev,
      selfExclusion: { enabled: true, endDate, reason }
    }));
  }, []);

  const disableSelfExclusion = useCallback((): { success: boolean; message: string } => {
    // Self-exclusion cannot be disabled early - it must expire naturally
    if (state.selfExclusion.endDate && Date.now() < state.selfExclusion.endDate) {
      const remainingDays = Math.ceil((state.selfExclusion.endDate - Date.now()) / (24 * 60 * 60 * 1000));
      return {
        success: false,
        message: `Your self-exclusion period cannot be ended early. ${remainingDays} day(s) remaining. This waiting period helps you maintain the break you chose.`
      };
    }

    setState(prev => ({
      ...prev,
      selfExclusion: { enabled: false, endDate: null }
    }));
    return { success: true, message: 'Self-exclusion period has ended.' };
  }, [state.selfExclusion.endDate]);

  // Break reminder logic
  const shouldShowBreakReminder = useMemo(() => {
    if (breakReminderDismissed) return false;
    return state.consecutivePurchases >= CONSECUTIVE_PURCHASE_THRESHOLD;
  }, [state.consecutivePurchases, breakReminderDismissed]);

  const dismissBreakReminder = useCallback(() => {
    setBreakReminderDismissed(true);
    // Reset after 1 hour
    setTimeout(() => setBreakReminderDismissed(false), 60 * 60 * 1000);
  }, []);

  // Export spending history
  const exportSpendingHistory = useCallback((): string => {
    const data = {
      exportDate: new Date().toISOString(),
      limits: state.limits,
      spending: state.spending.map(r => ({
        ...r,
        date: new Date(r.timestamp).toISOString()
      })),
      totals: {
        today: spentToday,
        thisWeek: spentThisWeek,
        thisMonth: spentThisMonth,
        allTime: state.spending.reduce((sum, r) => sum + r.amount, 0)
      }
    };
    return JSON.stringify(data, null, 2);
  }, [state.limits, state.spending, spentToday, spentThisWeek, spentThisMonth]);

  // Problem gambling resources
  const getProblemGamblingResources = useCallback(() => [
    { name: 'Joueurs Info Service (France)', url: 'https://www.joueurs-info-service.fr', phone: '09 74 75 13 13' },
    { name: 'GamCare (UK)', url: 'https://www.gamcare.org.uk', phone: '0808 8020 133' },
    { name: 'National Council on Problem Gambling (US)', url: 'https://www.ncpgambling.org', phone: '1-800-522-4700' },
    { name: 'Gambling Help Online (Australia)', url: 'https://www.gamblinghelponline.org.au', phone: '1800 858 858' },
  ], []);

  const value: SpendingLimitsContextType = {
    limits: state.limits,
    selfExclusion: state.selfExclusion,
    pendingChanges: state.pendingChanges,
    spentToday,
    spentThisWeek,
    spentThisMonth,
    canSpend,
    getLimitStatus,
    setLimit,
    recordPurchase,
    enableSelfExclusion,
    disableSelfExclusion,
    shouldShowBreakReminder,
    dismissBreakReminder,
    exportSpendingHistory,
    getProblemGamblingResources,
  };

  return (
    <SpendingLimitsContext.Provider value={value}>
      {children}
    </SpendingLimitsContext.Provider>
  );
};

export const useSpendingLimits = (): SpendingLimitsContextType => {
  const context = useContext(SpendingLimitsContext);
  if (!context) {
    throw new Error('useSpendingLimits must be used within a SpendingLimitsProvider');
  }
  return context;
};

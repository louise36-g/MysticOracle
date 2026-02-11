/**
 * useProfileData Hook
 * Manages profile data fetching: readings and transactions
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  fetchUnifiedReadings,
  fetchUserTransactions,
  UnifiedReadingData,
  Transaction,
} from '../services/api';

export type ReadingFilterType = 'all' | 'this_week' | 'last_week' | 'this_month' | 'last_month';
export type TransactionTypeFilter = 'all' | 'purchases' | 'bonuses' | 'readings';

interface UseProfileDataParams {
  isSignedIn: boolean;
  language: 'en' | 'fr';
  t: (key: string, fallback: string) => string;
}

interface UseProfileDataReturn {
  // Readings
  readings: UnifiedReadingData[];
  filteredReadings: UnifiedReadingData[];
  isLoadingReadings: boolean;
  readingsError: string | null;
  readingTypeFilter: ReadingFilterType;
  setReadingTypeFilter: (filter: ReadingFilterType) => void;

  // Transactions
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  isLoadingTransactions: boolean;
  transactionTypeFilter: TransactionTypeFilter;
  setTransactionTypeFilter: (filter: TransactionTypeFilter) => void;

  // Transaction summary
  purchasedCredits: number;
  earnedCredits: number;
  spentCredits: number;

  // Actions
  refetchData: () => Promise<void>;
}

export function useProfileData({
  isSignedIn,
  language,
  t,
}: UseProfileDataParams): UseProfileDataReturn {
  const { getToken } = useAuth();

  // Data state
  const [readings, setReadings] = useState<UnifiedReadingData[]>([]);
  const [isLoadingReadings, setIsLoadingReadings] = useState(true);
  const [readingsError, setReadingsError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  // Filter state
  const [readingTypeFilter, setReadingTypeFilter] = useState<ReadingFilterType>('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionTypeFilter>('all');

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!isSignedIn) return;

    setIsLoadingReadings(true);
    setIsLoadingTransactions(true);
    setReadingsError(null);

    const token = await getToken();
    if (!token) {
      setIsLoadingReadings(false);
      setIsLoadingTransactions(false);
      return;
    }

    // Fetch readings and transactions independently
    fetchUnifiedReadings(token, { limit: 100, offset: 0, type: 'all', language })
      .then(result => setReadings(result.data || []))
      .catch(error => {
        console.error('Failed to load readings:', error);
        setReadingsError(t('UserProfile.tsx.UserProfile.failed_to_load', 'Failed to load history'));
      })
      .finally(() => setIsLoadingReadings(false));

    fetchUserTransactions(token, 100, 0)
      .then(result => setTransactions(result.data || []))
      .catch(error => console.error('Failed to load transactions:', error))
      .finally(() => setIsLoadingTransactions(false));
  }, [isSignedIn, getToken, t, language]);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper to get date range boundaries
  const getDateRange = (filter: ReadingFilterType): { start: Date; end: Date } | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Adjust to make Monday the start of the week
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    switch (filter) {
      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() + mondayOffset);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return { start: startOfWeek, end: endOfWeek };
      }
      case 'last_week': {
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() + mondayOffset - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);
        return { start: startOfLastWeek, end: endOfLastWeek };
      }
      case 'this_month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return { start: startOfMonth, end: endOfMonth };
      }
      case 'last_month': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfLastMonth, end: endOfLastMonth };
      }
      default:
        return null;
    }
  };

  // Filter readings by date range
  const filteredReadings = useMemo(() => {
    if (!readings || readings.length === 0) return [];

    if (readingTypeFilter === 'all') {
      return readings;
    }

    const range = getDateRange(readingTypeFilter);
    if (!range) return readings;

    return readings.filter(r => {
      const readingDate = new Date(r.createdAt);
      return readingDate >= range.start && readingDate < range.end;
    });
  }, [readings, readingTypeFilter]);

  // Filter transactions by type
  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    if (transactionTypeFilter === 'all') return transactions;

    if (transactionTypeFilter === 'purchases') {
      return transactions.filter(t => t.type === 'PURCHASE');
    }
    if (transactionTypeFilter === 'bonuses') {
      return transactions.filter(t =>
        ['DAILY_BONUS', 'ACHIEVEMENT', 'REFERRAL_BONUS', 'REFUND'].includes(t.type)
      );
    }
    if (transactionTypeFilter === 'readings') {
      return transactions.filter(t => ['READING', 'QUESTION'].includes(t.type));
    }

    return transactions;
  }, [transactions, transactionTypeFilter]);

  // Transaction summary calculations
  const purchasedCredits = useMemo(() =>
    (transactions || [])
      .filter(t => t.type === 'PURCHASE')
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const earnedCredits = useMemo(() =>
    (transactions || [])
      .filter(t => ['DAILY_BONUS', 'ACHIEVEMENT', 'REFERRAL_BONUS', 'REFUND'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const spentCredits = useMemo(() =>
    (transactions || [])
      .filter(t => ['READING', 'QUESTION'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  return {
    // Readings
    readings,
    filteredReadings,
    isLoadingReadings,
    readingsError,
    readingTypeFilter,
    setReadingTypeFilter,

    // Transactions
    transactions,
    filteredTransactions,
    isLoadingTransactions,
    transactionTypeFilter,
    setTransactionTypeFilter,

    // Summary
    purchasedCredits,
    earnedCredits,
    spentCredits,

    // Actions
    refetchData: fetchData,
  };
}

export default useProfileData;

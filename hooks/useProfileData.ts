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

export type ReadingFilterType = 'all' | 'single' | 'three_card' | 'five_card' | 'horseshoe' | 'celtic_cross' | 'birth_cards';
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
  const [readingTypeFilter, setReadingTypeFilter] = useState<ReadingFilterType>('single');
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

  // Filter readings by type
  const filteredReadings = useMemo(() => {
    if (!readings || readings.length === 0) return [];

    if (readingTypeFilter === 'all') {
      return readings;
    }

    if (readingTypeFilter === 'birth_cards') {
      return readings.filter(r =>
        r.readingType === 'birth_synthesis' ||
        r.readingType === 'personal_year' ||
        r.readingType === 'threshold'
      );
    }

    // Filter to specific tarot spread type
    return readings.filter(r =>
      r.readingType === 'tarot' &&
      r.spreadType?.toLowerCase() === readingTypeFilter
    );
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

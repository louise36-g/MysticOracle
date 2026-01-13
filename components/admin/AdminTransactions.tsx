import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { fetchAdminTransactions, fetchRevenueMonths } from '../../services/apiService';
import { ChevronLeft, ChevronRight, Filter, Download, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface TransactionWithUser {
  id: string;
  type: string;
  amount: number;
  description: string;
  paymentProvider?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  currency?: string;
  createdAt: string;
  user: { username: string; email: string };
}

interface RevenueMonth {
  year: number;
  month: number;
  label: string;
}

const AdminTransactions: React.FC = () => {
  const { t } = useApp();
  const { getToken } = useAuth();

  const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');

  // Revenue export
  const [availableMonths, setAvailableMonths] = useState<RevenueMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) throw new Error('No token');

        // Load transactions
        const result = await fetchAdminTransactions(token, {
          page,
          limit: 25,
          type: typeFilter || undefined
        });

        setTransactions(result.transactions);
        setTotalPages(result.pagination.totalPages);
        setTotal(result.pagination.total);

        // Load available months for export
        const monthsResult = await fetchRevenueMonths(token);
        setAvailableMonths(monthsResult.months || []);
        if (monthsResult.months?.length > 0 && !selectedMonth) {
          setSelectedMonth(`${monthsResult.months[0].year}-${monthsResult.months[0].month}`);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getToken, page, typeFilter]);

  const handleExport = async () => {
    if (!selectedMonth) return;

    try {
      setExporting(true);
      const token = await getToken();
      if (!token) throw new Error('No token');

      const [year, month] = selectedMonth.split('-').map(Number);
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '');

      const response = await fetch(`${API_URL}/api/admin/revenue/export?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mysticoracle-revenue-${year}-${String(month).padStart(2, '0')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PURCHASE': return 'text-green-400 bg-green-500/10';
      case 'READING': return 'text-blue-400 bg-blue-500/10';
      case 'QUESTION': return 'text-cyan-400 bg-cyan-500/10';
      case 'DAILY_BONUS': return 'text-amber-400 bg-amber-500/10';
      case 'ACHIEVEMENT': return 'text-purple-400 bg-purple-500/10';
      case 'REFERRAL_BONUS': return 'text-pink-400 bg-pink-500/10';
      case 'REFUND': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getAmountDisplay = (tx: TransactionWithUser) => {
    if (tx.type === 'PURCHASE' && tx.paymentAmount) {
      return `€${Number(tx.paymentAmount).toFixed(2)}`;
    }
    const prefix = tx.amount >= 0 ? '+' : '';
    return `${prefix}${tx.amount} cr`;
  };

  return (
    <div>
      {/* Revenue Export Section */}
      <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-green-200 font-medium">
                {t('admin.AdminTransactions.revenue_export', 'Revenue Export')}
              </h3>
              <p className="text-green-400/60 text-sm">
                {t('admin.AdminTransactions.download_monthly_revenue', 'Download monthly revenue reports')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-slate-200 text-sm focus:outline-none"
              >
                {availableMonths.length === 0 ? (
                  <option value="">{t('admin.AdminTransactions.no_data_available', 'No data available')}</option>
                ) : (
                  availableMonths.map((m) => (
                    <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                      {m.label}
                    </option>
                  ))
                )}
              </select>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting || !selectedMonth || availableMonths.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {t('admin.AdminTransactions.export_csv', 'Export CSV')}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200 focus:outline-none"
        >
          <option value="">{t('admin.AdminTransactions.all_types', 'All Types')}</option>
          <option value="PURCHASE">{t('admin.AdminTransactions.purchases', 'Purchases')}</option>
          <option value="READING">{t('admin.AdminTransactions.readings', 'Readings')}</option>
          <option value="DAILY_BONUS">{t('admin.AdminTransactions.daily_bonus', 'Daily Bonus')}</option>
          <option value="ACHIEVEMENT">{t('admin.AdminTransactions.achievements', 'Achievements')}</option>
          <option value="REFERRAL_BONUS">{t('admin.AdminTransactions.referrals', 'Referrals')}</option>
          <option value="REFUND">{t('admin.AdminTransactions.refunds', 'Refunds')}</option>
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300 mb-4">
          {error}
        </div>
      )}

      {!loading && (
        <>
          <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-500/20 bg-slate-800/50">
                    <th className="text-left p-4 text-slate-300 font-medium">{t('admin.AdminTransactions.date', 'Date')}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{t('admin.AdminTransactions.user', 'User')}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{t('admin.AdminTransactions.type', 'Type')}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{t('admin.AdminTransactions.description', 'Description')}</th>
                    <th className="text-right p-4 text-slate-300 font-medium">{t('admin.AdminTransactions.amount', 'Amount')}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{t('admin.AdminTransactions.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {t('admin.AdminTransactions.no_transactions_found', 'No transactions found')}
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, index) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-purple-500/10 hover:bg-slate-800/30"
                      >
                        <td className="p-4 text-slate-400 text-sm">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <p className="text-slate-200 text-sm">{tx.user.username}</p>
                          <p className="text-slate-500 text-xs">{tx.user.email}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(tx.type)}`}>
                            {tx.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300 text-sm max-w-[200px] truncate">
                          {tx.description}
                        </td>
                        <td className="p-4 text-right">
                          <span className={tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {getAmountDisplay(tx)}
                          </span>
                        </td>
                        <td className="p-4">
                          {tx.paymentStatus && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tx.paymentStatus === 'COMPLETED' ? 'text-green-400 bg-green-500/10' :
                              tx.paymentStatus === 'PENDING' ? 'text-amber-400 bg-amber-500/10' :
                              'text-red-400 bg-red-500/10'
                            }`}>
                              {tx.paymentStatus}
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-slate-400 text-sm">
              {t('admin.AdminTransactions.showing_transactions', `Showing ${transactions.length} of ${total} transactions`)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-300 px-4">
                {page} / {totalPages || 1}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50 hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTransactions;

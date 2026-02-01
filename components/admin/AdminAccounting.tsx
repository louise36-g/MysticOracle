import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  TrendingUp,
  TrendingDown,
  Euro,
  CreditCard,
  Calendar,
  ExternalLink,
  Download,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Invoice {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  credits: number;
  amount: number;
  currency: string;
  paymentProvider: string;
  paymentId: string;
  description: string;
}

interface AccountingStats {
  summary: {
    totalRevenue: number;
    totalInvoices: number;
    averageAmount: number;
    currency: string;
  };
  byProvider: {
    stripe: { revenue: number; count: number };
    paypal: { revenue: number; count: number };
  };
  monthlyRevenue: Array<{ month: string; revenue: number; count: number }>;
  recentInvoices: Array<{
    id: string;
    createdAt: string;
    username: string;
    amount: number;
    credits: number;
  }>;
  periodComparison: {
    previousRevenue: number;
    previousCount: number;
    revenueChange: number;
    countChange: number;
  } | null;
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '');

const AdminAccounting: React.FC = () => {
  const { t } = useApp();
  const { getToken } = useAuth();

  // Stats state
  const [stats, setStats] = useState<AccountingStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Invoice list state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const token = await getToken();
        if (!token) return;

        const params = new URLSearchParams();
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);

        const response = await fetch(`${API_URL}/api/v1/admin/invoices/stats?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to load stats');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to load accounting stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [getToken, dateFrom, dateTo]);

  // Load invoices
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) throw new Error('No token');

        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        });

        if (search) params.append('search', search);
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        if (paymentProvider) params.append('paymentProvider', paymentProvider);

        const response = await fetch(`${API_URL}/api/v1/admin/invoices?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to load invoices');
        const data = await response.json();

        setInvoices(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [getToken, page, search, dateFrom, dateTo, paymentProvider]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const openInvoice = async (invoiceId: string) => {
    const token = await getToken();
    if (!token) return;

    // Open invoice in new window
    window.open(`${API_URL}/api/v1/admin/invoices/${invoiceId}/html?language=fr`, '_blank');
  };

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      setExporting(true);
      const token = await getToken();
      if (!token) throw new Error('No token');

      const params = new URLSearchParams({ format });
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (paymentProvider) params.append('paymentProvider', paymentProvider);

      const response = await fetch(`${API_URL}/api/v1/admin/invoices/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading text-white">
            {t('admin.accounting.title', 'Accounting & Invoices')}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t('admin.accounting.subtitle', 'View all invoices and revenue statistics')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {t('admin.accounting.exportCsv', 'Export CSV')}
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white rounded-lg transition-colors"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {t('admin.accounting.exportJson', 'Export JSON')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">{t('admin.accounting.totalRevenue', 'Total Revenue')}</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(stats.summary.totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Euro className="w-6 h-6 text-green-400" />
              </div>
            </div>
            {stats.periodComparison && (
              <div className={`flex items-center mt-3 text-sm ${stats.periodComparison.revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.periodComparison.revenueChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {stats.periodComparison.revenueChange >= 0 ? '+' : ''}{stats.periodComparison.revenueChange}%
                <span className="text-slate-500 ml-1">vs previous period</span>
              </div>
            )}
          </motion.div>

          {/* Total Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">{t('admin.accounting.totalInvoices', 'Total Invoices')}</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.summary.totalInvoices}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            {stats.periodComparison && (
              <div className={`flex items-center mt-3 text-sm ${stats.periodComparison.countChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.periodComparison.countChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {stats.periodComparison.countChange >= 0 ? '+' : ''}{stats.periodComparison.countChange}%
                <span className="text-slate-500 ml-1">vs previous period</span>
              </div>
            )}
          </motion.div>

          {/* Stripe Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Stripe</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(stats.byProvider.stripe.revenue)}
                </p>
              </div>
              <div className="p-3 bg-indigo-500/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-3">
              {stats.byProvider.stripe.count} {t('admin.accounting.invoices', 'invoices')}
            </p>
          </motion.div>

          {/* PayPal Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">PayPal</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(stats.byProvider.paypal.revenue)}
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-3">
              {stats.byProvider.paypal.count} {t('admin.accounting.invoices', 'invoices')}
            </p>
          </motion.div>
        </div>
      )}

      {/* Monthly Chart */}
      {!statsLoading && stats && stats.monthlyRevenue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
        >
          <h3 className="text-lg font-medium text-white mb-4">
            {t('admin.accounting.monthlyRevenue', 'Monthly Revenue (Last 12 Months)')}
          </h3>
          <div className="flex items-end gap-2 h-40">
            {stats.monthlyRevenue.slice(0, 12).reverse().map((month, idx) => {
              const maxRevenue = Math.max(...stats.monthlyRevenue.map(m => m.revenue));
              const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-purple-500/60 rounded-t hover:bg-purple-500 transition-colors cursor-pointer"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${month.month}: ${formatCurrency(month.revenue)} (${month.count} invoices)`}
                  />
                  <span className="text-xs text-slate-500 -rotate-45 origin-top-left whitespace-nowrap">
                    {month.month.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <label className="block text-slate-400 text-sm mb-1">
              {t('admin.accounting.search', 'Search')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.accounting.searchPlaceholder', 'Username, email, or ID...')}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </form>

          {/* Date From */}
          <div className="min-w-[150px]">
            <label className="block text-slate-400 text-sm mb-1">
              {t('admin.accounting.dateFrom', 'From')}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Date To */}
          <div className="min-w-[150px]">
            <label className="block text-slate-400 text-sm mb-1">
              {t('admin.accounting.dateTo', 'To')}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Provider Filter */}
          <div className="min-w-[150px]">
            <label className="block text-slate-400 text-sm mb-1">
              {t('admin.accounting.provider', 'Provider')}
            </label>
            <select
              value={paymentProvider}
              onChange={(e) => { setPaymentProvider(e.target.value); setPage(1); }}
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">{t('admin.accounting.allProviders', 'All')}</option>
              <option value="STRIPE">Stripe</option>
              <option value="PAYPAL">PayPal</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(search || dateFrom || dateTo || paymentProvider) && (
            <button
              onClick={() => {
                setSearch('');
                setDateFrom('');
                setDateTo('');
                setPaymentProvider('');
                setPage(1);
              }}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              {t('admin.accounting.clearFilters', 'Clear')}
            </button>
          )}
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            {t('admin.accounting.noInvoices', 'No invoices found')}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-900/30">
                    <th className="text-left p-4 text-slate-400 font-medium">
                      {t('admin.accounting.invoice', 'Invoice')}
                    </th>
                    <th className="text-left p-4 text-slate-400 font-medium">
                      {t('admin.accounting.date', 'Date')}
                    </th>
                    <th className="text-left p-4 text-slate-400 font-medium">
                      {t('admin.accounting.customer', 'Customer')}
                    </th>
                    <th className="text-left p-4 text-slate-400 font-medium">
                      {t('admin.accounting.credits', 'Credits')}
                    </th>
                    <th className="text-right p-4 text-slate-400 font-medium">
                      {t('admin.accounting.amount', 'Amount')}
                    </th>
                    <th className="text-left p-4 text-slate-400 font-medium">
                      {t('admin.accounting.provider', 'Provider')}
                    </th>
                    <th className="text-right p-4 text-slate-400 font-medium">
                      {t('admin.accounting.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-mono text-sm text-purple-400">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">
                        {formatDate(invoice.createdAt)}
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white">{invoice.user.username}</p>
                          <p className="text-slate-500 text-sm">{invoice.user.email}</p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                        {invoice.credits}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-green-400 font-medium">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.paymentProvider === 'STRIPE'
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {invoice.paymentProvider}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openInvoice(invoice.id)}
                          className="p-2 text-slate-400 hover:text-purple-400 transition-colors"
                          title={t('admin.accounting.viewInvoice', 'View Invoice')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-slate-700/50">
              <p className="text-slate-400 text-sm">
                {t('admin.accounting.showing', 'Showing')} {invoices.length} {t('admin.accounting.of', 'of')} {total} {t('admin.accounting.invoices', 'invoices')}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-slate-400 px-3">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAccounting;

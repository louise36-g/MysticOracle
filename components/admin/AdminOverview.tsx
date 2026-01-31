import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { fetchAdminStats, fetchAdminRevenue, fetchAdminReadingStats, AdminStats, AdminRevenue } from '../../services/api';
import { Users, Coins, BookOpen, TrendingUp, UserPlus, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminOverview: React.FC = () => {
  const { t } = useApp();
  const { getToken } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [revenue, setRevenue] = useState<AdminRevenue | null>(null);
  const [readingStats, setReadingStats] = useState<{ bySpreadType: Array<{ spreadType: string; _count: number }> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[AdminOverview] Getting token...');
        const token = await getToken();
        console.log('[AdminOverview] Token received:', token ? 'yes' : 'no');
        if (!token) throw new Error('No authentication token - please sign in');

        console.log('[AdminOverview] Fetching admin data...');
        const [statsData, revenueData, readingsData] = await Promise.all([
          fetchAdminStats(token),
          fetchAdminRevenue(token),
          fetchAdminReadingStats(token)
        ]);
        console.log('[AdminOverview] Data fetched successfully');

        setStats(statsData);
        setRevenue(revenueData);
        setReadingStats(readingsData);
      } catch (err) {
        console.error('[AdminOverview] Error:', err);
        const message = err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300">
        {error}
      </div>
    );
  }

  const statCards = [
    {
      labelKey: 'admin.AdminOverview.total_users',
      labelEn: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: <Users className="w-6 h-6" />,
      color: 'purple'
    },
    {
      labelKey: 'admin.AdminOverview.active_users',
      labelEn: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: <UserPlus className="w-6 h-6" />,
      color: 'green'
    },
    {
      labelKey: 'admin.AdminOverview.total_readings',
      labelEn: 'Total Readings',
      value: stats?.totalReadings || 0,
      icon: <BookOpen className="w-6 h-6" />,
      color: 'blue'
    },
    {
      labelKey: 'admin.AdminOverview.total_revenue',
      labelEn: 'Total Revenue',
      value: `€${Number(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: <Coins className="w-6 h-6" />,
      color: 'amber'
    },
    {
      labelKey: 'admin.AdminOverview.today_readings',
      labelEn: 'Today Readings',
      value: stats?.todayReadings || 0,
      icon: <Calendar className="w-6 h-6" />,
      color: 'cyan'
    },
    {
      labelKey: 'admin.AdminOverview.today_signups',
      labelEn: 'Today Signups',
      value: stats?.todaySignups || 0,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'pink'
    }
  ];

  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30'
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.labelEn}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-xl border ${colorClasses[stat.color]}`}
          >
            <div className="flex items-center gap-3 mb-2">
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-400">
              {t(stat.labelKey, stat.labelEn)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Revenue and Readings Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Details */}
        {revenue && (
          <div className="bg-slate-900/60 border border-purple-500/20 rounded-xl p-6">
            <h3 className="text-lg font-heading text-purple-200 mb-4">
              {t('admin.AdminOverview.revenue_last_30', 'Revenue (Last 30 Days)')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">{t('admin.AdminOverview.revenue', 'Revenue')}</span>
                <span className="text-amber-400 font-bold">€{Number(revenue.last30Days.revenue).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('admin.AdminOverview.transactions', 'Transactions')}</span>
                <span className="text-purple-300 font-medium">{revenue.last30Days.transactions}</span>
              </div>
              <div className="border-t border-slate-700 pt-3 mt-3">
                <p className="text-xs text-slate-500 mb-2">{t('admin.AdminOverview.by_provider', 'By Provider')}</p>
                {revenue.byProvider.map((provider) => (
                  <div key={provider.paymentProvider || 'unknown'} className="flex justify-between text-sm">
                    <span className="text-slate-400">{provider.paymentProvider || 'Other'}</span>
                    <span className="text-purple-300">
                      €{Number(provider._sum.paymentAmount || 0).toFixed(2)} ({provider._count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Readings by Spread */}
        {readingStats && (
          <div className="bg-slate-900/60 border border-purple-500/20 rounded-xl p-6">
            <h3 className="text-lg font-heading text-purple-200 mb-4">
              {t('admin.AdminOverview.readings_by_spread', 'Readings by Spread Type')}
            </h3>
            <div className="space-y-3">
              {readingStats.bySpreadType.map((item) => {
                const total = readingStats.bySpreadType.reduce((sum, i) => sum + i._count, 0);
                const percent = total > 0 ? (item._count / total) * 100 : 0;
                return (
                  <div key={item.spreadType} className="flex items-center gap-3">
                    <span className="text-slate-400 w-28 text-sm">{item.spreadType.replace('_', ' ')}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-amber-500 h-2 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-purple-300 font-medium w-10 text-right">{item._count}</span>
                  </div>
                );
              })}
              {readingStats.bySpreadType.length === 0 && (
                <p className="text-slate-500 text-sm">
                  {t('admin.AdminOverview.no_readings_yet', 'No readings yet')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;

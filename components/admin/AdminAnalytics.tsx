import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { fetchAdminAnalytics, AdminAnalytics as AnalyticsData } from '../../services/api';
import { TrendingUp, Award, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminAnalytics: React.FC = () => {
  const { t } = useApp();
  const { getToken } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('No token');

        const data = await fetchAdminAnalytics(token);
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
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

  if (!analytics) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-heading text-purple-200">
        {t('admin.AdminAnalytics.analytics', 'Analytics')}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Readings Chart (Simple Bar) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-medium text-purple-200">
              {t('admin.AdminAnalytics.readings_last_7', 'Readings (Last 7 Days)')}
            </h3>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {analytics.readingsByDay.map((day, i) => {
              const maxCount = Math.max(...analytics.readingsByDay.map((d) => d.count), 1);
              const height = (day.count / maxCount) * 100;
              return (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className="w-full flex flex-col items-center justify-end h-24">
                    <span className="text-xs text-purple-300 mb-1">{day.count}</span>
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 mt-2">{day.date}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Users by Readings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-medium text-purple-200">
              {t('admin.AdminAnalytics.most_active_users', 'Most Active Users')}
            </h3>
          </div>
          {analytics.topUsers.length === 0 ? (
            <p className="text-slate-400">{t('admin.AdminAnalytics.no_data_yet', 'No data yet')}</p>
          ) : (
            <div className="space-y-3">
              {analytics.topUsers.map((user, i) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0
                          ? 'bg-amber-500 text-black'
                          : i === 1
                          ? 'bg-slate-400 text-black'
                          : i === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-slate-200">{user.username}</span>
                  </div>
                  <span className="text-purple-300 font-medium">
                    {user.count} {t('admin.AdminAnalytics.readings', 'readings')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top Credit Holders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-medium text-purple-200">
              {t('admin.AdminAnalytics.top_credit_holders', 'Top Credit Holders')}
            </h3>
          </div>
          {analytics.topCreditUsers.length === 0 ? (
            <p className="text-slate-400">{t('admin.AdminAnalytics.no_users_yet', 'No users yet')}</p>
          ) : (
            <div className="space-y-3">
              {analytics.topCreditUsers.map((user, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-slate-200">{user.username}</span>
                  <span className="text-amber-300 font-medium">{user.credits} credits</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Login Streaks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-pink-400" />
            <h3 className="text-lg font-medium text-purple-200">
              {t('admin.AdminAnalytics.longest_login_streaks', 'Longest Login Streaks')}
            </h3>
          </div>
          {analytics.topStreakUsers.length === 0 ? (
            <p className="text-slate-400">{t('admin.AdminAnalytics.no_users_yet_2', 'No users yet')}</p>
          ) : (
            <div className="space-y-3">
              {analytics.topStreakUsers.map((user, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-slate-200">{user.username}</span>
                  <span className="text-pink-300 font-medium">
                    {user.streak} {t('admin.AdminAnalytics.days', 'days')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

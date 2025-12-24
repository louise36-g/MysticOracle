import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getAllUsers, getAllReadings } from '../../services/storageService';
import { TrendingUp, Award, Calendar } from 'lucide-react';

const AdminAnalytics: React.FC = () => {
  const { language } = useApp();

  const analytics = useMemo(() => {
    const users = getAllUsers();
    const readings = getAllReadings();

    // Most active users (by readings)
    const userReadingCounts: Record<string, { username: string; count: number }> = {};
    readings.forEach((r) => {
      if (r.userId) {
        if (!userReadingCounts[r.userId]) {
          const user = users.find((u) => u.id === r.userId);
          userReadingCounts[r.userId] = { username: user?.username || 'Unknown', count: 0 };
        }
        userReadingCounts[r.userId].count++;
      }
    });
    const topUsers = Object.entries(userReadingCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }));

    // Users with most credits
    const topCreditUsers = [...users]
      .sort((a, b) => b.credits - a.credits)
      .slice(0, 5)
      .map((u) => ({ username: u.username, credits: u.credits }));

    // Readings by day (last 7 days)
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const readingsByDay: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * dayMs);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + dayMs);

      const count = readings.filter((r) => {
        const readingDate = new Date(r.date).getTime();
        return readingDate >= dayStart.getTime() && readingDate < dayEnd.getTime();
      }).length;

      readingsByDay.push({
        date: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        count,
      });
    }

    // Users with longest login streaks
    const topStreakUsers = [...users]
      .sort((a, b) => b.loginStreak - a.loginStreak)
      .slice(0, 5)
      .map((u) => ({ username: u.username, streak: u.loginStreak }));

    return { topUsers, topCreditUsers, readingsByDay, topStreakUsers };
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-heading text-purple-200">
        {language === 'en' ? 'Analytics' : 'Analytique'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Readings Chart (Simple Bar) */}
        <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-medium text-purple-200">
              {language === 'en' ? 'Readings (Last 7 Days)' : 'Lectures (7 Derniers Jours)'}
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
                      className="w-full bg-purple-500 rounded-t"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 mt-2">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Users by Readings */}
        <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-medium text-purple-200">
              {language === 'en' ? 'Most Active Users' : 'Utilisateurs les Plus Actifs'}
            </h3>
          </div>
          {analytics.topUsers.length === 0 ? (
            <p className="text-slate-400">{language === 'en' ? 'No data yet' : 'Pas de données'}</p>
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
                    {user.count} {language === 'en' ? 'readings' : 'lectures'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Credit Holders */}
        <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-medium text-purple-200">
              {language === 'en' ? 'Top Credit Holders' : 'Top Détenteurs de Crédits'}
            </h3>
          </div>
          {analytics.topCreditUsers.length === 0 ? (
            <p className="text-slate-400">{language === 'en' ? 'No users yet' : 'Pas d\'utilisateurs'}</p>
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
        </div>

        {/* Login Streaks */}
        <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-pink-400" />
            <h3 className="text-lg font-medium text-purple-200">
              {language === 'en' ? 'Longest Login Streaks' : 'Plus Longues Séries de Connexion'}
            </h3>
          </div>
          {analytics.topStreakUsers.length === 0 ? (
            <p className="text-slate-400">{language === 'en' ? 'No users yet' : 'Pas d\'utilisateurs'}</p>
          ) : (
            <div className="space-y-3">
              {analytics.topStreakUsers.map((user, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-slate-200">{user.username}</span>
                  <span className="text-pink-300 font-medium">
                    {user.streak} {language === 'en' ? 'days' : 'jours'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

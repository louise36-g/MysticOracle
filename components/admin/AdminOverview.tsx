import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getAdminStats } from '../../services/storageService';
import { Users, CreditCard, BookOpen, TrendingUp, UserPlus, Activity } from 'lucide-react';

const AdminOverview: React.FC = () => {
  const { language } = useApp();

  const stats = useMemo(() => getAdminStats(), []);

  const statCards = [
    {
      labelEn: 'Total Users',
      labelFr: 'Total Utilisateurs',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      labelEn: 'Active Users (7d)',
      labelFr: 'Utilisateurs Actifs (7j)',
      value: stats.activeUsers,
      icon: Activity,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      labelEn: 'New Today',
      labelFr: "Nouveaux Aujourd'hui",
      value: stats.newUsersToday,
      icon: UserPlus,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      labelEn: 'New This Week',
      labelFr: 'Nouveaux Cette Semaine',
      value: stats.newUsersThisWeek,
      icon: TrendingUp,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      labelEn: 'Total Readings',
      labelFr: 'Total Lectures',
      value: stats.totalReadings,
      icon: BookOpen,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
    {
      labelEn: 'Credits in Circulation',
      labelFr: 'Crédits en Circulation',
      value: stats.totalCredits,
      icon: CreditCard,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-heading text-purple-200 mb-6">
        {language === 'en' ? 'Platform Overview' : 'Aperçu de la Plateforme'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">
                    {language === 'en' ? card.labelEn : card.labelFr}
                  </p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Readings by Spread Type */}
      <div className="mt-8">
        <h3 className="text-lg font-heading text-purple-200 mb-4">
          {language === 'en' ? 'Readings by Spread Type' : 'Lectures par Type de Tirage'}
        </h3>
        <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6">
          {Object.keys(stats.readingsBySpread).length === 0 ? (
            <p className="text-slate-400">
              {language === 'en' ? 'No readings yet' : 'Aucune lecture encore'}
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.readingsBySpread).map(([spread, count]) => (
                <div key={spread} className="flex items-center justify-between">
                  <span className="text-slate-300 capitalize">{spread.replace('_', ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (count / stats.totalReadings) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-purple-300 font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;

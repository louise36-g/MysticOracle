import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { Database, Trash2, RefreshCw, Loader } from 'lucide-react';

interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: string;
  breakdown: Record<string, number>;
  lastPurge: string | null;
}

const AdminCache: React.FC = () => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cache/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurge = async () => {
    if (!confirm(language === 'en' ? 'Purge all cache?' : 'Vider tout le cache?')) return;

    try {
      setPurging(true);
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cache/purge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: language === 'en' ? 'Cache purged successfully' : 'Cache vide avec succes' });
        fetchStats();
      } else {
        setMessage({ type: 'error', text: language === 'en' ? 'Failed to purge cache' : 'Echec du vidage du cache' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: language === 'en' ? 'Failed to purge cache' : 'Echec du vidage du cache' });
    } finally {
      setPurging(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatLastPurge = (dateStr: string | null) => {
    if (!dateStr) return language === 'en' ? 'Never' : 'Jamais';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return language === 'en' ? 'Just now' : 'A l\'instant';
    if (diffMins < 60) return language === 'en' ? `${diffMins} min ago` : `Il y a ${diffMins} min`;
    if (diffHours < 24) return language === 'en' ? `${diffHours} hours ago` : `Il y a ${diffHours} heures`;
    return language === 'en' ? `${diffDays} days ago` : `Il y a ${diffDays} jours`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading text-amber-400 flex items-center gap-2">
          <Database className="w-5 h-5" />
          {language === 'en' ? 'Cache Management' : 'Gestion du Cache'}
        </h2>
        <button
          onClick={fetchStats}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title={language === 'en' ? 'Refresh' : 'Actualiser'}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-500/20">
          <div className="text-3xl font-bold text-purple-300">{stats?.keys || 0}</div>
          <div className="text-sm text-slate-400">{language === 'en' ? 'Cached Items' : 'Elements en cache'}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-500/20">
          <div className="text-3xl font-bold text-green-400">{stats?.hitRate || 0}%</div>
          <div className="text-sm text-slate-400">{language === 'en' ? 'Hit Rate' : 'Taux de succes'}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-500/20">
          <div className="text-3xl font-bold text-amber-400">{stats?.memoryUsage || '0 KB'}</div>
          <div className="text-sm text-slate-400">{language === 'en' ? 'Memory Usage' : 'Utilisation memoire'}</div>
        </div>
      </div>

      {/* Cache Breakdown */}
      {stats?.breakdown && Object.keys(stats.breakdown).length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-500/20">
          <h3 className="text-lg font-medium text-purple-300 mb-4">
            {language === 'en' ? 'Cache Breakdown' : 'Repartition du cache'}
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.breakdown).map(([key, count]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-slate-300">{key}:</span>
                <span className="text-purple-300 font-mono">{count} {language === 'en' ? 'items' : 'elements'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purge Button */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-500/20">
        <button
          onClick={handlePurge}
          disabled={purging}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {purging ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
          {language === 'en' ? 'Purge All Cache' : 'Vider tout le cache'}
        </button>
        <p className="text-sm text-slate-500 text-center mt-3">
          {language === 'en' ? 'Last purged:' : 'Dernier vidage:'} {formatLastPurge(stats?.lastPurge || null)}
        </p>
      </div>
    </div>
  );
};

export default AdminCache;

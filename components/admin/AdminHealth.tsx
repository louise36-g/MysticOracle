import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { fetchAdminHealth, SystemHealth } from '../../services/apiService';
import { Activity, CheckCircle, AlertCircle, XCircle, RefreshCw, Database, CreditCard, Mail, Bot, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const serviceIcons: Record<string, React.ReactNode> = {
  database: <Database className="w-5 h-5" />,
  clerk: <Users className="w-5 h-5" />,
  stripe: <CreditCard className="w-5 h-5" />,
  paypal: <CreditCard className="w-5 h-5" />,
  brevo: <Mail className="w-5 h-5" />,
  openrouter: <Bot className="w-5 h-5" />
};

const serviceNames: Record<string, { en: string; fr: string }> = {
  database: { en: 'Database', fr: 'Base de donnees' },
  clerk: { en: 'Clerk Auth', fr: 'Clerk Auth' },
  stripe: { en: 'Stripe Payments', fr: 'Paiements Stripe' },
  paypal: { en: 'PayPal', fr: 'PayPal' },
  brevo: { en: 'Brevo Email', fr: 'Email Brevo' },
  openrouter: { en: 'OpenRouter AI', fr: 'OpenRouter IA' }
};

const REFRESH_OPTIONS = [
  { value: 60000, labelEn: '1 min', labelFr: '1 min' },
  { value: 300000, labelEn: '5 min', labelFr: '5 min' },
  { value: 600000, labelEn: '10 min', labelFr: '10 min' },
  { value: 1800000, labelEn: '30 min', labelFr: '30 min' },
  { value: 0, labelEn: 'Off', labelFr: 'Desactive' }
];

interface AdminHealthProps {
  onServiceClick?: (serviceId: string) => void;
}

const AdminHealth: React.FC<AdminHealthProps> = ({ onServiceClick }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutes default

  const loadHealth = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const token = await getToken();
      if (!token) throw new Error('No token');

      const data = await fetchAdminHealth(token);
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  useEffect(() => {
    if (refreshInterval === 0) return; // Auto-refresh disabled
    const interval = setInterval(() => loadHealth(true), refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'not_configured':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'border-green-500/30 bg-green-500/10';
      case 'error':
        return 'border-red-500/30 bg-red-500/10';
      case 'not_configured':
        return 'border-amber-500/30 bg-amber-500/10';
      default:
        return 'border-slate-500/30 bg-slate-500/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ok':
        return language === 'en' ? 'Operational' : 'Operationnel';
      case 'error':
        return language === 'en' ? 'Error' : 'Erreur';
      case 'not_configured':
        return language === 'en' ? 'Not Configured' : 'Non configure';
      default:
        return status;
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 bg-green-500/20';
      case 'partial':
        return 'text-amber-400 bg-amber-500/20';
      case 'degraded':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

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

  if (!health) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-heading text-purple-200">
            {language === 'en' ? 'System Health' : 'Sante du Systeme'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm"
          >
            {REFRESH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {language === 'en' ? opt.labelEn : opt.labelFr}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadHealth(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {language === 'en' ? 'Refresh' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">
              {language === 'en' ? 'Overall Status' : 'Statut General'}
            </p>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold capitalize ${
                health.status === 'healthy' ? 'text-green-400' :
                health.status === 'partial' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {health.status === 'healthy' ? (language === 'en' ? 'Healthy' : 'Sain') :
                 health.status === 'partial' ? (language === 'en' ? 'Partial' : 'Partiel') :
                 (language === 'en' ? 'Degraded' : 'Degrade')}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOverallStatusColor(health.status)}`}>
                {Object.values(health.services).filter(s => s.status === 'ok').length}/{Object.keys(health.services).length} {language === 'en' ? 'services' : 'services'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">
              {language === 'en' ? 'Last checked' : 'Derniere verification'}
            </p>
            <p className="text-sm text-slate-400">
              {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(health.services).map(([service, info], index) => (
          <motion.div
            key={service}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onServiceClick?.(service)}
            className={`rounded-lg border p-4 ${getStatusColor(info.status)} ${onServiceClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="text-slate-400">
                  {serviceIcons[service] || <Activity className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    {serviceNames[service]?.[language] || service}
                  </h3>
                  <p className={`text-sm ${
                    info.status === 'ok' ? 'text-green-400' :
                    info.status === 'error' ? 'text-red-400' :
                    'text-amber-400'
                  }`}>
                    {getStatusText(info.status)}
                  </p>
                </div>
              </div>
              {getStatusIcon(info.status)}
            </div>
            {info.message && (
              <p className="mt-2 text-xs text-slate-400 bg-slate-900/50 rounded p-2">
                {info.message}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Info */}
      <div className="p-4 bg-slate-800/30 rounded-lg text-sm text-slate-400">
        <p>
          {language === 'en'
            ? 'Click on a service to view its configuration. Services marked as "Not Configured" need their environment variables set on your hosting platform.'
            : 'Cliquez sur un service pour voir sa configuration. Les services "Non configure" necessitent la configuration des variables d\'environnement sur votre plateforme d\'hebergement.'}
        </p>
      </div>
    </div>
  );
};

export default AdminHealth;

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { fetchAdminHealth, fetchAdminErrorLogs, clearAdminErrorLogs, SystemHealth, ErrorLogEntry } from '../../services/apiService';
import { Activity, CheckCircle, AlertCircle, XCircle, RefreshCw, Database, CreditCard, Mail, Bot, Users, Trash2, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Error logs state
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

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

  const loadErrorLogs = async () => {
    try {
      setLogsLoading(true);
      const token = await getToken();
      if (!token) return;

      const data = await fetchAdminErrorLogs(token, { limit: 50, level: levelFilter || undefined });
      setErrorLogs(data.logs);
    } catch (err) {
      console.error('Failed to load error logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm(language === 'en' ? 'Clear all error logs?' : 'Effacer tous les logs d\'erreur?')) return;

    try {
      const token = await getToken();
      if (!token) return;

      await clearAdminErrorLogs(token);
      setErrorLogs([]);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  useEffect(() => {
    loadHealth();
    loadErrorLogs();
  }, []);

  useEffect(() => {
    if (refreshInterval === 0) return; // Auto-refresh disabled
    const interval = setInterval(() => {
      loadHealth(true);
      loadErrorLogs();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    loadErrorLogs();
  }, [levelFilter]);

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

      {/* Error Logs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden"
      >
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/30"
          onClick={() => setShowLogs(!showLogs)}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-medium text-purple-200">
              {language === 'en' ? 'Error Log' : 'Journal des erreurs'}
            </h3>
            {errorLogs.length > 0 && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                {errorLogs.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showLogs && (
              <>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300"
                >
                  <option value="">{language === 'en' ? 'All Levels' : 'Tous les niveaux'}</option>
                  <option value="error">{language === 'en' ? 'Errors' : 'Erreurs'}</option>
                  <option value="warn">{language === 'en' ? 'Warnings' : 'Avertissements'}</option>
                  <option value="info">Info</option>
                </select>
                {errorLogs.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClearLogs(); }}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title={language === 'en' ? 'Clear logs' : 'Effacer les logs'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            {showLogs ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        <AnimatePresence>
          {showLogs && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-800"
            >
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : errorLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500/50" />
                  <p>{language === 'en' ? 'No errors logged' : 'Aucune erreur enregistree'}</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {errorLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/30"
                    >
                      <div
                        className="p-3 cursor-pointer"
                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {log.level === 'error' ? (
                              <XCircle className="w-4 h-4 text-red-400" />
                            ) : log.level === 'warn' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Info className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                                log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {log.level.toUpperCase()}
                              </span>
                              <span className="text-xs text-slate-500">{log.source}</span>
                              <span className="text-xs text-slate-600">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300 truncate">{log.message}</p>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedLogId === log.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      <AnimatePresence>
                        {expandedLogId === log.id && log.details && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-3 pb-3"
                          >
                            <pre className="p-2 bg-slate-950 rounded text-xs text-slate-400 overflow-x-auto">
                              {log.details}
                            </pre>
                            {log.path && (
                              <p className="mt-2 text-xs text-slate-500">
                                Path: <span className="text-slate-400">{log.path}</span>
                              </p>
                            )}
                            {log.userId && (
                              <p className="text-xs text-slate-500">
                                User: <span className="text-slate-400">{log.userId}</span>
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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

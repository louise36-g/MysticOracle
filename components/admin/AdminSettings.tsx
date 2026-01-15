import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminAIConfig,
  fetchAdminServices,
  fetchAdminSettings,
  updateAdminSetting,
  fetchRevenueMonths,
  getRevenueExportUrl,
  ServiceConfig,
  SystemSetting,
  RevenueMonth
} from '../../services/apiService';
import {
  Bot, Key, CheckCircle, AlertCircle, ExternalLink, Server, Database,
  CreditCard, Mail, Users, Settings, Save, Eye, EyeOff, Download, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AIConfig {
  model: string;
  provider: string;
  hasApiKey: boolean;
}

const serviceIcons: Record<string, React.ReactNode> = {
  database: <Database className="w-5 h-5" />,
  clerk: <Users className="w-5 h-5" />,
  stripe: <CreditCard className="w-5 h-5" />,
  paypal: <CreditCard className="w-5 h-5" />,
  brevo: <Mail className="w-5 h-5" />,
  openrouter: <Bot className="w-5 h-5" />
};

interface AdminSettingsProps {
  selectedServiceId?: string;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ selectedServiceId }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [services, setServices] = useState<ServiceConfig[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [revenueMonths, setRevenueMonths] = useState<RevenueMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const serviceRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('No token');

        const [aiData, servicesData, settingsData, monthsData] = await Promise.all([
          fetchAdminAIConfig(token),
          fetchAdminServices(token),
          fetchAdminSettings(token),
          fetchRevenueMonths(token)
        ]);

        setAiConfig(aiData);
        setServices(servicesData.services);
        setSettings(settingsData.settings);
        setRevenueMonths(monthsData.months);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [getToken]);

  // Scroll to selected service when it changes
  useEffect(() => {
    if (selectedServiceId && !loading && serviceRefs.current[selectedServiceId]) {
      setTimeout(() => {
        serviceRefs.current[selectedServiceId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [selectedServiceId, loading, services]);

  const handleSaveSetting = async (key: string) => {
    try {
      setSaving(true);
      const token = await getToken();
      if (!token) return;

      await updateAdminSetting(token, key, editValue);

      // Refresh settings
      const settingsData = await fetchAdminSettings(token);
      setSettings(settingsData.settings);

      setEditingKey(null);
      setEditValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const handleExportRevenue = async (month: RevenueMonth) => {
    try {
      const token = await getToken();
      if (!token) return;

      // Create a hidden link and trigger download
      const url = getRevenueExportUrl(token, month.year, month.month);
      const link = document.createElement('a');
      link.href = url;
      link.download = `revenue-${month.year}-${String(month.month).padStart(2, '0')}.csv`;

      // Add auth header via fetch and blob
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export');
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
        <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Editable Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-heading text-purple-200">
              {language === 'en' ? 'API Keys & Settings' : 'Clés API & Paramètres'}
            </h3>
            <p className="text-sm text-slate-400">
              {language === 'en'
                ? 'Configuration values from environment variables'
                : 'Valeurs de configuration des variables d\'environnement'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {settings.map((setting) => {
            // Environment-only keys (read-only, especially for AI/OpenRouter)
            const isEnvOnly = setting.key === 'OPENROUTER_API_KEY' || setting.key === 'AI_MODEL' || setting.source === 'environment';

            return (
              <div
                key={setting.key}
                className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-purple-300">{setting.key}</span>
                    {setting.hasValue && (
                      <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-300">
                        ENV
                      </span>
                    )}
                    {isEnvOnly && (
                      <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300">
                        {language === 'en' ? 'Read-Only' : 'Lecture seule'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {language === 'en' ? setting.descriptionEn : setting.descriptionFr}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300 font-mono">
                    {setting.hasValue ? (
                      setting.isSecret ? '••••••••••••••••' : setting.value
                    ) : (
                      <span className="text-slate-500 italic">
                        {language === 'en' ? 'Not configured' : 'Non configuré'}
                      </span>
                    )}
                  </span>
                  {isEnvOnly && setting.hasValue && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  {isEnvOnly && !setting.hasValue && (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Settings className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-200/90 space-y-1">
              <p className="font-medium">
                {language === 'en'
                  ? 'Environment Variables Configuration'
                  : 'Configuration des Variables d\'Environnement'}
              </p>
              <p className="text-blue-200/70">
                {language === 'en'
                  ? 'All settings are now configured via environment variables for improved security. To update these values, modify your server/.env file and restart the backend.'
                  : 'Tous les paramètres sont maintenant configurés via des variables d\'environnement pour une sécurité améliorée. Pour modifier ces valeurs, modifiez votre fichier server/.env et redémarrez le backend.'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Service Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Server className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-heading text-purple-200">
              {language === 'en' ? 'Service Dashboards' : 'Tableaux de Bord'}
            </h3>
            <p className="text-sm text-slate-400">
              {language === 'en'
                ? 'Quick access to service dashboards'
                : 'Accès rapide aux tableaux de bord des services'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              ref={(el) => { serviceRefs.current[service.id] = el; }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-lg border p-4 transition-all ${
                selectedServiceId === service.id
                  ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/50'
                  : service.configured
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-amber-500/30 bg-amber-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-slate-400">
                    {serviceIcons[service.id] || <Server className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">
                        {language === 'en' ? service.nameEn : service.nameFr}
                      </h4>
                      {service.configured ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {service.envVars.map((envVar) => (
                        <span
                          key={envVar}
                          className="px-1.5 py-0.5 bg-slate-800 rounded text-xs font-mono text-slate-400"
                        >
                          {envVar}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={service.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-white text-sm font-medium transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Dashboard
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Revenue Export */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-heading text-purple-200">
              {language === 'en' ? 'Revenue Export' : 'Export des Revenus'}
            </h3>
            <p className="text-sm text-slate-400">
              {language === 'en'
                ? 'Download monthly revenue reports for accounting'
                : 'Télécharger les rapports de revenus mensuels pour la comptabilité'}
            </p>
          </div>
        </div>

        {revenueMonths.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            {language === 'en'
              ? 'No revenue data available yet.'
              : 'Aucune donnée de revenus disponible.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {revenueMonths.map((month) => (
              <button
                key={`${month.year}-${month.month}`}
                onClick={() => handleExportRevenue(month)}
                className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700 transition-colors group"
              >
                <span className="text-sm text-white">{month.label}</span>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-green-400 transition-colors" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
          <p className="text-xs text-slate-400">
            {language === 'en'
              ? 'Reports include all completed purchases with transaction details, user info, and totals. Format: CSV'
              : 'Les rapports incluent tous les achats complétés avec les détails des transactions, infos utilisateur et totaux. Format: CSV'}
          </p>
        </div>
      </motion.div>

      {/* AI Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-heading text-purple-200">
              {language === 'en' ? 'AI Configuration' : 'Configuration IA'}
            </h3>
            <p className="text-sm text-slate-400">
              {language === 'en'
                ? 'Current AI model and provider settings'
                : 'Paramètres actuels du modèle IA'}
            </p>
          </div>
        </div>

        {aiConfig && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">
                {language === 'en' ? 'Provider' : 'Fournisseur'}
              </p>
              <p className="text-lg font-medium text-white capitalize">{aiConfig.provider}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">
                {language === 'en' ? 'Model' : 'Modèle'}
              </p>
              <p className="text-lg font-medium text-white">{aiConfig.model}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">
                {language === 'en' ? 'API Key Status' : 'Statut Clé API'}
              </p>
              <div className="flex items-center gap-2">
                {aiConfig.hasApiKey ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium">
                      {language === 'en' ? 'Configured' : 'Configuré'}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-medium">
                      {language === 'en' ? 'Not Set' : 'Non configuré'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* System Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-heading text-purple-200">
            {language === 'en' ? 'System Information' : 'Informations Système'}
          </h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Frontend</p>
            <p className="text-sm text-white">React 19 + Vite + TypeScript</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Backend</p>
            <p className="text-sm text-white">Express + Prisma + PostgreSQL</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">
              {language === 'en' ? 'Authentication' : 'Authentification'}
            </p>
            <p className="text-sm text-white">Clerk</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">
              {language === 'en' ? 'Payments' : 'Paiements'}
            </p>
            <p className="text-sm text-white">Stripe + PayPal</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSettings;

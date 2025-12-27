import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { fetchAdminAIConfig, fetchAdminServices, ServiceConfig } from '../../services/apiService';
import { Bot, Key, CheckCircle, AlertCircle, ExternalLink, Server, Database, CreditCard, Mail, Users } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const serviceRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('No token');

        const [aiData, servicesData] = await Promise.all([
          fetchAdminAIConfig(token),
          fetchAdminServices(token)
        ]);

        setAiConfig(aiData);
        setServices(servicesData.services);
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

  return (
    <div className="space-y-8">
      {/* Service Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Server className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-heading text-purple-200">
              {language === 'en' ? 'Service Configuration' : 'Configuration des Services'}
            </h3>
            <p className="text-sm text-slate-400">
              {language === 'en'
                ? 'Required environment variables for each service'
                : 'Variables d\'environnement requises pour chaque service'}
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
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="text-slate-400 mt-0.5">
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
                    <p className="text-sm text-slate-400 mt-1">
                      {language === 'en' ? service.descriptionEn : service.descriptionFr}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {service.envVars.map((envVar) => (
                        <span
                          key={envVar}
                          className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-slate-300"
                        >
                          {envVar}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <a
                  href={service.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                  title={language === 'en' ? 'View documentation' : 'Voir la documentation'}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-slate-800/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Key className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-400">
              {language === 'en'
                ? 'Environment variables are managed on your hosting platform (Render). Go to your service dashboard to update these values.'
                : 'Les variables d\'environnement sont gérées sur votre plateforme d\'hébergement (Render). Accédez au tableau de bord de votre service pour mettre à jour ces valeurs.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* AI Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
        transition={{ delay: 0.2 }}
        className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
      >
        <h3 className="text-lg font-heading text-purple-200 mb-4">
          {language === 'en' ? 'System Information' : 'Informations Système'}
        </h3>
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

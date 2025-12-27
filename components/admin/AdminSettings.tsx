import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { fetchAdminAIConfig } from '../../services/apiService';
import { Bot, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIConfig {
  model: string;
  provider: string;
  hasApiKey: boolean;
}

const AdminSettings: React.FC = () => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('No token');

        const aiData = await fetchAdminAIConfig(token);
        setAiConfig(aiData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
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

  return (
    <div className="space-y-8">
      {/* AI Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
                : 'Parametres actuels du modele IA'}
            </p>
          </div>
        </div>

        {aiConfig && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">
                  {language === 'en' ? 'Provider' : 'Fournisseur'}
                </p>
                <p className="text-lg font-medium text-white capitalize">{aiConfig.provider}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">
                  {language === 'en' ? 'Model' : 'Modele'}
                </p>
                <p className="text-lg font-medium text-white">{aiConfig.model}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">
                  {language === 'en' ? 'API Key Status' : 'Statut Cle API'}
                </p>
                <div className="flex items-center gap-2">
                  {aiConfig.hasApiKey ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-medium">
                        {language === 'en' ? 'Configured' : 'Configure'}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-medium">
                        {language === 'en' ? 'Not Set' : 'Non configure'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Key className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-200/80">
                {language === 'en'
                  ? 'AI configuration is managed via environment variables on your hosting platform (Render). Update OPENROUTER_API_KEY and AI_MODEL in your environment settings.'
                  : 'La configuration IA est geree via les variables d\'environnement sur votre plateforme d\'hebergement (Render). Mettez a jour OPENROUTER_API_KEY et AI_MODEL dans vos parametres.'}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* System Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
      >
        <h3 className="text-lg font-heading text-purple-200 mb-4">
          {language === 'en' ? 'System Information' : 'Informations Systeme'}
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

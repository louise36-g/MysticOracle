import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { fetchAdminAIConfig, fetchAdminEmailTemplates, EmailTemplate } from '../../services/apiService';
import { Bot, Mail, Key, CheckCircle, AlertCircle, ExternalLink, Eye } from 'lucide-react';
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
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [brevoConfigured, setBrevoConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('No token');

        const [aiData, emailData] = await Promise.all([
          fetchAdminAIConfig(token),
          fetchAdminEmailTemplates(token)
        ]);

        setAiConfig(aiData);
        setEmailTemplates(emailData.templates);
        setBrevoConfigured(emailData.brevoConfigured);
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

      {/* Email Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-heading text-purple-200">
                {language === 'en' ? 'Email Templates' : 'Modeles d\'Email'}
              </h3>
              <p className="text-sm text-slate-400">
                {language === 'en'
                  ? 'Transactional email templates'
                  : 'Modeles d\'emails transactionnels'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {brevoConfigured ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">Brevo Connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-400">Brevo Not Configured</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {emailTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-mono">
                      {template.id}
                    </span>
                    <h4 className="font-medium text-white">
                      {language === 'en' ? template.nameEn : template.nameFr}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-400">
                    <span className="text-slate-500">Subject: </span>
                    {language === 'en' ? template.subjectEn : template.subjectFr}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewTemplate(previewTemplate === template.id ? null : template.id)}
                  className="p-2 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                  title={language === 'en' ? 'Preview template' : 'Apercu du modele'}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {previewTemplate === template.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-slate-700"
                >
                  <p className="text-sm text-slate-400 mb-3">
                    {language === 'en'
                      ? 'This template is rendered with Brevo using {{params.variableName}} placeholders.'
                      : 'Ce modele est rendu avec Brevo en utilisant les espaces reserves {{params.variableName}}.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 font-mono">
                      {'{{params.username}}'}
                    </span>
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 font-mono">
                      {'{{params.siteUrl}}'}
                    </span>
                    {template.id === 'PURCHASE_CONFIRMATION' && (
                      <>
                        <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 font-mono">
                          {'{{params.credits}}'}
                        </span>
                        <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 font-mono">
                          {'{{params.amount}}'}
                        </span>
                        <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 font-mono">
                          {'{{params.newBalance}}'}
                        </span>
                      </>
                    )}
                    {template.id === 'LOW_CREDITS_REMINDER' && (
                      <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 font-mono">
                        {'{{params.credits}}'}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-slate-800/30 rounded-lg">
          <div className="flex items-start gap-2">
            <ExternalLink className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-slate-400">
                {language === 'en'
                  ? 'Email templates are defined in the backend code. To modify templates, edit the email service file.'
                  : 'Les modeles d\'email sont definis dans le code backend. Pour les modifier, editez le fichier du service email.'}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                server/src/services/email.ts
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* System Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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

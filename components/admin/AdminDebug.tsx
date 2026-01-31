import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { adjustUserCredits } from '../../services/api';
import { Bug, Plus, Zap, Bot, CheckCircle, AlertCircle, RefreshCw, Coins } from 'lucide-react';

// Debug mode key for localStorage
export const DEBUG_AI_MODE_KEY = 'mystic_debug_ai_mode';

interface AdminDebugProps {
  language: 'en' | 'fr';
}

const AdminDebug: React.FC<AdminDebugProps> = ({ language }) => {
  const { getToken } = useAuth();
  const { user, refreshUser } = useApp();
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const [lastAction, setLastAction] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [debugAIMode, setDebugAIMode] = useState(false);

  // Load debug mode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(DEBUG_AI_MODE_KEY);
    setDebugAIMode(saved === 'true');
  }, []);

  const handleAddCredits = async (amount: number) => {
    if (!user) return;

    setIsAddingCredits(true);
    setLastAction(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('No auth token');

      console.log('[AdminDebug] Calling adjustUserCredits for user:', user.id, 'amount:', amount);
      const result = await adjustUserCredits(
        token,
        user.id,
        amount,
        `Debug: Admin added ${amount} credits`
      );
      console.log('[AdminDebug] adjustUserCredits result:', result);

      console.log('[AdminDebug] Calling refreshUser...');
      await refreshUser();
      console.log('[AdminDebug] refreshUser completed, current user credits:', user.credits);

      setLastAction({
        type: 'success',
        message: language === 'en'
          ? `Added ${amount} credits. New balance: ${result.newBalance}`
          : `Ajout de ${amount} crédits. Nouveau solde: ${result.newBalance}`,
      });
    } catch (error) {
      console.error('[AdminDebug] Error adding credits:', error);
      setLastAction({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to add credits',
      });
    } finally {
      setIsAddingCredits(false);
    }
  };

  const toggleDebugAIMode = () => {
    const newValue = !debugAIMode;
    setDebugAIMode(newValue);
    localStorage.setItem(DEBUG_AI_MODE_KEY, String(newValue));

    setLastAction({
      type: 'success',
      message: language === 'en'
        ? `Debug AI mode ${newValue ? 'enabled' : 'disabled'}. ${newValue ? 'Readings will use mock data.' : 'Readings will use OpenRouter.'}`
        : `Mode debug IA ${newValue ? 'activé' : 'désactivé'}. ${newValue ? 'Les lectures utiliseront des données fictives.' : 'Les lectures utiliseront OpenRouter.'}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <Bug className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">
            {language === 'en' ? 'Debug Tools' : 'Outils de Débogage'}
          </h2>
          <p className="text-sm text-slate-400">
            {language === 'en'
              ? 'Development and testing utilities'
              : 'Utilitaires de développement et de test'}
          </p>
        </div>
      </div>

      {/* Status Message */}
      {lastAction && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          lastAction.type === 'success'
            ? 'bg-green-500/20 border border-green-500/30'
            : 'bg-red-500/20 border border-red-500/30'
        }`}>
          {lastAction.type === 'success'
            ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            : <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          }
          <span className={lastAction.type === 'success' ? 'text-green-300' : 'text-red-300'}>
            {lastAction.message}
          </span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Credit Management */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <Coins className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-medium text-white">
              {language === 'en' ? 'Credit Management' : 'Gestion des Crédits'}
            </h3>
          </div>

          <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
            <div className="text-sm text-slate-400">
              {language === 'en' ? 'Current Balance' : 'Solde Actuel'}
            </div>
            <div className="text-2xl font-bold text-purple-300 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {user?.credits ?? 0}
            </div>
          </div>

          <p className="text-sm text-slate-400 mb-4">
            {language === 'en'
              ? 'Add credits to your admin account for testing:'
              : 'Ajouter des crédits à votre compte admin pour les tests:'}
          </p>

          <div className="flex flex-wrap gap-2">
            {[10, 25, 50, 100].map((amount) => (
              <button
                key={amount}
                onClick={() => handleAddCredits(amount)}
                disabled={isAddingCredits}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500
                         disabled:bg-slate-600 disabled:cursor-not-allowed
                         text-white rounded-lg transition-colors text-sm font-medium"
              >
                {isAddingCredits ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                +{amount}
              </button>
            ))}
          </div>
        </div>

        {/* Debug AI Mode */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">
              {language === 'en' ? 'AI Debug Mode' : 'Mode Debug IA'}
            </h3>
          </div>

          <p className="text-sm text-slate-400 mb-4">
            {language === 'en'
              ? 'When enabled, readings will return mock data instead of calling OpenRouter. This saves API credits during testing.'
              : 'Lorsqu\'il est activé, les lectures retourneront des données fictives au lieu d\'appeler OpenRouter. Cela économise des crédits API pendant les tests.'}
          </p>

          <div className="p-4 bg-slate-900/50 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">
                  {language === 'en' ? 'Status' : 'Statut'}
                </div>
                <div className={`text-sm ${debugAIMode ? 'text-orange-400' : 'text-green-400'}`}>
                  {debugAIMode
                    ? (language === 'en' ? 'Mock Mode Active' : 'Mode Fictif Actif')
                    : (language === 'en' ? 'Using OpenRouter' : 'Utilisation d\'OpenRouter')
                  }
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${debugAIMode ? 'bg-orange-400' : 'bg-green-400'} animate-pulse`} />
            </div>
          </div>

          <button
            onClick={toggleDebugAIMode}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              debugAIMode
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-orange-600 hover:bg-orange-500 text-white'
            }`}
          >
            {debugAIMode
              ? (language === 'en' ? 'Disable Debug Mode' : 'Désactiver le Mode Debug')
              : (language === 'en' ? 'Enable Debug Mode' : 'Activer le Mode Debug')
            }
          </button>

          {debugAIMode && (
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-orange-300">
                  {language === 'en'
                    ? 'Debug mode is active. All tarot readings will return a sample interpretation. Credits will still be deducted to test the full flow.'
                    : 'Le mode debug est actif. Toutes les lectures de tarot retourneront une interprétation exemple. Les crédits seront toujours déduits pour tester le flux complet.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-lg font-medium text-white mb-4">
          {language === 'en' ? 'Environment Info' : 'Info Environnement'}
        </h3>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between p-2 bg-slate-900/50 rounded">
            <span className="text-slate-400">API URL</span>
            <span className="text-slate-300 font-mono">
              {import.meta.env.VITE_API_URL || 'http://localhost:3001'}
            </span>
          </div>
          <div className="flex justify-between p-2 bg-slate-900/50 rounded">
            <span className="text-slate-400">Dev Mode</span>
            <span className={`font-mono ${import.meta.env.VITE_DEV_MODE === 'true' ? 'text-orange-400' : 'text-green-400'}`}>
              {import.meta.env.VITE_DEV_MODE === 'true' ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex justify-between p-2 bg-slate-900/50 rounded">
            <span className="text-slate-400">User ID</span>
            <span className="text-slate-300 font-mono text-xs">
              {user?.id || 'Not logged in'}
            </span>
          </div>
          <div className="flex justify-between p-2 bg-slate-900/50 rounded">
            <span className="text-slate-400">Debug AI Mode</span>
            <span className={`font-mono ${debugAIMode ? 'text-orange-400' : 'text-green-400'}`}>
              {debugAIMode ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDebug;

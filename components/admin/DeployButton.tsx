import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Rocket, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { fetchDeployConfigured, triggerDeploy } from '../../services/api';

type DeployState = 'idle' | 'triggering' | 'triggered' | 'error';

const RESET_DELAY_MS = 8000;

const DeployButton: React.FC = () => {
  const { getToken } = useAuth();
  const [configured, setConfigured] = useState(false);
  const [state, setState] = useState<DeployState>('idle');
  const [error, setError] = useState<string | null>(null);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const { configured } = await fetchDeployConfigured(token);
        if (!cancelled) setConfigured(configured);
      } catch {
        // Silently hide the button if the check itself fails
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  useEffect(() => {
    return () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, []);

  const scheduleReset = () => {
    if (resetRef.current) clearTimeout(resetRef.current);
    resetRef.current = setTimeout(() => setState('idle'), RESET_DELAY_MS);
  };

  const handleDeploy = async () => {
    if (state === 'triggering') return;

    setError(null);
    setState('triggering');

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      await triggerDeploy(token);
      setState('triggered');
      scheduleReset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger deployment');
      setState('error');
      scheduleReset();
    }
  };

  if (!configured) return null;

  const label = {
    idle: 'Deploy now',
    triggering: 'Triggering…',
    triggered: 'Deploy queued ✓',
    error: error || 'Deploy failed',
  }[state];

  const icon = {
    idle: <Rocket className="w-4 h-4" />,
    triggering: <Loader2 className="w-4 h-4 animate-spin" />,
    triggered: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    error: <XCircle className="w-4 h-4 text-red-400" />,
  }[state];

  const colorClasses =
    state === 'triggered'
      ? 'bg-green-500/10 border-green-500/30 text-green-300'
      : state === 'error'
        ? 'bg-red-500/10 border-red-500/30 text-red-300'
        : 'bg-purple-500/10 border-purple-500/30 text-purple-200 hover:bg-purple-500/20';

  return (
    <button
      onClick={handleDeploy}
      disabled={state === 'triggering'}
      title="Redeploy the front-end so newly published articles are pre-rendered immediately (takes a few minutes to go live)"
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors disabled:cursor-not-allowed ${colorClasses}`}
    >
      {icon}
      {label}
    </button>
  );
};

export default DeployButton;

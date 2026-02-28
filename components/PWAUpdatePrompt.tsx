import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every hour
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[300] flex justify-center pointer-events-none">
      <div className="bg-slate-900 border border-purple-500/40 rounded-xl shadow-2xl p-4 flex items-center gap-4 max-w-md pointer-events-auto">
        <p className="text-sm text-slate-300 flex-1">
          A new version is available.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setNeedRefresh(false)}
            className="px-3 py-2 min-h-[44px] text-sm text-slate-400 hover:text-white transition-colors"
          >
            Later
          </button>
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-4 py-2 min-h-[44px] text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;

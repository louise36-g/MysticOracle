import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { frFR } from '@clerk/localizations';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { AppProvider } from './context/AppContext';
import { SpendingLimitsProvider } from './context/SpendingLimitsContext';
import { TranslationProvider } from './context/TranslationContext';
import { ReadingProvider } from './context/ReadingContext';
import { detectLanguageFromPath } from './utils/language';
import App from './App';
import './styles/main.css';

// Defer Sentry initialization until well after LCP to avoid competing for bandwidth
// Sentry's ~150KB vendor chunk must not load during the critical rendering window
const sentryModule = () => import('./config/sentry');
if (typeof window !== 'undefined') {
  const initFn = () => sentryModule().then(m => m.initSentry());
  // Wait 5 seconds — LCP should be complete by then on even slow connections
  setTimeout(() => initFn(), 5000);
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * First-visit language redirect.
 * If the user is on an English path but their saved preference (localStorage) or
 * browser language is French, redirect them to the /fr/ equivalent.
 * Runs ONCE before React mounts so there's no flash of English content.
 *
 * Respects:
 * - Explicit English preference in localStorage (no redirect)
 * - Admin/auth paths (never redirected)
 * - Current /fr/ paths (already French)
 */
(function redirectToPreferredLanguage() {
  try {
    const path = window.location.pathname;

    // Already on French path, no redirect needed
    if (path === '/fr' || path.startsWith('/fr/')) return;

    // Never redirect admin or auth paths (French admin doesn't exist)
    if (path.startsWith('/admin') || path.startsWith('/sign-in') || path.startsWith('/sign-up')) return;

    const saved = localStorage.getItem('celestiarcana-language');

    // User explicitly chose English, respect it
    if (saved === 'en') return;

    // Decide whether to redirect to French:
    // - saved === 'fr' means they previously chose French
    // - no saved value AND browser is French means first visit from a French user
    const shouldRedirect =
      saved === 'fr' ||
      (saved === null && (navigator.language || '').toLowerCase().startsWith('fr'));

    if (shouldRedirect) {
      const frPath = path === '/' ? '/fr' : `/fr${path}`;
      window.location.replace(frPath + window.location.search + window.location.hash);
    }
  } catch {
    // If anything goes wrong (storage disabled, etc.), just continue with the current path
  }
})();

// Global error handler to catch render errors
window.onerror = (message, source, lineno, colno, error) => {
  // Downgrade network errors to warn (expected when API is unavailable)
  const isNetworkError = error?.message?.includes('Failed to fetch') || String(message).includes('Failed to fetch');
  const log = isNetworkError ? console.warn : console.error;
  log('Global error:', { message, source, lineno, colno, error });

  // Capture in Sentry (lazy — module may not be loaded yet on very early errors)
  if (error) {
    sentryModule().then(m => m.captureException(error, { source, lineno, colno })).catch(() => {});
  }

  const root = document.getElementById('root');
  if (root && !root.textContent?.includes('Something went wrong')) {
    // Build DOM elements safely to prevent XSS
    const container = document.createElement('div');
    container.style.cssText = 'color: red; padding: 20px; background: #1a1a2e;';

    const heading = document.createElement('h1');
    heading.textContent = 'Something went wrong';

    const pre = document.createElement('pre');
    pre.textContent = String(message); // Safe: textContent escapes HTML

    const button = document.createElement('button');
    button.textContent = 'Clear Storage & Reload';
    button.onclick = () => { localStorage.clear(); location.reload(); };

    container.appendChild(heading);
    container.appendChild(pre);
    container.appendChild(button);

    // Clear root safely and append new content
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }
    root.appendChild(container);
  }
  return true;
};

window.onunhandledrejection = (event) => {
  // Downgrade network errors to warn (expected when API is unavailable)
  const isNetworkError = event.reason instanceof TypeError && event.reason.message?.includes('Failed to fetch');
  const log = isNetworkError ? console.warn : console.error;
  log('Unhandled promise rejection:', event.reason);
  // Capture in Sentry (lazy)
  if (event.reason instanceof Error) {
    sentryModule().then(m => m.captureException(event.reason as Error)).catch(() => {});
  }
};

// Register service worker for offline support and silent auto-updates
// The SW uses skipWaiting + clientsClaim so new versions take effect immediately.
// We check for updates every hour so mobile users don't get stuck on stale cache.
if ('serviceWorker' in navigator) {
  // Self-healing: if the active SW has a broken cache entry for the JS bundle
  // (returns non-2xx), unregister all SWs and reload so the fresh network
  // response is used. This recovers from deployment race conditions where a
  // SW precached a 404 during a container switchover.
  const entryMeta = document.querySelector<HTMLMetaElement>('meta[name="app-entry"]');
  if (entryMeta && navigator.serviceWorker.controller) {
    fetch(entryMeta.content, { cache: 'no-store' }).then((r) => {
      if (!r.ok) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          Promise.all(regs.map((reg) => reg.unregister())).then(() => location.reload());
        });
      }
    }).catch(() => {});
  }

  // Reload once when a new service worker takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Check for updates every 60 minutes
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    }).catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <HelmetProvider>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        localization={(detectLanguageFromPath(window.location.pathname) === 'fr'
          || localStorage.getItem('celestiarcana-language') === 'fr')
          ? {
              ...frFR,
              unstable__errors: {
                form_identifier_not_found: 'Cette adresse e-mail est introuvable. Veuillez vérifier et réessayer.',
                form_password_incorrect: 'Mot de passe incorrect. Veuillez réessayer.',
                not_allowed_access: 'Cette adresse e-mail n\'est pas valide. Veuillez vérifier et réessayer.',
              },
            }
          : {
              unstable__errors: {
                form_identifier_not_found: 'This email address was not found. Please check and try again.',
                form_password_incorrect: 'Incorrect password. Please try again.',
                not_allowed_access: 'This is not a valid email address. Please check and try again.',
              },
            }
        }
      >
        <TranslationProvider>
          <AppProvider>
            <SpendingLimitsProvider>
              <ReadingProvider>
                <App />
              </ReadingProvider>
            </SpendingLimitsProvider>
          </AppProvider>
        </TranslationProvider>
      </ClerkProvider>
    </HelmetProvider>
  );
}

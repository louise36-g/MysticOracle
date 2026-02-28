// Initialize Sentry first (before any other code runs)
import { initSentry, captureException } from './config/sentry';
initSentry();

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { AppProvider } from './context/AppContext';
import { SpendingLimitsProvider } from './context/SpendingLimitsContext';
import { TranslationProvider } from './context/TranslationContext';
import { ReadingProvider } from './context/ReadingContext';
import App from './App';
import './styles/main.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Global error handler to catch render errors
window.onerror = (message, source, lineno, colno, error) => {
  // Downgrade network errors to warn (expected when API is unavailable)
  const isNetworkError = error?.message?.includes('Failed to fetch') || String(message).includes('Failed to fetch');
  const log = isNetworkError ? console.warn : console.error;
  log('Global error:', { message, source, lineno, colno, error });

  // Capture in Sentry
  if (error) {
    captureException(error, { source, lineno, colno });
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
  // Capture in Sentry
  if (event.reason instanceof Error) {
    captureException(event.reason);
  }
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <HelmetProvider>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        localization={{
          unstable__errors: {
            form_identifier_not_found: 'This email address was not found. Please check and try again.',
            form_password_incorrect: 'Incorrect password. Please try again.',
            not_allowed_access: 'This is not a valid email address. Please check and try again.',
          },
        }}
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

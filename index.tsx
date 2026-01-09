import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { HelmetProvider } from 'react-helmet-async';
import { AppProvider } from './context/AppContext';
import { SpendingLimitsProvider } from './context/SpendingLimitsContext';
import { TranslationProvider } from './context/TranslationContext';
import App from './App';
import './styles/main.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Global error handler to catch render errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error });
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

    root.innerHTML = '';
    root.appendChild(container);
  }
  return true;
};

window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason);
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <HelmetProvider>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <TranslationProvider>
          <AppProvider>
            <SpendingLimitsProvider>
              <App />
            </SpendingLimitsProvider>
          </AppProvider>
        </TranslationProvider>
      </ClerkProvider>
    </HelmetProvider>
  );
}

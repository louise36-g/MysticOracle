import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { AppProvider } from './context/AppContext';
import App from './App';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Global error handler to catch render errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error });
  const root = document.getElementById('root');
  if (root && !root.innerHTML.includes('Error')) {
    root.innerHTML = `<div style="color: red; padding: 20px; background: #1a1a2e;">
      <h1>Something went wrong</h1>
      <pre>${message}</pre>
      <button onclick="localStorage.clear(); location.reload();">Clear Storage & Reload</button>
    </div>`;
  }
  return true;
};

window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason);
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <AppProvider>
        <App />
      </AppProvider>
    </ClerkProvider>
  );
}

/**
 * Google Analytics - GDPR/CNIL Compliant Implementation
 *
 * Analytics is only loaded when the user gives explicit consent.
 * This complies with French CNIL regulations and GDPR requirements.
 */

const GA_MEASUREMENT_ID = 'G-S15MYZYP4Q';

// Track if GA has been initialized
let gaInitialized = false;

/**
 * Initialize Google Analytics (only call after consent is given)
 */
export function initializeAnalytics(): void {
  if (gaInitialized) return;
  if (typeof window === 'undefined') return;

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag - must match Google's expected format exactly
  window.dataLayer = window.dataLayer || [];

  // Standard gtag implementation that pushes arguments directly
  window.gtag = function(...args: unknown[]) {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true, // GDPR: Anonymize IP addresses
    send_page_view: true, // Explicitly send initial page view
  });

  gaInitialized = true;
  console.log('[Analytics] Google Analytics initialized with consent');
}

/**
 * Disable Google Analytics (when user revokes consent)
 */
export function disableAnalytics(): void {
  if (typeof window === 'undefined') return;

  // Set opt-out cookie
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;

  console.log('[Analytics] Google Analytics disabled');
}

/**
 * Check consent and initialize/disable analytics accordingly
 */
export function updateAnalyticsConsent(hasConsent: boolean): void {
  if (hasConsent) {
    initializeAnalytics();
  } else {
    disableAnalytics();
  }
}

// TypeScript declaration for gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

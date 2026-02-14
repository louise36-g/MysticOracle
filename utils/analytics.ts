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

/**
 * Track page view (for SPA route changes)
 * Only tracks if analytics has been initialized (user consented)
 */
export function trackPageView(path: string, title?: string): void {
  if (!gaInitialized || typeof window === 'undefined') return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
}

/**
 * Track custom event
 * Only tracks if analytics has been initialized (user consented)
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (!gaInitialized || typeof window === 'undefined') return;

  window.gtag('event', eventName, params);
}

// ============================================
// Specific Event Tracking Functions
// ============================================

/**
 * Track when user starts a reading
 */
export function trackStartReading(spreadType: string, category?: string): void {
  trackEvent('start_reading', {
    spread_type: spreadType,
    category: category || 'general',
  });
}

/**
 * Track when user completes a reading
 */
export function trackCompleteReading(spreadType: string, category?: string): void {
  trackEvent('complete_reading', {
    spread_type: spreadType,
    category: category || 'general',
  });
}

/**
 * Track when credit shop modal opens
 */
export function trackCreditShopOpen(source: string): void {
  trackEvent('credit_shop_open', {
    source: source, // e.g., 'header', 'low_credits_warning', 'reading_flow'
  });
}

/**
 * Track credit purchase (GA4 recommended e-commerce event)
 * Mark 'purchase' as a conversion in GA4 Admin
 */
export function trackPurchase(
  packageName: string,
  credits: number,
  value: number,
  currency: string = 'EUR',
  paymentMethod: string = 'unknown'
): void {
  trackEvent('purchase', {
    currency: currency,
    value: value,
    items: packageName,
    credits_purchased: credits,
    payment_method: paymentMethod,
  });
}

/**
 * Track scroll depth on content pages (blog, articles)
 * Call this with milestones: 25, 50, 75, 100
 */
export function trackScrollDepth(milestone: number, contentType: string, contentId: string): void {
  trackEvent('scroll_depth', {
    percent_scrolled: milestone,
    content_type: contentType, // 'blog' or 'tarot_article'
    content_id: contentId,
  });
}

/**
 * Track blog article view with metadata
 */
export function trackArticleView(articleSlug: string, category?: string): void {
  trackEvent('article_view', {
    article_slug: articleSlug,
    category: category || 'uncategorized',
  });
}

/**
 * Track tarot card article view
 */
export function trackTarotCardView(cardSlug: string, cardName: string): void {
  trackEvent('tarot_card_view', {
    card_slug: cardSlug,
    card_name: cardName,
  });
}

// TypeScript declaration for gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

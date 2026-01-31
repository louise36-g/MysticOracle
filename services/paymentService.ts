/**
 * Payment Service
 * Re-exports payment functions from apiService with additional utilities
 */

// Re-export payment types and functions from api
export type { CreditPackage } from './api';
export {
  fetchCreditPackages,
  createStripeCheckout,
  verifyStripePayment,
  createPayPalOrder,
  capturePayPalOrder,
  fetchPurchaseHistory,
} from './api';

/**
 * Redirect to Stripe checkout URL
 */
export function redirectToStripeCheckout(url: string): void {
  window.location.href = url;
}

/**
 * Redirect to PayPal approval URL
 */
export function redirectToPayPalApproval(approvalUrl: string): void {
  window.location.href = approvalUrl;
}

/**
 * Get purchase history (alias for fetchPurchaseHistory)
 * @deprecated Use fetchPurchaseHistory instead
 */
export { fetchPurchaseHistory as getPurchaseHistory } from './api';

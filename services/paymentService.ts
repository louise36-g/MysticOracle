/**
 * Payment Service
 * Re-exports payment functions from apiService with additional utilities
 */

// Re-export payment types and functions from apiService
export type { CreditPackage } from './apiService';
export {
  fetchCreditPackages,
  createStripeCheckout,
  verifyStripePayment,
  createPayPalOrder,
  capturePayPalOrder,
  fetchPurchaseHistory,
} from './apiService';

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
export { fetchPurchaseHistory as getPurchaseHistory } from './apiService';

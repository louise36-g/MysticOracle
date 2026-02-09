/**
 * Payments API - Credit packages, Stripe, PayPal
 */

import { apiRequest, generateIdempotencyKey } from './client';
import type { Transaction } from './user';

// ============================================
// CREDIT PACKAGES
// ============================================

export interface CreditPackage {
  id: string;
  credits: number;
  bonusCredits?: number; // Free bonus credits (e.g., "10 + 2 FREE")
  priceEur: number;
  name: string;
  nameEn: string;
  nameFr: string;
  labelEn: string;
  labelFr: string;
  discount: number;
  badge: string | null;
}

export async function fetchCreditPackages(): Promise<CreditPackage[]> {
  return apiRequest('/api/payments/packages');
}

// ============================================
// STRIPE
// ============================================

export async function createStripeCheckout(
  token: string,
  packageId: string,
  useStripeLink = false
): Promise<{ sessionId: string; url: string }> {
  return apiRequest('/api/payments/stripe/checkout', {
    method: 'POST',
    body: { packageId, useStripeLink },
    token,
  });
}

export async function verifyStripePayment(
  token: string,
  sessionId: string
): Promise<{ success: boolean; credits?: number; status?: string }> {
  return apiRequest(`/api/payments/stripe/verify/${sessionId}`, { token });
}

// ============================================
// PAYPAL
// ============================================

export async function createPayPalOrder(
  token: string,
  packageId: string
): Promise<{ orderId: string; approvalUrl: string }> {
  return apiRequest('/api/payments/paypal/order', {
    method: 'POST',
    body: { packageId },
    token,
  });
}

export async function capturePayPalOrder(
  token: string,
  orderId: string
): Promise<{ success: boolean; credits?: number; captureId?: string; status?: string }> {
  // Use idempotency key to prevent double-crediting on network retries
  const idempotencyKey = generateIdempotencyKey();
  return apiRequest('/api/payments/paypal/capture', {
    method: 'POST',
    body: { orderId },
    token,
    idempotencyKey,
  });
}

// ============================================
// PURCHASE HISTORY
// ============================================

export async function fetchPurchaseHistory(token: string): Promise<Transaction[]> {
  return apiRequest('/api/payments/history', { token });
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  return apiRequest('/api/health');
}

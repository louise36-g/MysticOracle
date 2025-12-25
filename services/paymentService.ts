const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface CreditPackage {
  id: string;
  credits: number;
  priceEur: number;
  name: string;
  nameEn: string;
  nameFr: string;
}

// Get auth token from Clerk
async function getAuthToken(): Promise<string | null> {
  // This will be called from components that have access to useAuth
  // For now, we'll pass the token as a parameter
  return null;
}

// Fetch credit packages
export async function fetchCreditPackages(): Promise<CreditPackage[]> {
  try {
    const response = await fetch(`${API_BASE}/payments/packages`);
    if (!response.ok) throw new Error('Failed to fetch packages');
    return response.json();
  } catch (error) {
    console.error('Error fetching packages:', error);
    // Return default packages if API fails
    return [
      { id: 'pack_10', credits: 10, priceEur: 2.99, name: '10 Credits', nameEn: '10 Credits', nameFr: '10 Crédits' },
      { id: 'pack_25', credits: 25, priceEur: 5.99, name: '25 Credits', nameEn: '25 Credits', nameFr: '25 Crédits' },
      { id: 'pack_50', credits: 50, priceEur: 9.99, name: '50 Credits', nameEn: '50 Credits', nameFr: '50 Crédits' },
      { id: 'pack_100', credits: 100, priceEur: 17.99, name: '100 Credits', nameEn: '100 Credits', nameFr: '100 Crédits' },
    ];
  }
}

// Create Stripe checkout session
export async function createStripeCheckout(
  packageId: string,
  token: string,
  useStripeLink: boolean = true
): Promise<{ sessionId: string; url: string }> {
  const response = await fetch(`${API_BASE}/payments/stripe/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ packageId, useStripeLink }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  return response.json();
}

// Redirect to Stripe checkout (uses URL from session)
export function redirectToStripeCheckout(url: string): void {
  window.location.href = url;
}

// Verify Stripe payment
export async function verifyStripePayment(
  sessionId: string,
  token: string
): Promise<{ success: boolean; credits?: number }> {
  const response = await fetch(`${API_BASE}/payments/stripe/verify/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to verify payment');
  }

  return response.json();
}

// Create PayPal order
export async function createPayPalOrder(
  packageId: string,
  token: string
): Promise<{ orderId: string; approvalUrl: string }> {
  const response = await fetch(`${API_BASE}/payments/paypal/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ packageId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create PayPal order');
  }

  return response.json();
}

// Capture PayPal order
export async function capturePayPalOrder(
  orderId: string,
  token: string
): Promise<{ success: boolean; credits?: number }> {
  const response = await fetch(`${API_BASE}/payments/paypal/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to capture PayPal order');
  }

  return response.json();
}

// Get purchase history
export async function getPurchaseHistory(token: string): Promise<any[]> {
  const response = await fetch(`${API_BASE}/payments/history`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch purchase history');
  }

  return response.json();
}

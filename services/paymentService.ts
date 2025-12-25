// VITE_API_URL should be base URL without /api (e.g., http://localhost:3001)
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// Remove trailing /api if present to avoid duplication
const API_BASE = baseUrl.replace(/\/api$/, '') + '/api';

export interface CreditPackage {
  id: string;
  credits: number;
  priceEur: number;
  name: string;
  nameEn: string;
  nameFr: string;
  labelEn: string;
  labelFr: string;
  discount: number;
  badge: string | null;
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
      { id: 'starter', credits: 10, priceEur: 5.00, name: 'Starter', nameEn: 'Starter', nameFr: 'Démarrage', labelEn: 'Try It Out', labelFr: 'Essayez', discount: 0, badge: null },
      { id: 'basic', credits: 25, priceEur: 10.00, name: 'Basic', nameEn: 'Basic', nameFr: 'Basique', labelEn: 'Popular', labelFr: 'Populaire', discount: 20, badge: null },
      { id: 'popular', credits: 60, priceEur: 20.00, name: 'Popular', nameEn: 'Popular', nameFr: 'Populaire', labelEn: '⭐ MOST POPULAR', labelFr: '⭐ LE PLUS POPULAIRE', discount: 34, badge: 'popular' },
      { id: 'value', credits: 100, priceEur: 30.00, name: 'Value', nameEn: 'Value', nameFr: 'Avantage', labelEn: '💰 BEST VALUE', labelFr: '💰 MEILLEUR PRIX', discount: 40, badge: 'value' },
      { id: 'premium', credits: 200, priceEur: 50.00, name: 'Premium', nameEn: 'Premium', nameFr: 'Premium', labelEn: '👑 POWER USER', labelFr: '👑 UTILISATEUR PRO', discount: 50, badge: 'premium' },
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

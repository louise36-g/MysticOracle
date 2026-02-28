/**
 * API Client - Core request handling with retry logic
 * Shared by all API modules
 */

import { apiEndpoint, type ParamValue } from '../apiHelpers';

// VITE_API_URL should be base URL (e.g., http://localhost:3001)
// Remove trailing /api if present to avoid duplication with endpoint paths
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_URL = rawUrl.replace(/\/api$/, '');

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Check if an error is retryable (network errors, 5xx server errors)
 */
function isRetryableError(error: unknown, status?: number): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  // Server errors (5xx)
  if (status && status >= 500 && status < 600) {
    return true;
  }
  // Rate limiting
  if (status === 429) {
    return true;
  }
  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number): number {
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelayMs);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  retry?: boolean; // Enable retry for this request (default: true for GET, false for others)
  idempotencyKey?: string; // For POST requests, enables safe retries
}

/**
 * Generate a unique idempotency key for a request
 * Format: timestamp-random
 */
export function generateIdempotencyKey(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Make an authenticated API request with optional retry logic
 */
export async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token, retry, idempotencyKey } = options;

  // Enable retry by default for GET requests, or for POST with idempotency key
  const hasIdempotency = !!idempotencyKey;
  const shouldRetry = retry ?? (method === 'GET' || hasIdempotency);
  const maxAttempts = shouldRetry ? RETRY_CONFIG.maxRetries : 1;

  let lastError: Error | null = null;
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add idempotency key header for safe POST retries
      if (idempotencyKey) {
        headers['X-Idempotency-Key'] = idempotencyKey;
      }

      const fullUrl = `${API_URL}${endpoint}`;

      const response = await fetch(fullUrl, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });

      lastStatus = response.status;

      if (!response.ok) {
        console.warn(`[apiRequest] Request failed: ${method} ${fullUrl} - Status ${response.status}`);
        const error = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
        const errorMessage = error.error || `API Error: ${response.status}`;

        // Check if we should retry
        if (shouldRetry && isRetryableError(null, response.status) && attempt < maxAttempts - 1) {
          const delay = calculateDelay(attempt);
          console.warn(`API request failed (attempt ${attempt + 1}/${maxAttempts}), retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }

        throw new Error(errorMessage);
      }

      console.log(`[apiRequest] Success: ${method} ${fullUrl} - Status ${response.status}`);

      return response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry network errors
      if (shouldRetry && isRetryableError(error, lastStatus) && attempt < maxAttempts - 1) {
        const delay = calculateDelay(attempt);
        console.warn(`API request failed (attempt ${attempt + 1}/${maxAttempts}), retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error('Request failed after max retries');
}

// Re-export apiEndpoint helper for convenience
export { apiEndpoint, type ParamValue };

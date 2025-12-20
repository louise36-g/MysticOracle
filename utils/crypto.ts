/**
 * Generate a cryptographically secure random token
 * Uses crypto.getRandomValues() instead of Math.random()
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a short referral code (username prefix + random suffix)
 */
export function generateReferralCode(username: string): string {
  const prefix = username.substring(0, 3).toUpperCase();
  const array = new Uint8Array(2);
  crypto.getRandomValues(array);
  const suffix = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `${prefix}${suffix}`;
}

/**
 * Generate a verification token with expiry
 */
export function generateVerificationToken(): { token: string; expiresAt: number } {
  return {
    token: generateSecureToken(16),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
}

/**
 * Simple hash function for passwords (client-side only)
 * Note: For production, use bcrypt/argon2 on the backend
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

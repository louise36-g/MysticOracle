/**
 * Input validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  return { isValid: true };
}

export function validatePassword(password: string, minLength: number = 8): ValidationResult {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters` };
  }
  return { isValid: true };
}

export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  return { isValid: true };
}

export function validateUsername(username: string, minLength: number = 3, maxLength: number = 20): ValidationResult {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Username is required' };
  }
  if (username.length < minLength) {
    return { isValid: false, error: `Username must be at least ${minLength} characters` };
  }
  if (username.length > maxLength) {
    return { isValid: false, error: `Username must be less than ${maxLength} characters` };
  }
  return { isValid: true };
}

export function validateQuestion(question: string): ValidationResult {
  if (!question || question.trim().length === 0) {
    return { isValid: false, error: 'Please enter a question' };
  }
  return { isValid: true };
}

/**
 * Check if email is from a free provider (for reputation scoring)
 */
const FREE_EMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'aol.com', 'mail.com', 'protonmail.com', 'icloud.com',
  'yandex.com', 'gmx.com', 'zoho.com'
];

export function isFreeEmailProvider(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? FREE_EMAIL_PROVIDERS.includes(domain) : false;
}

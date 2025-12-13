/**
 * CSRF (Cross-Site Request Forgery) Protection
 *
 * This module provides CSRF token generation and validation
 * to protect against cross-site request forgery attacks.
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_EXPIRY_KEY = 'csrf_token_expiry';
const TOKEN_VALIDITY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create a CSRF token
 * Creates a new token if none exists or if the existing one has expired
 */
export function getCsrfToken(): string {
  try {
    const existingToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    const expiryStr = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
    const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;

    // Return existing token if valid
    if (existingToken && expiry > Date.now()) {
      return existingToken;
    }

    // Generate new token
    const newToken = generateSecureToken();
    const newExpiry = Date.now() + TOKEN_VALIDITY_MS;

    sessionStorage.setItem(CSRF_TOKEN_KEY, newToken);
    sessionStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, newExpiry.toString());

    return newToken;
  } catch {
    // If sessionStorage is not available, generate a temporary token
    return generateSecureToken();
  }
}

/**
 * Validate a CSRF token
 */
export function validateCsrfToken(token: string): boolean {
  try {
    const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    const expiryStr = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
    const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;

    // Check token matches and hasn't expired
    if (!storedToken || !token) {
      return false;
    }

    if (expiry <= Date.now()) {
      // Token expired, clear it
      clearCsrfToken();
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(token, storedToken);
  } catch {
    return false;
  }
}

/**
 * Clear the CSRF token (useful after logout)
 */
export function clearCsrfToken(): void {
  try {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
    sessionStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Rotate the CSRF token (generate new one)
 * Call this after sensitive operations for added security
 */
export function rotateCsrfToken(): string {
  clearCsrfToken();
  return getCsrfToken();
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * CSRF header name for API requests
 */
export const CSRF_HEADER = 'X-CSRF-Token';

/**
 * Create headers with CSRF token for fetch requests
 */
export function createCsrfHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    ...additionalHeaders,
    [CSRF_HEADER]: getCsrfToken(),
  };
}

/**
 * Shared CSRF utilities for Edge Functions
 */

export const CSRF_HEADER = 'x-csrf-token';

/**
 * Extract CSRF token from request headers
 */
export function extractCsrfToken(req: Request): string | null {
  return req.headers.get(CSRF_HEADER);
}

/**
 * Validate that a CSRF token is present and well-formed
 * Note: The actual token validation happens client-side since tokens are stored in sessionStorage
 * Server-side we ensure the header is present and has a valid format
 */
export function validateCsrfTokenFormat(token: string | null): boolean {
  if (!token) {
    return false;
  }

  // Token should be a 64-character hex string (32 bytes)
  if (token.length !== 64) {
    return false;
  }

  // Token should only contain hex characters
  return /^[0-9a-f]+$/i.test(token);
}

/**
 * Middleware to check CSRF token on state-changing requests
 */
export function requireCsrfToken(req: Request): { valid: boolean; error?: string } {
  // Skip CSRF check for OPTIONS (preflight) and GET requests
  if (req.method === 'OPTIONS' || req.method === 'GET' || req.method === 'HEAD') {
    return { valid: true };
  }

  const token = extractCsrfToken(req);

  if (!validateCsrfTokenFormat(token)) {
    return {
      valid: false,
      error: 'Invalid or missing CSRF token',
    };
  }

  return { valid: true };
}

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCsrfToken,
  validateCsrfToken,
  clearCsrfToken,
  rotateCsrfToken,
  createCsrfHeaders,
  CSRF_HEADER,
} from '../csrf';

describe('CSRF Protection', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  describe('getCsrfToken', () => {
    it('should generate a new token when none exists', () => {
      const token = getCsrfToken();
      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes * 2 hex chars
    });

    it('should return the same token on subsequent calls', () => {
      const token1 = getCsrfToken();
      const token2 = getCsrfToken();
      expect(token1).toBe(token2);
    });

    it('should generate hex string format', () => {
      const token = getCsrfToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should store token in sessionStorage', () => {
      const token = getCsrfToken();
      expect(sessionStorage.getItem('csrf_token')).toBe(token);
    });

    it('should generate new token when expired', () => {
      const token1 = getCsrfToken();

      // Simulate expired token by setting expiry in the past
      sessionStorage.setItem('csrf_token_expiry', '0');

      const token2 = getCsrfToken();
      expect(token2).not.toBe(token1);
    });
  });

  describe('validateCsrfToken', () => {
    it('should return true for valid token', () => {
      const token = getCsrfToken();
      expect(validateCsrfToken(token)).toBe(true);
    });

    it('should return false for invalid token', () => {
      getCsrfToken();
      expect(validateCsrfToken('invalid-token')).toBe(false);
    });

    it('should return false for empty token', () => {
      getCsrfToken();
      expect(validateCsrfToken('')).toBe(false);
    });

    it('should return false when no stored token exists', () => {
      expect(validateCsrfToken('some-token')).toBe(false);
    });

    it('should return false for expired token', () => {
      const token = getCsrfToken();

      // Simulate expired token
      sessionStorage.setItem('csrf_token_expiry', '0');

      expect(validateCsrfToken(token)).toBe(false);
    });

    it('should clear expired tokens', () => {
      const token = getCsrfToken();
      sessionStorage.setItem('csrf_token_expiry', '0');

      validateCsrfToken(token);

      expect(sessionStorage.getItem('csrf_token')).toBeNull();
    });
  });

  describe('clearCsrfToken', () => {
    it('should remove token from sessionStorage', () => {
      getCsrfToken();
      expect(sessionStorage.getItem('csrf_token')).not.toBeNull();

      clearCsrfToken();

      expect(sessionStorage.getItem('csrf_token')).toBeNull();
      expect(sessionStorage.getItem('csrf_token_expiry')).toBeNull();
    });

    it('should not throw when no token exists', () => {
      expect(() => clearCsrfToken()).not.toThrow();
    });
  });

  describe('rotateCsrfToken', () => {
    it('should generate a new token', () => {
      const token1 = getCsrfToken();
      const token2 = rotateCsrfToken();

      expect(token2).not.toBe(token1);
    });

    it('should return a valid token', () => {
      const token = rotateCsrfToken();
      expect(validateCsrfToken(token)).toBe(true);
    });
  });

  describe('createCsrfHeaders', () => {
    it('should include CSRF token header', () => {
      const token = getCsrfToken();
      const headers = createCsrfHeaders();

      expect(headers[CSRF_HEADER]).toBe(token);
    });

    it('should merge with additional headers', () => {
      const headers = createCsrfHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      });

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers.Authorization).toBe('Bearer token');
      expect(headers[CSRF_HEADER]).toBeDefined();
    });

    it('should use correct header name', () => {
      expect(CSRF_HEADER).toBe('X-CSRF-Token');
    });
  });

  describe('sessionStorage unavailable', () => {
    it('should handle sessionStorage errors gracefully', () => {
      // Mock sessionStorage to throw
      const originalGetItem = sessionStorage.getItem;
      sessionStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      // Should not throw and should return a temporary token
      expect(() => getCsrfToken()).not.toThrow();
      const token = getCsrfToken();
      expect(token).toBeDefined();
      expect(token.length).toBe(64);

      // Restore
      sessionStorage.getItem = originalGetItem;
    });
  });
});

/**
 * Rate Limiting Utility
 * Client-side rate limiting for auth and API operations
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations
export const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 60 * 1000 }, // 5 attempts per minute
  passwordReset: { maxAttempts: 3, windowMs: 60 * 1000 }, // 3 per minute
  signup: { maxAttempts: 3, windowMs: 60 * 1000 }, // 3 per minute
  mfaVerify: { maxAttempts: 5, windowMs: 60 * 1000 }, // 5 per minute
  apiCall: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 per minute
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // milliseconds until reset
  retryAfter?: number; // seconds to wait if blocked
}

/**
 * Generate a rate limit key based on action and identifier
 */
function getRateLimitKey(action: RateLimitAction, identifier: string): string {
  return `${action}:${identifier}`;
}

/**
 * Check if an action is allowed under rate limits
 */
export function checkRateLimit(
  action: RateLimitAction,
  identifier: string = "global"
): RateLimitResult {
  const config = RATE_LIMITS[action];
  const key = getRateLimitKey(action, identifier);
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Reset if window has passed
  if (!entry || now >= entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  const remaining = Math.max(0, config.maxAttempts - entry.count);
  const resetIn = Math.max(0, entry.resetTime - now);

  if (entry.count >= config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      retryAfter: Math.ceil(resetIn / 1000),
    };
  }

  return {
    allowed: true,
    remaining: remaining - 1, // After this action
    resetIn,
  };
}

/**
 * Record an action attempt (call after checkRateLimit if proceeding)
 */
export function recordRateLimitAttempt(
  action: RateLimitAction,
  identifier: string = "global"
): void {
  const config = RATE_LIMITS[action];
  const key = getRateLimitKey(action, identifier);
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
  } else {
    entry.count++;
  }

  rateLimitStore.set(key, entry);
}

/**
 * Reset rate limit for an action (e.g., after successful login)
 */
export function resetRateLimit(
  action: RateLimitAction,
  identifier: string = "global"
): void {
  const key = getRateLimitKey(action, identifier);
  rateLimitStore.delete(key);
}

/**
 * Wrapper function that enforces rate limiting
 */
export async function withRateLimit<T>(
  action: RateLimitAction,
  identifier: string,
  fn: () => Promise<T>
): Promise<T> {
  const check = checkRateLimit(action, identifier);

  if (!check.allowed) {
    throw new RateLimitError(
      `Too many attempts. Please try again in ${check.retryAfter} seconds.`,
      check.retryAfter || 60
    );
  }

  recordRateLimitAttempt(action, identifier);

  try {
    const result = await fn();
    // On success, optionally reset the limit
    if (action === "login" || action === "mfaVerify") {
      resetRateLimit(action, identifier);
    }
    return result;
  } catch (error) {
    // Don't reset on error - let limit stay
    throw error;
  }
}

/**
 * Custom error for rate limiting
 */
export class RateLimitError extends Error {
  retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every 5 minutes
if (typeof window !== "undefined") {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Get rate limit status for UI display
 */
export function getRateLimitStatus(
  action: RateLimitAction,
  identifier: string = "global"
): {
  attempts: number;
  maxAttempts: number;
  isLimited: boolean;
  resetIn: number;
} {
  const config = RATE_LIMITS[action];
  const key = getRateLimitKey(action, identifier);
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetTime) {
    return {
      attempts: 0,
      maxAttempts: config.maxAttempts,
      isLimited: false,
      resetIn: 0,
    };
  }

  return {
    attempts: entry.count,
    maxAttempts: config.maxAttempts,
    isLimited: entry.count >= config.maxAttempts,
    resetIn: Math.max(0, entry.resetTime - now),
  };
}

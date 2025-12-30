/**
 * Sentry Error Tracking Configuration
 * Initializes Sentry for production error monitoring
 */

import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PRODUCTION = import.meta.env.PROD;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

/**
 * Initialize Sentry error tracking
 * Should be called in main.tsx before React renders
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.log("Sentry DSN not configured, error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: IS_PRODUCTION ? "production" : "development",
    release: `soluly@${APP_VERSION}`,

    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance sampling
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0, // 10% in prod, 100% in dev
    tracePropagationTargets: ["localhost", /^https:\/\/.*\.supabase\.co/],

    // Session replay sampling
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (!IS_PRODUCTION && !import.meta.env.VITE_SENTRY_DEV) {
        return null;
      }

      // Filter out common non-actionable errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore network errors that are expected
        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("Load failed")
        ) {
          // Still log network errors but at lower priority
          event.level = "warning";
        }

        // Ignore user-triggered cancellations
        if (
          error.name === "AbortError" ||
          error.message.includes("user aborted")
        ) {
          return null;
        }
      }

      return event;
    },

    // Sensitive data scrubbing
    beforeSendTransaction(event) {
      // Remove sensitive URL parameters
      if (event.request?.query_string) {
        const params = new URLSearchParams(event.request.query_string);
        ["token", "password", "secret", "key", "api_key"].forEach((param) => {
          if (params.has(param)) {
            params.set(param, "[FILTERED]");
          }
        });
        event.request.query_string = params.toString();
      }
      return event;
    },
  });
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  name?: string;
  organizationId?: string;
  organizationName?: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });

  Sentry.setContext("organization", {
    id: user.organizationId,
    name: user.organizationName,
  });

  Sentry.setTag("user.role", user.role || "unknown");
  Sentry.setTag("organization.id", user.organizationId || "unknown");
}

/**
 * Clear user context on logout
 */
export function clearSentryUser() {
  Sentry.setUser(null);
  Sentry.setContext("organization", null);
}

/**
 * Capture an exception with additional context
 */
export function captureError(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
) {
  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  }

  if (context?.extra) {
    Sentry.setContext("additional", context.extra);
  }

  Sentry.captureException(error, {
    level: context?.level || "error",
  });
}

/**
 * Capture a message for non-error events
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  extra?: Record<string, unknown>
) {
  Sentry.captureMessage(message, {
    level,
    extra,
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = "info"
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({
    name,
    op,
    forceTransaction: true,
  });
}

/**
 * Wrap an async function with error tracking
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  context: {
    operation: string;
    tags?: Record<string, string>;
  }
): Promise<T> {
  const span = startTransaction(context.operation, "function");

  try {
    const result = await fn();
    span?.setStatus({ code: 1, message: "ok" });
    return result;
  } catch (error) {
    span?.setStatus({ code: 2, message: "error" });
    captureError(error, { tags: context.tags });
    throw error;
  } finally {
    span?.end();
  }
}

// Export Sentry for direct usage in error boundaries
export { Sentry };

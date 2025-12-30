/**
 * Structured Logging Utility
 * Provides consistent logging across the application with
 * integration to Sentry and PostHog
 */

import { captureError, captureMessage, addBreadcrumb } from "./sentry";
import { posthog } from "./posthog";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  resource?: string;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: LogContext;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level based on environment
const MIN_LOG_LEVEL: LogLevel = import.meta.env.PROD ? "info" : "debug";

// Generate unique request ID for correlation
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// Current request ID (set per request/action)
let currentRequestId: string = generateRequestId();

/**
 * Set a new request ID for correlation
 */
export function setRequestId(id?: string): string {
  currentRequestId = id || generateRequestId();
  return currentRequestId;
}

/**
 * Get current request ID
 */
export function getRequestId(): string {
  return currentRequestId;
}

/**
 * Format log entry for console output
 */
function formatLogEntry(entry: LogEntry): string {
  const { level, message, timestamp, context } = entry;
  const contextStr = Object.keys(context).length > 0
    ? ` ${JSON.stringify(context)}`
    : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Should this log level be output?
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context: LogContext = {}) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      requestId: context.requestId || currentRequestId,
    },
  };

  // Console output
  const formatted = formatLogEntry(entry);
  switch (level) {
    case "debug":
      console.debug(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }

  // Add breadcrumb for Sentry
  addBreadcrumb("app", message, entry.context, level === "error" ? "error" : "info");

  // Track in PostHog for analytics
  if (level === "error" || level === "warn") {
    posthog.capture(`log_${level}`, {
      message,
      ...entry.context,
    });
  }

  // Send errors to Sentry
  if (level === "error") {
    captureMessage(message, "error", entry.context);
  }
}

/**
 * Logger object with level-specific methods
 */
export const logger = {
  /**
   * Debug level - detailed information for debugging
   */
  debug(message: string, context?: LogContext) {
    log("debug", message, context);
  },

  /**
   * Info level - general operational information
   */
  info(message: string, context?: LogContext) {
    log("info", message, context);
  },

  /**
   * Warn level - something unexpected but not critical
   */
  warn(message: string, context?: LogContext) {
    log("warn", message, context);
  },

  /**
   * Error level - something failed
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      errorName: error instanceof Error ? error.name : "Unknown",
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    };

    log("error", message, errorContext);

    // Also capture the actual error in Sentry
    if (error) {
      captureError(error, {
        extra: errorContext,
        tags: {
          component: context?.component || "unknown",
          action: context?.action || "unknown",
        },
      });
    }
  },

  /**
   * Log an API request
   */
  apiRequest(
    method: string,
    endpoint: string,
    context?: LogContext
  ) {
    log("info", `API ${method} ${endpoint}`, {
      ...context,
      action: "api_request",
      method,
      endpoint,
    });
  },

  /**
   * Log an API response
   */
  apiResponse(
    method: string,
    endpoint: string,
    status: number,
    duration: number,
    context?: LogContext
  ) {
    const level: LogLevel = status >= 400 ? "error" : "info";
    log(level, `API ${method} ${endpoint} -> ${status} (${duration}ms)`, {
      ...context,
      action: "api_response",
      method,
      endpoint,
      status,
      duration,
    });
  },

  /**
   * Log a user action
   */
  userAction(action: string, resource: string, context?: LogContext) {
    log("info", `User ${action} ${resource}`, {
      ...context,
      action,
      resource,
    });
  },

  /**
   * Log a security event
   */
  security(event: string, context?: LogContext) {
    log("warn", `Security: ${event}`, {
      ...context,
      action: "security_event",
      event,
    });
  },

  /**
   * Log a performance metric
   */
  performance(metric: string, value: number, context?: LogContext) {
    log("info", `Performance: ${metric} = ${value}ms`, {
      ...context,
      action: "performance",
      metric,
      duration: value,
    });
  },

  /**
   * Create a child logger with preset context
   */
  child(defaultContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        logger.debug(message, { ...defaultContext, ...context }),
      info: (message: string, context?: LogContext) =>
        logger.info(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        logger.warn(message, { ...defaultContext, ...context }),
      error: (message: string, error?: Error | unknown, context?: LogContext) =>
        logger.error(message, error, { ...defaultContext, ...context }),
    };
  },

  /**
   * Time an operation and log its duration
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = Math.round(performance.now() - start);
      logger.performance(operation, duration, context);
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      logger.error(`${operation} failed after ${duration}ms`, error, context);
      throw error;
    }
  },
};

export default logger;

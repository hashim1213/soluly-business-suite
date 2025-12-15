import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST;

// Initialize PostHog
export function initPostHog() {
  if (!POSTHOG_KEY || !POSTHOG_HOST) {
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false, // We handle this for SPA
    capture_pageleave: true,
    autocapture: true,
    persistence: "localStorage+cookie",
  });
}

// Identify user after login
export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    organizationId?: string;
    organizationName?: string;
    role?: string;
  }
) {
  if (!POSTHOG_KEY) return;

  posthog.identify(userId, {
    email: properties?.email,
    name: properties?.name,
    organization_id: properties?.organizationId,
    organization_name: properties?.organizationName,
    role: properties?.role,
  });

  if (properties?.organizationId) {
    posthog.group("organization", properties.organizationId, {
      name: properties.organizationName,
    });
  }
}

// Reset user on logout
export function resetUser() {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}

// Track page view
export function trackPageView() {
  if (!POSTHOG_KEY) return;
  posthog.capture("$pageview");
}

// Track custom event (use sparingly)
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  posthog.capture(eventName, properties);
}

export { posthog };

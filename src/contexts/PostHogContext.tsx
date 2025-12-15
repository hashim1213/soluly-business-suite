import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import {
  initPostHog,
  identifyUser,
  resetUser,
  trackPageView,
} from "@/lib/posthog";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, member, organization, role } = useAuth();
  const isInitialized = useRef(false);
  const lastIdentifiedUserId = useRef<string | null>(null);

  // Initialize PostHog once
  useEffect(() => {
    if (!isInitialized.current) {
      initPostHog();
      isInitialized.current = true;
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (isInitialized.current) {
      trackPageView();
    }
  }, [location.pathname, location.search]);

  // Identify user when logged in, reset on logout
  useEffect(() => {
    if (user && member && organization) {
      if (lastIdentifiedUserId.current !== user.id) {
        identifyUser(user.id, {
          email: user.email,
          name: member.name,
          organizationId: organization.id,
          organizationName: organization.name,
          role: role?.name,
        });
        lastIdentifiedUserId.current = user.id;
      }
    } else if (!user && lastIdentifiedUserId.current) {
      resetUser();
      lastIdentifiedUserId.current = null;
    }
  }, [user, member, organization, role]);

  return <>{children}</>;
}

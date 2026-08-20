import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getBaseDomain, isSubdomainCapable } from '@/lib/tenant';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

/**
 * Session storage shared across org subdomains (acme.soluly.com etc.).
 *
 * localStorage is per-origin, so a session created on the apex domain would
 * be invisible on a tenant subdomain. In subdomain deployments the session
 * is kept in cookies scoped to `.<base-domain>` instead. Sessions are larger
 * than the ~4KB per-cookie limit, so the value is URL-encoded and split into
 * numbered chunks (key.0, key.1, ...).
 */
const COOKIE_CHUNK_SIZE = 3500;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // supabase-js refreshes tokens itself

function cookieAttributes(maxAge: number): string {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  return `; Domain=.${getBaseDomain()}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function readCookie(name: string): string | null {
  const entry = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : null;
}

const crossSubdomainStorage = {
  getItem(key: string): string | null {
    const chunks: string[] = [];
    for (let i = 0; ; i++) {
      const chunk = readCookie(`${key}.${i}`);
      if (chunk === null) break;
      chunks.push(chunk);
    }
    if (chunks.length > 0) {
      try {
        return decodeURIComponent(chunks.join(''));
      } catch {
        return null;
      }
    }
    // Migrate sessions that predate cookie storage so users stay signed in
    try {
      const legacy = localStorage.getItem(key);
      if (legacy !== null) {
        crossSubdomainStorage.setItem(key, legacy);
        localStorage.removeItem(key);
        return legacy;
      }
    } catch {
      // localStorage unavailable
    }
    return null;
  },
  setItem(key: string, value: string): void {
    const encoded = encodeURIComponent(value);
    const chunkCount = Math.ceil(encoded.length / COOKIE_CHUNK_SIZE) || 1;
    for (let i = 0; i < chunkCount; i++) {
      const chunk = encoded.slice(i * COOKIE_CHUNK_SIZE, (i + 1) * COOKIE_CHUNK_SIZE);
      document.cookie = `${key}.${i}=${chunk}${cookieAttributes(COOKIE_MAX_AGE)}`;
    }
    // Clear any leftover chunks from a previously longer value
    for (let i = chunkCount; ; i++) {
      if (readCookie(`${key}.${i}`) === null) break;
      document.cookie = `${key}.${i}=${cookieAttributes(0)}`;
    }
  },
  removeItem(key: string): void {
    for (let i = 0; ; i++) {
      if (readCookie(`${key}.${i}`) === null) break;
      document.cookie = `${key}.${i}=${cookieAttributes(0)}`;
    }
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: isSubdomainCapable() ? crossSubdomainStorage : localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

supabase.auth.onAuthStateChange((event) => {
  if (event === "TOKEN_REFRESHED") return;
  if (event === "SIGNED_OUT") {
    const on = window.location.pathname;
    if (on !== "/login" && on !== "/signup" && on !== "/auth/callback") {
      window.location.replace("/login");
    }
  }
});

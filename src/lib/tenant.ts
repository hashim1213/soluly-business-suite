/**
 * Subdomain tenancy (Harvest/Atlassian style): each organization lives at
 * `<slug>.<base-domain>` (e.g. acme.soluly.com) instead of /org/<slug>.
 *
 * The app runs in one of two modes:
 * - Subdomain mode: VITE_APP_BASE_DOMAIN is set AND the current hostname is
 *   that domain or a subdomain of it. Org routes mount at "/" and the org is
 *   resolved from the hostname.
 * - Path mode (fallback): everything else — local dev without the env var,
 *   Electron, and preview deployments — keeps the /org/<slug> URLs.
 */

import { isElectron } from "@/lib/platform";

// Hostnames that are never organization slugs
const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "mail", "admin", "id", "auth"]);

export function getBaseDomain(): string | null {
  const base = import.meta.env.VITE_APP_BASE_DOMAIN as string | undefined;
  return base ? base.toLowerCase().replace(/^\.+/, "").replace(/\/+$/, "") : null;
}

/**
 * Whether the current host participates in subdomain tenancy at all
 * (apex OR a tenant subdomain). Controls cookie-based session sharing.
 */
export function isSubdomainCapable(): boolean {
  if (typeof window === "undefined" || isElectron()) return false;
  const base = getBaseDomain();
  if (!base) return false;
  const host = window.location.hostname.toLowerCase();
  return host === base || host.endsWith(`.${base}`);
}

/** The org slug encoded in the hostname, or null when on the apex domain. */
export function getTenantSlug(): string | null {
  if (!isSubdomainCapable()) return null;
  const base = getBaseDomain()!;
  const host = window.location.hostname.toLowerCase();
  if (host === base) return null;
  const prefix = host.slice(0, -(base.length + 1)); // strip ".base"
  // Nested subdomains (a.b.base) are not tenant hosts
  if (!prefix || prefix.includes(".")) return null;
  if (RESERVED_SUBDOMAINS.has(prefix)) return null;
  return prefix;
}

/** Origin for an organization's workspace, preserving protocol and port. */
export function orgOrigin(slug: string): string {
  const base = getBaseDomain();
  const { protocol, port } = window.location;
  const portSuffix = port && port !== "80" && port !== "443" ? `:${port}` : "";
  return `${protocol}//${slug}.${base}${portSuffix}`;
}

/** Absolute URL into an organization's workspace (subdomain mode only). */
export function orgHref(slug: string, path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${orgOrigin(slug)}${cleanPath}`;
}

/** Origin of the apex domain (login/signup/marketing). */
export function apexOrigin(): string {
  const base = getBaseDomain();
  const { protocol, port } = window.location;
  const portSuffix = port && port !== "80" && port !== "443" ? `:${port}` : "";
  return `${protocol}//${base}${portSuffix}`;
}

/**
 * The user-facing workspace address for a slug, for display in forms:
 * "acme.soluly.com" in subdomain deployments, "/org/acme" otherwise.
 */
export function workspaceAddress(slug: string): string {
  const base = getBaseDomain();
  return base ? `${slug}.${base}` : `/org/${slug}`;
}

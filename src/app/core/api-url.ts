type WayfarerRuntimeConfig = {
  apiBaseUrl?: string;
};

const PRODUCTION_API_BASE_URL = 'https://wayfarer-api-p4by.onrender.com';

declare global {
  interface Window {
    wayfarerConfig?: WayfarerRuntimeConfig;
  }
}

/** Resolve public runtime configuration, falling back safely when a Pages
 * preview or cached deployment serves an empty/missing app-config.js. */
export function resolveApiBaseUrl(configuredBaseUrl: string | undefined, hostname: string): string {
  const configured = configuredBaseUrl?.trim().replace(/\/+$/, '');
  if (configured) return configured;

  const normalizedHostname = hostname.toLowerCase();
  const isLocalhost = normalizedHostname === 'localhost'
    || normalizedHostname === '127.0.0.1'
    || normalizedHostname === '[::1]'
    || normalizedHostname.endsWith('.localhost');
  return isLocalhost ? '' : PRODUCTION_API_BASE_URL;
}

const apiBaseUrl = typeof window === 'undefined'
  ? ''
  : resolveApiBaseUrl(window.wayfarerConfig?.apiBaseUrl, window.location.hostname);

/** Prefix API paths with the public, runtime-configured backend URL. */
export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

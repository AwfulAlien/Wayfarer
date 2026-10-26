type WayfarerRuntimeConfig = {
  apiBaseUrl?: string;
};

declare global {
  interface Window {
    wayfarerConfig?: WayfarerRuntimeConfig;
  }
}

const apiBaseUrl = typeof window === 'undefined'
  ? ''
  : (window.wayfarerConfig?.apiBaseUrl ?? '').trim().replace(/\/+$/, '');

/** Prefix API paths with the public, runtime-configured backend URL. */
export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

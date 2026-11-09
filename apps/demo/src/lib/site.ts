import 'server-only';

import { env } from './env';

export function appUrl(): URL {
  return new URL(env().APP_URL);
}

export function appOrigin(): string {
  return appUrl().origin;
}

export function isOwnOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  try {
    return new URL(origin).origin === appOrigin();
  } catch {
    return false;
  }
}

/** A URL on this app to return to after login; anything else falls back to the auth page. */
export function safeReturnTo(value: string | null | undefined, fallbackPath = '/auth'): string {
  const fallback = `${appOrigin()}${fallbackPath}`;
  if (!value) return fallback;
  try {
    const url = new URL(value, appOrigin());
    return isOwnOrigin(url.origin) ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

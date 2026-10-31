import { getSessionCookie } from 'better-auth/cookies';

/** Cheap check for the proxy/middleware: is there a Better Auth session cookie at all? */
export function hasSessionCookie(request: Request, cookiePrefix: string): boolean {
  return getSessionCookie(request, { cookiePrefix }) !== null;
}

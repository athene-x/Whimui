// Paths and names shared by the browser, the proxy and the server. No server-only imports here.

export const LOGIN_PATH = '/api/auth/login';
export const LOGOUT_PATH = '/api/auth/logout';
export const END_KEYCLOAK_SESSION_PATH = '/api/auth/end-keycloak-session';
export const BACKCHANNEL_LOGOUT_PATH = '/api/auth/backchannel-logout';
export const RETURN_TO_PARAM = 'returnTo';

/** Better Auth cookie prefix: the session cookie is `demo.session_token`. */
export const COOKIE_PREFIX = 'demo';

export function loginPath(returnTo?: string): string {
  if (!returnTo) return LOGIN_PATH;
  return `${LOGIN_PATH}?${new URLSearchParams({ [RETURN_TO_PARAM]: returnTo })}`;
}

import 'server-only';

import { decodeJwtPayload, isKeycloakSessionRevoked } from '@athene-x/whimui/auth';
import { isAPIError } from 'better-auth/api';
import { headers } from 'next/headers';
import { cache } from 'react';

import { auth } from './auth';

export type KeycloakTokens = {
  accessToken?: string;
  accessTokenExpiresAt?: Date;
  idToken?: string;
};

export type SessionUser = { id: string; name: string; email: string };

export type SessionState =
  /** No Better Auth session cookie, or it has expired. */
  | { kind: 'none' }
  /** The cookie is there but Keycloak refused to refresh the tokens. */
  | { kind: 'tokens-unavailable'; user: SessionUser }
  /** Keycloak ended this session through back-channel logout; the cookie is now worthless. */
  | { kind: 'revoked'; user: SessionUser; sid: string }
  | {
      kind: 'active';
      user: SessionUser;
      expiresAt: Date;
      tokens: KeycloakTokens;
      sid: string | null;
    };

/** Everything the auth page wants to show. Read once per request. */
export const getSessionState = cache(async (): Promise<SessionState> => {
  const requestHeaders = await headers();
  const session = await auth().api.getSession({ headers: requestHeaders });
  if (!session) return { kind: 'none' };

  const user = { id: session.user.id, name: session.user.name, email: session.user.email };
  const tokens = await getKeycloakTokens();
  if (!tokens) return { kind: 'tokens-unavailable', user };

  const sid = tokens.idToken
    ? (decodeJwtPayload<{ sid?: string }>(tokens.idToken)?.sid ?? null)
    : null;
  if (sid && isKeycloakSessionRevoked(sid)) return { kind: 'revoked', user, sid };

  return { kind: 'active', user, expiresAt: session.session.expiresAt, tokens, sid };
});

/** The logged-in user, or `null` once Keycloak has ended the login. */
export const getSession = cache(async () => {
  const state = await getSessionState();
  return state.kind === 'active' ? state : null;
});

/** Keycloak access token for calling the API, refreshed by Better Auth when it has expired. */
export const getAccessToken = cache(async (): Promise<string | null> => {
  return (await getSession())?.tokens.accessToken ?? null;
});

/** Tokens from the account cookie; `null` when there is no login or Keycloak refused a refresh. */
const getKeycloakTokens = cache(async (): Promise<KeycloakTokens | null> => {
  const requestHeaders = await headers();
  try {
    return await auth().api.getAccessToken({
      body: { useAccountCookie: true },
      headers: requestHeaders,
    });
  } catch (error) {
    if (isAPIError(error)) return null;
    throw error;
  }
});

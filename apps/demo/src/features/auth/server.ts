import 'server-only';

import { ApiError } from '@athene-x/whimui/api';
import { decodeJwtPayload, hasSessionCookie } from '@athene-x/whimui/auth';
import { headers } from 'next/headers';

import { serverApi } from '@/lib/api-server';
import { COOKIE_PREFIX } from '@/lib/auth-urls';
import { backchannelEvents } from '@/lib/backchannel-log';
import { env } from '@/lib/env';
import { keycloak } from '@/lib/keycloak';
import { getSessionState, type SessionState } from '@/lib/session';
import { appUrl } from '@/lib/site';

import type { AuthCheck, AuthOverview, ServerCallResult } from './types';

type AccessClaims = {
  iss?: string;
  aud?: string | string[];
  azp?: string;
  sid?: string;
  exp?: number;
  typ?: string;
  scope?: string;
};

export async function getAuthOverview(): Promise<AuthOverview> {
  const requestHeaders = await headers();
  const hasCookie = hasSessionCookie(
    new Request(appUrl(), { headers: requestHeaders }),
    COOKIE_PREFIX,
  );
  const state = await getSessionState();
  const config = env();
  const realm = keycloak();

  return {
    state,
    hasCookie,
    checks: checks(state, hasCookie),
    serverCall: await callApiAsServer(),
    events: backchannelEvents(),
    config: {
      issuer: realm.issuer,
      internalIssuer: realm.internalIssuer,
      clientId: config.AUTH_CLIENT_ID,
      audience: config.API_AUDIENCE,
      apiBaseUrl: config.API_BASE_URL,
    },
  };
}

function checks(state: SessionState, hasCookie: boolean): AuthCheck[] {
  const config = env();
  const list: AuthCheck[] = [
    {
      label: 'hasSessionCookie (what proxy.ts sees)',
      ok: hasCookie === (state.kind !== 'none'),
      value: hasCookie ? `cookie ${COOKIE_PREFIX}.session_token present` : 'no session cookie',
    },
    {
      label: 'Session state',
      ok: state.kind === 'active' ? true : state.kind === 'none' ? null : false,
      value: state.kind,
    },
  ];
  if (state.kind !== 'active') return list;

  const access = state.tokens.accessToken
    ? decodeJwtPayload<AccessClaims>(state.tokens.accessToken)
    : null;
  const id = state.tokens.idToken ? decodeJwtPayload<AccessClaims>(state.tokens.idToken) : null;
  const audiences = Array.isArray(access?.aud) ? access.aud : access?.aud ? [access.aud] : [];
  const expiresIn = access?.exp ? Math.round(access.exp - Date.now() / 1000) : null;

  list.push(
    {
      label: 'Access token decodes (decodeJwtPayload)',
      ok: access !== null,
      value: access ? `typ ${access.typ ?? '?'}, scope "${access.scope ?? ''}"` : 'no access token',
    },
    {
      label: 'iss equals AUTH_ISSUER (public issuer)',
      ok: access?.iss === keycloak().issuer,
      value: access?.iss ?? '-',
    },
    {
      label: `aud includes API_AUDIENCE "${config.API_AUDIENCE}" (audience mapper)`,
      ok: audiences.includes(config.API_AUDIENCE),
      value: JSON.stringify(audiences),
    },
    {
      label: `azp equals AUTH_CLIENT_ID "${config.AUTH_CLIENT_ID}"`,
      ok: access?.azp === config.AUTH_CLIENT_ID,
      value: access?.azp ?? '-',
    },
    {
      label: 'ID token carries sid (back-channel logout can target this session)',
      ok: typeof id?.sid === 'string' && id.sid.length > 0,
      value: id?.sid ?? '-',
    },
    {
      label: 'Keycloak session not revoked (isKeycloakSessionRevoked)',
      ok: true,
      value: 'not revoked',
    },
    {
      label: 'Access token expires in',
      ok: expiresIn === null ? null : expiresIn > 0,
      value:
        expiresIn === null
          ? '-'
          : `${expiresIn} s (Better Auth refreshes it with the refresh token)`,
    },
    {
      label: 'Web session expires at',
      ok: null,
      value: state.expiresAt.toISOString(),
    },
  );
  return list;
}

/** createServerApiClient + authorizeWith: the token is attached on the server, never in the browser. */
async function callApiAsServer(): Promise<ServerCallResult> {
  try {
    const me = await serverApi().get('me').json<Record<string, unknown>>();
    return { kind: 'ok', me };
  } catch (error) {
    if (error instanceof ApiError) {
      return { kind: 'error', status: error.status, code: error.code, message: error.message };
    }
    throw error;
  }
}

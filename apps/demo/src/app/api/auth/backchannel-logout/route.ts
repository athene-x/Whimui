import { handleBackchannelLogout } from '@athene-x/whimui/auth';

import { SESSION_MAX_AGE } from '@/lib/auth';
import { backchannelEvents, recordBackchannelEvent } from '@/lib/backchannel-log';
import { env } from '@/lib/env';
import { keycloak } from '@/lib/keycloak';

/** Keycloak calls this (server-to-server) when it ends a session that this client took part in. */
export async function POST(request: Request) {
  const response = await handleBackchannelLogout(request, {
    verifier: {
      issuer: keycloak().issuer,
      clientId: env().AUTH_CLIENT_ID,
      jwksUrl: keycloak().url('jwks', { internal: true }),
    },
    revokeForSeconds: SESSION_MAX_AGE,
    onLogout: ({ sid, sub }) =>
      recordBackchannelEvent({
        status: 200,
        sid,
        sub,
        detail: 'Logout token verified; session revoked.',
      }),
  });

  if (response.status !== 200) {
    const body = (await response
      .clone()
      .json()
      .catch(() => null)) as {
      error_description?: string;
    } | null;
    recordBackchannelEvent({
      status: response.status,
      sid: null,
      sub: null,
      detail: body?.error_description ?? 'Rejected.',
    });
  }
  return response;
}

/** Diagnostics for the auth page and the e2e script: the last back-channel calls received. */
export function GET() {
  return Response.json(backchannelEvents(), { headers: { 'cache-control': 'no-store' } });
}

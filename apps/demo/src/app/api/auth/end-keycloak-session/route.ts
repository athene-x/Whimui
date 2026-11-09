import { type NextRequest, NextResponse } from 'next/server';

import { getSessionState } from '@/lib/session';
import { appOrigin, isOwnOrigin } from '@/lib/site';

import { endSessionUrl } from '../logout/route';

/**
 * Test helper for back-channel logout: ends the Keycloak SSO session but keeps the web cookies.
 * Keycloak then POSTs a logout token to /api/auth/backchannel-logout, and the next request with
 * the old cookies must be treated as logged out.
 */
export async function POST(request: NextRequest) {
  if (!isOwnOrigin(request.headers.get('origin'))) {
    return new NextResponse(null, { status: 403 });
  }

  const state = await getSessionState();
  if (state.kind !== 'active') return NextResponse.redirect(`${appOrigin()}/auth`, 303);

  return NextResponse.redirect(
    endSessionUrl(state.tokens.idToken, `${appOrigin()}/auth?ended=keycloak`),
    303,
  );
}

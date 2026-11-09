import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { env } from '@/lib/env';
import { keycloak } from '@/lib/keycloak';
import { getSessionState } from '@/lib/session';
import { appOrigin, isOwnOrigin } from '@/lib/site';

/**
 * Front-channel logout: drop the web session, then send the browser to Keycloak's end-session
 * endpoint with `id_token_hint` so the SSO session ends too and the browser comes straight back.
 */
export async function POST(request: NextRequest) {
  if (!isOwnOrigin(request.headers.get('origin'))) {
    return new NextResponse(null, { status: 403 });
  }

  const state = await getSessionState();
  const idToken = state.kind === 'active' ? state.tokens.idToken : undefined;

  await auth().api.signOut({ headers: request.headers });

  return NextResponse.redirect(endSessionUrl(idToken, `${appOrigin()}/auth?ended=both`), 303);
}

export function GET() {
  return NextResponse.redirect(`${appOrigin()}/`);
}

export function endSessionUrl(idToken: string | undefined, postLogoutRedirectUri: string): URL {
  const url = keycloak().url('endSession');
  url.searchParams.set('client_id', env().AUTH_CLIENT_ID);
  url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  if (idToken) url.searchParams.set('id_token_hint', idToken);
  return url;
}

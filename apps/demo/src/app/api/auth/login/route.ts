import { isAPIError } from 'better-auth/api';
import { type NextRequest, NextResponse } from 'next/server';

import { auth, KEYCLOAK_PROVIDER_ID } from '@/lib/auth';
import { RETURN_TO_PARAM } from '@/lib/auth-urls';
import { appUrl, safeReturnTo } from '@/lib/site';

/** Sends the browser to Keycloak's login screen; Better Auth's callback brings it back to `returnTo`. */
export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get(RETURN_TO_PARAM));

  // Cookies are bound to APP_URL's host: a login started on 127.0.0.1 would not be seen on localhost.
  const requestHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (requestHost !== appUrl().host) {
    return NextResponse.redirect(
      new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, appUrl()),
    );
  }

  let url: string | undefined;
  try {
    ({ url } = await auth().api.signInSocial({
      body: { provider: KEYCLOAK_PROVIDER_ID, callbackURL: returnTo, disableRedirect: true },
      headers: request.headers,
    }));
  } catch (error) {
    if (!isAPIError(error)) throw error;
  }
  if (!url) {
    return new NextResponse(
      'Login is unavailable: Keycloak discovery failed. Is Keycloak running at AUTH_ISSUER?',
      { status: 503 },
    );
  }
  return NextResponse.redirect(url);
}

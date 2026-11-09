import { hasSessionCookie } from '@athene-x/whimui/auth';
import { type NextRequest, NextResponse } from 'next/server';

import { COOKIE_PREFIX, LOGIN_PATH, RETURN_TO_PARAM } from '@/lib/auth-urls';

/**
 * Cheap gate in front of pages that need a login: no session cookie at all means no point
 * rendering. The page still verifies the session itself (the cookie may be revoked).
 */
export function proxy(request: NextRequest) {
  if (hasSessionCookie(request, COOKIE_PREFIX)) return NextResponse.next();

  const login = request.nextUrl.clone();
  login.pathname = LOGIN_PATH;
  login.search = '';
  login.searchParams.set(RETURN_TO_PARAM, `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = { matcher: ['/auth/protected/:path*'] };

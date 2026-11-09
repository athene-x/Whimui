import {
  type LogoutToken,
  LogoutTokenError,
  type LogoutTokenVerifier,
  verifyLogoutToken,
} from './logout-token';
import { revokeKeycloakSession } from './revoked-sessions';

export type BackchannelLogoutOptions = {
  verifier: LogoutTokenVerifier;
  /** How long to remember the revoked session: the realm's SSO session max lifespan. */
  revokeForSeconds: number;
  /** Runs after the session is revoked, e.g. to delete the app's own session row. */
  onLogout?: (token: LogoutToken) => void | Promise<void>;
};

/**
 * Handles Keycloak's back-channel logout POST: verifies `logout_token`, revokes its `sid`
 * and answers as the OIDC spec asks (200 on success, 400 with an error body otherwise).
 * Errors other than an invalid token, such as an unreachable JWKS endpoint, propagate.
 */
export async function handleBackchannelLogout(
  request: Request,
  { verifier, revokeForSeconds, onLogout }: BackchannelLogoutOptions,
): Promise<Response> {
  const token = await readLogoutToken(request);
  if (!token) return reject('logout_token is required');

  let logout: LogoutToken;
  try {
    logout = await verifyLogoutToken(token, verifier);
  } catch (error) {
    if (error instanceof LogoutTokenError) return reject(error.message);
    throw error;
  }

  revokeKeycloakSession(logout.sid, revokeForSeconds);
  await onLogout?.(logout);
  return new Response(null, { status: 200, headers: NO_STORE });
}

const NO_STORE = { 'cache-control': 'no-store' };

async function readLogoutToken(request: Request): Promise<string | null> {
  try {
    const token = (await request.formData()).get('logout_token');
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

function reject(description: string): Response {
  return Response.json(
    { error: 'invalid_request', error_description: description },
    { status: 400, headers: NO_STORE },
  );
}

import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  errors,
  type JWTPayload,
  jwtVerify,
} from 'jose';

const BACKCHANNEL_LOGOUT_EVENT = 'http://schemas.openid.net/event/backchannel-logout';
const MAX_TOKEN_AGE_SECONDS = 5 * 60;
const CLOCK_SKEW_SECONDS = 60;

export type LogoutToken = { sid: string; sub: string | null };

export class LogoutTokenError extends Error {
  override name = 'LogoutTokenError';
}

export type LogoutTokenVerifier = {
  /** Expected `iss`: the public realm issuer. */
  issuer: string;
  /** Expected audience: the OIDC client id. */
  clientId: string;
  /** Where to fetch the realm's signing keys (the internal JWKS URL). */
  jwksUrl: URL | string;
};

/**
 * Verifies an OIDC back-channel logout token signed by the realm and returns the Keycloak
 * session it ends. `jose` fetches and caches the JWKS and refetches on an unknown `kid`,
 * at most once every 30 seconds.
 */
export async function verifyLogoutToken(
  token: string,
  { issuer, clientId, jwksUrl }: LogoutTokenVerifier,
): Promise<LogoutToken> {
  const now = Date.now();
  let claims: JWTPayload;
  try {
    const { alg, kid } = decodeProtectedHeader(token);
    if (alg !== 'RS256') throw new LogoutTokenError(`unsupported alg ${alg}`);
    if (kid !== undefined && !isNonEmptyString(kid)) throw new LogoutTokenError('invalid key id');
    ({ payload: claims } = await jwtVerify(token, jwks(jwksUrl), {
      issuer,
      audience: clientId,
      algorithms: ['RS256'],
      requiredClaims: ['iat', 'sid', 'events'],
      currentDate: new Date(now),
    }));
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      throw new LogoutTokenError(error.message, { cause: error });
    }
    throw error;
  }
  return checkLogoutClaims(claims, Math.floor(now / 1000));
}

/** The rules jose does not know: the back-channel logout profile plus our issue-time window. */
function checkLogoutClaims(claims: JWTPayload, now: number): LogoutToken {
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.every(isNonEmptyString)) throw new LogoutTokenError('wrong audience');
  const iat = claims.iat as number;
  if (now - iat > MAX_TOKEN_AGE_SECONDS) throw new LogoutTokenError('token too old');
  if (iat > now + CLOCK_SKEW_SECONDS) throw new LogoutTokenError('token issued in the future');
  if ('nonce' in claims) throw new LogoutTokenError('nonce not allowed');
  const events = claims.events;
  if (
    !isRecord(events) ||
    !Object.hasOwn(events, BACKCHANNEL_LOGOUT_EVENT) ||
    !isRecord(events[BACKCHANNEL_LOGOUT_EVENT])
  ) {
    throw new LogoutTokenError('not a logout event');
  }
  if (!isNonEmptyString(claims.sid)) throw new LogoutTokenError('sid missing or invalid');
  if (claims.sub !== undefined && !isNonEmptyString(claims.sub)) {
    throw new LogoutTokenError('invalid subject');
  }
  return { sid: claims.sid, sub: claims.sub ?? null };
}

const jwksSets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwks(url: URL | string) {
  const key = String(url);
  let set = jwksSets.get(key);
  if (!set) {
    set = createRemoteJWKSet(new URL(url));
    jwksSets.set(key, set);
  }
  return set;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

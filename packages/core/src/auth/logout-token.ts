import { type Jwt, parseJwt } from './jwt';

const BACKCHANNEL_LOGOUT_EVENT = 'http://schemas.openid.net/event/backchannel-logout';
const JWKS_TTL_MS = 10 * 60 * 1000;
const MAX_TOKEN_AGE_SECONDS = 5 * 60;
const CLOCK_SKEW_SECONDS = 60;

type Header = { alg?: string; kid?: string };

type Claims = {
  iss?: string;
  aud?: string | string[];
  iat?: number;
  exp?: number;
  sid?: string;
  sub?: string;
  nonce?: unknown;
  events?: Record<string, unknown>;
};

type Jwk = JsonWebKey & { kid?: string; use?: string };

export type LogoutToken = { sid: string; sub: string | null };

export class LogoutTokenError extends Error {}

export type LogoutTokenVerifier = {
  /** Expected `iss`: the public realm issuer. */
  issuer: string;
  /** Expected audience: the OIDC client id. */
  clientId: string;
  /** Where to fetch the realm's signing keys (the internal JWKS URL). */
  jwksUrl: URL | string;
};

/**
 * Verifies an OIDC back-channel logout token (RS256, signed by the realm) and returns the
 * Keycloak session id it ends. Keys are cached and refreshed once on an unknown `kid`.
 */
export async function verifyLogoutToken(
  token: string,
  verifier: LogoutTokenVerifier,
): Promise<LogoutToken> {
  const jwt = parseJwt<Header, Claims>(token);
  if (!jwt) throw new LogoutTokenError('malformed token');
  if (jwt.header.alg !== 'RS256') throw new LogoutTokenError(`unsupported alg ${jwt.header.alg}`);
  if (jwt.header.kid !== undefined && !isNonEmptyString(jwt.header.kid)) {
    throw new LogoutTokenError('invalid key id');
  }

  if (!(await hasValidSignature(jwt, verifier.jwksUrl))) {
    throw new LogoutTokenError('bad signature');
  }

  return checkClaims(jwt.payload, verifier);
}

function checkClaims(claims: Claims, { issuer, clientId }: LogoutTokenVerifier): LogoutToken {
  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];

  if (claims.iss !== issuer) throw new LogoutTokenError('wrong issuer');
  if (!audiences.every(isNonEmptyString) || !audiences.includes(clientId)) {
    throw new LogoutTokenError('wrong audience');
  }
  if (typeof claims.iat !== 'number' || !Number.isFinite(claims.iat)) {
    throw new LogoutTokenError('invalid issued-at time');
  }
  if (now - claims.iat > MAX_TOKEN_AGE_SECONDS) {
    throw new LogoutTokenError('token too old');
  }
  if (claims.iat > now + CLOCK_SKEW_SECONDS) {
    throw new LogoutTokenError('token issued in the future');
  }
  if (claims.exp !== undefined) {
    if (typeof claims.exp !== 'number' || !Number.isFinite(claims.exp)) {
      throw new LogoutTokenError('invalid expiration time');
    }
    if (claims.exp <= now) throw new LogoutTokenError('token expired');
  }
  if ('nonce' in claims) throw new LogoutTokenError('nonce not allowed');
  if (
    !isRecord(claims.events) ||
    !Object.hasOwn(claims.events, BACKCHANNEL_LOGOUT_EVENT) ||
    !isRecord(claims.events[BACKCHANNEL_LOGOUT_EVENT])
  ) {
    throw new LogoutTokenError('not a logout event');
  }
  if (!isNonEmptyString(claims.sid)) throw new LogoutTokenError('sid missing or invalid');
  if (claims.sub !== undefined && !isNonEmptyString(claims.sub)) {
    throw new LogoutTokenError('invalid subject');
  }

  return { sid: claims.sid, sub: claims.sub ?? null };
}

async function hasValidSignature(
  jwt: Jwt<Header, Claims>,
  jwksUrl: URL | string,
): Promise<boolean> {
  const key = await signingKey(jwt.header.kid, jwksUrl);
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    Buffer.from(jwt.signature, 'base64url'),
    Buffer.from(jwt.signingInput),
  );
}

type JwksCache = { keys: Jwk[]; fetchedAt: number };

const jwksCaches = new Map<string, JwksCache>();

async function signingKey(kid: string | undefined, jwksUrl: URL | string): Promise<CryptoKey> {
  const jwk = (await findJwk(kid, jwksUrl)) ?? (await findJwk(kid, jwksUrl, { refresh: true }));
  if (!jwk) throw new LogoutTokenError(`unknown key ${kid}`);

  return crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
}

async function findJwk(
  kid: string | undefined,
  jwksUrl: URL | string,
  options?: { refresh?: boolean },
) {
  const { keys } = options?.refresh ? await refreshJwks(jwksUrl) : await currentJwks(jwksUrl);

  return keys.find(
    (key) =>
      key.kty === 'RSA' &&
      (key.use === undefined || key.use === 'sig') &&
      (key.alg === undefined || key.alg === 'RS256') &&
      (key.key_ops === undefined || key.key_ops.includes('verify')) &&
      (kid === undefined || key.kid === kid),
  );
}

async function currentJwks(jwksUrl: URL | string): Promise<JwksCache> {
  const cached = jwksCaches.get(String(jwksUrl));
  if (cached && Date.now() - cached.fetchedAt <= JWKS_TTL_MS) return cached;
  return refreshJwks(jwksUrl);
}

async function refreshJwks(jwksUrl: URL | string): Promise<JwksCache> {
  const cache = { keys: await fetchJwks(jwksUrl), fetchedAt: Date.now() };
  jwksCaches.set(String(jwksUrl), cache);
  return cache;
}

async function fetchJwks(jwksUrl: URL | string): Promise<Jwk[]> {
  const response = await fetch(jwksUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`JWKS request failed with ${response.status}`);

  const body: unknown = await response.json();
  if (!isRecord(body) || !Array.isArray(body.keys) || !body.keys.every(isJwk)) {
    throw new LogoutTokenError('invalid JWKS response');
  }
  return body.keys;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isJwk(value: unknown): value is Jwk {
  if (!isRecord(value) || !isNonEmptyString(value.kty)) return false;
  if (
    !['kid', 'use', 'alg'].every(
      (field) => value[field] === undefined || isNonEmptyString(value[field]),
    )
  ) {
    return false;
  }
  if (
    value.key_ops !== undefined &&
    (!Array.isArray(value.key_ops) || !value.key_ops.every(isNonEmptyString))
  ) {
    return false;
  }
  return value.kty !== 'RSA' || (isNonEmptyString(value.n) && isNonEmptyString(value.e));
}

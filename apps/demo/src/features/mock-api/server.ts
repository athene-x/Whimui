import 'server-only';

import { type ApiErrorBody, type ApiErrorDetail, apiErrorBody } from '@athene-x/whimui/api';
import { createRemoteJWKSet, errors, type JWTPayload, jwtVerify } from 'jose';

import { env } from '@/lib/env';
import { keycloak } from '@/lib/keycloak';

/**
 * A stand-in for the team's .NET API, mounted at /mock/api/v1. It answers with the real error
 * envelope, and `me` verifies the bearer token exactly as the API would (signature from the
 * realm's JWKS, `iss`, `exp`, and the `aud` the audience mapper must add).
 */

type MockRouteContext = { params: Promise<{ path: string[] }> };

const MAX_DELAY_MS = 10_000;

const ERROR_CODES: Record<number, [code: string, description: string]> = {
  400: ['Demo.InvalidInput', 'The input is invalid.'],
  401: ['Demo.Unauthorized', 'A valid token is required.'],
  403: ['Demo.Forbidden', 'You may not do this.'],
  404: ['Demo.NotFound', 'No such thing.'],
  409: ['Demo.Conflict', 'This title already exists.'],
  500: ['Demo.Failure', 'The API failed.'],
  503: ['Demo.Unavailable', 'The API is briefly unavailable.'],
};

const FIELD_ERRORS: ApiErrorDetail[] = [
  { code: 'Demo.TitleRequired', description: 'Title is required.', field: 'title' },
];

export async function handleMockApi(request: Request, context: MockRouteContext) {
  const { path } = await context.params;
  const url = new URL(request.url);
  const [head, tail] = path;
  const route = `${request.method} ${head}`;

  switch (route) {
    case 'GET ping':
      return json({ ok: true, at: new Date().toISOString() });

    case 'GET errors':
      return envelope(statusOf(tail));

    case 'GET plain':
      return json({ oops: true }, statusOf(tail));

    case 'GET text':
      return new Response('boom', {
        status: statusOf(tail),
        headers: { 'content-type': 'text/plain' },
      });

    case 'GET slow': {
      const ms = Math.min(Number(url.searchParams.get('ms') ?? 2000), MAX_DELAY_MS);
      await new Promise((resolve) => setTimeout(resolve, ms));
      return json({ ok: true, waitedMs: ms });
    }

    case 'GET fail': {
      const status = statusOf(tail);
      const attempt = countAttempt(url.searchParams.get('key') ?? 'default');
      return envelope(status, { attempt });
    }

    case 'GET list-echo':
      return json({
        searchTerm: url.searchParams.get('searchTerm'),
        sort: url.searchParams.get('sort'),
        filters: url.searchParams.getAll('filters'),
        page: url.searchParams.get('page'),
        size: url.searchParams.get('size'),
      });

    case 'POST validate': {
      const body = (await request.json().catch(() => null)) as { title?: unknown } | null;
      const title = typeof body?.title === 'string' ? body.title.trim() : '';
      if (!title) return envelope(400, { errors: FIELD_ERRORS });
      return json({ id: crypto.randomUUID(), title }, 201);
    }

    case 'GET me': {
      const claims = await authenticate(request);
      if (claims instanceof Response) return claims;
      return json({
        sub: claims.sub,
        preferredUsername: claims.preferred_username,
        email: claims.email,
        name: claims.name,
        iss: claims.iss,
        aud: audiences(claims),
        azp: claims.azp,
        sid: claims.sid,
        exp: claims.exp,
        scope: claims.scope,
      });
    }

    default:
      return envelope(404);
  }
}

function statusOf(value: string | undefined): number {
  const status = Number(value);
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function envelope(
  status: number,
  extra: Partial<ApiErrorBody> & Record<string, unknown> = {},
): Response {
  const [code, description] = ERROR_CODES[status] ?? [
    `Demo.Status${status}`,
    `The API answered ${status}.`,
  ];
  const headers: HeadersInit = status === 401 ? { 'www-authenticate': 'Bearer' } : {};
  return Response.json({ ...apiErrorBody(code, description), ...extra }, { status, headers });
}

// --- retry counting -------------------------------------------------------------------------

const ATTEMPTS_KEY = Symbol.for('whimui-demo.mockAttempts');
type AttemptStore = typeof globalThis & { [ATTEMPTS_KEY]?: Map<string, number> };
const attempts = ((globalThis as AttemptStore)[ATTEMPTS_KEY] ??= new Map<string, number>());

function countAttempt(key: string): number {
  const attempt = (attempts.get(key) ?? 0) + 1;
  attempts.set(key, attempt);
  if (attempts.size > 500) attempts.clear();
  return attempt;
}

// --- bearer token verification ----------------------------------------------------------------

type AccessClaims = JWTPayload & {
  azp?: string;
  sid?: string;
  scope?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
};

const JWKS_KEY = Symbol.for('whimui-demo.mockJwks');
type JwksStore = typeof globalThis & { [JWKS_KEY]?: ReturnType<typeof createRemoteJWKSet> };

function jwks() {
  const store = globalThis as JwksStore;
  return (store[JWKS_KEY] ??= createRemoteJWKSet(keycloak().url('jwks', { internal: true })));
}

async function authenticate(request: Request): Promise<AccessClaims | Response> {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token)
    return envelope(401, { ...apiErrorBody('Demo.MissingToken', 'Send a Bearer access token.') });

  let claims: AccessClaims;
  try {
    // `issuer` is the public issuer: Keycloak writes `iss` from the hostname the browser used.
    ({ payload: claims } = await jwtVerify(token, jwks(), {
      issuer: keycloak().issuer,
      algorithms: ['RS256'],
    }));
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      return envelope(401, {
        ...apiErrorBody('Demo.InvalidToken', `${error.code}: ${error.message}`),
      });
    }
    throw error;
  }

  const audience = env().API_AUDIENCE;
  if (!audiences(claims).includes(audience)) {
    return envelope(401, {
      ...apiErrorBody(
        'Demo.WrongAudience',
        `aud ${JSON.stringify(audiences(claims))} does not include "${audience}". Check the audience mapper on client ${env().AUTH_CLIENT_ID}.`,
      ),
    });
  }
  return claims;
}

function audiences(claims: JWTPayload): string[] {
  return Array.isArray(claims.aud) ? claims.aud : claims.aud ? [claims.aud] : [];
}

import 'server-only';

import {
  API_PREFIX,
  type ApiErrorBody,
  apiErrorBody,
  createServerApiClient,
  SESSION_REQUIRED,
} from '@athene-x/whimui/api';
import { type NextRequest, NextResponse } from 'next/server';

import { env } from './env';
import { getAccessToken } from './session';
import { isOwnOrigin } from './site';

/** Request headers passed on to the API. */
const REQUEST_HEADERS = ['accept', 'accept-language', 'content-type', 'if-match', 'if-none-match'];

/** Response headers not passed back to the browser. */
const SKIPPED_RESPONSE_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'set-cookie',
  'transfer-encoding',
]);

const SAFE_METHODS = new Set(['GET', 'HEAD']);

/** `API_BASE_URL` split into origin and an optional path prefix (`/mock` for the demo's fake API). */
function apiBase() {
  const url = new URL(env().API_BASE_URL);
  return { origin: url.origin, pathPrefix: url.pathname.replace(/\/$/, '') };
}

type ServerApi = ReturnType<typeof createServerApiClient>;

let instance: ServerApi | undefined;

/**
 * Server components and route handlers call the API directly with the session's token
 * (`createServerApiClient` + `authorizeWith` from the kit). Keep it in server-only modules.
 */
export function serverApi(): ServerApi {
  if (instance) return instance;
  const { origin, pathPrefix } = apiBase();
  instance = createServerApiClient({
    baseUrl: origin,
    prefix: `${pathPrefix}${API_PREFIX}`,
    getAccessToken,
  });
  return instance;
}

/** Passes `/api/v1/*` calls on to the API with the user's access token: the BFF route. */
export async function forwardToApi(request: NextRequest): Promise<Response> {
  const isSafe = SAFE_METHODS.has(request.method);
  if (!isSafe && !isOwnOrigin(request.headers.get('origin'))) {
    return error(403, apiErrorBody('Web.CrossSiteRequest', 'Cross-site request refused.'));
  }

  const token = await getAccessToken();
  if (!token) return error(401, SESSION_REQUIRED);

  const headers = new Headers({ authorization: `Bearer ${token}` });
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const { origin, pathPrefix } = apiBase();
  const { pathname, search } = request.nextUrl;
  let upstream: Response;
  try {
    upstream = await fetch(new URL(`${pathPrefix}${pathname}${search}`, origin), {
      method: request.method,
      headers,
      body: isSafe ? undefined : request.body,
      // Required by fetch when the body is a stream.
      duplex: 'half',
      redirect: 'manual',
      cache: 'no-store',
    } as RequestInit);
  } catch {
    return error(502, apiErrorBody('Web.ApiUnavailable', 'The API did not respond.'));
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, name) => {
    if (!SKIPPED_RESPONSE_HEADERS.has(name)) responseHeaders.set(name, value);
  });
  return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
}

function error(status: number, body: ApiErrorBody) {
  return NextResponse.json(body, { status });
}

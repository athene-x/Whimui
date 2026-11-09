import ky, {
  type BeforeErrorState,
  type BeforeRequestState,
  type Hooks,
  type KyInstance,
  type Options,
  isHTTPError,
  isNetworkError,
  isTimeoutError,
} from 'ky';

import { markSessionExpired } from './session-expired';

export type { BeforeRequestState };

const UNAUTHORIZED = 401;

export const API_PREFIX = '/api/v1';

export type RequestOptions = {
  client?: KyInstance;
  signal?: AbortSignal;
};

export type ApiErrorDetail = {
  code: string;
  description: string;
  field: string | null;
};

export type ApiErrorBody = {
  code: string;
  description: string;
  errors: ApiErrorDetail[] | null;
};

/** The API's error envelope as a thrown error; also what timeouts and network failures become. */
export class ApiError extends Error {
  override name = 'ApiError';
  readonly status: number;
  readonly code: string;
  readonly errors: ApiErrorDetail[];
  readonly data: unknown;

  constructor(status: number, body: ApiErrorBody, options?: ErrorOptions & { data?: unknown }) {
    super(body.description, options);
    this.status = status;
    this.code = body.code;
    this.errors = body.errors ?? [];
    this.data = options?.data;
  }
}

export const SESSION_REQUIRED = apiErrorBody(
  'Web.SessionRequired',
  'Not logged in, or the login has expired.',
);

export function apiErrorBody(code: string, description: string): ApiErrorBody {
  return { code, description, errors: null };
}

export type ApiClientOptions = Options & {
  /** Runs before `hooks.beforeRequest`. */
  beforeRequest?: NonNullable<Hooks['beforeRequest']>;
  /** Runs in the browser on a 401. Defaults to marking the session expired. */
  onUnauthorized?: () => void;
  /** Replaces `toApiError`; `hooks.beforeError` still runs afterwards. */
  normalizeError?: (state: BeforeErrorState) => Error | Promise<Error>;
};

/**
 * A Ky client that throws `ApiError`. Defaults to the app's `/api/v1` BFF with no
 * retries; TanStack Query decides about retrying.
 */
export function createApiClient({
  beforeRequest = [],
  onUnauthorized = markSessionExpired,
  normalizeError = toApiError,
  hooks = {},
  ...options
}: ApiClientOptions = {}): KyInstance {
  return ky.create({
    prefix: API_PREFIX,
    retry: 0,
    ...options,
    hooks: {
      ...hooks,
      beforeRequest: [...beforeRequest, ...(hooks.beforeRequest ?? [])],
      beforeError: [
        (state) => {
          notifyUnauthorized(state, onUnauthorized);
          return normalizeError(state);
        },
        ...(hooks.beforeError ?? []),
      ],
    },
  });
}

function notifyUnauthorized({ error }: BeforeErrorState, onUnauthorized: () => void): void {
  if (
    isHTTPError(error) &&
    error.response.status === UNAUTHORIZED &&
    typeof window !== 'undefined'
  ) {
    onUnauthorized();
  }
}

type AccessToken = string | null | undefined;

export type AccessTokenProvider = () => AccessToken | Promise<AccessToken>;

export type ServerApiClientOptions = Omit<ApiClientOptions, 'onUnauthorized'> & {
  /** The API as the server reaches it, e.g. `http://api:8080/`; `prefix` is appended. */
  baseUrl: string | URL;
  /** Reads the current user's access token, e.g. from the session. */
  getAccessToken: AccessTokenProvider;
};

/**
 * A Ky client for server components and route handlers: calls the API directly,
 * never caches, and sends the user's bearer token. Keep it in server-only modules.
 */
export function createServerApiClient({
  baseUrl,
  getAccessToken,
  beforeRequest = [],
  ...options
}: ServerApiClientOptions): KyInstance {
  return createApiClient({
    baseUrl,
    cache: 'no-store',
    ...options,
    beforeRequest: [authorizeWith(getAccessToken), ...beforeRequest],
  });
}

/** A `beforeRequest` hook that sets the bearer token, or fails with a 401 `ApiError` before sending. */
export function authorizeWith(getAccessToken: AccessTokenProvider) {
  return async ({ request }: BeforeRequestState): Promise<void> => {
    const token = await getAccessToken();
    if (!token) throw new ApiError(UNAUTHORIZED, SESSION_REQUIRED);
    request.headers.set('authorization', `Bearer ${token}`);
  };
}

/** Turns Ky's HTTP, timeout and network errors into `ApiError`; other errors pass through. */
export function toApiError({ error }: BeforeErrorState): Error {
  if (isHTTPError(error)) {
    const { status } = error.response;
    const body = isApiErrorBody(error.data)
      ? error.data
      : apiErrorBody('Web.UnexpectedResponse', `The API answered ${status} without an error body.`);
    return new ApiError(status, body, { cause: error, data: error.data });
  }

  if (isTimeoutError(error)) {
    const body = apiErrorBody('Web.Timeout', 'The API took too long to respond.');
    return new ApiError(0, body, { cause: error });
  }

  if (isNetworkError(error)) {
    const body = apiErrorBody('Web.NetworkError', 'Could not reach the server.');
    return new ApiError(0, body, { cause: error });
  }

  return error;
}

export function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    'code' in data &&
    typeof data.code === 'string' &&
    'description' in data &&
    typeof data.description === 'string' &&
    'errors' in data &&
    (data.errors === null || (Array.isArray(data.errors) && data.errors.every(isApiErrorDetail)))
  );
}

function isApiErrorDetail(data: unknown): data is ApiErrorDetail {
  return (
    typeof data === 'object' &&
    data !== null &&
    'code' in data &&
    typeof data.code === 'string' &&
    'description' in data &&
    typeof data.description === 'string' &&
    'field' in data &&
    (data.field === null || typeof data.field === 'string')
  );
}

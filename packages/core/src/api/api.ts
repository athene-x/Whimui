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
  /** Runs before `hooks.beforeRequest`; retained for existing callers. */
  beforeRequest?: NonNullable<Hooks['beforeRequest']>;
  /**
   * Runs in the browser on a 401; by default marks the session expired so a
   * `SessionExpiredDialog` can offer the login again.
   */
  onUnauthorized?: () => void;
  /** Replaces the default error normalization; app `beforeError` hooks run afterward. */
  normalizeError?: (state: BeforeErrorState) => Error | Promise<Error>;
};

/**
 * Creates a Ky client with API error handling. Defaults to the app's `/api/v1` BFF
 * and no retries; callers can override native Ky options and add hooks.
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

export type { BeforeRequestState };

function notifyUnauthorized({ error }: BeforeErrorState, onUnauthorized?: () => void): void {
  if (
    isHTTPError(error) &&
    error.response.status === UNAUTHORIZED &&
    typeof window !== 'undefined'
  ) {
    onUnauthorized?.();
  }
}

export function toApiError(state: BeforeErrorState, onUnauthorized?: () => void): Error {
  const { error } = state;
  if (isHTTPError(error)) {
    const { status } = error.response;
    notifyUnauthorized(state, onUnauthorized);
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

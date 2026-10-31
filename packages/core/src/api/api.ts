import ky, {
  type BeforeErrorState,
  type BeforeRequestState,
  type Hooks,
  type KyInstance,
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

  constructor(status: number, body: ApiErrorBody, options?: ErrorOptions) {
    super(body.description, options);
    this.status = status;
    this.code = body.code;
    this.errors = body.errors ?? [];
  }
}

export const SESSION_REQUIRED = apiErrorBody(
  'Web.SessionRequired',
  'Not logged in, or the login has expired.',
);

export function apiErrorBody(code: string, description: string): ApiErrorBody {
  return { code, description, errors: null };
}

export type ApiClientOptions = {
  /** Defaults to `/api/v1`: the app's own BFF route that forwards to the API. */
  prefix?: string;
  /** Extra `beforeRequest` hooks, e.g. one that adds a tenant header from the URL. */
  beforeRequest?: NonNullable<Hooks['beforeRequest']>;
  /**
   * Runs in the browser on a 401; by default marks the session expired so a
   * `SessionExpiredDialog` can offer the login again.
   */
  onUnauthorized?: () => void;
};

/**
 * Browser-side client. Every call goes to `<prefix>/*` on this app; the BFF route adds the
 * bearer token and passes the request on to the API. Feature code never builds URLs itself.
 */
export function createApiClient({
  prefix = API_PREFIX,
  beforeRequest = [],
  onUnauthorized = markSessionExpired,
}: ApiClientOptions = {}): KyInstance {
  return ky.create({
    prefix,
    retry: 0,
    hooks: {
      beforeRequest,
      beforeError: [(state) => toApiError(state, onUnauthorized)],
    },
  });
}

export type { BeforeRequestState };

export function toApiError({ error }: BeforeErrorState, onUnauthorized?: () => void): Error {
  if (isHTTPError(error)) {
    const { status } = error.response;
    if (status === UNAUTHORIZED && typeof window !== 'undefined') onUnauthorized?.();
    const body = isApiErrorBody(error.data)
      ? error.data
      : apiErrorBody('Web.UnexpectedResponse', `The API answered ${status} without an error body.`);
    return new ApiError(status, body, { cause: error });
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
    typeof data.description === 'string'
  );
}

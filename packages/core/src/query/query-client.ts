import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

import { ApiError } from '../api';

export const STALE_TIME_MS = 60_000;

const MAX_RETRIES = 2;

/** Retries transient failures twice, never a 4xx the API meant. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  return !(error instanceof ApiError && error.status >= 400 && error.status < 500);
}

/** A `QueryClient` with the kit's defaults; `config.defaultOptions.queries` overrides them. */
export function createQueryClient(config: QueryClientConfig = {}): QueryClient {
  return new QueryClient({
    ...config,
    defaultOptions: {
      ...config.defaultOptions,
      queries: { staleTime: STALE_TIME_MS, retry: shouldRetry, ...config.defaultOptions?.queries },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * The client for `QueryClientProvider`: a new one per request on the server so users
 * never share data, one per browser tab. In the browser `config` applies on first use.
 */
export function getQueryClient(config?: QueryClientConfig): QueryClient {
  if (typeof window === 'undefined') return createQueryClient(config);
  return (browserQueryClient ??= createQueryClient(config));
}

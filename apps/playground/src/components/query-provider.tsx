'use client';

import type { ReactNode } from 'react';

import { ApiError, STALE_TIME_MS } from '@athene-x/whimui/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const MAX_RETRIES = 2;

let browserQueryClient: QueryClient | undefined;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        // Retry network blips, never a 4xx the API meant.
        retry: (failureCount, error) =>
          failureCount < MAX_RETRIES &&
          !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      },
    },
  });
}

function getQueryClient() {
  if (typeof window === 'undefined') return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}

'use client';

import type { ReactNode } from 'react';

import { ApiError, STALE_TIME_MS } from '@athenex/web-core/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let browserClient: QueryClient | undefined;

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        retry: (count, error) =>
          count < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const client =
    typeof window === 'undefined' ? createClient() : (browserClient ??= createClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

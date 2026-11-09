'use client';

import type { ReactNode } from 'react';

import { getQueryClient } from '@athene-x/whimui/query';
import { QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}

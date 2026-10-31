'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, createContext, use, useMemo } from 'react';

const BasePathContext = createContext('');

export type BasePathProviderProps = {
  basePath: string;
  children: ReactNode;
};

/**
 * Prefix for every in-app link below it (e.g. `/t/<tenant>`); without a provider links are
 * used as written, so `AppLink` is a drop-in for `next/link` in apps with one zone.
 */
export function BasePathProvider({ basePath, children }: BasePathProviderProps) {
  return <BasePathContext value={basePath}>{children}</BasePathContext>;
}

export function withBasePath(basePath: string, href: string): string {
  if (!basePath || !href.startsWith('/') || href.startsWith('//')) return href;
  return href === '/' ? basePath : `${basePath}${href}`;
}

export function stripBasePath(basePath: string, pathname: string): string {
  if (!basePath) return pathname;
  if (pathname === basePath) return '/';
  return pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : pathname;
}

export function useBasePath(): string {
  return use(BasePathContext);
}

export function useBaseHref(): (href: string) => string {
  const basePath = useBasePath();
  return (href) => withBasePath(basePath, href);
}

type NavigateOptions = Parameters<ReturnType<typeof useRouter>['push']>[1];

export function useAppRouter() {
  const router = useRouter();
  const basePath = useBasePath();

  return useMemo(
    () => ({
      push: (href: string, options?: NavigateOptions) =>
        router.push(withBasePath(basePath, href), options),
      replace: (href: string, options?: NavigateOptions) =>
        router.replace(withBasePath(basePath, href), options),
      refresh: () => router.refresh(),
      back: () => router.back(),
    }),
    [router, basePath],
  );
}

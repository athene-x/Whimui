'use client';

import { useMemo, useSyncExternalStore } from 'react';

/**
 * Subscribe/snapshot pair over `window.matchMedia(query)` for `useSyncExternalStore`.
 * Reports `false` on the server and wherever `matchMedia` is unavailable.
 */
export function matchMediaStore(query: string) {
  const mql =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query)
      : undefined;

  return {
    subscribe(onChange: () => void) {
      mql?.addEventListener('change', onChange);
      return () => mql?.removeEventListener('change', onChange);
    },
    getSnapshot: () => mql?.matches ?? false,
    getServerSnapshot: () => false,
  };
}

export function useMediaQuery(query: string): boolean {
  const store = useMemo(() => matchMediaStore(query), [query]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

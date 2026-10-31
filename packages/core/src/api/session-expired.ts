let expired = false;
const listeners = new Set<() => void>();

export function markSessionExpired() {
  if (expired) return;
  expired = true;
  for (const listener of listeners) listener();
}

export function isSessionExpired(): boolean {
  return expired;
}

export function subscribeSessionExpired(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

declare global {
  interface Window {
    expireSession?: () => void;
  }
}

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.expireSession = markSessionExpired;
}

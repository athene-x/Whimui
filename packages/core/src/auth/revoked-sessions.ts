const STORE_KEY = Symbol.for('athenex.revokedKeycloakSessions');
const PRUNE_THRESHOLD = 1000;

type Store = typeof globalThis & { [STORE_KEY]?: Map<string, number> };

const revokedUntil = ((globalThis as Store)[STORE_KEY] ??= new Map<string, number>());

export function revokeKeycloakSession(sid: string, ttlSeconds: number) {
  if (revokedUntil.size >= PRUNE_THRESHOLD) pruneExpired();
  revokedUntil.set(sid, Date.now() + ttlSeconds * 1000);
}

export function isKeycloakSessionRevoked(sid: string): boolean {
  const until = revokedUntil.get(sid);
  if (until === undefined) return false;
  if (until > Date.now()) return true;

  revokedUntil.delete(sid);
  return false;
}

function pruneExpired() {
  const now = Date.now();
  for (const [sid, until] of revokedUntil) {
    if (until <= now) revokedUntil.delete(sid);
  }
}

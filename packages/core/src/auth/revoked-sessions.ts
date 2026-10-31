const STORE_KEY = Symbol.for('athenex.revokedKeycloakSessions');
const PRUNE_THRESHOLD = 1000;

type Store = typeof globalThis & { [STORE_KEY]?: Map<string, number> };

const revokedUntil = ((globalThis as Store)[STORE_KEY] ??= new Map<string, number>());

/** Revokes a session in this process; repeated calls can extend, but never shorten, its TTL. */
export function revokeKeycloakSession(sid: string, ttlSeconds: number) {
  const until = Date.now() + ttlSeconds * 1000;
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0 || !Number.isFinite(until)) {
    throw new RangeError('Session revocation TTL must be a positive, finite number of seconds.');
  }

  if (revokedUntil.size >= PRUNE_THRESHOLD) pruneExpired();
  revokedUntil.set(sid, Math.max(revokedUntil.get(sid) ?? 0, until));
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

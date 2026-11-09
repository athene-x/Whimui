import 'server-only';

export type BackchannelEvent = {
  at: string;
  status: number;
  sid: string | null;
  sub: string | null;
  detail: string;
};

const STORE_KEY = Symbol.for('whimui-demo.backchannelLog');
const MAX_EVENTS = 20;

type Store = typeof globalThis & { [STORE_KEY]?: BackchannelEvent[] };

// Survives development reloads, but only within this server process.
const events = ((globalThis as Store)[STORE_KEY] ??= []);

export function recordBackchannelEvent(event: Omit<BackchannelEvent, 'at'>) {
  events.unshift({ at: new Date().toISOString(), ...event });
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
}

export function backchannelEvents(): BackchannelEvent[] {
  return [...events];
}

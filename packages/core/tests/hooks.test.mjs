import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    const local = specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier);
    return nextResolve(local ? `${specifier}.ts` : specifier, context);
  },
});

const { matchMediaStore } = await import('../src/hooks/use-media-query.ts');

function fakeMatchMedia(matches) {
  const listeners = new Set();
  const mql = {
    matches,
    queries: [],
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
    set(next) {
      mql.matches = next;
      for (const listener of listeners) listener();
    },
    listeners,
  };
  globalThis.window = {
    matchMedia(query) {
      mql.queries.push(query);
      return mql;
    },
  };
  return mql;
}

test('matchMediaStore reads matchMedia, notifies on change and unsubscribes', () => {
  const mql = fakeMatchMedia(false);
  try {
    const store = matchMediaStore('(min-width: 640px)');
    assert.deepEqual(mql.queries, ['(min-width: 640px)']);
    assert.equal(store.getSnapshot(), false);
    assert.equal(store.getServerSnapshot(), false);

    let notified = 0;
    const unsubscribe = store.subscribe(() => notified++);
    mql.set(true);
    assert.equal(notified, 1);
    assert.equal(store.getSnapshot(), true);

    unsubscribe();
    mql.set(false);
    assert.equal(notified, 1);
    assert.equal(mql.listeners.size, 0);
  } finally {
    delete globalThis.window;
  }
});

test('matchMediaStore is inert without window.matchMedia', () => {
  const store = matchMediaStore('(min-width: 640px)');
  assert.equal(store.getSnapshot(), false);
  assert.equal(store.getServerSnapshot(), false);
  assert.doesNotThrow(() => store.subscribe(() => {})());
});

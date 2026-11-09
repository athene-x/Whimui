import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    const local = specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier);
    return nextResolve(local ? `${specifier}.ts` : specifier, context);
  },
});

const { ApiError, createApiClient, createServerApiClient } = await import('../src/api/api.ts');

const envelope = (code, description) => ({ code, description, errors: null });
const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
const respondWith = (status, body) => async () => json(status, body);

test('HTTP errors become ApiError with the envelope, or UnexpectedResponse without one', async () => {
  const withBody = createApiClient({
    baseUrl: 'http://api.test/',
    fetch: respondWith(409, envelope('Tasks.DuplicateTitle', 'Exists.')),
  });
  await assert.rejects(withBody.get('tasks'), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 409);
    assert.equal(error.code, 'Tasks.DuplicateTitle');
    assert.equal(error.message, 'Exists.');
    return true;
  });

  const withoutBody = createApiClient({
    baseUrl: 'http://api.test/',
    fetch: respondWith(500, { oops: true }),
  });
  await assert.rejects(withoutBody.get('tasks'), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 500);
    assert.equal(error.code, 'Web.UnexpectedResponse');
    assert.deepEqual(error.data, { oops: true });
    return true;
  });
});

test('a 401 in the browser notifies onUnauthorized exactly once', async () => {
  globalThis.window = {};
  try {
    let calls = 0;
    const api = createApiClient({
      baseUrl: 'http://api.test/',
      fetch: respondWith(401, envelope('Auth.Expired', 'Expired.')),
      onUnauthorized: () => calls++,
    });
    await assert.rejects(api.get('me'), (error) => error instanceof ApiError && error.status === 401);
    assert.equal(calls, 1);
  } finally {
    delete globalThis.window;
  }
});

test('server client calls the API directly with the bearer token and no cache', async () => {
  let seen;
  const api = createServerApiClient({
    baseUrl: 'http://api:8080/',
    getAccessToken: async () => 'token-123',
    fetch: async (request) => {
      seen = request;
      return json(200, { id: '1' });
    },
  });
  assert.deepEqual(await api.get('tasks/1').json(), { id: '1' });
  assert.equal(seen.url, 'http://api:8080/api/v1/tasks/1');
  assert.equal(seen.headers.get('authorization'), 'Bearer token-123');
  assert.equal(seen.cache, 'no-store');
});

test('server client fails with 401 before sending when there is no token', async () => {
  let sent = false;
  const api = createServerApiClient({
    baseUrl: 'http://api:8080/',
    getAccessToken: () => null,
    fetch: async () => {
      sent = true;
      return json(200, {});
    },
  });
  await assert.rejects(api.get('me'), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal(error.code, 'Web.SessionRequired');
    return true;
  });
  assert.equal(sent, false);
});

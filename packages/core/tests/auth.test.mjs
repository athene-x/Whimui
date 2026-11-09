import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    const local = specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier);
    return nextResolve(local ? `${specifier}.ts` : specifier, context);
  },
});

const { decodeJwtPayload } = await import('../src/auth/jwt.ts');
const { verifyLogoutToken, LogoutTokenError } = await import('../src/auth/logout-token.ts');
const { revokeKeycloakSession, isKeycloakSessionRevoked } =
  await import('../src/auth/revoked-sessions.ts');
const { handleBackchannelLogout } = await import('../src/auth/backchannel-logout.ts');

const event = 'http://schemas.openid.net/event/backchannel-logout';
const now = 1_800_000_000;
const pair = await crypto.subtle.generateKey(
  {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  },
  true,
  ['sign', 'verify'],
);
const publicKey = {
  ...(await crypto.subtle.exportKey('jwk', pair.publicKey)),
  kid: 'key-1',
  use: 'sig',
  alg: 'RS256',
};
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const claims = () => ({
  iss: 'https://issuer.test',
  aud: 'app',
  iat: now,
  exp: now + 300,
  sid: 'session-1',
  sub: 'user-1',
  events: { [event]: {} },
});
async function sign(payload, header = { alg: 'RS256', kid: 'key-1' }) {
  const input = `${encode(header)}.${encode(payload)}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    pair.privateKey,
    Buffer.from(input),
  );
  return `${input}.${Buffer.from(signature).toString('base64url')}`;
}
function setup(t, body = { keys: [publicKey] }) {
  t.mock.method(Date, 'now', () => now * 1000);
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json(body));
  const verifier = {
    issuer: 'https://issuer.test',
    clientId: 'app',
    jwksUrl: `https://jwks.test/${crypto.randomUUID()}`,
  };
  return { verifier, fetch };
}

test('JWT payload decoding returns null for anything that is not a well-formed JWT', () => {
  const valid = `${encode({ alg: 'RS256' })}.${encode({ sub: 'user' })}.c2ln`;
  assert.deepEqual(decodeJwtPayload(valid), { sub: 'user' });
  for (const token of [
    valid + '.extra',
    valid.slice(0, valid.lastIndexOf('.')),
    '',
    'not a token',
    `${encode({})}.${encode('text')}.c2ln`,
    `${encode({})}.${encode([])}.c2ln`,
    `${encode({})}.!${encode({})}.c2ln`,
  ]) {
    assert.equal(decodeJwtPayload(token), null, token);
  }
});

test('verifies real RS256 signatures and caches validated JWKS', async (t) => {
  const { verifier, fetch } = setup(t);
  const token = await sign(claims());
  assert.deepEqual(await verifyLogoutToken(token, verifier), { sid: 'session-1', sub: 'user-1' });
  await verifyLogoutToken(token, verifier);
  assert.equal(fetch.mock.callCount(), 1);
  await assert.rejects(
    verifyLogoutToken(
      await sign({ ...claims(), sid: 'other' }).then((value) => {
        const parts = value.split('.');
        parts[1] = encode(claims());
        return parts.join('.');
      }),
      verifier,
    ),
    LogoutTokenError,
  );
});

test('rejects signed malformed claims, expired tokens, and future issue times', async (t) => {
  const { verifier } = setup(t);
  for (const patch of [
    { iss: 'wrong' },
    { aud: ['app', 42] },
    { aud: [] },
    { iat: 'now' },
    { iat: null },
    { iat: now - 301 },
    { iat: now + 61 },
    { exp: 'tomorrow' },
    { exp: null },
    { exp: now },
    { sid: 42 },
    { sid: '' },
    { sub: 42 },
    { sub: null },
    { nonce: null },
    { events: event },
    { events: [] },
    { events: { [event]: null } },
    { events: { [event]: [] } },
  ]) {
    await assert.rejects(
      verifyLogoutToken(await sign({ ...claims(), ...patch }), verifier),
      LogoutTokenError,
    );
  }
  await assert.rejects(
    verifyLogoutToken(await sign(claims(), { alg: 'RS256', kid: 42 }), verifier),
    LogoutTokenError,
  );
});

test('preserves optional expiration/subject and allows 60 seconds of issue-time skew', async (t) => {
  const { verifier } = setup(t);
  const payload = claims();
  delete payload.exp;
  delete payload.sub;
  payload.iat = now + 60;
  assert.deepEqual(await verifyLogoutToken(await sign(payload), verifier), {
    sid: 'session-1',
    sub: null,
  });
});

test('rejects malformed JWKS response structures', async (t) => {
  for (const body of [
    null,
    {},
    { keys: {} },
    { keys: [null] },
    { keys: [{ kty: 'RSA' }] },
    { keys: [{ ...publicKey, kid: 42 }] },
    { keys: [{ ...publicKey, key_ops: 'verify' }] },
  ]) {
    const { verifier } = setup(t, body);
    await assert.rejects(verifyLogoutToken(await sign(claims()), verifier), LogoutTokenError);
  }
});

test('rejects keys with incompatible algorithm, use, or key operations', async (t) => {
  for (const patch of [{ alg: 'RS512' }, { use: 'enc' }, { key_ops: ['sign'] }]) {
    const { verifier } = setup(t, { keys: [{ ...publicKey, ...patch }] });
    await assert.rejects(verifyLogoutToken(await sign(claims()), verifier), LogoutTokenError);
  }
});

test('refreshes cached JWKS once when the signing key id changes', async (t) => {
  const { verifier, fetch } = setup(t);
  await verifyLogoutToken(await sign(claims()), verifier);
  fetch.mock.mockImplementation(async () =>
    Response.json({ keys: [{ ...publicKey, kid: 'key-2' }] }),
  );
  // Inside jose's 30-second cooldown an unknown kid is refused without a refetch.
  await assert.rejects(
    verifyLogoutToken(await sign(claims(), { alg: 'RS256', kid: 'key-2' }), verifier),
    LogoutTokenError,
  );
  assert.equal(fetch.mock.callCount(), 1);
  t.mock.method(Date, 'now', () => (now + 31) * 1000);
  await verifyLogoutToken(await sign(claims(), { alg: 'RS256', kid: 'key-2' }), verifier);
  assert.equal(fetch.mock.callCount(), 2);
});

test('revocation cannot be shortened, can be extended, and expires at its deadline', (t) => {
  let time = now * 1000;
  t.mock.method(Date, 'now', () => time);
  const sid = crypto.randomUUID();
  revokeKeycloakSession(sid, 100);
  revokeKeycloakSession(sid, 1);
  time += 2000;
  assert.equal(isKeycloakSessionRevoked(sid), true);
  revokeKeycloakSession(sid, 200);
  time += 100000;
  assert.equal(isKeycloakSessionRevoked(sid), true);
  time += 100000;
  assert.equal(isKeycloakSessionRevoked(sid), false);
});

test('invalid revocation TTLs throw without clearing an existing revocation', () => {
  const sid = crypto.randomUUID();
  revokeKeycloakSession(sid, 100);
  for (const ttl of [0, -1, NaN, Infinity, -Infinity, Number.MAX_VALUE]) {
    assert.throws(() => revokeKeycloakSession(sid, ttl), RangeError);
    assert.equal(isKeycloakSessionRevoked(sid), true);
  }
});

test('back-channel logout handler revokes the session and answers per spec', async (t) => {
  const { verifier } = setup(t);
  const sid = crypto.randomUUID();
  const post = (body) =>
    new Request('http://web.internal/api/auth/backchannel-logout', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
  const seen = [];
  const ok = await handleBackchannelLogout(
    post(new URLSearchParams({ logout_token: await sign({ ...claims(), sid }) })),
    { verifier, revokeForSeconds: 60, onLogout: (token) => seen.push(token) },
  );
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('cache-control'), 'no-store');
  assert.deepEqual(seen, [{ sid, sub: 'user-1' }]);
  assert.equal(isKeycloakSessionRevoked(sid), true);

  const bad = await handleBackchannelLogout(
    post(new URLSearchParams({ logout_token: await sign({ ...claims(), iss: 'wrong' }) })),
    { verifier, revokeForSeconds: 60 },
  );
  assert.equal(bad.status, 400);
  assert.equal(bad.headers.get('cache-control'), 'no-store');
  const body = await bad.json();
  assert.equal(body.error, 'invalid_request');
  assert.match(body.error_description, /iss/);

  const missing = await handleBackchannelLogout(post(new URLSearchParams()), {
    verifier,
    revokeForSeconds: 60,
  });
  assert.equal(missing.status, 400);
  assert.equal((await missing.json()).error, 'invalid_request');
});

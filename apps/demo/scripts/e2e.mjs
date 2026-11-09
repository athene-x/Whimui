/**
 * End-to-end check of the login flow against a running Keycloak and dev server:
 *
 *   pnpm --filter demo keycloak      # once; wait until http://localhost:8082 answers
 *   pnpm --filter demo dev           # in another terminal
 *   pnpm --filter demo e2e
 *
 * Logs in as the realm's test user by driving Keycloak's login form, then checks the BFF,
 * the protected page, cross-site refusal, front-channel logout and back-channel revocation.
 * Reads apps/demo/.env (APP_URL, DEMO_USER_PASSWORD, API_AUDIENCE); DEMO_USER=demo by default.
 */
import assert from 'node:assert/strict';

try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {
  // Environment may be provided by the shell instead.
}

const APP = (process.env.APP_URL ?? 'http://localhost:3002').replace(/\/$/, '');
const USER = process.env.DEMO_USER ?? 'demo';
const PASSWORD = process.env.DEMO_USER_PASSWORD;
const AUDIENCE = process.env.API_AUDIENCE ?? 'demo-api';
const COOKIE_PREFIX = 'demo';

if (!PASSWORD) {
  console.error('DEMO_USER_PASSWORD is not set (apps/demo/.env).');
  process.exit(2);
}

/** Minimal cookie jar keyed by origin; enough for Keycloak and the app on plain HTTP. */
class Jar {
  #cookies = new Map();

  store(url, response) {
    const origin = new URL(url).origin;
    const jar = this.#cookies.get(origin) ?? new Map();
    for (const header of response.headers.getSetCookie()) {
      const [pair, ...attributes] = header.split(';');
      const index = pair.indexOf('=');
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      const expired =
        attributes.some((a) => /^\s*max-age=0*\s*$/i.test(a)) ||
        attributes.some((a) => /^\s*expires=/i.test(a) && Date.parse(a.split('=')[1]) < Date.now());
      if (expired || value === '') jar.delete(name);
      else jar.set(name, value);
    }
    this.#cookies.set(origin, jar);
  }

  header(url) {
    const jar = this.#cookies.get(new URL(url).origin);
    return jar && jar.size ? [...jar].map(([k, v]) => `${k}=${v}`).join('; ') : undefined;
  }

  names(url) {
    return [...(this.#cookies.get(new URL(url).origin)?.keys() ?? [])];
  }

  snapshot(url) {
    return new Map(this.#cookies.get(new URL(url).origin) ?? []);
  }

  restore(url, cookies) {
    this.#cookies.set(new URL(url).origin, new Map(cookies));
  }
}

const jar = new Jar();

async function request(url, init = {}) {
  const headers = new Headers(init.headers);
  const cookie = jar.header(url);
  if (cookie) headers.set('cookie', cookie);
  const response = await fetch(url, { ...init, headers, redirect: 'manual' });
  jar.store(url, response);
  return response;
}

/** Follows redirects one hop at a time so every Set-Cookie lands in the jar. */
async function follow(url, init, { stopAt, max = 10 } = {}) {
  let current = url;
  let response = await request(current, init);
  for (let hop = 0; hop < max; hop++) {
    const location = response.headers.get('location');
    if (!location || response.status < 300 || response.status >= 400) break;
    current = new URL(location, current).toString();
    if (stopAt && stopAt(current)) return { response, url: current, stopped: true };
    response = await request(current);
  }
  return { response, url: current, stopped: false };
}

let step = 0;
function log(message) {
  step += 1;
  console.log(`${String(step).padStart(2, ' ')}. ${message}`);
}

async function main() {
  // 1. Logged out: the BFF refuses, the protected page redirects to the login.
  const anonymous = await request(`${APP}/api/v1/me`);
  assert.equal(anonymous.status, 401);
  assert.equal((await anonymous.json()).code, 'Web.SessionRequired');
  log('GET /api/v1/me without a session → 401 Web.SessionRequired');

  const gate = await request(`${APP}/auth/protected`);
  assert.ok(gate.status >= 300 && gate.status < 400, `expected a redirect, got ${gate.status}`);
  assert.match(gate.headers.get('location') ?? '', /\/api\/auth\/login\?returnTo=/);
  log('GET /auth/protected without a cookie → redirect to the login (proxy.ts + hasSessionCookie)');

  // 2. Start the login: the app sends us to Keycloak's authorization endpoint.
  const start = await request(
    `${APP}/api/auth/login?returnTo=${encodeURIComponent(`${APP}/auth`)}`,
  );
  assert.ok(
    [302, 303, 307].includes(start.status),
    `login route answered ${start.status}: ${await start.text()}`,
  );
  const authorizeUrl = start.headers.get('location');
  assert.match(authorizeUrl, /\/protocol\/openid-connect\/auth\?/);
  const authorize = new URL(authorizeUrl);
  assert.equal(authorize.searchParams.get('client_id'), process.env.AUTH_CLIENT_ID ?? 'demo-web');
  assert.equal(authorize.searchParams.get('response_type'), 'code');
  assert.match(authorize.searchParams.get('redirect_uri'), new RegExp(`^${APP}/api/auth/`));
  log(
    `Login route → Keycloak authorize (redirect_uri ${authorize.searchParams.get('redirect_uri')})`,
  );

  // 3. Keycloak's login form.
  const loginPage = await follow(authorizeUrl);
  assert.equal(
    loginPage.response.status,
    200,
    `Keycloak login page answered ${loginPage.response.status}`,
  );
  const html = await loginPage.response.text();
  const action = html.match(/<form[^>]*id="kc-form-login"[^>]*action="([^"]+)"/)?.[1];
  assert.ok(action, 'could not find the Keycloak login form');
  log('Keycloak login page loaded');

  // 4. Submit username/password; Keycloak redirects to the app's callback with the code.
  const submitted = await request(action.replaceAll('&amp;', '&'), {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: USER, password: PASSWORD, credentialId: '' }),
  });
  assert.equal(
    submitted.status,
    302,
    `Keycloak did not accept the credentials (${submitted.status}). Wrong DEMO_USER_PASSWORD, or the realm was imported with an older .env?`,
  );
  const callbackUrl = submitted.headers.get('location');
  assert.match(callbackUrl, new RegExp(`^${APP}/api/auth/.*[?&]code=`));
  log('Credentials accepted → callback with authorization code');

  // 5. The callback exchanges the code (server-to-server) and sets the session cookies.
  const callback = await follow(callbackUrl, undefined, { stopAt: (url) => url === `${APP}/auth` });
  assert.ok(
    callback.stopped,
    `callback did not return to /auth (ended at ${callback.url} with ${callback.response.status})`,
  );
  const cookieNames = jar.names(APP);
  assert.ok(
    cookieNames.includes(`${COOKIE_PREFIX}.session_token`),
    `no session cookie; have ${cookieNames.join(', ')}`,
  );
  log(`Callback set cookies: ${cookieNames.join(', ')}`);

  // 6. Logged in: the BFF forwards with a bearer token that the (fake) API accepts.
  const me = await request(`${APP}/api/v1/me`);
  const meBody = await me.text();
  assert.equal(me.status, 200, `GET /api/v1/me → ${me.status} ${meBody.slice(0, 300)}`);
  const claims = JSON.parse(meBody);
  assert.equal(claims.preferredUsername, USER);
  assert.ok(claims.aud.includes(AUDIENCE), `aud ${JSON.stringify(claims.aud)} lacks ${AUDIENCE}`);
  assert.ok(claims.sid, 'access token has no sid');
  log(`GET /api/v1/me → 200 for ${claims.preferredUsername}, aud ${JSON.stringify(claims.aud)}`);

  const protectedPage = await request(`${APP}/auth/protected`);
  assert.equal(protectedPage.status, 200);
  log('GET /auth/protected with the session → 200');

  const authPage = await request(`${APP}/auth`);
  const authHtml = await authPage.text();
  assert.ok(!authHtml.includes('badge-fail'), 'the auth page shows a failing check');
  // React escapes quotes in text, so look for a key name rather than JSON syntax.
  assert.ok(
    authHtml.includes('preferredUsername'),
    'the auth page did not show the server-side API call result',
  );
  const passes = authHtml.match(/badge-pass/g)?.length ?? 0;
  assert.ok(passes >= 7, `expected at least 7 passing checks on /auth, found ${passes}`);
  log(`GET /auth → ${passes} checks pass, none fail, server-side API call succeeded`);

  // 7. Writes through the BFF need the app's own Origin (CSRF).
  const crossSite = await request(`${APP}/api/v1/validate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
    body: JSON.stringify({ title: 'x' }),
  });
  assert.equal(crossSite.status, 403);
  assert.equal((await crossSite.json()).code, 'Web.CrossSiteRequest');
  const sameSite = await request(`${APP}/api/v1/validate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: APP },
    body: JSON.stringify({ title: '' }),
  });
  assert.equal(sameSite.status, 400);
  assert.equal((await sameSite.json()).errors?.[0]?.field, 'title');
  log(
    'POST /api/v1/validate: foreign Origin → 403 Web.CrossSiteRequest; own Origin → 400 with field errors',
  );

  // 8. Logout: the app drops its session and sends the browser to Keycloak's end-session endpoint
  //    with id_token_hint. Keycloak then back-channel-POSTs a logout token to the app.
  const before = jar.snapshot(APP);
  const logout = await request(`${APP}/api/auth/logout`, {
    method: 'POST',
    headers: { origin: APP },
  });
  assert.equal(logout.status, 303);
  const endSession = new URL(logout.headers.get('location'));
  assert.match(endSession.pathname, /\/protocol\/openid-connect\/logout$/);
  assert.ok(
    endSession.searchParams.get('id_token_hint'),
    'no id_token_hint on the end-session URL',
  );
  assert.equal(endSession.searchParams.get('post_logout_redirect_uri'), `${APP}/auth?ended=both`);
  log('POST /api/auth/logout → 303 to Keycloak end-session with id_token_hint');

  const ended = await follow(endSession.toString(), undefined, {
    stopAt: (url) => url.startsWith(`${APP}/auth`),
  });
  assert.ok(
    ended.stopped,
    `Keycloak did not redirect back (ended at ${ended.url}, ${ended.response.status})`,
  );
  log('Keycloak ended the SSO session and redirected back to the app');

  const events = await waitForBackchannel(claims.sid);
  assert.ok(
    events,
    `no back-channel logout for sid ${claims.sid} within 5 s. Can the Keycloak container reach APP_INTERNAL_URL?`,
  );
  log(`Back-channel logout received for sid ${claims.sid} (handleBackchannelLogout → 200)`);

  // 9. Replaying the old cookies must fail: Better Auth cannot invalidate a stateless cookie,
  //    so the revoked sid is what logs the browser out.
  jar.restore(APP, before);
  const replay = await request(`${APP}/api/v1/me`);
  assert.equal(
    replay.status,
    401,
    `old cookies still work after back-channel logout (${replay.status})`,
  );
  log('Old cookies replayed after logout → 401 (isKeycloakSessionRevoked)');

  console.log('\nAll checks passed.');
}

async function waitForBackchannel(sid) {
  for (let i = 0; i < 25; i++) {
    const response = await fetch(`${APP}/api/auth/backchannel-logout`);
    const events = await response.json();
    const match = events.find((event) => event.sid === sid && event.status === 200);
    if (match) return match;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
}

main().catch((error) => {
  console.error(`\nFailed at step ${step + 1}: ${error.message}`);
  process.exit(1);
});

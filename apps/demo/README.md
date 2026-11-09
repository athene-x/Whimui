# Demo: API client and Keycloak auth

A Next.js-only harness that proves `@athene-x/whimui` works end to end: the `api` module
against a fake API that lives in this app, and the `auth` module against a real Keycloak,
wired the way the team's apps wire it (Better Auth without a database, generic OAuth
`keycloak` provider, BFF route at `/api/v1`). Nothing here is a reference for app structure;
use [the starter](../starter/README.md) for that.

```bash
cp apps/demo/.env.example apps/demo/.env      # then set the secrets (see below)
pnpm --filter demo keycloak                   # Keycloak 26 in Docker on :8082, imports the realm
pnpm --filter demo dev                        # http://localhost:3002
pnpm --filter demo e2e                        # scripted login/logout against both (optional)
```

`.env` is read by both Next.js and Docker Compose. Set `AUTH_CLIENT_SECRET` and `AUTH_SECRET` to
`openssl rand -base64 32` outputs and `DEMO_USER_PASSWORD` to anything; the realm import uses the
first and the last, so change them before the first `keycloak` start (afterwards the realm exists and
is not re-imported: `docker compose down -v` in this directory to start over). Port 8082 is the default
because 8081 is normally taken by another project's Keycloak; `KEYCLOAK_PORT` and `AUTH_ISSUER*` move
together.

| Page | What it exercises |
| --- | --- |
| `/api-lab` | In the browser: `createApiClient`, `ApiError` from the envelope, field errors + `toSubmitError`/`describeError`, non-envelope and text bodies → `Web.UnexpectedResponse`, timeout → `Web.Timeout`, connection refused → `Web.NetworkError`, `createQueryClient`/`shouldRetry` (5xx twice, 4xx never), `toListSearchParams`, and the BFF: 401 `Web.SessionRequired` + `markSessionExpired` when logged out, bearer forwarded when logged in. |
| `/auth` | `createKeycloak` URLs, Better Auth session + Keycloak tokens held server-side, `decodeJwtPayload` checks on `iss`/`aud`/`azp`/`sid`, `hasSessionCookie`, `createServerApiClient` + `authorizeWith` calling the API during render, front-channel logout with `id_token_hint`, back-channel logout through `handleBackchannelLogout` + `isKeycloakSessionRevoked`, and a log of the logout tokens received. |
| `/auth/protected` | `proxy.ts` gate with `hasSessionCookie`; the page re-checks the session (revoked cookies). |

The fake API at `/mock/api/v1` answers with the team's error envelope; `GET me` verifies the
bearer token against the realm's JWKS (`iss` = `AUTH_ISSUER`, RS256, `exp`) and requires
`aud` to include `API_AUDIENCE`, so a missing audience mapper shows up as `Demo.WrongAudience`.
`API_BASE_URL` points at it; the BFF and `serverApi` honour a path prefix in that URL, which the
team's `http://api:8080` does not need.

## Realm `whimui-demo`

`keycloak/realms/whimui-demo-realm.json`: client `demo-web` (confidential, authorization code,
audience mapper `demo-api`, back-channel logout URL on `APP_INTERNAL_URL`), client `demo-api`
(bearer-only, exists to be named as the audience), user `demo` with `DEMO_USER_PASSWORD`.
Placeholders come from `compose.yaml`'s `environment`. Differences from the team standard, on
purpose: the dev-file database instead of PostgreSQL, no mailpit, no theme, no service account.

## Testing back-channel logout by hand

1. Log in on `/auth`. Every check should pass and the server-side call should show your claims.
2. Click "End the Keycloak session only". Keycloak ends the SSO session and POSTs a logout token to
   `http://host.docker.internal:3002/api/auth/backchannel-logout` (the container reaching your
   machine). Back on `/auth` the state reads `revoked` and the log shows the token.
3. Alternatively log out from the Keycloak account console or end the session in the admin console
   (`http://localhost:8082`, realm `whimui-demo`): same effect, since it is the realm's `sid`.

## Checks

`pnpm --filter demo check` runs oxlint + the starter's dependency-boundary checker, oxfmt, typecheck
and the checker's tests. `pnpm --filter demo e2e` needs Keycloak and the dev server running.

# @athene-x/whimui

## 0.2.0

### Minor Changes

- New `./query` entry for the TanStack Query glue: `invalidateOnSuccess` and `STALE_TIME_MS`
  move there from `./api`, joined by `createQueryClient`, `getQueryClient` and `shouldRetry`.
  `./api` now depends on Ky alone and gains `createServerApiClient` and `authorizeWith` for
  server components and route handlers. `onUnauthorized` fires once per 401 instead of twice.
- `./auth` verifies back-channel logout tokens with `jose` (new optional peer dependency)
  instead of hand-written JWKS and WebCrypto code, and adds `handleBackchannelLogout`, which
  verifies the token, revokes its session and answers per the OIDC spec. `parseJwt` is gone;
  `decodeJwtPayload` stays. Login, refresh and front-channel logout are left to better-auth.

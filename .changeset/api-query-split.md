---
'@athene-x/whimui': minor
---

New `./query` entry for the TanStack Query glue: `invalidateOnSuccess` and `STALE_TIME_MS`
move there from `./api`, joined by `createQueryClient`, `getQueryClient` and `shouldRetry`.
`./api` now depends on Ky alone and gains `createServerApiClient` and `authorizeWith` for
server components and route handlers. `onUnauthorized` fires once per 401 instead of twice.

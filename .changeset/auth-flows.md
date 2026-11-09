---
'@athene-x/whimui': minor
---

`./auth` verifies back-channel logout tokens with `jose` (new optional peer dependency)
instead of hand-written JWKS and WebCrypto code, and adds `handleBackchannelLogout`, which
verifies the token, revokes its session and answers per the OIDC spec. `parseJwt` is gone;
`decodeJwtPayload` stays. Login, refresh and front-channel logout are left to better-auth.

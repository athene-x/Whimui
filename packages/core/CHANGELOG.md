# @athene-x/whimui

## 0.3.0

### Minor Changes

- 6fcf83d: `useFieldControl` and `FormFieldProps` move from the registry's `form-field.tsx` into
  `@athene-x/whimui/form`, so the id and aria wiring of every field component comes from the kit.
  `form-field.tsx` keeps re-exporting both; field components need no change, but the `form`
  registry item now requires a kit version that ships them.
  
  The `feedback` item's `load-error.tsx` now reads its message with `describeError` from
  `@athene-x/whimui/api` instead of `toSubmitError(...).message`; the rendered text is unchanged.

### Patch Changes

- 6fcf83d: Form and API error helpers:
  
  - `./form` gains `applySubmitError(formApi, result)`: puts the field errors from `toSubmitError`
    on the form as `onSubmit` errors and returns the form-level message, so every app applies API
    errors to a form the same way.
  - `describeError` moves to `./api` next to `ApiError`, with a new `apiErrorCodes(error)` helper.
    `./form` still re-exports `describeError` (deprecated); update imports when convenient.
- f5b8fa7: Hooks and list-query:
  
  - `useMediaQuery` now uses `useSyncExternalStore` over a `matchMediaStore(query)` pair, so it
    reads `matchMedia` synchronously on the client, reports `false` during SSR and hydration, and
    no longer sets state from an effect after mount.
  - `useListQuery` keeps stable identities for `setPage`, `setSize`, `setPagination`, `setSort`,
    `toggleSort`, `setFilter`, `setSearchInput` and `reset`, so `useListTable`'s page clamp and
    memoized toolbars no longer re-run on every render.
  - Page sizes are capped at `MAX_LIST_SIZE` (100), matching the API's `ListQueryRequest` limit,
    instead of being sent through unchanged.

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

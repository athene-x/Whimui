---
'@athene-x/whimui': patch
---

Hooks and list-query:

- `useMediaQuery` now uses `useSyncExternalStore` over a `matchMediaStore(query)` pair, so it
  reads `matchMedia` synchronously on the client, reports `false` during SSR and hydration, and
  no longer sets state from an effect after mount.
- `useListQuery` keeps stable identities for `setPage`, `setSize`, `setPagination`, `setSort`,
  `toggleSort`, `setFilter`, `setSearchInput` and `reset`, so `useListTable`'s page clamp and
  memoized toolbars no longer re-run on every render.
- Page sizes are capped at `MAX_LIST_SIZE` (100), matching the API's `ListQueryRequest` limit,
  instead of being sent through unchanged.

# Frontend conventions

Read README.md before changing application structure. This app is the reference starter;
keep it independent of playground and of a shared component library.

- Keep routes/layouts thin and compose features through their public entries.
- Keep HTTP adapters, query options, schemas and feature components in their named files/folders.
- Use the configured app API client in feature api.ts. Keep query keys and invalidation in queries.ts.
- Shared layers cannot import features or routes; features cannot import routes or another feature's internals.
- Keep server code behind a server-only entry; do not export it from a client-safe feature index.
- Use message keys for UI text and preserve the core error, pagination and placeholder contracts.
- Do not introduce generic abstractions for a single feature. Each app owns its shadcn components.
- After changes, run pnpm --filter starter check. Verify runtime behavior when handlers or UI flows change.

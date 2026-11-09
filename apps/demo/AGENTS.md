# Demo app conventions

Read README.md first. This app is a test harness for `@athene-x/whimui`, not a reference for
application structure (that is `apps/starter`). It mirrors how the team's real apps wire Better
Auth (no database) + Keycloak + the `/api/v1` BFF, so changes here should keep proving the kit.

- Keep the kit under test: prefer calling `@athene-x/whimui/*` helpers over re-implementing them.
- The fake API lives in `features/mock-api/server.ts` (mounted at `/mock/api/v1`); add endpoints
  there and a matching scenario in `features/api-lab/scenarios.ts`.
- Secrets never go in the realm file, compose.yaml or this repo; `.env` is local and gitignored.
- The same boundary checker as the starter runs in `pnpm lint`; `lib/api-server.ts` is the only
  extra adapter allowed to call `fetch`.
- After changes run `pnpm --filter demo check`, and `pnpm --filter demo e2e` when auth or BFF code moved.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

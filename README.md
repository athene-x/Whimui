# Athenex

The standard web kit for our Next.js apps (Health-Check-Up, Minato-Tracking, …): the parts
that every app copied from the previous one, kept in one place. Nothing here is wired into an
app yet; the apps adopt it piece by piece.

Two kinds of things, distributed two ways:

| What | Where | How an app gets it |
| --- | --- | --- |
| Logic with no UI: server-paged lists, API client + `ApiError`, form core, Keycloak BFF helpers, bulk import, `ui` messages | `packages/core` → npm package `@athenex/web-core` | `pnpm add @athenex/web-core` + `transpilePackages` |
| Components built on the shadcn primitives: form fields, data table, dialogs, status pages, app shell… | `apps/playground/src/components` → shadcn registry `@athenex` | `pnpm dlx shadcn add @athenex/form` (copied into the app, free to restyle) |

The split follows what the two apps showed: the logic was byte-identical between them, while
`components/ui` (buttons, cards, inputs) is restyled per app (PMK's `base-luma` theme vs
Minato's `base-vega`). So the kit never ships `components/ui`; registry items depend on the
app's own copies through `registryDependencies`.

## Layout

```text
packages/core/            @athenex/web-core (TypeScript source, no build step)
  src/list-query/         useListQuery, useListTable, list-query state/params, pageRange
  src/api/                createApiClient, ApiError, session-expired store, query defaults
  src/form/               TanStack form contexts, field-state helpers, toSubmitError/describeError
  src/auth/               (server only) jwt, Keycloak URLs, back-channel logout token, revoked sessions
  src/bulk/               bulk rows + CSV/XLSX import helpers
  src/i18n/               breadcrumbs, enum labels, date helpers, next-intl types
  src/hooks/              useMediaQuery, useIsMobile
  src/messages/           the `ui` namespace (en, th) used by the registry components
apps/playground/          Next app = the registry source + a demo page that mounts every item
  registry.json           the items; `pnpm registry:build` writes public/r/*.json
  src/components/         registry items (kebab-case files, named exports)
  src/components/ui/      shadcn primitives (base-vega), NOT published; apps keep their own
  src/styles/tokens.css   Minato brand palette (the shadcn variables), playground only
  src/styles/semantic-tokens.css  success/warning/critical/info: the `tokens` registry item's cssVars
  scripts/check-tokens.mjs  fails when semantic-tokens.css and the registry item drift
```

## Working on the kit

```bash
pnpm install
pnpm dev              # playground at http://localhost:3000 (/demo mounts the components)
pnpm check            # lint + format + typecheck both packages + build the registry
```

Registry source is a normal app layout, so the playground type-checks it as an app would.
Item files import `@/components/ui/*`, `@/lib/utils`, `@/components/*` and
`@athenex/web-core/*`; the shadcn CLI rewrites the `@/` aliases for the consuming app.

## Using it in an app (when the time comes)

1. `pnpm add @athenex/web-core` and add `transpilePackages: ['@athenex/web-core']` to
   `next.config.ts` (the package ships `.ts` source so `'use client'` boundaries survive).
2. Add the `ui` messages: `{ ...messages, ui: (await import('@athenex/web-core/messages/en')).default }`
   per locale; the registry components read `useTranslations('ui')`.
3. Register the registry in `components.json`:
   `"registries": { "@athenex": "<registry url>/r/{name}.json" }` and
   `pnpm dlx shadcn add @athenex/form @athenex/data-table …`.
4. `pnpm dlx shadcn add @athenex/tokens` writes the semantic colour variables (`--success`,
   `--success-tint`, `--success-foreground`, same for `warning`, `critical`, `info`) into the
   app's `globals.css` for both themes and maps them in `@theme inline`. Items that use them
   list it in `registryDependencies`, so it also comes along on its own. Retune the values to
   the app's palette afterwards.

Publishing the core package (GitHub Packages or a private registry) and hosting `public/r`
(GitHub Pages or the playground itself) are not set up yet.

## What an app must provide

The kit is a base, not a complete app. Registry items assume these exist in the consuming app;
this is the whole contract between the kit and an app.

**shadcn on Base UI.** `components.json` must use a `base-*` style (`base-vega`, `base-luma`…),
not a Radix one. The items use the Base UI `render` prop and `nativeButton`, which the Radix
primitives do not have. `iconLibrary` should be `tabler`; the items import `@tabler/icons-react`
directly and declare it as a dependency, so a lucide app would carry both icon sets.

**Files every shadcn app already has.** `@/lib/utils` exporting `cn`, and the primitives each
item lists in `registryDependencies` (`shadcn add` installs them when missing).

**Packages.** `@athenex/web-core` (see step 1 above), `next-intl`, and whatever each item lists in
`dependencies`. The core package's peer dependencies pin the majors it was written against:
TanStack Table v9 (not v8; the `useTable`/`tableFeatures` API differs), TanStack Query v5,
TanStack Form v1, Zod v4, ky v2, React 19.

**Messages.** The `ui` namespace from `@athenex/web-core/messages/<locale>` merged into the app's
messages for every locale (step 2 above). Items call `useTranslations('ui')` and fail at runtime
without it.

**Design tokens.** The `tokens` registry item (step 4), or the same twelve variables defined by
hand in both themes and mapped in `@theme inline`. Without them classes like `border-critical`
render with no colour. The playground's copy is `src/styles/semantic-tokens.css`; `pnpm
tokens:check` keeps it equal to the registry item.

**i18n files for `locale-switcher`.** `src/i18n/config.ts` exporting `locales`, `Locale` and
`src/i18n/actions.ts` exporting a `setLocale` server action, shaped like the playground's. The
other items do not need them.

**Routes the defaults point at.** `createApiClient` calls `/api/v1/*` (the app's BFF route that
adds the bearer token); `SessionExpiredDialog` links to `/api/auth/login?returnTo=…`;
`LogoutForm` posts to `/api/auth/logout`. Each is a prop or option if the app's routes differ.

**API configuration.** `createApiClient` accepts native Ky options, including headers,
credentials, timeouts, retries, and hooks. Retries default to `0` so React Query can own
the retry policy. Use `normalizeError(state)` to adapt another backend's error format;
the browser's `onUnauthorized` callback still runs first on a 401. App `beforeError`
hooks run after normalization. The default `ApiError.data` preserves the original HTTP
error response data. The top-level `beforeRequest` option remains supported and runs
before `hooks.beforeRequest`.

**Paged query results.** When retaining previous results with React Query, pass its
`isPlaceholderData` flag to `useListTable` so previous results cannot correct the current
page. Correction runs after render and requires result page/size to match the list state.

```ts
const table = useListTable({
  list,
  columns,
  result: query.data,
  isPlaceholderData: query.isPlaceholderData,
});
```

**Server-only modules.** `@athenex/web-core/auth` uses Node `Buffer`, WebCrypto and
`better-auth/cookies`; import it from route handlers and middleware only, and install `better-auth`
if you import it at all. `revokeKeycloakSession` keeps its list in process memory, so it only
works for a single server instance.

The quickest check that an app meets the contract: `shadcn add` every item into it and mount
the playground's `DemoScreen`.

## Conventions

- Files kebab-case, components as named exports (shadcn style).
- Links use `AppLink`, never `next/link` directly, so a `BasePathProvider` can prefix a zone.
- Text in shared components comes from the `ui` namespace; apps never need to edit the kit to
  translate it, only to add a locale.
- Components import logic from `@athenex/web-core/*`, never from each other's `lib/` copies.

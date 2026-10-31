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

```
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
  src/styles/tokens.css   Minato tokens + the semantic token contract (success/warning/critical/info…)
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
4. Define the semantic tokens (`--success`, `--success-tint`, `--success-foreground`, same for
   `warning`, `critical`, `info`, plus `--hairline`, `--placeholder`, `--primary-hover`,
   `--destructive-tint`, `--destructive-border`) in the app's `tokens.css` and map them in
   `@theme inline` as the playground's `globals.css` does.

Publishing the core package (GitHub Packages or a private registry) and hosting `public/r`
(GitHub Pages or the playground itself) are not set up yet.

## Conventions

- Files kebab-case, components as named exports (shadcn style).
- Links use `AppLink`, never `next/link` directly, so a `BasePathProvider` can prefix a zone.
- Text in shared components comes from the `ui` namespace; apps never need to edit the kit to
  translate it, only to add a locale.
- Components import logic from `@athenex/web-core/*`, never from each other's `lib/` copies.

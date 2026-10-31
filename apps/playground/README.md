# Component playground

This app is the WhimUI registry source and component catalog. For application structure,
providers, feature boundaries and a real CRUD reference, use [the starter](../starter/README.md).

```bash
pnpm dev
# http://localhost:3000/demo
pnpm --filter playground check
```

Each `/demo/<registry-item>` page includes an interactive preview, a usage snippet, a props
summary, direct dependencies from registry.json and its distributable source paths. Documentation
is English; locale controls switch the components' shared UI messages between English and Thai.
The dark-preview toggle applies to the document so portaled dialogs match too, and restores
the previous theme when leaving the preview.

## Ownership

- `src/components/` and `src/hooks/use-app-form.ts`: installable registry source.
- `src/components/ui/`: playground-owned shadcn Base UI primitives; do not publish these copies.
- `src/demo/`: previews, schemas/fixtures and catalog documentation. Never ship these files.
- `registry.json`: installation files and dependency declarations.
- `public/r/`: generated installation JSON; run `pnpm registry:build` after changing source.
- `src/app/demo/`: catalog routes, preview pages and the isolated demonstration logout POST.

`form-example.tsx` moved into `src/demo` and is no longer installed with the form registry item.
The installed form README still provides a minimal usage example.

## Adding or changing a component

1. Add reusable source without demo data. Declare its npm and registry dependencies in registry.json.
2. Add metadata in `src/demo/catalog.json` and a preview in `src/demo/preview.tsx`. The preview map
   is exhaustive by TypeScript type. Keep fixture data and fake responses under `src/demo`.
3. Include meaningful states: normal/empty/loading/error for data, validation/disabled/pending/error
   for forms, and disabled/pending/error for confirmations. Add narrow-layout and dark-theme checks.
4. Run `pnpm --filter playground check`. `registry:check` audits source existence, local dependency
   closure, npm imports, primitive declarations, catalog coverage and accidental demo imports;
   it also runs regression tests for the auditor. Core/Next/React host assumptions remain documented
   in the root README. This static audit is not a full clean-app installation test.
5. Build the registry and review generated JSON. Preview changes should not alter published files
   unless the reusable source, documentation or dependency declarations changed.

List previews use React Query with a cancellable 500 ms simulated response and placeholder data.
Form/dialog previews use local state only. The session-expired action reloads its demo page;
the logout POST redirects back without reading or changing auth cookies. These are visual examples,
not authentication integration tests. A real app must provide its own login/logout routes.

Registry hosting/publishing is not configured. Installation snippets assume the consuming app has
registered a working `@whimui` URL in components.json.

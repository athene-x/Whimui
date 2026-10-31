# App starter

Copy this app when starting a frontend on the Athenex stack. `playground` remains the
registry preview; this app demonstrates application structure without a shared UI library.

```bash
pnpm install
pnpm --filter starter dev
# http://localhost:3001
pnpm --filter starter check
```

The Tasks feature demonstrates list/search/sort/pagination, create/edit/delete, Zod validation,
TanStack Form, React Query invalidation, placeholder-safe page correction and API error mapping.
Messages are Thai/English; switch language in the header. The native HTML/CSS is intentionally
small so each consuming app can install and style its own shadcn components.

## Structure and dependency direction

```text
src/
  app/                     routes, layouts and feature composition
  features/tasks/
    index.ts               public client-safe feature exports
    server.ts              server-only entry and demo route handlers
    api.ts                 HTTP adapter using the app client
    queries.ts             query keys/options and mutation invalidation
    schemas.ts             input validation and data types
    components/            feature screens and forms
  components/              app-owned UI and shared presentation (add as needed)
  hooks/use-app-form.ts     app form configuration; register app fields here
  lib/api.ts               one configured browser API client
  providers/               app-wide providers
  i18n/                    locale resolution and language action
  messages/                core ui messages plus business messages
```

- `app` composes features through their public `index.ts`. Server app files may import a
  feature's `server.ts`; the server entry must import `server-only`.
- A feature may import its own internals. Imports from another feature use that feature's
  public index. Keep indexes small; expose only intentional contracts. Move genuinely shared
  business contracts to an explicitly owned module when needed, rather than a generic utils folder.
- Shared components, hooks, providers, lib, i18n and messages cannot import features or routes.
- Features cannot import `app`. Pass route-dependent values and navigation callbacks in.
- Browser requests live in feature `api.ts` adapters, using `@/lib/api`. Server integration
  belongs in the server adapter. Query options own keys/caching; mutations await invalidation.
- Use core subpath exports; import other workspaces by package name, not filesystem paths.
- Business text belongs in messages. Components use the `tasks` namespace; registry components
  can use the already loaded `ui` namespace. Override core messages when composing each locale.

`pnpm lint` checks import/re-export/type-import/dynamic-import boundaries using the Babel
TypeScript syntax tree and catches common direct HTTP calls outside adapters. It is an architectural
guardrail, not a security boundary or a complete data-flow analysis. Renaming or wrapping
network APIs still needs code review. Nonliteral module imports are rejected so paths remain
checkable. Next's `server-only` check protects transitive server imports during compilation.

## Starting a real app

1. Copy this directory to `apps/<name>`, change the package name, title and development port,
   then run `pnpm install` at the repository root. Keep the checks and run root `pnpm check`.
2. Set the app's locale/timezone and configure `lib/api.ts` for its API. The default client
   calls same-origin `/api/v1`; the example routes implement that contract.
3. Replace the demo server entry/routes with your backend or authenticated BFF. The demo Map
   is shared within one process, resets on restart and is not durable or safe for multiple instances.
   There is no login, authorization, tenant isolation or session-expiry UI wired into this demo.
   Add server-side authorization to every protected operation; hiding UI is not authorization.
   When adding authentication, wire the 401/session-expired flow to the app's login routes.
4. Initialize the app's own shadcn setup and install the components it needs. Base UI is required
   if adopting the existing Athenex registry items. Configure Tailwind/tokens and replace the demo
   CSS. Keep UI primitives free of business dependencies.
5. Use Tasks as the reference for the first real feature, then remove the demo routes and messages.
   Add tests for the feature's actual behavior and a production build to the app's release checks.

Do not copy `node_modules`, `.next` or generated Next type files. The boundary checker travels
with the starter and derives its source root from its own location. This starter expects the
workspace core package; publishing core/registry remains a separate task.

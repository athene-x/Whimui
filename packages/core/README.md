# @athene-x/whimui

WhimUI standard web kit: framework-level logic shared by the Next.js apps (server-paged
lists, API client, form core, Keycloak BFF helpers, UI messages).

Published as TypeScript source to GitHub Packages. Consumers map the `@athene-x` scope to
`https://npm.pkg.github.com` in `.npmrc`, authenticate with a token that has
`read:packages`, and add the package to `transpilePackages` in `next.config.ts`.

```bash
pnpm add @athene-x/whimui
```

Entry points: `.`, `./list-query`, `./api`, `./query`, `./form`, `./auth`, `./i18n`, `./hooks`,
`./messages/en`, `./messages/th`. See `docs/releases.md` in the repository for versioning
and publishing.

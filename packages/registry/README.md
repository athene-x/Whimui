# WhimUI registry version

This workspace holds the registry's version and generated changelog for Changesets. It is
private and is never published to npm. Component source stays in `apps/playground`.

`pnpm registry:release` builds a snapshot under `apps/playground/public/r/<version>/`, pins
`@athene-x/whimui` dependencies, and records content hashes in `release-manifest.json`.
Existing snapshots cannot be overwritten with different content.

See [the release guide](../../docs/releases.md).

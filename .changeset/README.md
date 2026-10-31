# WhimUI changesets

Run `pnpm changeset` when a change needs a release. Select `@athene-x/whimui` for package API
changes and `@whimui/registry` for installable component/dependency changes. The latter is
private metadata for the source registry, not an npm UI library. Do not select the private
playground/starter applications for kit releases.

Include both packages when a core release should be adopted by the registry: registry snapshots
pin the current core version. A new snapshot therefore needs its own registry version bump.
Demo-only changes and tooling changes do not need a release changeset.

See [the release guide](../docs/releases.md) for the complete workflow. An empty changeset records this tooling setup without a product
version bump; `0.1.0` remains the initial unpublished version.

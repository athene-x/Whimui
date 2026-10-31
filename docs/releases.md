# WhimUI versions and releases

Core and components have independent versions, managed by Changesets:

| Release | Version source | Distribution |
| --- | --- | --- |
| `@whimui/core` | `packages/core/package.json` | Private npm registry; TypeScript source, no build |
| `@whimui/registry` | `packages/registry/package.json` | Immutable JSON under `/r/<version>/`; never npm-published |

The registry workspace is version metadata only. Source components stay in playground.
`playground` and `starter` are private applications; do not select them for kit releases.
Private versioning is enabled so Changesets can version the registry metadata workspace.

Both versions start at `0.1.0`. This setup has not published either release. Generate a
changeset for subsequent product changes; the initial release may use the existing versions.

## Choosing a bump

After `1.0.0`, use patch for compatible fixes, minor for compatible additions, and major for
breaking public APIs. During `0.x`, our convention is patch for compatible fixes/additions and
minor for breaking changes. Include migration instructions for breaking changes. Promote to
`1.0.0` when the public API is stable enough for consumers to rely on.

Registry compatibility includes component props, required providers/messages/styles, dependency
requirements and installed file paths. Changes to previews alone do not require a registry release.

## Record and prepare changes

```bash
pnpm changeset
pnpm release:status
```

Select `@whimui/core`, `@whimui/registry`, or both, then enter the bump and a useful change
summary. Commit the generated `.changeset/*.md` with the implementation. For example:

```md
---
'@whimui/core': patch
'@whimui/registry': patch
---

Correct list page handling and update the registry to use the corrected core version.
```

When ready to release:

```bash
pnpm release:version
pnpm check
```

This consumes pending changesets, updates versions/changelogs, and refreshes the lockfile.
Review and commit the resulting changes before publishing. No commit or publish happens
automatically. The two versions do not need matching numbers.

Changesets does not inspect component changes outside `packages/registry`. Selecting the
registry package for those changes is an explicit contributor responsibility.

## Build a versioned registry

```bash
pnpm registry:release
```

This builds from current source in a temporary directory and writes:

```text
apps/playground/public/r/0.1.0/
  registry.json
  form.json
  data-table.json
  ...
  release-manifest.json
```

Each item's `@whimui/core` npm dependency is pinned to the current core version. The manifest
records registry/core versions and SHA-256 hashes. Rebuilding identical files is allowed;
changed content under the same version is rejected. Bump the registry version instead.
Stable `x.y.z` versions are supported; prerelease registry snapshots are not implemented yet.

Commit the new snapshot directory with its version/changelog so future builds can protect it.
The unversioned `/r/*.json` files remain a mutable development preview; ordinary `registry:build`
updates those without touching versioned directories. Never edit previously released snapshots.

If a core release should be adopted by the registry, include a registry bump too: changing the
pinned core version changes snapshot content. A core-only release can leave the old registry
snapshot pinned to the previous core version; skip `registry:release` in that case.

Host snapshot files at `/r/<version>/` and retain older directories. Configure the consuming
app's namespace to the selected release, using your actual host:

```json
{
  "registries": {
    "@whimui": "https://your-registry.example/r/0.1.0/{name}.json"
  }
}
```

The `@whimui` namespace must be configured to that version: local transitive dependencies
such as `@whimui/form` resolve through it. Use the namespace when installing:

```bash
pnpm dlx shadcn add @whimui/form @whimui/data-table
```

The release freezes WhimUI sources and its core version; upstream shadcn primitives and other
npm dependencies still follow their own requirements. Keep the consuming app's lockfile and
review installed changes. Updating a package does not update previously copied components.

## Publish and host

Configure the chosen private npm registry and authentication before running:

```bash
pnpm release:publish
git push --follow-tags
```

Changesets publishes the non-private core package and creates package release tags. The
registry workspace is private and only receives version handling. If releasing a registry
snapshot, create an annotated tag for its committed version (for example,
`git tag -a @whimui/registry@0.1.0 -m "WhimUI registry 0.1.0"`)
before pushing tags. Private application versions are not automatically tagged. `access` defaults to
`restricted`; no registry destination, token, or hosting service is configured by this setup.
Do not use the publish command until the destination and package access are configured.

Publish core before consumers install a snapshot that pins it. Upload registry snapshots to
your authenticated host with an append-only policy; the local overwrite check does not protect
against someone replacing files directly on the host. Keep tokens in environment/CI secrets.

## Prepare artifacts in GitHub Actions

Run **Prepare release artifacts** manually on the commit containing the intended versions and
source. Choose core, registry, or both. It runs checks and produces a core `.tgz`, a versioned
registry bundle, or both. It does not bump versions, publish packages, push tags, or deploy.

Extract the registry bundle under `/r/<registry-version>/` on your chosen host. The workflow
is intentionally separate from hosting/authentication so a private Git repository does not
accidentally become a public component endpoint.

References: [Changesets version/publish](https://changesets.dev/guide/versioning-and-publishing),
[private versioned projects](https://changesets.dev/guide/beyond-npm),
[SemVer](https://semver.org/), [shadcn private registry](https://ui.shadcn.com/docs/registry/authentication).

# WhimUI versions and releases

Core and components have independent versions, managed by Changesets:

| Release | Version source | Distribution |
| --- | --- | --- |
| `@athene-x/whimui` | `packages/core/package.json` | GitHub Packages (`npm.pkg.github.com`), `athene-x` org; TypeScript source, no build |
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

Select `@athene-x/whimui`, `@whimui/registry`, or both, then enter the bump and a useful change
summary. Commit the generated `.changeset/*.md` with the implementation. For example:

```md
---
'@athene-x/whimui': patch
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

Each item's `@athene-x/whimui` npm dependency is pinned to the current core version. The manifest
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

Core publishes to GitHub Packages under the `athene-x` organization. GitHub Packages requires
the npm scope to equal the organization login, and the `repository` field in
`packages/core/package.json` must point at the repository that owns the package. The root
`.npmrc` maps the `@athene-x` scope to `https://npm.pkg.github.com`; authentication is never
committed.

Publish from CI by running **Publish core to GitHub Packages** manually on the commit that
contains the versioned `main`. It runs checks, publishes every core version that has no
release tag yet using the workflow's `GITHUB_TOKEN`, and pushes the tags. The organization's
Actions settings must grant workflows read and write permissions, and members must be allowed
to create packages.

To publish locally instead, create a classic personal access token with `write:packages`,
add it to your user config, then run:

```bash
echo '//npm.pkg.github.com/:_authToken=<token>' >> ~/.npmrc
pnpm release:publish
git push --follow-tags
```

Changesets publishes the non-private core package and creates package release tags. The
registry workspace is private and only receives version handling. If releasing a registry
snapshot, create an annotated tag for its committed version (for example,
`git tag -a @whimui/registry@0.1.0 -m "WhimUI registry 0.1.0"`)
before pushing tags. Private application versions are not automatically tagged. `access` stays
`restricted`; GitHub Packages visibility follows the repository.

Consumers need the same scope line in their own `.npmrc` and a token with `read:packages`,
because GitHub Packages does not serve anonymous installs. Publish core before consumers
install a snapshot that pins it. Upload registry snapshots to your authenticated host with an
append-only policy; the local overwrite check does not protect against someone replacing files
directly on the host. Keep tokens in environment/CI secrets.

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

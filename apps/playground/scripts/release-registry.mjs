import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function assertVersion(version) {
  if (!versionPattern.test(version))
    throw new Error(`Use a stable x.y.z release version: ${version}`);
}

function pinDependencies(item, coreVersion) {
  if (item.dependencies)
    item.dependencies = item.dependencies.map((dependency) =>
      dependency === '@whimui/core' || dependency.startsWith('@whimui/core@')
        ? `@whimui/core@${coreVersion}`
        : dependency,
    );
  return item;
}

/** Generates deterministic files: repeated builds can be compared without timestamps. */
export function releaseFiles(registry, generated, version, coreVersion) {
  assertVersion(version);
  assertVersion(coreVersion);
  const files = new Map();
  const encode = (value) => `${JSON.stringify(value, null, 2)}\n`;
  const items = registry.items.map((item) => pinDependencies(structuredClone(item), coreVersion));
  files.set('registry.json', encode({ ...registry, items }));
  for (const item of items) {
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.name) ||
      ['registry', 'release-manifest'].includes(item.name)
    )
      throw new Error(`Invalid registry item name: ${item.name}`);
    const built = generated.get(item.name);
    if (!built || built.name !== item.name)
      throw new Error(`Missing built registry item: ${item.name}`);
    files.set(`${item.name}.json`, encode(pinDependencies(structuredClone(built), coreVersion)));
  }
  const hashes = Object.fromEntries(
    [...files]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, contents]) => [name, createHash('sha256').update(contents).digest('hex')]),
  );
  files.set(
    'release-manifest.json',
    encode({
      name: '@whimui/registry',
      version,
      core: { name: '@whimui/core', version: coreVersion },
      sha256: hashes,
    }),
  );
  return files;
}

/** Publishes locally by atomic directory rename; never edits an existing snapshot. */
export async function writeRelease(output, version, files) {
  assertVersion(version);
  await mkdir(output, { recursive: true });
  const destination = path.join(output, version);
  let existing;
  try {
    existing = await readdir(destination);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (existing) {
    const sameNames = existing.length === files.size && existing.every((file) => files.has(file));
    const sameContent =
      sameNames &&
      (
        await Promise.all(
          existing.map(
            async (file) =>
              (await readFile(path.join(destination, file), 'utf8')) === files.get(file),
          ),
        )
      ).every(Boolean);
    if (!sameContent)
      throw new Error(
        `Registry ${version} already exists with different content. Add a registry changeset and bump its version.`,
      );
    return { destination, created: false };
  }
  const staging = await mkdtemp(path.join(output, '.release-'));
  try {
    await Promise.all(
      [...files].map(([name, contents]) =>
        writeFile(path.join(staging, name), contents, { flag: 'wx' }),
      ),
    );
    await rename(staging, destination);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return { destination, created: true };
}

async function main() {
  const registry = JSON.parse(await readFile(path.join(root, 'registry.json'), 'utf8'));
  const { version } = JSON.parse(
    await readFile(path.join(root, '../../packages/registry/package.json'), 'utf8'),
  );
  const { version: coreVersion } = JSON.parse(
    await readFile(path.join(root, '../../packages/core/package.json'), 'utf8'),
  );
  assertVersion(version);
  assertVersion(coreVersion);
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'whimui-registry-'));
  try {
    execFileSync(process.execPath, [require.resolve('shadcn'), 'build', '--output', temporary], {
      cwd: root,
      stdio: 'inherit',
    });
    const generated = new Map(
      await Promise.all(
        registry.items.map(async ({ name }) => [
          name,
          JSON.parse(await readFile(path.join(temporary, `${name}.json`), 'utf8')),
        ]),
      ),
    );
    const result = await writeRelease(
      path.join(root, 'public/r'),
      version,
      releaseFiles(registry, generated, version, coreVersion),
    );
    process.stdout.write(
      `${result.created ? 'Created' : 'Verified existing'} registry ${version}: ${result.destination}\n`,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

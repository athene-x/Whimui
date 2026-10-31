import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { releaseFiles, writeRelease } from './release-registry.mjs';

function fixture() {
  const registry = {
    name: 'whimui',
    items: [
      {
        name: 'form',
        dependencies: ['@athene-x/whimui', 'zod'],
        registryDependencies: ['@whimui/tokens'],
      },
      { name: 'tokens', type: 'registry:theme' },
    ],
  };
  const generated = new Map(registry.items.map((item) => [item.name, structuredClone(item)]));
  return { registry, generated };
}

test('pins core in every release item and index, preserving namespaced dependencies and source input', () => {
  const { registry, generated } = fixture();
  const files = releaseFiles(registry, generated, '0.2.0', '0.1.1');
  const form = JSON.parse(files.get('form.json'));
  assert.deepEqual(form.dependencies, ['@athene-x/whimui@0.1.1', 'zod']);
  assert.deepEqual(form.registryDependencies, ['@whimui/tokens']);
  assert.equal(
    JSON.parse(files.get('registry.json')).items[0].dependencies[0],
    '@athene-x/whimui@0.1.1',
  );
  assert.equal(registry.items[0].dependencies[0], '@athene-x/whimui');
  assert.equal(generated.get('form').dependencies[0], '@athene-x/whimui');
  const manifest = JSON.parse(files.get('release-manifest.json'));
  assert.equal(manifest.version, '0.2.0');
  assert.equal(manifest.core.version, '0.1.1');
  assert.equal(
    manifest.sha256['form.json'],
    createHash('sha256').update(files.get('form.json')).digest('hex'),
  );
  assert.deepEqual([...files], [...releaseFiles(registry, generated, '0.2.0', '0.1.1')]);
});

test('rejects unstable versions, path traversal and incomplete builds', () => {
  const { registry, generated } = fixture();
  for (const version of ['../bad', '01.2.3', '1.0.0-beta.1', 'latest'])
    assert.throws(() => releaseFiles(registry, generated, version, '0.1.0'));
  assert.throws(() => releaseFiles(registry, generated, '0.1.0', 'invalid'));
  generated.delete('form');
  assert.throws(() => releaseFiles(registry, generated, '0.1.0', '0.1.0'), /Missing built/);
});

test('identical builds are idempotent; changed content or core version cannot replace a snapshot', async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), 'whimui-release-test-'));
  try {
    const { registry, generated } = fixture();
    const files = releaseFiles(registry, generated, '0.1.0', '0.1.0');
    assert.equal((await writeRelease(output, '0.1.0', files)).created, true);
    assert.equal((await writeRelease(output, '0.1.0', files)).created, false);
    const changed = releaseFiles(registry, generated, '0.1.0', '0.1.1');
    await assert.rejects(writeRelease(output, '0.1.0', changed), /already exists/);
    assert.equal(
      await readFile(path.join(output, '0.1.0/form.json'), 'utf8'),
      files.get('form.json'),
    );
    const next = releaseFiles(registry, generated, '0.2.0', '0.1.1');
    assert.equal((await writeRelease(output, '0.2.0', next)).created, true);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

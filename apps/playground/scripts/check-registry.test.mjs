import assert from 'node:assert/strict';
import { test } from 'node:test';

import { auditRegistry } from './check-registry.mjs';

const documentation = {
  group: 'Tests',
  description: 'Example',
  props: 'children',
  code: '<Example />',
};
const item = (name, extra = {}) => ({
  name,
  files: [{ path: `src/components/${name}.tsx` }],
  ...extra,
});
const audit = (
  items,
  sources,
  catalog = Object.fromEntries(items.map((entry) => [entry.name, documentation])),
) =>
  auditRegistry({ items }, catalog, async (file) => {
    if (!(file in sources)) throw new Error('missing');
    return sources[file];
  });

test('accepts imports satisfied by local registry dependency closure', async () => {
  const items = [
    item('a', { registryDependencies: ['@athenex/b'] }),
    item('b', { registryDependencies: ['button'], dependencies: ['next-intl'] }),
  ];
  assert.deepEqual(
    await audit(items, {
      'src/components/a.tsx':
        "import { B } from './b'; import { Button } from '@/components/ui/button';",
      'src/components/b.tsx':
        "import { useTranslations } from 'next-intl'; import { cn } from '@/lib/utils';",
    }),
    [],
  );
});

test('reports missing npm, primitive and local registry dependencies', async () => {
  const errors = await audit([item('a'), item('b')], {
    'src/components/a.tsx':
      "import { B } from './b'; import { Button } from '@/components/ui/button'; import { z } from 'zod';",
    'src/components/b.tsx': '',
  });
  assert.ok(errors.some((error) => error.includes('missing npm dependency zod')));
  assert.ok(errors.some((error) => error.includes('missing registry dependency button')));
  assert.ok(errors.some((error) => error.includes('declare its registry dependency')));
});

test('rejects shipping demo sources and importing demo fixtures', async () => {
  const errors = await audit(
    [item('a', { files: [{ path: 'src/demo/example.tsx' }] }), item('b')],
    {
      'src/demo/example.tsx': '',
      'src/components/b.tsx': "import { rows } from '@/demo/fixtures';",
    },
  );
  assert.ok(errors.some((error) => error.includes('non-distributable source')));
  assert.ok(errors.some((error) => error.includes('@/demo/fixtures')));
});

test('reports missing source, unknown items, cycles and duplicate names', async () => {
  const errors = await audit(
    [
      item('a', { registryDependencies: ['@athenex/b', '@athenex/unknown'] }),
      item('b', { registryDependencies: ['@athenex/a'] }),
      item('b'),
    ],
    {},
  );
  assert.ok(errors.some((error) => error.includes('Duplicate')));
  assert.ok(errors.some((error) => error.includes('missing source')));
  assert.ok(errors.some((error) => error.includes('Unknown local')));
  // Audit a separate cycle so a duplicate entry cannot replace its dependency list.
  assert.ok(
    (await audit([item('a', { registryDependencies: ['@athenex/a'] })], {})).some((error) =>
      error.includes('cycle'),
    ),
  );
});

test('checks documentation coverage and type/re-export/dynamic imports', async () => {
  const errors = await audit(
    [item('a')],
    {
      'src/components/a.tsx':
        "export { x } from '@/demo/x'; type X = import('missing-package').X; const x = import('@/demo/other');",
    },
    { stale: documentation },
  );
  assert.ok(errors.some((error) => error.includes('Stale demo')));
  assert.ok(errors.some((error) => error.includes('missing demo')));
  assert.ok(errors.some((error) => error.includes('missing-package')));
  assert.ok(errors.some((error) => error.includes('@/demo/other')));
});

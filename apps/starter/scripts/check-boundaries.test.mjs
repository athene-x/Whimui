import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkSource } from './check-boundaries.mjs';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const check = (file, source) => checkSource(path.join(root, file), source, root);

test('routes and other features use public entries', () => {
  assert.deepEqual(check('app/page.tsx', "import { TasksScreen } from '@/features/tasks';"), []);
  assert.deepEqual(
    check('features/reports/queries.ts', "import type { Task } from '../tasks/index';"),
    [],
  );
  assert.equal(
    check('app/page.tsx', "import { Screen } from '@/features/tasks/components/screen';").length,
    1,
  );
  assert.equal(
    check('features/reports/queries.ts', "import { list } from '../tasks/api';").length,
    1,
  );
});

test('shared UI and infrastructure cannot depend on features or routes', () => {
  for (const layer of [
    'components/ui',
    'components/shared',
    'lib',
    'providers',
    'hooks',
    'i18n',
    'messages',
  ]) {
    assert.ok(
      check(`${layer}/example.ts`, "export { something } from '@/features/tasks';").length > 0,
    );
    assert.ok(check(`${layer}/example.ts`, "import Page from '@/app/page';").length > 0);
  }
  assert.deepEqual(
    check(
      'features/tasks/components/screen.tsx',
      "import { Button } from '@/components/ui/button';",
    ),
    [],
  );
});

test('server entries are available to server app files, not client modules', () => {
  assert.deepEqual(
    check('app/api/tasks/route.ts', "export { GET } from '@/features/tasks/server';"),
    [],
  );
  assert.ok(
    check('app/page.tsx', "'use client'; import { GET } from '@/features/tasks/server';").length >
      0,
  );
  assert.ok(
    check('features/tasks/components/screen.tsx', "'use client'; import { GET } from '../server';")
      .length > 0,
  );
  assert.ok(
    check('features/reports/server.ts', "import { GET } from '../tasks/server';").length > 0,
  );
});

test('HTTP calls and client configuration stay in adapters', () => {
  assert.deepEqual(
    check('features/tasks/api.ts', "import { api } from '@/lib/api'; api.get('tasks');"),
    [],
  );
  assert.deepEqual(check('features/tasks/server.ts', "fetch('https://example.test');"), []);
  assert.deepEqual(
    check(
      'lib/api.ts',
      "import { createApiClient } from '@athene-x/whimui/api'; const api = createApiClient();",
    ),
    [],
  );
  assert.ok(check('features/tasks/queries.ts', "import { api } from '@/lib/api';").length > 0);
  assert.ok(check('features/tasks/components/screen.tsx', "fetch('/api/tasks');").length > 0);
  assert.ok(check('features/tasks/queries.ts', "globalThis.fetch('/api/tasks');").length > 0);
  assert.ok(check('features/tasks/api.ts', "import ky from 'ky';").length > 0);
  assert.ok(check('features/tasks/api.ts', 'createApiClient();').length > 0);
});

test('checks re-exports, dynamic imports, require and type imports', () => {
  for (const expression of [
    "export * from '../tasks/api';",
    "import('../tasks/api');",
    "require('../tasks/api');",
    "type Task = import('../tasks/schemas').Task;",
  ]) {
    assert.ok(check('features/reports/index.ts', expression).length > 0);
  }
  assert.ok(check('features/reports/index.ts', 'import(variable);').length > 0);
});

test('resolves relative paths, extensions and directory traversal', () => {
  assert.ok(
    check('components/ui/button.tsx', "import { query } from '../../features/tasks/api.ts';")
      .length > 0,
  );
  assert.ok(check('features/tasks/api.ts', "import Page from '../../app/page';").length > 0);
  assert.ok(
    check('features/tasks/api.ts', "import x from '../../../../playground/src/lib/utils';").length >
      0,
  );
  assert.deepEqual(check('features/tasks/queries.ts', "import { list } from './api';"), []);
});

test('does not inspect comments and plain strings as imports', () => {
  assert.deepEqual(
    check(
      'components/shared/example.ts',
      "// import x from '@/features/tasks';\nconst help = \"fetch('/api/tasks')\";",
    ),
    [],
  );
});

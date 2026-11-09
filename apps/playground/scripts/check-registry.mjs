import { parse } from '@babel/parser';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

function importsOf(source, filename) {
  const tree = parse(source, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
    createImportExpressions: true,
  });
  const imports = [];
  function visit(node) {
    if (
      [
        'ImportDeclaration',
        'ExportNamedDeclaration',
        'ExportAllDeclaration',
        'ImportExpression',
      ].includes(node.type) &&
      node.source
    ) {
      if (node.source.type !== 'StringLiteral')
        throw new Error(`${filename}: nonliteral module path`);
      imports.push(node.source.value);
    }
    if (node.type === 'TSImportType' && node.source.type === 'StringLiteral')
      imports.push(node.source.value);
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'comments', 'tokens', 'errors'].includes(key)) continue;
      if (Array.isArray(value)) {
        for (const child of value) if (child?.type) visit(child);
      } else if (value?.type) visit(value);
    }
  }
  visit(tree);
  return imports;
}

/** Audits declared installation dependencies; host app files are a small explicit contract. */
export async function auditRegistry(registry, catalog, readSource) {
  const errors = new Set();
  const items = new Map(registry.items.map((item) => [item.name, item]));
  if (items.size !== registry.items.length) errors.add('Duplicate registry item names.');
  for (const name of Object.keys(catalog))
    if (!items.has(name)) errors.add(`Stale demo documentation: ${name}`);
  const allFiles = new Set(
    registry.items.flatMap((item) => (item.files ?? []).map((file) => file.path)),
  );

  function closure(name, active = []) {
    if (active.includes(name)) {
      errors.add(`Registry dependency cycle: ${[...active, name].join(' -> ')}`);
      return [];
    }
    const item = items.get(name);
    if (!item) {
      errors.add(`Unknown local registry dependency: ${name}`);
      return [];
    }
    return [
      item,
      ...(item.registryDependencies ?? [])
        .filter((dependency) => dependency.startsWith('@whimui/'))
        .flatMap((dependency) => closure(dependency.slice('@whimui/'.length), [...active, name])),
    ];
  }

  for (const item of registry.items) {
    const documentation = catalog[item.name];
    if (
      !documentation ||
      ['group', 'description', 'props', 'code'].some((field) => !documentation[field]?.trim())
    )
      errors.add(`${item.name}: missing demo documentation.`);
    const dependencies = closure(item.name);
    const installedFiles = new Set(
      dependencies.flatMap((dependency) => (dependency.files ?? []).map((file) => file.path)),
    );
    const packages = new Set(dependencies.flatMap((dependency) => dependency.dependencies ?? []));
    const primitives = new Set(
      dependencies.flatMap((dependency) => dependency.registryDependencies ?? []),
    );
    for (const file of item.files ?? []) {
      if (
        !file.path.startsWith('src/') ||
        /(^|\/)(demo|app)(\/|$)/.test(file.path) ||
        file.path.includes('/components/ui/')
      )
        errors.add(`${item.name}: non-distributable source ${file.path}`);
      let source;
      try {
        source = await readSource(file.path);
      } catch {
        errors.add(`${item.name}: missing source ${file.path}`);
        continue;
      }
      if (!/\.[cm]?[jt]sx?$/.test(file.path)) continue;
      let imports;
      try {
        imports = importsOf(source, file.path);
      } catch (error) {
        errors.add(`${item.name}: ${error.message}`);
        continue;
      }
      for (const target of imports) {
        if (target.startsWith('@/') || target.startsWith('.')) {
          const local = target.startsWith('@/')
            ? `src/${target.slice(2)}`
            : path.posix.normalize(path.posix.join(path.posix.dirname(file.path), target));
          if (local === 'src/lib/utils') continue;
          if (
            item.name === 'locale-switcher' &&
            ['src/i18n/actions', 'src/i18n/config'].includes(local)
          )
            continue;
          if (local.startsWith('src/components/ui/')) {
            const primitive = local.slice('src/components/ui/'.length).replace(/\.[jt]sx?$/, '');
            if (!primitives.has(primitive))
              errors.add(`${item.name}: missing registry dependency ${primitive} (${file.path})`);
            continue;
          }
          const candidates = [
            local,
            `${local}.ts`,
            `${local}.tsx`,
            `${local}/index.ts`,
            `${local}/index.tsx`,
          ];
          if (!candidates.some((candidate) => installedFiles.has(candidate))) {
            errors.add(
              `${item.name}: ${target} is not shipped by this item or its dependencies${candidates.some((candidate) => allFiles.has(candidate)) ? ' (declare its registry dependency)' : ''}`,
            );
          }
        } else {
          const dependency = target.startsWith('@')
            ? target.split('/').slice(0, 2).join('/')
            : target.split('/')[0];
          if (['react', 'next'].includes(dependency)) continue;
          if (!packages.has(dependency))
            errors.add(`${item.name}: missing npm dependency ${dependency} (${file.path})`);
        }
      }
    }
  }
  return [...errors];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const registry = JSON.parse(await readFile(path.join(root, 'registry.json'), 'utf8'));
  const catalog = JSON.parse(await readFile(path.join(root, 'src/demo/catalog.json'), 'utf8'));
  const errors = await auditRegistry(registry, catalog, (file) =>
    readFile(path.join(root, file), 'utf8'),
  );
  if (errors.length) {
    process.stderr.write(`${errors.join('\n')}\n`);
    process.exitCode = 1;
  } else
    process.stdout.write(
      `Registry sources, dependencies and demo documentation passed (${registry.items.length} items).\n`,
    );
}

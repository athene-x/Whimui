import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from '@babel/parser';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceRoot = path.join(appRoot, 'src');

function relativeName(file, root) {
  return path.relative(root, file).split(path.sep).join('/');
}

function featureOf(file) {
  return /^features\/([^/]+)\//.exec(file)?.[1];
}

/** Checks syntax trees rather than matching comments or import-looking strings. */
export function checkSource(file, text, root = sourceRoot) {
  const name = relativeName(file, root);
  const owner = featureOf(name);
  let source;
  try {
    source = parse(text, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      createImportExpressions: true,
    });
  } catch (error) {
    return [`${name}: ${error.message}`];
  }
  const client = source.program.directives.some(
    (directive) => directive.value.value === 'use client',
  );
  const errors = [];
  const adapter = name === 'lib/api.ts' || /^features\/[^/]+\/(api|server)\.ts$/.test(name);

  function report(node, message) {
    errors.push(`${name}:${node.loc?.start.line ?? 1}: ${message}`);
  }

  function dependency(node, specifier) {
    if (!specifier || specifier.type !== 'StringLiteral') {
      report(node, 'Use a literal module path so dependency boundaries can be checked.');
      return;
    }
    const target = specifier.value;
    if ((target === 'ky' || target.startsWith('ky/')) && name !== 'lib/api.ts') {
      report(node, 'Configure Ky only in lib/api.ts; features use the app client.');
    }
    const absolute = target.startsWith('@/')
      ? path.resolve(root, target.slice(2))
      : target.startsWith('.')
        ? path.resolve(path.dirname(file), target)
        : undefined;
    if (!absolute) return;
    const resolved = relativeName(absolute, root).replace(/\.(?:[cm]?[jt]sx?)$/, '');
    if (resolved.startsWith('../')) {
      report(node, 'Import other workspaces through their package exports.');
      return;
    }
    const targetFeature = featureOf(`${resolved}/`);
    const shared = /^(components|lib|providers|hooks|i18n|messages)\//.test(name);
    if (shared && /^(features|app)\//.test(resolved)) {
      report(node, 'Shared layers cannot import features or app routes.');
    }
    if (owner && resolved.startsWith('app/')) {
      report(node, 'Features cannot import app routes.');
    }
    if (targetFeature && targetFeature !== owner) {
      const publicEntry =
        resolved === `features/${targetFeature}` || resolved === `features/${targetFeature}/index`;
      const serverEntry =
        /^app\//.test(name) && !client && resolved === `features/${targetFeature}/server`;
      if (!publicEntry && !serverEntry) {
        report(node, 'Use the feature public index, or its server entry from server app files.');
      }
    }
    if (resolved === 'lib/api' && owner && name !== `features/${owner}/api.ts`) {
      report(node, 'Only feature api.ts adapters import the app API client.');
    }
    if (client && /\/server(?:\/|$)/.test(resolved)) {
      report(node, 'Client modules cannot import server entries.');
    }
  }

  function visit(node) {
    if (
      ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) &&
      node.source
    ) {
      dependency(node, node.source);
    }
    if (node.type === 'TSImportType') dependency(node, node.argument);
    if (node.type === 'ImportExpression') dependency(node, node.source);
    if (node.type === 'CallExpression') {
      const expression = node.callee;
      if (expression.type === 'Identifier' && expression.name === 'require')
        dependency(node, node.arguments[0]);
      const direct = expression.type === 'Identifier' && expression.name === 'fetch';
      const member =
        expression.type === 'MemberExpression' &&
        expression.object.type === 'Identifier' &&
        ['window', 'globalThis'].includes(expression.object.name) &&
        (expression.computed ? expression.property.value : expression.property.name) === 'fetch';
      if ((direct || member) && !adapter)
        report(node, 'HTTP calls belong in lib/api.ts or a feature api.ts/server.ts adapter.');
      if (
        expression.type === 'Identifier' &&
        expression.name === 'createApiClient' &&
        name !== 'lib/api.ts'
      ) {
        report(node, 'Create the app API client only in lib/api.ts.');
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'comments', 'tokens', 'errors'].includes(key)) continue;
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child.type === 'string') visit(child);
      } else if (value && typeof value.type === 'string') visit(value);
    }
  }
  visit(source);
  return errors;
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? sourceFiles(file) : /\.[cm]?[jt]sx?$/.test(file) ? [file] : [];
    }),
  );
  return files.flat();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = await sourceFiles(sourceRoot);
  const violations = (
    await Promise.all(files.map(async (file) => checkSource(file, await readFile(file, 'utf8'))))
  ).flat();
  if (violations.length) {
    process.stderr.write(`${violations.join('\n')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Dependency boundaries passed (${files.length} files).\n`);
  }
}

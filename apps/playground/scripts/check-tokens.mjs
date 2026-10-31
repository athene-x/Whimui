// Fails when src/styles/semantic-tokens.css and the `tokens` registry item disagree, so the
// playground and the apps (which get the item's cssVars) always use the same contract.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles/semantic-tokens.css'), 'utf8');
const registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8'));

const item = registry.items.find((entry) => entry.name === 'tokens');
if (!item?.cssVars) fail('registry.json has no `tokens` item with cssVars');

const blocks = { light: /:root\s*\{([^}]*)\}/, dark: /\.dark\s*\{([^}]*)\}/ };
let problems = 0;

for (const [theme, pattern] of Object.entries(blocks)) {
  const body = css.match(pattern)?.[1] ?? fail(`semantic-tokens.css has no ${theme} block`);
  const fromCss = Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
  );
  const fromRegistry = item.cssVars[theme] ?? {};

  for (const name of new Set([...Object.keys(fromCss), ...Object.keys(fromRegistry)])) {
    if (fromCss[name] !== fromRegistry[name]) {
      problems++;
      console.error(
        `${theme} --${name}: css=${fromCss[name] ?? '(missing)'} registry=${fromRegistry[name] ?? '(missing)'}`,
      );
    }
  }
}

if (problems > 0) fail(`${problems} token(s) differ between semantic-tokens.css and registry.json`);
console.log('semantic tokens: css and registry agree');

function fail(message) {
  console.error(message);
  process.exit(1);
}

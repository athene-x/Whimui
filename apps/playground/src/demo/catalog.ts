import registry from '../../registry.json';
import examples from './catalog.json';

export type DemoName = keyof typeof examples;

export function isDemoName(name: string): name is DemoName {
  return Object.hasOwn(examples, name);
}

export const demoItems = registry.items.map((item) => {
  if (!isDemoName(item.name)) throw new Error(`Missing demo documentation: ${item.name}`);
  return { ...item, example: examples[item.name] };
});

export const demoGroups = [...new Set(demoItems.map((item) => item.example.group))];

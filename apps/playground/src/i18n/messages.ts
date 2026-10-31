import type { Locale } from './config';

const loaders = {
  en: () => import('@/messages/en'),
  th: () => import('@/messages/th'),
} satisfies Record<Locale, () => Promise<{ default: unknown }>>;

export async function loadMessages(locale: Locale) {
  return (await loaders[locale]()).default;
}

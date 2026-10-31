import type { Locale as DateFnsLocale } from 'date-fns';

import { enUS, th } from 'date-fns/locale';

const DATE_FNS_LOCALES = new Map<string, DateFnsLocale>([
  ['en', enUS],
  ['th', th],
]);

/** Matches the base language of a locale code (e.g. `th-TH`); English when unknown. */
export function dateFnsLocale(locale: string): DateFnsLocale {
  const language = locale.trim().toLowerCase().split('-')[0];
  return DATE_FNS_LOCALES.get(language) ?? enUS;
}

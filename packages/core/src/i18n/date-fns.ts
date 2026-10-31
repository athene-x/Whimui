import type { Locale as DateFnsLocale } from 'date-fns';

import { enUS, th } from 'date-fns/locale';

const DATE_FNS_LOCALES: Record<string, DateFnsLocale> = { en: enUS, th };

/** The date-fns locale for a next-intl locale code; English when unknown. */
export function dateFnsLocale(locale: string): DateFnsLocale {
  return DATE_FNS_LOCALES[locale] ?? enUS;
}

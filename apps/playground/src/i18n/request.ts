import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

import { defaultLocale, isLocale, LOCALE_COOKIE, timeZone, type Locale } from './config';
import { formats } from './formats';
import { loadMessages } from './messages';

async function resolveLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const accepted = (await headers()).get('accept-language') ?? '';
  const preferred = accepted
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase().split('-')[0])
    .find(isLocale);

  return preferred ?? defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  return { locale, messages: await loadMessages(locale), formats, timeZone };
});

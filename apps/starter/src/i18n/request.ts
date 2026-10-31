import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

import { defaultLocale, isLocale, LOCALE_COOKIE, timeZone } from './config';

const loaders = {
  en: () => import('@/messages/en').then((module) => module.default),
  th: () => import('@/messages/th').then((module) => module.default),
};

export default getRequestConfig(async () => {
  const preferred = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(preferred) ? preferred : defaultLocale;
  return { locale, timeZone, messages: await loaders[locale]() };
});

'use server';

import { cookies } from 'next/headers';

import { isLocale, LOCALE_COOKIE } from './config';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: '/', maxAge: ONE_YEAR, sameSite: 'lax' });
}

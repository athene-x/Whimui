'use server';

import { cookies } from 'next/headers';

import { isLocale, LOCALE_COOKIE } from './config';

export async function setLocale(data: FormData) {
  const locale = data.get('locale');
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
}

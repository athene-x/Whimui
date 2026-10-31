export const locales = ['en', 'th'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const timeZone = 'Asia/Bangkok';

export const LOCALE_COOKIE = 'locale';

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (locales as readonly string[]).includes(value);

export const locales = ['en', 'th'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'th';
export const timeZone = 'Asia/Bangkok';
export const LOCALE_COOKIE = 'locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

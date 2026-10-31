import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

import { setLocale } from '@/i18n/actions';
import { QueryProvider } from '@/providers/query-provider';

import './globals.css';

export const metadata: Metadata = { title: 'WhimUI starter' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <header>
          <form action={setLocale} className="actions">
            <button name="locale" value="th" lang="th" disabled={locale === 'th'}>
              ไทย
            </button>
            <button name="locale" value="en" lang="en" disabled={locale === 'en'}>
              English
            </button>
          </form>
        </header>
        <NextIntlClientProvider>
          <QueryProvider>
            <main>{children}</main>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

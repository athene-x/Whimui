import type { Metadata } from 'next';

import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { Inter, Noto_Sans_Thai } from 'next/font/google';

import { QueryProvider } from '@/components/query-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoThai = Noto_Sans_Thai({ subsets: ['thai', 'latin'], variable: '--font-noto-thai' });

export const metadata: Metadata = {
  title: 'Athenex playground',
  description: 'Type-checks and previews every item of the Athenex shadcn registry.',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={cn('h-full font-sans antialiased', inter.variable, notoThai.variable)}
      style={{ ['--font-sans-app' as string]: 'var(--font-inter), var(--font-noto-thai)' }}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <QueryProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

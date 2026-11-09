import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import Link from 'next/link';

import { SessionExpiredBanner } from '@/features/auth';
import { QueryProvider } from '@/providers/query-provider';

import './globals.css';

export const metadata: Metadata = { title: 'WhimUI demo' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <strong>WhimUI demo</strong>
          <nav className="actions" aria-label="Sections">
            <Link href="/">Overview</Link>
            <Link href="/api-lab">API lab</Link>
            <Link href="/auth">Auth</Link>
          </nav>
        </header>
        <QueryProvider>
          <SessionExpiredBanner />
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}

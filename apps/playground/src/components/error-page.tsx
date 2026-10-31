'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { StatusPage } from '@/components/status-page';
import { Button } from '@/components/ui/button';

export type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/** Body of a route's `error.tsx`: `<ErrorPage error={error} retry={reset} />`. */
export function ErrorPage({ error, retry }: ErrorPageProps) {
  const t = useTranslations('ui');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage title={t('errorPage.title')} description={t('errorPage.description')}>
      <Button onClick={retry}>{t('actions.retry')}</Button>
    </StatusPage>
  );
}

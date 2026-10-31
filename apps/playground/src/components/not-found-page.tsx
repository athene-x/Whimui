import { useTranslations } from 'next-intl';

import { AppLink } from '@/components/app-link';
import { StatusPage } from '@/components/status-page';
import { Button } from '@/components/ui/button';

export type NotFoundPageProps = {
  homeHref?: string;
};

/** Body of a route's `not-found.tsx`. */
export function NotFoundPage({ homeHref = '/' }: NotFoundPageProps) {
  const t = useTranslations('ui');

  return (
    <StatusPage title={t('notFound.title')} description={t('notFound.description')}>
      <Button nativeButton={false} render={<AppLink href={homeHref} />}>
        {t('notFound.home')}
      </Button>
    </StatusPage>
  );
}

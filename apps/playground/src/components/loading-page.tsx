import { useTranslations } from 'next-intl';

import { Spinner } from '@/components/ui/spinner';

/** Full-area spinner for a route's `loading.tsx`. */
export function LoadingPage() {
  const t = useTranslations('ui');

  return (
    <div role="status" className="flex flex-1 items-center justify-center gap-2 p-12">
      <Spinner />
      <span className="text-sm text-muted-foreground">{t('status.loading')}</span>
    </div>
  );
}

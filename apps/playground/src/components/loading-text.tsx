import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

export function LoadingText({ className }: { className?: string }) {
  const t = useTranslations('ui');

  return (
    <p role="status" className={cn('text-sm text-muted-foreground', className)}>
      {t('status.loading')}
    </p>
  );
}

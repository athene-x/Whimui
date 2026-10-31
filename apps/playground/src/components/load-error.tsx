'use client';

import { toSubmitError } from '@whimui/core/form';
import { useTranslations } from 'next-intl';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export type LoadErrorProps = {
  error: unknown;
  className?: string;
};

/** The message of a failed query, in place of the content it would have shown. */
export function LoadError({ error, className }: LoadErrorProps) {
  const t = useTranslations('ui');

  return (
    <Alert variant="destructive" className={cn('max-w-xl', className)}>
      <AlertDescription>{toSubmitError(error, t('errors.loadFailed')).message}</AlertDescription>
    </Alert>
  );
}

'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useFormContext } from '@athenex/web-core/form';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export type SubmitButtonProps = Omit<ComponentProps<typeof Button>, 'type'> & {
  submittingText?: ReactNode;
};

export function SubmitButton({ children, submittingText, disabled, ...props }: SubmitButtonProps) {
  const t = useTranslations('ui');
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
      {([canSubmit, isSubmitting]) => (
        <Button
          {...props}
          type="submit"
          disabled={disabled || !canSubmit || isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting
            ? (submittingText ?? t('status.submitting'))
            : (children ?? t('actions.submit'))}
        </Button>
      )}
    </form.Subscribe>
  );
}

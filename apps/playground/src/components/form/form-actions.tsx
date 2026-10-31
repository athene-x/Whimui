import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export function FormActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="form-actions"
      className={cn(
        'sticky bottom-0 z-10 -mx-6 flex flex-wrap items-center justify-end gap-2 border-t bg-background px-6 py-4',
        className,
      )}
      {...props}
    />
  );
}

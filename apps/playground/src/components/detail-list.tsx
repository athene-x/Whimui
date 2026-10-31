import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type DetailListProps = {
  className?: string;
  children: ReactNode;
};

/** Label/value pairs of a detail page, two columns from the `@2xl` container width. */
export function DetailList({ className, children }: DetailListProps) {
  return <dl className={cn('grid gap-x-6 gap-y-3 @2xl:grid-cols-2', className)}>{children}</dl>;
}

export type DetailItemProps = {
  label: ReactNode;
  className?: string;
  children: ReactNode;
};

export function DetailItem({ label, className, children }: DetailItemProps) {
  return (
    <div className={className}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

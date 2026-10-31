import type { ReactNode } from 'react';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

export type StatusPageProps = {
  title: string;
  description: ReactNode;
  children?: ReactNode;
};

/** Centered title + description + optional actions: the body of error, not-found and empty pages. */
export function StatusPage({ title, description, children }: StatusPageProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  );
}

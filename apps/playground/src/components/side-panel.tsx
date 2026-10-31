'use client';

import { IconChevronDown } from '@tabler/icons-react';
import { type ReactNode, useId, useState } from 'react';

import { cn } from '@/lib/utils';

export function SidePanelLayout({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 @5xl:grid-cols-[20rem_minmax(0,1fr)]">{children}</div>;
}

export type SidePanelProps = {
  title: ReactNode;
  children: ReactNode;
};

/** Left column of a `SidePanelLayout`; collapses into a disclosure below the `@5xl` width. */
export function SidePanel({ title, children }: SidePanelProps) {
  const contentId = useId();
  const [open, setOpen] = useState(false);

  return (
    <aside className="flex flex-col gap-6 @max-5xl:rounded-2xl @max-5xl:border @max-5xl:p-4 @5xl:border-r @5xl:pr-6">
      <h3 className="font-medium">
        <button
          type="button"
          className="group flex w-full items-center justify-between gap-2 @5xl:hidden"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((current) => !current)}
        >
          {title}
          <IconChevronDown className="size-4 text-muted-foreground group-aria-expanded:rotate-180" />
        </button>
        <span className="@max-5xl:hidden">{title}</span>
      </h3>
      <div id={contentId} className={cn('flex flex-col gap-6', !open && '@max-5xl:hidden')}>
        {children}
      </div>
    </aside>
  );
}

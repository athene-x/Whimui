import type { ReactNode } from 'react';

import { cookies } from 'next/headers';

import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

/** The sidebar component writes this cookie on every toggle, so the next page opens the same way. */
const SIDEBAR_COOKIE_NAME = 'sidebar_state';

export type AppShellProps = {
  sidebar: ReactNode;
  breadcrumb: ReactNode;
  /** Right end of the header bar, e.g. a `LocaleSwitcher`. */
  actions?: ReactNode;
  children: ReactNode;
};

/** Frame of a signed-in zone: collapsible sidebar, header with breadcrumb, the page below. */
export async function AppShell({ sidebar, breadcrumb, actions, children }: AppShellProps) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {sidebar}
      <SidebarInset className="min-w-0 md:peer-data-[variant=inset]:m-4 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-[1em] md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0">
        <header className="flex shrink-0 items-center gap-2 rounded-t-xl border-b bg-primary px-4 py-2 text-primary-foreground">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-8" />
          <div className="min-w-0 flex-1">{breadcrumb}</div>
          {actions}
        </header>
        <div className="w-full min-w-0 flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

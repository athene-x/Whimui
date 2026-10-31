'use client';

import type { Icon } from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { IconLock } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';

import { AppLink } from '@/components/app-link';
import { useBaseHref } from '@/components/base-path-provider';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export type AppSidebarNavItem = {
  href: string;
  label: string;
  icon: Icon;
  badge?: ReactNode;
  /** Shown but marked with a lock (feature off, no permission). */
  locked?: boolean;
};

export type AppSidebarNavProps = {
  label?: string;
  items: readonly AppSidebarNavItem[];
};

function isActive(pathname: string, href: string, home: string) {
  if (href === home) return pathname === home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** One group of the sidebar menu; the current section is highlighted by pathname prefix. */
export function AppSidebarNav({ label, items }: AppSidebarNavProps) {
  const pathname = usePathname();
  const baseHref = useBaseHref();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(({ href, label: itemLabel, icon: ItemIcon, badge, locked }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                isActive={isActive(pathname, baseHref(href), baseHref('/'))}
                tooltip={itemLabel}
                className={cn(
                  'font-medium text-primary hover:bg-sidebar-primary hover:text-sidebar-primary-foreground data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground',
                  locked && 'text-muted-foreground',
                )}
                render={<AppLink href={href} onClick={() => setOpenMobile(false)} />}
              >
                <ItemIcon />
                <span>{itemLabel}</span>
              </SidebarMenuButton>
              {locked ? (
                <SidebarMenuBadge className="text-muted-foreground">
                  <IconLock className="size-3.5" aria-hidden />
                </SidebarMenuBadge>
              ) : (
                badge
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

'use client';

import type { ReactNode } from 'react';

import { IconLogout, IconSelector } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

import { AppLink } from '@/components/app-link';
import { LogoutForm } from '@/components/logout-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { UserAvatar } from '@/components/user-avatar';

export type AppSidebarUser = {
  displayName: string;
  /** Second line under the name: email, role, unit… */
  subtitle?: string | null;
  profileImageUrl?: string | null;
};

export type AppSidebarProps = {
  /** The brand at the top; links to `/`. */
  logo: ReactNode;
  homeLabel: string;
  user: AppSidebarUser;
  /** Extra items of the profile menu, between the name and "Log out". */
  menu?: ReactNode;
  logoutAction?: string;
  children: ReactNode;
};

/** Sidebar with the brand, the app's nav groups (`children`) and the profile menu at the bottom. */
export function AppSidebar({
  logo,
  homeLabel,
  user,
  menu,
  logoutAction,
  children,
}: AppSidebarProps) {
  const t = useTranslations('ui.sidebar');
  const { isMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="pt-4 group-data-[collapsible=icon]:hidden">
        <AppLink href="/" aria-label={homeLabel} className="flex h-10 items-center px-2">
          {logo}
        </AppLink>
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    tooltip={user.displayName}
                    aria-label={t('profileMenu')}
                  />
                }
              >
                <UserAvatar
                  name={user.displayName}
                  imageUrl={user.profileImageUrl}
                  className="size-8"
                />
                <span className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">{user.displayName}</span>
                  {user.subtitle && (
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      {user.subtitle}
                    </span>
                  )}
                </span>
                <IconSelector className="ml-auto group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? 'top' : 'right'}
                align="end"
                sideOffset={8}
                className="w-72 max-w-[calc(100vw-2rem)]"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="grid min-w-0 gap-1">
                      <span
                        title={user.displayName}
                        className="truncate text-sm font-medium text-foreground"
                      >
                        {user.displayName}
                      </span>
                      {user.subtitle && (
                        <span title={user.subtitle} className="truncate text-xs font-normal">
                          {user.subtitle}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                {menu && (
                  <>
                    <DropdownMenuSeparator />
                    {menu}
                  </>
                )}
                <DropdownMenuSeparator />
                <LogoutForm action={logoutAction}>
                  {(pending) => (
                    <DropdownMenuItem
                      variant="destructive"
                      nativeButton
                      closeOnClick={false}
                      disabled={pending}
                      aria-busy={pending}
                      render={<button type="submit" className="w-full" />}
                    >
                      {pending ? <Spinner /> : <IconLogout />}
                      <span>{pending ? t('loggingOut') : t('logout')}</span>
                    </DropdownMenuItem>
                  )}
                </LogoutForm>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

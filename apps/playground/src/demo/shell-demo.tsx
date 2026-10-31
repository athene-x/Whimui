'use client';

import { IconComponents, IconForms, IconTable } from '@tabler/icons-react';

import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarNav } from '@/components/app-sidebar-nav';
import { SidebarLocaleSwitcher } from '@/components/locale-switcher';
import { SidebarGroup, SidebarMenu } from '@/components/ui/sidebar';

export function DemoSidebar() {
  return (
    <AppSidebar
      logo={<span className="font-semibold">WhimUI previews</span>}
      homeLabel="Playground"
      user={{ displayName: 'Demo user', subtitle: 'Local preview only' }}
      logoutAction="/demo/logout"
    >
      <AppSidebarNav
        label="Components"
        items={[
          { href: '/demo', label: 'Catalog', icon: IconComponents },
          { href: '/demo/form', label: 'Forms', icon: IconForms },
          { href: '/demo/data-table', label: 'Lists', icon: IconTable },
        ]}
      />
      <SidebarGroup>
        <SidebarMenu>
          <SidebarLocaleSwitcher />
        </SidebarMenu>
      </SidebarGroup>
    </AppSidebar>
  );
}

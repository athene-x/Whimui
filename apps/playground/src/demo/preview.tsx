import type { ReactNode } from 'react';

import { AppLink } from '@/components/app-link';
import { BasePathProvider } from '@/components/base-path-provider';
import { LocaleSwitcher } from '@/components/locale-switcher';

import type { DemoName } from './catalog';

import { ActionsDemo } from './actions-demo';
import { DetailsDemo } from './details-demo';
import { DialogsDemo } from './dialogs-demo';
import { FeedbackDemo } from './feedback-demo';
import { FormsDemo } from './forms-demo';
import { LogoutDemo, QueryDemo, SessionDemo } from './integration-demo';
import { ListsDemo } from './lists-demo';

export function Preview({ name }: { name: DemoName }) {
  const details = <DetailsDemo name={name} />;
  const previews: Record<DemoName, ReactNode> = {
    tokens: (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-success bg-success-tint p-4 text-success-foreground">
          Success
        </div>
        <div className="rounded-lg border border-warning bg-warning-tint p-4 text-warning-foreground">
          Warning
        </div>
        <div className="rounded-lg border border-critical bg-critical-tint p-4 text-critical-foreground">
          Critical
        </div>
        <div className="rounded-lg border border-info bg-info-tint p-4 text-info-foreground">
          Info
        </div>
      </div>
    ),
    form: <FormsDemo />,
    'data-table': <ListsDemo />,
    'list-filters': <ListsDemo />,
    'row-actions': <ActionsDemo />,
    'confirm-dialog': <DialogsDemo confirmation />,
    'app-dialog': <DialogsDemo />,
    'page-header': details,
    'detail-list': details,
    'side-panel': details,
    'enum-badge': details,
    'user-avatar': details,
    'permission-grid': details,
    feedback: <FeedbackDemo />,
    'status-pages': <FeedbackDemo pages />,
    'session-expired-dialog': <SessionDemo />,
    'logout-form': <LogoutDemo />,
    'query-provider': <QueryDemo />,
    'app-link': (
      <BasePathProvider basePath="/demo">
        <AppLink href="/form" className="underline">
          Forms: /form becomes /demo/form
        </AppLink>
      </BasePathProvider>
    ),
    'app-shell': (
      <p className="text-sm">The surrounding page uses AppShell, AppSidebar and AppBreadcrumb.</p>
    ),
    'locale-switcher': <LocaleSwitcher />,
  };
  return previews[name];
}

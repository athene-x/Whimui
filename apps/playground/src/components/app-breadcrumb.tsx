'use client';

import { type BreadcrumbRoute, buildBreadcrumbs } from '@athene-x/whimui/i18n';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

import { AppLink } from '@/components/app-link';
import { stripBasePath, useBasePath } from '@/components/base-path-provider';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export type AppBreadcrumbProps<TLabel extends string> = {
  routes: readonly BreadcrumbRoute<TLabel>[];
  /** Turns a route label into text, e.g. `useTranslations('breadcrumbs')`; identity by default. */
  translate?: (label: TLabel) => string;
};

/** Crumbs for the current pathname (below the nearest `BasePathProvider`), from `routes` patterns. */
export function AppBreadcrumb<TLabel extends string>({
  routes,
  translate = (label) => label,
}: AppBreadcrumbProps<TLabel>) {
  const pathname = stripBasePath(useBasePath(), usePathname());
  const breadcrumbs = buildBreadcrumbs(routes, pathname);
  const parents = breadcrumbs.slice(0, -1);
  const current = breadcrumbs.at(-1);

  if (!current) return null;

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {parents.map(({ href, label }) => (
          <Fragment key={href}>
            <BreadcrumbItem className="hidden md:inline-flex">
              <BreadcrumbLink
                render={
                  <AppLink
                    href={href}
                    className="text-primary-foreground hover:text-primary-foreground hover:underline"
                  />
                }
              >
                {translate(label)}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden text-primary-foreground md:block" />
          </Fragment>
        ))}
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="truncate font-medium text-primary-foreground">
            {translate(current.label)}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

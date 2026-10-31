import type { ReactNode } from 'react';

export type PageHeaderProps = {
  title: ReactNode;
  badge?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
};

/** Title row of a screen: h1 + optional badge and subtitle, actions at the right. */
export function PageHeader({ title, badge, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

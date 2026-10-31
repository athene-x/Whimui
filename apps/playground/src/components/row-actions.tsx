'use client';

import { IconDotsVertical } from '@tabler/icons-react';
import { Fragment, type ReactNode } from 'react';

import { AppLink } from '@/components/app-link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type RowAction = {
  key: string;
  icon: ReactNode;
  label: string;
  /** A link item; otherwise `onSelect` runs when picked. */
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
  /** A solid (primary) button in the header; outline otherwise. */
  primary?: boolean;
  /** Only in the "⋮" menu (e.g. "view": the header already is the detail page). */
  menuOnly?: boolean;
  /** A divider above this item in the menu. */
  separator?: boolean;
  /** Dropped altogether (permission or status gating). */
  hidden?: boolean;
};

export type RowActionsProps = {
  actions: RowAction[];
  /** Buttons in a page header instead of the "⋮" menu of a table row. */
  inHeader?: boolean;
  /** Accessible name of the menu trigger, e.g. `Manage ${name}`. */
  label: string;
};

function headerVariant(action: RowAction) {
  if (action.destructive) return 'destructive';
  if (action.primary) return 'default';
  return 'outline';
}

/**
 * The same list of things one can do to a row, rendered either as the "⋮" dropdown of a table
 * row or as the buttons in the header of its detail page.
 */
export function RowActions({ actions, inHeader = false, label }: RowActionsProps) {
  const visible = actions.filter((action) => !action.hidden);

  if (inHeader) {
    return (
      <>
        {visible
          .filter((action) => !action.menuOnly)
          .map((action) =>
            action.href !== undefined ? (
              <Button
                key={action.key}
                variant={headerVariant(action)}
                nativeButton={false}
                render={<AppLink href={action.href} />}
              >
                {action.icon} {action.label}
              </Button>
            ) : (
              <Button key={action.key} variant={headerVariant(action)} onClick={action.onSelect}>
                {action.icon} {action.label}
              </Button>
            ),
          )}
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} />}>
        <IconDotsVertical />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {visible.map((action) => (
          <Fragment key={action.key}>
            {action.separator && <DropdownMenuSeparator />}
            {action.href !== undefined ? (
              <DropdownMenuItem
                variant={action.destructive ? 'destructive' : 'default'}
                render={<AppLink href={action.href} />}
              >
                {action.icon} {action.label}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                variant={action.destructive ? 'destructive' : 'default'}
                onClick={action.onSelect}
              >
                {action.icon} {action.label}
              </DropdownMenuItem>
            )}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

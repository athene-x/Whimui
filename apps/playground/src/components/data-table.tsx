'use client';

import type { ListTable, ListTableRow } from '@athene-x/whimui/list-query';
import type { SortDirection } from '@tanstack/react-table';
import type { ReactNode } from 'react';

import { IconArrowDown, IconArrowUp, IconSelector } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

import { DataTablePagination } from '@/components/data-table-pagination';
import { Button } from '@/components/ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '@/components/ui/context-menu';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type DataTableProps<TData extends ListTableRow> = {
  table: ListTable<TData>;
  label: string;
  isLoading?: boolean;
  toolbar?: ReactNode;
  empty?: ReactNode;
  pagination?: ReactNode;
  onRowClick?: (row: TData) => void;
  rowContextMenu?: (row: TData) => ReactNode;
  rowClassName?: string | ((row: TData) => string | undefined);
  className?: string;
};

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

const CONTAINER_CLASS_NAME =
  'relative max-h-[70vh] w-full overflow-auto outline-none focus-visible:ring-3 focus-visible:ring-ring/30';

const HEAD_CLASS_NAME =
  'sticky top-0 z-20 bg-background before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border text-primary';

const PINNED_CLASS_NAME = {
  start: 'sticky start-0 after:absolute after:inset-y-0 after:end-0 after:w-px after:bg-border',
  end: 'sticky end-0 after:absolute after:inset-y-0 after:start-0 after:w-px after:bg-border',
} as const;

const PINNED_CELL_CLASS_NAME =
  'z-10 bg-background transition-colors group-hover/row:bg-[color-mix(in_oklab,var(--muted)_50%,var(--background))]';

/**
 * Server-paged table: `useListQuery` + `useListTable` (from `@athene-x/whimui/list-query`)
 * drive sort and paging, the API answers one page at a time.
 */
export function DataTable<TData extends ListTableRow>({
  table,
  label,
  isLoading = false,
  toolbar,
  empty,
  pagination = <DataTablePagination table={table} />,
  onRowClick,
  rowContextMenu,
  rowClassName,
  className,
}: DataTableProps<TData>) {
  const t = useTranslations('ui');
  const rows = table.getRowModel().rows;
  const columnCount = table.getAllLeafColumns().length;

  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      {toolbar}
      <div className="rounded-xl border p-4">
        <div
          data-slot="table-container"
          role="region"
          aria-label={label}
          tabIndex={0}
          className={CONTAINER_CLASS_NAME}
        >
          <table data-slot="table" className="w-full caption-bottom text-sm">
            <TableHeader className="[&_tr]:border-b-0">
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    const meta = header.column.columnDef.meta;

                    return (
                      <TableHead
                        key={header.id}
                        aria-sort={sorted ? ARIA_SORT[sorted] : undefined}
                        className={cn(
                          HEAD_CLASS_NAME,
                          meta?.pinned && PINNED_CLASS_NAME[meta.pinned],
                          meta?.pinned && 'z-30',
                          meta?.headerClassName,
                        )}
                      >
                        {header.column.getCanSort() ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-3"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <table.FlexRender header={header} />
                            <SortIcon direction={sorted} />
                          </Button>
                        ) : (
                          <table.FlexRender header={header} />
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {isLoading ? t('status.loading') : (empty ?? t('noResults'))}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const rowProps = {
                    className: cn(
                      'group/row',
                      onRowClick && 'cursor-pointer',
                      typeof rowClassName === 'function'
                        ? rowClassName(row.original)
                        : rowClassName,
                    ),
                    onClick: onRowClick ? () => onRowClick(row.original) : undefined,
                  };
                  const cells = row.getAllCells().map((cell) => {
                    const meta = cell.column.columnDef.meta;

                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          meta?.pinned && PINNED_CLASS_NAME[meta.pinned],
                          meta?.pinned && PINNED_CELL_CLASS_NAME,
                          meta?.cellClassName,
                        )}
                      >
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    );
                  });

                  if (!rowContextMenu) {
                    return (
                      <TableRow key={row.id} {...rowProps}>
                        {cells}
                      </TableRow>
                    );
                  }

                  return (
                    <ContextMenu key={row.id}>
                      <ContextMenuTrigger render={<TableRow {...rowProps} />}>
                        {cells}
                      </ContextMenuTrigger>
                      <ContextMenuContent>{rowContextMenu(row.original)}</ContextMenuContent>
                    </ContextMenu>
                  );
                })
              )}
            </TableBody>
          </table>
        </div>
      </div>
      {pagination}
    </div>
  );
}

function SortIcon({ direction }: { direction: false | SortDirection }) {
  if (direction === 'asc') return <IconArrowUp data-icon="inline-end" className="size-3.5" />;
  if (direction === 'desc') return <IconArrowDown data-icon="inline-end" className="size-3.5" />;
  return <IconSelector data-icon="inline-end" className="size-3.5 text-muted-foreground" />;
}

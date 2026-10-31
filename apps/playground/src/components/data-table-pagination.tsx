'use client';

import { type ListTable, type ListTableRow, pageRange } from '@athene-x/whimui/list-query';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { PaginationEllipsis } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

export type DataTablePaginationProps<TData extends ListTableRow> = {
  table: ListTable<TData>;
  variant?: 'simple' | 'numbered';
  pageSizes?: number[];
  showTotal?: boolean;
  showPageSize?: boolean;
  className?: string;
};

const PAGE_SIZES = [10, 20, 50, 100];

export function DataTablePagination<TData extends ListTableRow>({
  table,
  variant = 'simple',
  pageSizes = PAGE_SIZES,
  showTotal = true,
  showPageSize = true,
  className,
}: DataTablePaginationProps<TData>) {
  const t = useTranslations('ui.pagination');
  const { pageIndex, pageSize } = table.state.pagination;
  const page = pageIndex + 1;
  const pageCount = Math.max(table.getPageCount(), 1);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-4 text-sm', className)}>
      <p className="text-muted-foreground">
        {showTotal && t('total', { count: table.getRowCount() })}
      </p>
      <div className="flex items-center gap-4">
        {showPageSize && (
          <NativeSelect
            size="sm"
            aria-label={t('rowsPerPage')}
            value={pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {pageSizes.map((size) => (
              <NativeSelectOption key={size} value={size}>
                {t('perPage', { size })}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
        {variant === 'simple' && <p>{t('pageOf', { page, pageCount })}</p>}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t('previous')}
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <IconChevronLeft />
          </Button>
          {variant === 'numbered' &&
            pageRange(page, pageCount).map((item, index) =>
              item === 'ellipsis' ? (
                <PaginationEllipsis key={`ellipsis-${index}`} className="size-8" />
              ) : (
                <Button
                  key={item}
                  variant={item === page ? 'outline' : 'ghost'}
                  size="icon-sm"
                  aria-label={t('goToPage', { page: item })}
                  aria-current={item === page ? 'page' : undefined}
                  onClick={() => table.setPageIndex(item - 1)}
                >
                  {item}
                </Button>
              ),
            )}
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t('next')}
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <IconChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

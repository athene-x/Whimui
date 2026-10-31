'use client';

import {
  type ColumnDef,
  type ExpandedState,
  type ReactTable,
  type Row,
  columnSizingFeature,
  createExpandedRowModel,
  functionalUpdate,
  metaHelper,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';

import type { OffsetPagedResult } from './list-query';
import type { ListQuery } from './use-list-query';

import { toListPage, toPaginationState, toSortTerm, toSortingState } from './list-query-table';

export type ListColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
  pinned?: 'start' | 'end';
};

export const listTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  columnMeta: metaHelper<ListColumnMeta>(),
  columnSizingFeature,
});

export type ListTableFeatures = typeof listTableFeatures;

export type ListTableRow = { id: string };

export type ListTable<TData extends ListTableRow> = ReactTable<ListTableFeatures, TData>;

export type ListTableExpanding<TData extends ListTableRow> = {
  expanded: ExpandedState;
  onExpandedChange: (expanded: ExpandedState) => void;
  getSubRows: (row: TData) => readonly TData[] | undefined;
  getRowCanExpand: (row: Row<ListTableFeatures, TData>) => boolean;
};

export type ListTableOptions<TData extends ListTableRow, TSortField extends string> = {
  list: Pick<ListQuery<TSortField>, 'sort' | 'page' | 'size' | 'setSort' | 'setPagination'>;
  columns: ReadonlyArray<ColumnDef<ListTableFeatures, TData, any>>;
  result: OffsetPagedResult<TData> | undefined;
  expanding?: ListTableExpanding<TData>;
};

const EMPTY_ROWS: never[] = [];
const NOT_EXPANDED: ExpandedState = {};

export function useListTable<TData extends ListTableRow, TSortField extends string>({
  list,
  columns,
  result,
  expanding,
}: ListTableOptions<TData, TSortField>): ListTable<TData> {
  const lastPage = Math.max(result?.totalPages ?? list.page, 1);
  if (list.page > lastPage) list.setPagination({ page: lastPage, size: list.size });

  const sorting = toSortingState(list.sort);
  const pagination = toPaginationState({ page: list.page, size: list.size });
  const expanded = expanding?.expanded ?? NOT_EXPANDED;

  return useTable({
    features: listTableFeatures,
    columns,
    data: result?.items ?? EMPTY_ROWS,
    rowCount: result?.totalItems,
    getRowId: (row) => row.id,
    getSubRows: expanding?.getSubRows,
    getRowCanExpand: expanding?.getRowCanExpand,
    enableExpanding: expanding !== undefined,
    autoResetExpanded: false,
    manualSorting: true,
    manualPagination: true,
    enableMultiSort: false,
    sortDescFirst: false,
    state: { sorting, pagination, expanded },
    onSortingChange: (updater) => list.setSort(toSortTerm(functionalUpdate(updater, sorting))),
    onPaginationChange: (updater) =>
      list.setPagination(toListPage(functionalUpdate(updater, pagination))),
    onExpandedChange: (updater) => expanding?.onExpandedChange(functionalUpdate(updater, expanded)),
  });
}

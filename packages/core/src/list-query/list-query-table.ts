import type { PaginationState, SortingState } from '@tanstack/react-table';

import type { SortTerm } from './list-query';

export type ListPage = {
  page: number;
  size: number;
};

export function toSortingState(sort: SortTerm | undefined): SortingState {
  return sort ? [{ id: sort.field, desc: sort.descending ?? false }] : [];
}

export function toSortTerm<TSortField extends string>(
  sorting: SortingState,
): SortTerm<TSortField> | undefined {
  const [first] = sorting;
  return first ? { field: first.id as TSortField, descending: first.desc } : undefined;
}

export function toPaginationState({ page, size }: ListPage): PaginationState {
  return { pageIndex: page - 1, pageSize: size };
}

export function toListPage({ pageIndex, pageSize }: PaginationState): ListPage {
  return { page: pageIndex + 1, size: pageSize };
}

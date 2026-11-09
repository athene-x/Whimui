'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import type { ListQueryParams, SortTerm } from './list-query';
import type { ListPage } from './list-query-table';

import {
  type ListQueryDefaults,
  type SortDirection,
  createListQueryState,
  filterValues,
  listQueryReducer,
  sortDirection,
  toListQueryParams,
} from './list-query-state';

const DEFAULT_SEARCH_DELAY_MS = 300;

export type ListQueryOptions<
  TSortField extends string = string,
  TFilterField extends string = string,
> = ListQueryDefaults<TSortField, TFilterField> & {
  searchDelayMs?: number;
};

export type ListQuery<TSortField extends string = string, TFilterField extends string = string> = {
  params: ListQueryParams<TSortField, TFilterField>;
  searchInput: string;
  sort: SortTerm<TSortField> | undefined;
  page: number;
  size: number;
  setSearchInput: (value: string) => void;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  setPagination: (pagination: ListPage) => void;
  setSort: (sort: SortTerm<TSortField> | undefined) => void;
  toggleSort: (field: TSortField) => void;
  sortDirection: (field: TSortField) => SortDirection | undefined;
  setFilter: (field: TFilterField, values: string[]) => void;
  getFilter: (field: TFilterField) => string[];
  reset: () => void;
};

export function useListQuery<
  TSortField extends string = string,
  TFilterField extends string = string,
>(options: ListQueryOptions<TSortField, TFilterField> = {}): ListQuery<TSortField, TFilterField> {
  const searchDelayMs = options.searchDelayMs ?? DEFAULT_SEARCH_DELAY_MS;

  const [initialState] = useState(() => createListQueryState<TSortField, TFilterField>(options));
  const [state, dispatch] = useReducer(listQueryReducer<TSortField, TFilterField>, initialState);
  const [searchInput, setSearchInputValue] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const setSearchInput = useCallback(
    (value: string) => {
      setSearchInputValue(value);
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(
        () => dispatch({ type: 'search', searchTerm: value }),
        searchDelayMs,
      );
    },
    [searchDelayMs],
  );

  const reset = useCallback(() => {
    clearTimeout(searchTimer.current);
    setSearchInputValue('');
    dispatch({ type: 'reset', state: initialState });
  }, [initialState]);

  // `dispatch` is stable, so these keep their identity for the life of the list; `useListTable`
  // and memoized toolbars can depend on them without re-running every render.
  const actions = useMemo(
    () => ({
      setPage: (page: number) => dispatch({ type: 'page', page }),
      setSize: (size: number) => dispatch({ type: 'size', size }),
      setPagination: ({ page, size }: ListPage) => dispatch({ type: 'pagination', page, size }),
      setSort: (sort: SortTerm<TSortField> | undefined) => dispatch({ type: 'sort', sort }),
      toggleSort: (field: TSortField) => dispatch({ type: 'toggleSort', field }),
      setFilter: (field: TFilterField, values: string[]) =>
        dispatch({ type: 'filter', field, values }),
    }),
    [],
  );

  return {
    params: toListQueryParams(state),
    searchInput,
    sort: state.sort,
    page: state.page,
    size: state.size,
    setSearchInput,
    ...actions,
    sortDirection: (field) => sortDirection(state, field),
    getFilter: (field) => filterValues(state, field),
    reset,
  };
}

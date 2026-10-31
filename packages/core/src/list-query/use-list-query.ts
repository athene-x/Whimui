'use client';

import { useEffect, useReducer, useRef, useState } from 'react';

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

  function setSearchInput(value: string) {
    setSearchInputValue(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => dispatch({ type: 'search', searchTerm: value }),
      searchDelayMs,
    );
  }

  function reset() {
    clearTimeout(searchTimer.current);
    setSearchInputValue('');
    dispatch({ type: 'reset', state: initialState });
  }

  return {
    params: toListQueryParams(state),
    searchInput,
    sort: state.sort,
    page: state.page,
    size: state.size,
    setSearchInput,
    setPage: (page) => dispatch({ type: 'page', page }),
    setSize: (size) => dispatch({ type: 'size', size }),
    setPagination: ({ page, size }) => dispatch({ type: 'pagination', page, size }),
    setSort: (sort) => dispatch({ type: 'sort', sort }),
    toggleSort: (field) => dispatch({ type: 'toggleSort', field }),
    sortDirection: (field) => sortDirection(state, field),
    setFilter: (field, values) => dispatch({ type: 'filter', field, values }),
    getFilter: (field) => filterValues(state, field),
    reset,
  };
}

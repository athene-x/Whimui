import type { FilterTerm, ListQueryParams, SortTerm } from './list-query';

import { FIRST_PAGE } from './list-query';

const DEFAULT_SIZE = 20;

export type SortDirection = 'asc' | 'desc';

export type SelectedFilter<TFilterField extends string = string> = {
  field: TFilterField;
  values: string[];
};

export type ListQueryState<
  TSortField extends string = string,
  TFilterField extends string = string,
> = {
  searchTerm: string;
  sort: SortTerm<TSortField> | undefined;
  filters: SelectedFilter<TFilterField>[];
  page: number;
  size: number;
};

export type ListQueryAction<
  TSortField extends string = string,
  TFilterField extends string = string,
> =
  | { type: 'search'; searchTerm: string }
  | { type: 'toggleSort'; field: TSortField }
  | { type: 'sort'; sort: SortTerm<TSortField> | undefined }
  | { type: 'filter'; field: TFilterField; values: string[] }
  | { type: 'page'; page: number }
  | { type: 'size'; size: number }
  | { type: 'pagination'; page: number; size: number }
  | { type: 'reset'; state: ListQueryState<TSortField, TFilterField> };

export type ListQueryDefaults<
  TSortField extends string = string,
  TFilterField extends string = string,
> = {
  sort?: SortTerm<TSortField>;
  filters?: SelectedFilter<TFilterField>[];
  size?: number;
};

export function createListQueryState<TSortField extends string, TFilterField extends string>(
  defaults: ListQueryDefaults<TSortField, TFilterField> = {},
): ListQueryState<TSortField, TFilterField> {
  return {
    searchTerm: '',
    sort: defaults.sort,
    filters: defaults.filters ?? [],
    page: FIRST_PAGE,
    size: normalizeSize(defaults.size),
  };
}

export function listQueryReducer<TSortField extends string, TFilterField extends string>(
  state: ListQueryState<TSortField, TFilterField>,
  action: ListQueryAction<TSortField, TFilterField>,
): ListQueryState<TSortField, TFilterField> {
  switch (action.type) {
    case 'search':
      return { ...state, searchTerm: action.searchTerm.trim(), page: FIRST_PAGE };
    case 'toggleSort':
      return { ...state, sort: toggleSort(state.sort, action.field), page: FIRST_PAGE };
    case 'sort':
      return { ...state, sort: action.sort, page: FIRST_PAGE };
    case 'filter':
      return {
        ...state,
        filters: replaceFilter(state.filters, action.field, action.values),
        page: FIRST_PAGE,
      };
    case 'size':
      return { ...state, size: normalizeSize(action.size), page: FIRST_PAGE };
    case 'page':
      return { ...state, page: Math.max(FIRST_PAGE, action.page) };
    case 'pagination': {
      const size = normalizeSize(action.size);
      return size === state.size
        ? { ...state, page: Math.max(FIRST_PAGE, action.page) }
        : { ...state, size, page: FIRST_PAGE };
    }
    case 'reset':
      return { ...action.state, size: normalizeSize(action.state.size) };
  }
}

/** Invalid sizes fall back to the default; valid positive integers are preserved. */
function normalizeSize(size: number | undefined): number {
  return size !== undefined && Number.isInteger(size) && size > 0 ? size : DEFAULT_SIZE;
}

export function toListQueryParams<TSortField extends string, TFilterField extends string>(
  state: ListQueryState<TSortField, TFilterField>,
): ListQueryParams<TSortField, TFilterField> {
  return {
    searchTerm: state.searchTerm || undefined,
    sort: state.sort ? [state.sort] : [],
    filters: state.filters.map(toFilterTerm),
    page: state.page,
    size: state.size,
  };
}

export function sortDirection(state: ListQueryState, field: string): SortDirection | undefined {
  if (state.sort?.field !== field) return undefined;
  return state.sort.descending ? 'desc' : 'asc';
}

export function filterValues(state: ListQueryState, field: string): string[] {
  return state.filters.find((filter) => filter.field === field)?.values ?? [];
}

function toggleSort<TSortField extends string>(
  sort: SortTerm<TSortField> | undefined,
  field: TSortField,
): SortTerm<TSortField> | undefined {
  if (sort?.field !== field) return { field, descending: false };
  return sort.descending ? undefined : { field, descending: true };
}

function replaceFilter<TFilterField extends string>(
  filters: SelectedFilter<TFilterField>[],
  field: TFilterField,
  values: string[],
): SelectedFilter<TFilterField>[] {
  const others = filters.filter((filter) => filter.field !== field);
  return values.length > 0 ? [...others, { field, values }] : others;
}

function toFilterTerm<TFilterField extends string>({
  field,
  values,
}: SelectedFilter<TFilterField>): FilterTerm<TFilterField> {
  return { field, operator: 'in', value: values };
}

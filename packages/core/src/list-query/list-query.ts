export type FilterOperator = 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'cn' | 'sw' | 'ew' | 'in';

export type SortTerm<TField extends string = string> = {
  field: TField;
  descending?: boolean;
};

export type FilterTerm<TField extends string = string> =
  | { field: TField; operator: Exclude<FilterOperator, 'in'>; value: string }
  | { field: TField; operator: 'in'; value: string[] };

export type ListQueryParams<
  TSortField extends string = string,
  TFilterField extends string = string,
> = {
  searchTerm?: string;
  sort?: SortTerm<TSortField>[];
  filters?: FilterTerm<TFilterField>[];
  page?: number;
  size?: number;
};

export const MAX_LIST_SIZE = 100;

export type OffsetPagedResult<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export const FIRST_PAGE = 1;

export function nextPageParam({
  page,
  totalPages,
}: OffsetPagedResult<unknown>): number | undefined {
  return page < totalPages ? page + 1 : undefined;
}

export function toListSearchParams(params: ListQueryParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  const searchTerm = params.searchTerm?.trim();
  const sort = params.sort?.map(sortExpression).join(',');
  const filters = params.filters?.map(filterExpression).filter((filter) => filter !== null);

  if (searchTerm) searchParams.set('searchTerm', searchTerm);
  if (sort) searchParams.set('sort', sort);
  for (const filter of filters ?? []) searchParams.append('filters', filter);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.size !== undefined) searchParams.set('size', String(params.size));

  return searchParams;
}

function sortExpression({ field, descending }: SortTerm): string {
  return descending ? `-${field}` : field;
}

function filterExpression({ field, operator, value }: FilterTerm): string | null {
  const text = typeof value === 'string' ? value : value.join(',');
  return text ? `${field}:${operator}:${text}` : null;
}

'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ApiError, apiErrorBody } from '@whimui/core/api';
import {
  type ColumnDef,
  type ListTableFeatures,
  useListQuery,
  useListTable,
} from '@whimui/core/list-query';
import { useState } from 'react';

import { DataTable } from '@/components/data-table';
import { DataTablePagination } from '@/components/data-table-pagination';
import { EnumBadge, SEVERITY_CLASS_NAME } from '@/components/enum-badge';
import { ListFilterSelect } from '@/components/list-filter-select';
import { ListSearchInput } from '@/components/list-search-input';
import { LoadError } from '@/components/load-error';

import {
  type DemoRow,
  type FilterField,
  type ListState,
  type SortField,
  pageOf,
  severities,
  waitForPreview,
} from './list-fixtures';

const columns: ColumnDef<ListTableFeatures, DemoRow>[] = [
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  {
    accessorKey: 'severity',
    header: 'Severity',
    enableSorting: true,
    cell: ({ row }) => (
      <EnumBadge
        value={row.original.severity}
        label={row.original.severity}
        classNames={SEVERITY_CLASS_NAME}
      />
    ),
  },
  { accessorKey: 'owner', header: 'Owner', enableSorting: false },
];

export function ListsDemo() {
  const [state, setState] = useState<ListState>('ready');
  const list = useListQuery<SortField, FilterField>({ sort: { field: 'name' } });
  const query = useQuery({
    queryKey: ['playground', 'lists', state, list.params],
    queryFn: async ({ signal }) => {
      await waitForPreview(signal);
      if (state === 'error')
        throw new ApiError(503, apiErrorBody('Demo.Unavailable', 'Simulated request failure.'));
      return pageOf(list.params, state === 'empty');
    },
    enabled: state !== 'loading',
    placeholderData: keepPreviousData,
    retry: false,
  });
  const result = state === 'loading' ? undefined : query.data;
  const table = useListTable({ list, columns, result, isPlaceholderData: query.isPlaceholderData });

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        Response state
        <select
          value={state}
          onChange={(event) => setState(event.target.value as ListState)}
          className="rounded-md border bg-background p-2"
        >
          <option value="ready">Data</option>
          <option value="loading">Loading</option>
          <option value="empty">Empty</option>
          <option value="error">Error</option>
        </select>
      </label>
      {query.isError ? (
        <LoadError error={query.error} />
      ) : (
        <DataTable
          table={table}
          label="Sample items"
          isLoading={state === 'loading' || query.isPending}
          toolbar={
            <div className="flex flex-wrap gap-2">
              <ListSearchInput list={list} label="Search" className="w-64" />
              <ListFilterSelect
                list={list}
                field="severity"
                label="Severity"
                allLabel="All severities"
                options={severities.map((value) => ({ value, label: value }))}
              />
            </div>
          }
          pagination={<DataTablePagination table={table} variant="numbered" />}
        />
      )}
      <p role="status" className="text-sm text-muted-foreground">
        {query.isPlaceholderData
          ? 'Showing the previous page while the next result loads.'
          : query.isFetching
            ? 'Fetching a simulated response…'
            : 'No network request is made by this preview.'}
      </p>
    </div>
  );
}

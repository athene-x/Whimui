'use client';

import {
  type ColumnDef,
  type ListTableFeatures,
  type OffsetPagedResult,
  useListQuery,
  useListTable,
} from '@athenex/web-core/list-query';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DetailItem, DetailList } from '@/components/detail-list';
import { EnumBadge, SEVERITY_CLASS_NAME } from '@/components/enum-badge';
import { FormExample } from '@/components/form/form-example';
import { ListFilterSelect } from '@/components/list-filter-select';
import { ListSearchInput } from '@/components/list-search-input';
import { LoadError } from '@/components/load-error';
import { LoadingText } from '@/components/loading-text';
import { PageHeader } from '@/components/page-header';
import { PermissionGrid } from '@/components/permission-grid';
import { RowActions } from '@/components/row-actions';
import { SessionExpiredDialog } from '@/components/session-expired-dialog';
import { SidePanel, SidePanelLayout } from '@/components/side-panel';
import { StatusPage } from '@/components/status-page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';

type Severity = keyof typeof SEVERITY_CLASS_NAME;

type Row = { id: string; name: string; severity: Severity; owner: string };

const SEVERITIES: Severity[] = ['Low', 'Medium', 'High', 'Critical'];

const ROWS: Row[] = Array.from({ length: 57 }, (_, index) => ({
  id: String(index + 1),
  name: `Item ${index + 1}`,
  severity: SEVERITIES[index % SEVERITIES.length]!,
  owner: ['Ann', 'Bo', 'Chai'][index % 3]!,
}));

type SortField = 'name' | 'severity';
type FilterField = 'severity';

/** In-memory stand-in for the API's paged list endpoint. */
function pageOf(
  list: ReturnType<typeof useListQuery<SortField, FilterField>>,
): OffsetPagedResult<Row> {
  const { searchTerm, sort, filters, page = 1, size = 20 } = list.params;
  let items = ROWS;
  if (searchTerm) items = items.filter((row) => row.name.toLowerCase().includes(searchTerm));
  for (const filter of filters ?? []) {
    if (filter.operator === 'in')
      items = items.filter((row) => filter.value.includes(row[filter.field]));
  }
  const [first] = sort ?? [];
  if (first) {
    items = [...items].sort(
      (a, b) => a[first.field].localeCompare(b[first.field]) * (first.descending ? -1 : 1),
    );
  }
  const start = (page - 1) * size;
  return {
    items: items.slice(start, start + size),
    page,
    size,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
  };
}

const columns: ColumnDef<ListTableFeatures, Row, any>[] = [
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
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    meta: { pinned: 'end', cellClassName: 'w-0' },
    cell: ({ row }) => (
      <RowActions
        label={`Manage ${row.original.name}`}
        actions={[
          { key: 'edit', icon: <IconPencil />, label: 'Edit', href: `/demo?edit=${row.id}` },
          {
            key: 'delete',
            icon: <IconTrash />,
            label: 'Delete',
            destructive: true,
            separator: true,
          },
        ]}
      />
    ),
  },
];

export function DemoScreen() {
  const list = useListQuery<SortField, FilterField>({ sort: { field: 'name' } });
  const result = pageOf(list);
  const table = useListTable({ list, columns, result });
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <main className="@container mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <PageHeader
        title="Demo"
        subtitle="Lists, forms, dialogs and detail blocks from the registry."
      >
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          Confirm dialog
        </Button>
      </PageHeader>

      <DataTable
        table={table}
        label="Items"
        toolbar={
          <div className="flex flex-wrap gap-2">
            <ListSearchInput list={list} label="Search" className="w-64" />
            <ListFilterSelect
              list={list}
              field="severity"
              label="Severity"
              allLabel="All severities"
              options={SEVERITIES.map((value) => ({ value, label: value }))}
            />
          </div>
        }
        pagination={<DataTablePagination table={table} variant="numbered" />}
      />

      <SidePanelLayout>
        <SidePanel title="Owner">
          <DetailList>
            <DetailItem label="Name">
              <span className="flex items-center gap-2">
                <UserAvatar name="Ann Example" className="size-6" /> Ann Example
              </span>
            </DetailItem>
            <DetailItem label="Status">
              <EnumBadge value="High" label="High" classNames={SEVERITY_CLASS_NAME} />
            </DetailItem>
          </DetailList>
          <PermissionGrid
            idPrefix="demo"
            granted={['users:read']}
            options={[
              { value: 'users:read', label: 'View users', group: 'Users' },
              { value: 'users:manage', label: 'Manage users', group: 'Users' },
            ]}
          />
        </SidePanel>
        <Card>
          <CardHeader>
            <CardTitle>Form example</CardTitle>
          </CardHeader>
          <CardContent>
            <FormExample onSubmit={(value) => console.log(value)} />
          </CardContent>
        </Card>
      </SidePanelLayout>

      <div className="grid gap-4 @3xl:grid-cols-3">
        <LoadingText />
        <LoadError error={new Error('boom')} />
        <StatusPage title="Nothing here" description="An empty state from StatusPage." />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete item?"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => setConfirmOpen(false)}
        onClose={() => setConfirmOpen(false)}
      />
      <SessionExpiredDialog />
    </main>
  );
}

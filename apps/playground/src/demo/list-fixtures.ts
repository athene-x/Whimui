import type { ListQueryParams, OffsetPagedResult } from '@whimui/core/list-query';

import type { SEVERITY_CLASS_NAME } from '@/components/enum-badge';

export type Severity = keyof typeof SEVERITY_CLASS_NAME;
export type DemoRow = { id: string; name: string; severity: Severity; owner: string };
export type SortField = 'name' | 'severity';
export type FilterField = 'severity';
export type ListState = 'ready' | 'loading' | 'empty' | 'error';

export const severities: Severity[] = ['Low', 'Medium', 'High', 'Critical'];
export const demoRows: DemoRow[] = Array.from({ length: 57 }, (_, index) => ({
  id: String(index + 1),
  name: `Item ${index + 1}`,
  severity: severities[index % severities.length]!,
  owner: ['Ann', 'Bo', 'Chai'][index % 3]!,
}));

export function pageOf(
  params: ListQueryParams<SortField, FilterField>,
  empty: boolean,
): OffsetPagedResult<DemoRow> {
  const { searchTerm, sort, filters, page = 1, size = 20 } = params;
  let items = empty ? [] : demoRows;
  if (searchTerm)
    items = items.filter((row) => row.name.toLowerCase().includes(searchTerm.toLowerCase()));
  for (const filter of filters ?? []) {
    if (filter.operator === 'in')
      items = items.filter((row) => filter.value.includes(row[filter.field]));
  }
  const [first] = sort ?? [];
  if (first)
    items = [...items].sort(
      (a, b) => a[first.field].localeCompare(b[first.field]) * (first.descending ? -1 : 1),
    );
  return {
    items: items.slice((page - 1) * size, page * size),
    page,
    size,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / size),
  };
}

export function waitForPreview(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, 500);
    function abort() {
      clearTimeout(timer);
      reject(signal?.reason);
    }
    signal?.addEventListener('abort', abort, { once: true });
  });
}

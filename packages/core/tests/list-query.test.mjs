import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    const local = specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier);
    return nextResolve(local ? `${specifier}.ts` : specifier, context);
  },
});

const { FIRST_PAGE, MAX_LIST_SIZE, nextPageParam, toListSearchParams } =
  await import('../src/list-query/list-query.ts');
const { createListQueryState, filterValues, listQueryReducer, sortDirection, toListQueryParams } =
  await import('../src/list-query/list-query-state.ts');
const { toListPage, toPaginationState, toSortTerm, toSortingState } =
  await import('../src/list-query/list-query-table.ts');
const { pageRange } = await import('../src/list-query/page-range.ts');

const reduce = (state, ...actions) => actions.reduce(listQueryReducer, state);

test('toListSearchParams encodes the ListQueryRequest contract', () => {
  const params = toListSearchParams({
    searchTerm: '  hello ',
    sort: [{ field: 'title', descending: true }, { field: 'createdAt' }],
    filters: [
      { field: 'status', operator: 'in', value: ['active', 'paused'] },
      { field: 'name', operator: 'cn', value: 'x' },
      { field: 'empty', operator: 'eq', value: '' },
      { field: 'none', operator: 'in', value: [] },
    ],
    page: 2,
    size: 10,
  });
  assert.equal(params.get('searchTerm'), 'hello');
  assert.equal(params.get('sort'), '-title,createdAt');
  assert.deepEqual(params.getAll('filters'), ['status:in:active,paused', 'name:cn:x']);
  assert.equal(params.get('page'), '2');
  assert.equal(params.get('size'), '10');

  assert.equal(toListSearchParams({}).toString(), '');
  assert.equal(toListSearchParams({ searchTerm: '   ', sort: [], filters: [] }).toString(), '');
  assert.equal(toListSearchParams({ page: 0, size: 0 }).toString(), 'page=0&size=0');
});

test('nextPageParam stops at the last page', () => {
  const page = (current, totalPages) => ({ items: [], page: current, size: 1, totalItems: 0, totalPages });
  assert.equal(nextPageParam(page(1, 3)), 2);
  assert.equal(nextPageParam(page(3, 3)), undefined);
  assert.equal(nextPageParam(page(1, 0)), undefined);
});

test('createListQueryState applies defaults and normalizes the size', () => {
  assert.deepEqual(createListQueryState(), {
    searchTerm: '',
    sort: undefined,
    filters: [],
    page: FIRST_PAGE,
    size: 20,
  });
  const state = createListQueryState({
    sort: { field: 'name' },
    filters: [{ field: 'status', values: ['open'] }],
    size: 50,
  });
  assert.deepEqual(state.sort, { field: 'name' });
  assert.deepEqual(state.filters, [{ field: 'status', values: ['open'] }]);
  assert.equal(state.size, 50);

  for (const bad of [0, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY])
    assert.equal(createListQueryState({ size: bad }).size, 20, `size ${bad}`);
  assert.equal(createListQueryState({ size: MAX_LIST_SIZE + 1 }).size, MAX_LIST_SIZE);
});

test('search, sort, filter and size changes return to the first page; page changes do not', () => {
  const onPage3 = { ...createListQueryState(), page: 3 };

  assert.deepEqual(reduce(onPage3, { type: 'search', searchTerm: '  foo ' }), {
    ...onPage3,
    searchTerm: 'foo',
    page: 1,
  });
  assert.equal(reduce(onPage3, { type: 'sort', sort: { field: 'a' } }).page, 1);
  assert.equal(reduce(onPage3, { type: 'toggleSort', field: 'a' }).page, 1);
  assert.equal(reduce(onPage3, { type: 'filter', field: 'a', values: ['1'] }).page, 1);
  assert.equal(reduce(onPage3, { type: 'size', size: 10 }).page, 1);

  assert.equal(reduce(onPage3, { type: 'page', page: 7 }).page, 7);
  assert.equal(reduce(onPage3, { type: 'page', page: 0 }).page, 1);
  assert.equal(reduce(onPage3, { type: 'page', page: -4 }).page, 1);
});

test('toggleSort cycles ascending, descending, off; sort replaces outright', () => {
  const start = createListQueryState();
  const asc = reduce(start, { type: 'toggleSort', field: 'name' });
  assert.deepEqual(asc.sort, { field: 'name', descending: false });
  assert.equal(sortDirection(asc, 'name'), 'asc');
  assert.equal(sortDirection(asc, 'other'), undefined);

  const desc = reduce(asc, { type: 'toggleSort', field: 'name' });
  assert.deepEqual(desc.sort, { field: 'name', descending: true });
  assert.equal(sortDirection(desc, 'name'), 'desc');

  const off = reduce(desc, { type: 'toggleSort', field: 'name' });
  assert.equal(off.sort, undefined);

  const switched = reduce(desc, { type: 'toggleSort', field: 'other' });
  assert.deepEqual(switched.sort, { field: 'other', descending: false });

  assert.equal(reduce(desc, { type: 'sort', sort: undefined }).sort, undefined);
});

test('filter replaces the values for a field and drops it when empty', () => {
  const start = createListQueryState({ filters: [{ field: 'a', values: ['1'] }] });
  const both = reduce(start, { type: 'filter', field: 'b', values: ['x', 'y'] });
  assert.deepEqual(filterValues(both, 'a'), ['1']);
  assert.deepEqual(filterValues(both, 'b'), ['x', 'y']);
  assert.deepEqual(filterValues(both, 'c'), []);

  const replaced = reduce(both, { type: 'filter', field: 'a', values: ['2'] });
  assert.deepEqual(replaced.filters, [
    { field: 'b', values: ['x', 'y'] },
    { field: 'a', values: ['2'] },
  ]);
  assert.deepEqual(reduce(both, { type: 'filter', field: 'a', values: [] }).filters, [
    { field: 'b', values: ['x', 'y'] },
  ]);
});

test('pagination keeps the page when only the page changes and restarts when the size changes', () => {
  const start = { ...createListQueryState({ size: 10 }), page: 4 };
  assert.deepEqual(reduce(start, { type: 'pagination', page: 2, size: 10 }), { ...start, page: 2 });
  assert.deepEqual(reduce(start, { type: 'pagination', page: 2, size: 50 }), {
    ...start,
    page: 1,
    size: 50,
  });
  assert.equal(reduce(start, { type: 'pagination', page: 2, size: 0 }).size, 20);
  assert.equal(reduce(start, { type: 'size', size: 1000 }).size, MAX_LIST_SIZE);
});

test('reset restores the given state with a normalized size', () => {
  const initial = createListQueryState({ size: 5 });
  const dirty = reduce(initial, { type: 'search', searchTerm: 'x' }, { type: 'page', page: 3 });
  assert.deepEqual(reduce(dirty, { type: 'reset', state: initial }), initial);
  assert.equal(reduce(dirty, { type: 'reset', state: { ...initial, size: -1 } }).size, 20);
});

test('toListQueryParams sends one sort term, "in" filters, and omits an empty search', () => {
  const state = reduce(
    createListQueryState({ sort: { field: 'name', descending: true }, size: 10 }),
    { type: 'filter', field: 'status', values: ['a', 'b'] },
    { type: 'page', page: 2 },
  );
  assert.deepEqual(toListQueryParams(state), {
    searchTerm: undefined,
    sort: [{ field: 'name', descending: true }],
    filters: [{ field: 'status', operator: 'in', value: ['a', 'b'] }],
    page: 2,
    size: 10,
  });
  assert.deepEqual(toListQueryParams(createListQueryState()).sort, []);
  assert.equal(toListQueryParams(reduce(state, { type: 'search', searchTerm: 'q' })).searchTerm, 'q');
});

test('TanStack Table state converts both ways', () => {
  assert.deepEqual(toSortingState(undefined), []);
  assert.deepEqual(toSortingState({ field: 'name' }), [{ id: 'name', desc: false }]);
  assert.deepEqual(toSortingState({ field: 'name', descending: true }), [{ id: 'name', desc: true }]);
  assert.equal(toSortTerm([]), undefined);
  assert.deepEqual(toSortTerm([{ id: 'name', desc: true }, { id: 'other', desc: false }]), {
    field: 'name',
    descending: true,
  });
  assert.deepEqual(toPaginationState({ page: 3, size: 20 }), { pageIndex: 2, pageSize: 20 });
  assert.deepEqual(toListPage({ pageIndex: 2, pageSize: 20 }), { page: 3, size: 20 });
});

test('pageRange keeps the ends, the siblings, and collapses gaps larger than one page', () => {
  assert.deepEqual(pageRange(1, 1), [1]);
  assert.deepEqual(pageRange(1, 5), [1, 2, 'ellipsis', 5]);
  assert.deepEqual(pageRange(3, 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(pageRange(1, 7), [1, 2, 'ellipsis', 7]);
  assert.deepEqual(pageRange(4, 7), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(pageRange(5, 10), [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
  assert.deepEqual(pageRange(10, 10), [1, 'ellipsis', 9, 10]);
  assert.deepEqual(pageRange(5, 10, 0), [1, 'ellipsis', 5, 'ellipsis', 10]);
  assert.deepEqual(pageRange(5, 10, 2), [1, 2, 3, 4, 5, 6, 7, 'ellipsis', 10]);
});

test('pageRange tolerates out-of-range and non-finite input', () => {
  assert.deepEqual(pageRange(1, 0), []);
  assert.deepEqual(pageRange(1, Number.NaN), []);
  assert.deepEqual(pageRange(99, 3), [1, 2, 3]);
  assert.deepEqual(pageRange(-5, 3), [1, 2, 3]);
  assert.deepEqual(pageRange(Number.NaN, 3), [1, 2, 3]);
  assert.deepEqual(pageRange(2.7, 3.9), [1, 2, 3]);
  assert.deepEqual(pageRange(5, 10, Number.NaN), [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
});

import { FIRST_PAGE } from './list-query';

export type PageItem = number | 'ellipsis';

export function pageRange(page: number, pageCount: number, siblings = 1): PageItem[] {
  if (!Number.isFinite(pageCount) || pageCount < FIRST_PAGE) return [];

  pageCount = Math.floor(pageCount);
  page = Number.isFinite(page)
    ? Math.min(pageCount, Math.max(FIRST_PAGE, Math.floor(page)))
    : FIRST_PAGE;
  siblings = Number.isFinite(siblings) ? Math.max(0, Math.floor(siblings)) : 1;

  const pages = visiblePages(page, pageCount, siblings);

  return pages.flatMap((current, index): PageItem[] => {
    const gap = current - (pages[index - 1] ?? current);
    if (gap === 2) return [current - 1, current];
    if (gap > 2) return ['ellipsis', current];
    return [current];
  });
}

function visiblePages(page: number, pageCount: number, siblings: number): number[] {
  const pages = new Set([FIRST_PAGE, pageCount]);

  const start = Math.max(FIRST_PAGE, page - siblings);
  const end = Math.min(pageCount, page + siblings);
  for (let current = start; current <= end; current++) {
    pages.add(current);
  }

  return [...pages].sort((a, b) => a - b);
}

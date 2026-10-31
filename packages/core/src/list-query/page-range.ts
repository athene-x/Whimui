export type PageItem = number | 'ellipsis';

const FIRST_PAGE = 1;

export function pageRange(page: number, pageCount: number, siblings = 1): PageItem[] {
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

  for (let current = page - siblings; current <= page + siblings; current++) {
    if (current >= FIRST_PAGE && current <= pageCount) pages.add(current);
  }

  return [...pages].sort((a, b) => a - b);
}

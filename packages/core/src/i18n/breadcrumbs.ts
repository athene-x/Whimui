export type Breadcrumb<TLabel extends string = string> = {
  href: string;
  label: TLabel;
};

/** `pattern` is a path with `:param` segments, e.g. `/projects/:projectId/tasks`. */
export type BreadcrumbRoute<TLabel extends string = string> = {
  pattern: string;
  label: TLabel;
};

function toSegments(path: string) {
  return path.split('/').filter(Boolean);
}

function matches(pattern: string, segments: string[]) {
  const patternSegments = toSegments(pattern);

  return (
    patternSegments.length === segments.length &&
    patternSegments.every(
      (segment, index) => segment.startsWith(':') || segment === segments[index],
    )
  );
}

function findLabel<TLabel extends string>(
  routes: readonly BreadcrumbRoute<TLabel>[],
  segments: string[],
) {
  return routes.find(({ pattern }) => matches(pattern, segments))?.label;
}

/**
 * One crumb per matching path prefix; prefixes without a route are skipped.
 * The first matching route wins, so put static routes before overlapping `:param` routes.
 */
export function buildBreadcrumbs<TLabel extends string>(
  routes: readonly BreadcrumbRoute<TLabel>[],
  pathname: string,
): Breadcrumb<TLabel>[] {
  const segments = toSegments(pathname);

  if (segments.length === 0) {
    const label = findLabel(routes, segments);
    return label ? [{ href: '/', label }] : [];
  }

  return segments.flatMap((_, index) => {
    const prefix = segments.slice(0, index + 1);
    const label = findLabel(routes, prefix);
    return label ? [{ href: `/${prefix.join('/')}`, label }] : [];
  });
}

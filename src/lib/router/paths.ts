export const LEARN_TABS = ['about', 'scoring', 'data', 'architecture', 'impact'] as const;
export type LearnTab = (typeof LEARN_TABS)[number];

export type Route =
  | { name: 'landing' }
  | { name: 'app' }
  | { name: 'crop'; id: string }
  | { name: 'learn'; tab: LearnTab }
  | { name: 'legacy-learn' }
  | { name: 'dev-ui' }
  | { name: 'not-found' };

function normaliseBase(base: string): string {
  return base.endsWith('/') ? base : `${base}/`;
}

/** Path relative to the base, without leading or trailing slashes. */
function relative(pathname: string, base: string): string | null {
  const b = normaliseBase(base);
  const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`;
  if (!withSlash.startsWith(b)) return null;
  return withSlash.slice(b.length).replace(/\/+$/, '');
}

export function parseRoute(pathname: string, base: string): Route {
  const rel = relative(pathname, base);
  if (rel === null) return { name: 'not-found' };

  const parts = rel === '' ? [] : rel.split('/').map(decodeURIComponent);

  if (parts.length === 0) return { name: 'landing' };
  if (parts[0] === 'app') {
    if (parts.length === 1) return { name: 'app' };
    if (parts.length === 3 && parts[1] === 'crop' && parts[2]) return { name: 'crop', id: parts[2] };
    return { name: 'not-found' };
  }
  if (parts[0] === 'learn' && parts.length <= 2) {
    const tab = (parts[1] ?? 'about') as LearnTab;
    return LEARN_TABS.includes(tab) ? { name: 'learn', tab } : { name: 'not-found' };
  }
  if (parts[0] === 'learn-more' && parts.length === 1) return { name: 'legacy-learn' };
  if (parts[0] === 'dev' && parts[1] === 'ui' && parts.length === 2) return { name: 'dev-ui' };

  return { name: 'not-found' };
}

export function routeHref(route: Route, base: string): string {
  const b = normaliseBase(base);
  switch (route.name) {
    case 'landing':
      return b;
    case 'app':
      return `${b}app`;
    case 'crop':
      return `${b}app/crop/${encodeURIComponent(route.id)}`;
    case 'learn':
      return `${b}learn/${route.tab}`;
    case 'legacy-learn':
      return `${b}learn-more`;
    case 'dev-ui':
      return `${b}dev/ui`;
    case 'not-found':
      return b;
  }
}

/**
 * GitHub Pages serves 404.html for deep links, which redirects to `<base>?/<path>&<query>`
 * (with `&` in the original escaped as `~and~`). Returns the real path + search, or null.
 */
export function decodeGhPagesRedirect(search: string, base: string): string | null {
  if (!search.startsWith('?/')) return null;
  const [path, ...query] = search.slice(2).split('&');
  const restoredPath = path.replace(/~and~/g, '&');
  const restoredQuery = query.map((q) => q.replace(/~and~/g, '&')).join('&');
  return `${normaliseBase(base)}${restoredPath}${restoredQuery ? `?${restoredQuery}` : ''}`;
}

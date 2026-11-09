import { describe, expect, it } from 'vitest';
import { decodeGhPagesRedirect, parseRoute, routeHref, type Route } from './paths';

const BASE = '/nasa-space-apps-2025-home-grown/';

describe('parseRoute', () => {
  it.each<[string, Route]>([
    ['/nasa-space-apps-2025-home-grown/', { name: 'landing' }],
    ['/nasa-space-apps-2025-home-grown', { name: 'landing' }],
    ['/nasa-space-apps-2025-home-grown/app', { name: 'app' }],
    ['/nasa-space-apps-2025-home-grown/app/', { name: 'app' }],
    ['/nasa-space-apps-2025-home-grown/app/crop/kale', { name: 'crop', id: 'kale' }],
    ['/nasa-space-apps-2025-home-grown/app/crop/sweet_potato', { name: 'crop', id: 'sweet_potato' }],
    ['/nasa-space-apps-2025-home-grown/learn', { name: 'learn', tab: 'about' }],
    ['/nasa-space-apps-2025-home-grown/learn/scoring', { name: 'learn', tab: 'scoring' }],
    ['/nasa-space-apps-2025-home-grown/learn-more', { name: 'legacy-learn' }],
    ['/nasa-space-apps-2025-home-grown/dev/ui', { name: 'dev-ui' }],
    ['/nasa-space-apps-2025-home-grown/learn/nope', { name: 'not-found' }],
    ['/nasa-space-apps-2025-home-grown/app/crop', { name: 'not-found' }],
    ['/nasa-space-apps-2025-home-grown/whatever', { name: 'not-found' }],
    ['/elsewhere', { name: 'not-found' }],
  ])('%s', (path, route) => {
    expect(parseRoute(path, BASE)).toEqual(route);
  });

  it('works with a root base', () => {
    expect(parseRoute('/app/crop/kale', '/')).toEqual({ name: 'crop', id: 'kale' });
  });
});

describe('routeHref', () => {
  it.each<Route>([
    { name: 'landing' },
    { name: 'app' },
    { name: 'crop', id: 'kale' },
    { name: 'learn', tab: 'impact' },
    { name: 'dev-ui' },
  ])('round-trips %o', (route) => {
    expect(parseRoute(routeHref(route, BASE), BASE)).toEqual(route);
  });
});

describe('decodeGhPagesRedirect', () => {
  it('restores path and query', () => {
    expect(decodeGhPagesRedirect('?/app/crop/kale&x=1~and~y=2', BASE)).toBe(
      '/nasa-space-apps-2025-home-grown/app/crop/kale?x=1&y=2',
    );
  });

  it('ignores normal queries', () => {
    expect(decodeGhPagesRedirect('?x=1', BASE)).toBeNull();
  });
});

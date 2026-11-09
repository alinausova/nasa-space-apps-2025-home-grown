import { decodeGhPagesRedirect, parseRoute, routeHref, type Route } from './paths';

const BASE = import.meta.env.BASE_URL;

class Router {
  route = $state<Route>(parseRoute(window.location.pathname, BASE));

  href(route: Route): string {
    return routeHref(route, BASE);
  }

  navigate(route: Route, { replace = false } = {}): void {
    const url = routeHref(route, BASE);
    if (replace) window.history.replaceState({}, '', url);
    else window.history.pushState({}, '', url);
    this.route = route;
    if (!replace) window.scrollTo(0, 0);
  }

  /** Installs listeners; returns a cleanup function. */
  start(): () => void {
    const redirected = decodeGhPagesRedirect(window.location.search, BASE);
    if (redirected) {
      window.history.replaceState({}, '', redirected);
      this.route = parseRoute(window.location.pathname, BASE);
    }

    const onPopState = () => {
      this.route = parseRoute(window.location.pathname, BASE);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.('a');
      if (!link || !link.href || link.target === '_blank' || link.hasAttribute('download')) return;

      const url = new URL(link.href);
      if (url.origin !== window.location.origin || !url.pathname.startsWith(BASE.replace(/\/$/, ''))) return;

      const next = parseRoute(url.pathname, BASE);
      if (next.name === 'not-found') return;
      event.preventDefault();
      window.history.pushState({}, '', url.pathname + url.search + url.hash);
      this.route = next;
    };

    window.addEventListener('popstate', onPopState);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('click', onClick);
    };
  }
}

export const router = new Router();

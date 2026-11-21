import { useEffect, useState } from 'react';

/** Console pages, in sidebar order. */
export const CONSOLE_ROUTES = [
  { id: 'overview', label: 'Overview' },
  { id: 'report', label: 'Report an issue' },
  { id: 'track', label: 'Live tracker' },
  { id: 'admin', label: 'Admin console' },
] as const;

export type ConsoleRoute = (typeof CONSOLE_ROUTES)[number]['id'];
export type Route = 'home' | ConsoleRoute;

const IDS: readonly string[] = CONSOLE_ROUTES.map((r) => r.id);

/** Parses "#/track" style hashes; anything unknown is the landing page. */
export function parseRoute(hash: string): Route {
  const id = hash.replace(/^#\/?/, '');
  return IDS.includes(id) ? (id as ConsoleRoute) : 'home';
}

export const hrefFor = (route: Route) => (route === 'home' ? '#/' : `#/${route}`);

/** Current hash route, updated on navigation. */
export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const onChange = () => {
      const next = parseRoute(location.hash);
      setRoute((prev) => {
        if (prev !== next) window.scrollTo(0, 0);
        return next;
      });
    };
    addEventListener('hashchange', onChange);
    return () => removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

// Hash router: works on GitHub Pages with no server rewrites and survives an offline refresh.
export type RouteName = 'today' | 'plan' | 'classes' | 'library' | 'me';
const names: RouteName[] = ['today', 'plan', 'classes', 'library', 'me'];

export interface Route { name: RouteName; parts: string[] }

export function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const name = (names as string[]).includes(parts[0]) ? (parts[0] as RouteName) : 'today';
  return { name, parts: parts.slice(1) };
}

export const route = $state<Route>(parse(typeof location !== 'undefined' ? location.hash : ''));

export function startRouter() {
  const sync = () => { const r = parse(location.hash); route.name = r.name; route.parts = r.parts; };
  window.addEventListener('hashchange', sync);
  sync();
}
export function href(name: RouteName, ...parts: (string | number)[]): string {
  return '#/' + [name, ...parts.map((p) => encodeURIComponent(String(p)))].join('/');
}
export function go(name: RouteName, ...parts: (string | number)[]) { location.hash = href(name, ...parts); }

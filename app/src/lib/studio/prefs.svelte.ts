/** Favourite and recently used tools, remembered on this device only. */
const read = (k: string): string[] => { try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; } };
const write = (k: string, v: string[]) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
export const prefs = $state<{ fav: string[]; recent: string[] }>({ fav: read('consilia.toolfav'), recent: read('consilia.toolrecent') });
export function toggleFav(id: string) {
  prefs.fav = prefs.fav.includes(id) ? prefs.fav.filter((x) => x !== id) : [...prefs.fav, id];
  write('consilia.toolfav', prefs.fav);
}
export function used(id: string) {
  prefs.recent = [id, ...prefs.recent.filter((x) => x !== id)].slice(0, 6);
  write('consilia.toolrecent', prefs.recent);
}

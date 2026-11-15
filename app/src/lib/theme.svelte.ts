export type Theme = 'system' | 'light' | 'dark';
const KEY = 'consilia.theme';
function initial(): Theme {
  try { const s = localStorage.getItem(KEY); if (s === 'light' || s === 'dark') return s; } catch { /* ignore */ }
  return 'system';
}
export const theme = $state({ value: initial() });
export function setTheme(v: Theme) {
  theme.value = v;
  const root = document.documentElement;
  if (v === 'system') delete root.dataset.theme; else root.dataset.theme = v;
  try { if (v === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch { /* ignore */ }
}

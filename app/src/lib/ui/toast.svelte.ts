/**
 * Short messages at the bottom of the screen. notify('Saved') shows one for a few seconds; errors and anything with
 * an action stay until dismissed. One place, so messages look and behave the same everywhere.
 */
export interface Toast { id: number; text: string; kind: 'info' | 'ok' | 'error'; action?: { label: string; run: () => void }; sticky: boolean }
export const toasts = $state<{ list: Toast[] }>({ list: [] });
let n = 0;
export function notify(text: string, opts: { kind?: Toast['kind']; action?: Toast['action']; sticky?: boolean; ms?: number } = {}) {
  const t: Toast = { id: ++n, text, kind: opts.kind ?? 'info', action: opts.action, sticky: opts.sticky ?? (opts.kind === 'error' || !!opts.action) };
  toasts.list = [...toasts.list.filter((x) => x.text !== text), t].slice(-3);
  if (!t.sticky) setTimeout(() => dismiss(t.id), opts.ms ?? 3500);
  return t.id;
}
export function dismiss(id: number) { toasts.list = toasts.list.filter((x) => x.id !== id); }

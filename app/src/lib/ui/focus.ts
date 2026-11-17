/**
 * Keyboard focus helpers (WCAG 2.4.3 focus order, 2.4.2 page titles).
 * - trapFocus: Tab and Shift+Tab stay inside a modal dialog; focus returns where it was when the dialog closes.
 * - afterNavigation: after a screen change, the page title follows the screen's heading and keyboard and
 *   screen-reader users land on that heading instead of the top of the document.
 */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary, audio[controls], video[controls]';

export function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((e) => !e.closest('[inert]') && (e.offsetWidth > 0 || e.offsetHeight > 0 || e.getClientRects().length > 0));
}

/** Svelte action for a modal dialog. `initial`: an element to focus first (default: the dialog's first control); `enabled: false` turns it off. */
export function trapFocus(node: HTMLElement, opts: { initial?: string; enabled?: boolean } = {}) {
  if (opts.enabled === false) return {};
  const before = document.activeElement as HTMLElement | null;
  const start = () => {
    if (node.contains(document.activeElement)) return;
    const first = (opts.initial && node.querySelector<HTMLElement>(opts.initial)) || focusables(node)[0];
    if (first) first.focus({ preventScroll: true });
    else { if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1'); node.focus({ preventScroll: true }); }
  };
  const t = setTimeout(start, 0); // after the dialog's content has rendered
  function key(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const f = focusables(node);
    if (!f.length) { e.preventDefault(); return; }
    const first = f[0], last = f[f.length - 1], a = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (a === first || !node.contains(a))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (a === last || !node.contains(a))) { e.preventDefault(); first.focus(); }
  }
  // Tab pressed while focus has escaped (e.g. after a click on the backdrop) comes back in
  document.addEventListener('keydown', key, true);
  return {
    destroy() {
      clearTimeout(t);
      document.removeEventListener('keydown', key, true);
      if (before && before.isConnected && typeof before.focus === 'function') before.focus({ preventScroll: true });
    }
  };
}

let lastHeading = '';
/** Call after every route change. Moves focus only when the screen (its main heading) changed, never on first load. */
export function afterNavigation(appName: string, first: boolean) {
  let tries = 0;
  const run = () => {
    const h = [...document.querySelectorAll<HTMLElement>('main h1, .teach h1, h1')].find((e) => e.offsetParent !== null);
    if (!h) { if (++tries < 20) setTimeout(run, 50); else document.title = appName; return; }
    const text = (h.textContent ?? '').replace(/\s+/g, ' ').trim();
    document.title = text && text !== appName ? `${text} · ${appName}` : appName;
    if (!first && text !== lastHeading && !document.querySelector('[aria-modal="true"]')) {
      if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
    lastHeading = text;
  };
  setTimeout(run, 0);
}

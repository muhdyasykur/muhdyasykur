/**
 * Full screen for the projector, everywhere. Browsers without the Fullscreen API (Safari on iPhone) get a "filled
 * window" view instead, with a note and a way out, rather than a button that silently does nothing.
 */
type El = HTMLElement & { webkitRequestFullscreen?: () => void };
type Doc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
export const full = $state<{ pseudo: HTMLElement | null; note: string }>({ pseudo: null, note: '' });
const NOTE = 'This browser cannot use full screen, so Consilia filled the window instead. On an iPhone, add Consilia to your Home Screen for the most room. Press Esc or "Exit full view" to go back.';

export function fullElement(): Element | null { const d = document as Doc; return d.fullscreenElement ?? d.webkitFullscreenElement ?? full.pseudo; }
export const isFull = (el?: HTMLElement | null) => !!el && fullElement() === el;

function exitPseudo() {
  full.pseudo?.classList.remove('pseudo-full');
  document.documentElement.classList.remove('has-pseudo-full');
  full.pseudo = null; full.note = '';
  removeEventListener('keydown', esc, true);
}
function esc(e: KeyboardEvent) { if (e.key === 'Escape' && full.pseudo) { e.preventDefault(); e.stopPropagation(); exitPseudo(); } }

export async function exitFull() {
  if (full.pseudo) return exitPseudo();
  const d = document as Doc;
  try { if (d.fullscreenElement) await d.exitFullscreen(); else d.webkitExitFullscreen?.(); } catch { /* already left */ }
}
export async function toggleFull(el: HTMLElement | null | undefined) {
  if (!el) return;
  if (fullElement()) return exitFull();
  const e = el as El;
  try {
    if (e.requestFullscreen && document.fullscreenEnabled !== false) { await e.requestFullscreen(); return; }
    if (e.webkitRequestFullscreen) { e.webkitRequestFullscreen(); return; }
  } catch { /* refused: fall through to the filled window */ }
  e.classList.add('pseudo-full');
  document.documentElement.classList.add('has-pseudo-full');
  full.pseudo = e; full.note = NOTE;
  addEventListener('keydown', esc, true);
}

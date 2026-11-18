/** Which app-wide panel is open: the Create panel (the round + button) or Search (Ctrl+K or /). */
export const shell = $state<{ panel: '' | 'create' | 'search' }>({ panel: '' });
export const openPanel = (p: 'create' | 'search') => { shell.panel = p; };
export const closePanel = () => { shell.panel = ''; };
/** Ctrl+K (or Cmd+K) opens Search anywhere; so does "/" when the teacher is not typing. */
export function installShortcuts() {
  const onKey = (e: KeyboardEvent) => {
    const typing = (e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]');
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPanel('search'); }
    else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !shell.panel) { e.preventDefault(); openPanel('search'); }
  };
  addEventListener('keydown', onKey);
  return () => removeEventListener('keydown', onKey);
}

/**
 * Last line of defence (blueprint test plan, error handling): any error a screen did not handle is shown in plain
 * language with a next step, instead of failing silently. Expected, harmless errors are ignored.
 */
export const appError = $state({ message: '', next: '' });

const IGNORE = /ResizeObserver loop|AbortError|NotAllowedError|play\(\) request was interrupted|The play\(\) request|Load failed|NetworkError when attempting to fetch|Failed to fetch dynamically imported module/i;

export function describe(err: unknown): { message: string; next: string } | null {
  const e = err as { name?: string; message?: string; inner?: { name?: string } } | undefined;
  const name = e?.name ?? '', inner = e?.inner?.name ?? '', text = `${name} ${e?.message ?? String(err ?? '')}`;
  if (/QuotaExceeded/i.test(name + inner + text)) return { message: 'This device is out of storage space, so the last change was not saved.', next: 'Remove a textbook you do not need (Library → Textbooks), make a backup, then try again.' };
  if (/ChunkLoadError|dynamically imported module|Importing a module script failed/i.test(text)) return { message: 'Part of Consilia could not load.', next: 'Connect to the internet once and reopen the app, or accept the update if one is waiting.' };
  if (IGNORE.test(text)) return null;
  return { message: 'Something went wrong. Your work is saved up to your last change.', next: 'Try again. If it keeps happening, tell the developer in the Feedback Garden (choose Bug).' };
}

export function showError(err: unknown) {
  const d = describe(err);
  if (d) Object.assign(appError, d);
}
export function clearError() { appError.message = ''; appError.next = ''; }

export function startErrorGuard() {
  window.addEventListener('unhandledrejection', (e) => showError(e.reason));
  window.addEventListener('error', (e) => { if (e.error || e.message) showError(e.error ?? new Error(e.message)); });
}

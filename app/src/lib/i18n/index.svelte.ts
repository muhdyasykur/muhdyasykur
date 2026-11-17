import en from './en.json';
import ms from './ms.json';

export type Locale = 'en' | 'ms';
export type Key = keyof typeof en;
const dict: Record<Locale, Record<string, string>> = { en, ms };

const KEY = 'consilia.locale';
function initial(): Locale {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'ms') return saved;
  } catch { /* storage unavailable */ }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ms') ? 'ms' : 'en';
}

export const i18n = $state({ locale: initial() });

export async function setLocale(l: Locale) {
  await loadLocale(l);
  i18n.locale = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  if (typeof document !== 'undefined') document.documentElement.lang = l;
}

/** Translate a key. Falls back to English, then to the key itself. */
export function t(key: Key, vars?: Record<string, string | number>): string {
  let s = dict[i18n.locale][key] ?? dict.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

// The Malay interface text (about 140 KB) is loaded only when Bahasa Melayu is chosen, and kept for offline use.
const ui = $state<{ ms: Record<string, string> | null }>({ ms: null });
/** Load the translations a language needs. Call before showing it (main.ts does this at start). */
export async function loadLocale(l: Locale) { if (l === 'ms' && !ui.ms) ui.ms = (await import('./ms-ui.json')).default as Record<string, string>; }
/**
 * Interface text, keyed by its English wording (tools/i18n-wrap.mjs wraps it). In Bahasa Melayu the translation from
 * ms-ui.json is used; anything not yet translated stays in English. {name} placeholders are filled from `vars`.
 * Text for pupils and for the English lesson itself (lesson plans, slides, worksheets) is never passed through here.
 */
export function tr(en: string, vars?: Record<string, unknown>): string {
  const s = i18n.locale === 'ms' ? (ui.ms?.[en] ?? en) : en;
  const out = vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k] ?? '') : m)) : s;
  return out.includes('{{') || out.includes('}}') ? out.replace(/\{\{/g, '{').replace(/\}\}/g, '}') : out;
}

/** Dates on screen follow the interface language (printed lesson plans stay in English). */
export const dateLocale = () => (i18n.locale === 'ms' ? 'ms-MY' : 'en-GB');
/** A YYYY-MM-DD date (or a Date) formatted for the screen. */
export function uiDate(d: string | Date, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  const x = typeof d === 'string' ? (/^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) : new Date(d)) : d;
  return isNaN(x.getTime()) ? String(d) : x.toLocaleDateString(dateLocale(), opts);
}
/** Weekday name for an ISO day (1 = Monday … 7 = Sunday) in the interface language. */
export const dayName = (n: number, style: 'long' | 'short' = 'long') => new Date(2026, 0, 4 + n).toLocaleDateString(dateLocale(), { weekday: style });

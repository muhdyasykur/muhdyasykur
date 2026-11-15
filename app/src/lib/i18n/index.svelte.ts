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

export function setLocale(l: Locale) {
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

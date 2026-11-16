import { TERMS_VERSION } from './content/terms';

/** Whether this device has agreed to the current terms of use. Stored with the version and date. */
interface Accepted { v: number; at: string }
function read(): Accepted | null { try { const r = JSON.parse(localStorage.getItem('consilia.terms') || 'null'); return r && typeof r.v === 'number' ? r : null; } catch { return null; } }
const saved = read();
export const terms = $state({ accepted: !!saved && saved.v >= TERMS_VERSION, at: saved?.at ?? '' });
export function acceptTerms() {
  const at = new Date().toISOString();
  try { localStorage.setItem('consilia.terms', JSON.stringify({ v: TERMS_VERSION, at })); } catch { /* private mode: accepted for this session */ }
  terms.accepted = true; terms.at = at;
}

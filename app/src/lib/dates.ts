/**
 * Calendar dates as YYYY-MM-DD in the device's own time zone. Never use toISOString() for a date: it is UTC, which in
 * Malaysia (UTC+8) gives yesterday's date before 8 am.
 */
const pad = (n: number) => String(n).padStart(2, '0');
/** The local calendar date of a moment. */
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Today's local date. */
export const today = () => iso(new Date());
/** Midnight local time on a YYYY-MM-DD date. */
export function parseDate(s: string): Date { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
/** A YYYY-MM-DD date moved by n days (local calendar, safe across months and years). */
export function addDays(date: string, n: number): string { const d = parseDate(date); d.setDate(d.getDate() + n); return iso(d); }

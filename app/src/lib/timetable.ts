import type { Lesson } from './lesson/model';

/** One weekly teaching slot, e.g. 4 Zhong, Monday 09:10, 60 minutes (blueprint F03). */
export interface Slot { id: string; classId: string; day: number; start: string; durationMin: number }
export type Cancelled = Record<string, string>; // `${slotId}@${date}` → reason
export const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function parseDate(s: string): Date { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
/** ISO weekday: Monday = 1 … Sunday = 7 */
export const isoDay = (d: Date) => ((d.getDay() + 6) % 7) + 1;
export function mondayOf(date: string): string { const d = parseDate(date); d.setDate(d.getDate() - isoDay(d) + 1); return iso(d); }
export function addDays(date: string, n: number): string { const d = parseDate(date); d.setDate(d.getDate() + n); return iso(d); }
const minutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export interface WeekItem { date: string; slot: Slot; lesson: Lesson | null; cancelled: string | null }
/** Every slot in the week starting `monday`, each with its planned lesson (same class, date and start) if any. */
export function weekItems(monday: string, slots: Slot[], lessons: Lesson[], cancelled: Cancelled): WeekItem[] {
  const out: WeekItem[] = [];
  for (const s of [...slots].sort((a, b) => a.day - b.day || minutes(a.start) - minutes(b.start))) {
    const date = addDays(monday, s.day - 1);
    const same = lessons.filter((l) => l.classId === s.classId && l.header.date === date);
    const lesson = same.find((l) => l.header.start === s.start) ?? (same.length === 1 && slots.filter((x) => x.classId === s.classId && x.day === s.day).length === 1 ? same[0] : null);
    out.push({ date, slot: s, lesson, cancelled: cancelled[`${s.id}@${date}`] ?? null });
  }
  return out;
}
/** Pairs of slots on the same day whose times overlap. */
export function overlaps(slots: Slot[]): [Slot, Slot][] {
  const res: [Slot, Slot][] = [];
  for (let i = 0; i < slots.length; i++) for (let j = i + 1; j < slots.length; j++) {
    const a = slots[i], b = slots[j];
    if (a.day !== b.day) continue;
    const a0 = minutes(a.start), b0 = minutes(b.start);
    if (a0 < b0 + b.durationMin && b0 < a0 + a.durationMin) res.push([a, b]);
  }
  return res;
}
/** The next slot from `now` that is not cancelled, looking up to two weeks ahead. */
export function nextItem(now: Date, slots: Slot[], lessons: Lesson[], cancelled: Cancelled): WeekItem | null {
  const today = iso(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (const wk of [mondayOf(today), addDays(mondayOf(today), 7)]) {
    for (const it of weekItems(wk, slots, lessons, cancelled)) {
      if (it.cancelled) continue;
      if (it.date > today || (it.date === today && minutes(it.slot.start) + it.slot.durationMin > nowMin)) return it;
    }
  }
  return null;
}

import type { DayItem, DayPlan } from './db/schema';
import type { Lesson } from './lesson/model';
import { weekItems, mondayOf, type Slot, type Cancelled } from './timetable';

/**
 * The items of one day: timetable periods (with their lesson plan), lesson plans dated that day without a period,
 * and the teacher's own items. The saved arrangement keeps the teacher's order and ticks; anything new is added in
 * time order. (Milestone 9.)
 */
export interface DayRow { item: DayItem; lesson: Lesson | null; slot: Slot | null; cancelled: string | null }
const mins = (t: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(t); return m ? Number(m[1]) * 60 + Number(m[2]) : 24 * 60; };

export function buildDay(date: string, slots: Slot[], lessons: Lesson[], cancelled: Cancelled, saved: DayPlan | undefined, className: (id: string) => string): DayRow[] {
  const auto: DayRow[] = [];
  const wk = weekItems(mondayOf(date), slots, lessons, cancelled).filter((w) => w.date === date);
  const usedLessons = new Set<string>();
  for (const w of wk) {
    if (w.lesson) usedLessons.add(w.lesson.id);
    auto.push({ item: { id: `slot:${w.slot.id}`, kind: 'slot', ref: w.slot.id, time: w.slot.start, title: `${className(w.slot.classId)}${w.lesson?.topic ? ` · ${w.lesson.topic}` : ''}`, done: false }, lesson: w.lesson, slot: w.slot, cancelled: w.cancelled });
  }
  for (const l of lessons.filter((x) => x.header.date === date && !usedLessons.has(x.id))) {
    auto.push({ item: { id: `lesson:${l.id}`, kind: 'lesson', ref: l.id, time: l.header.start, title: `${l.header.className || `Year ${l.curriculum.year}`} · ${l.topic || 'Untitled lesson'}`, done: false }, lesson: l, slot: null, cancelled: null });
  }
  const byId = new Map(auto.map((r) => [r.item.id, r]));
  const out: DayRow[] = [];
  for (const it of saved?.items ?? []) {
    if (it.kind === 'extra') out.push({ item: { ...it }, lesson: null, slot: null, cancelled: null });
    else { const r = byId.get(it.id); if (r) { out.push({ ...r, item: { ...r.item, done: it.done } }); byId.delete(it.id); } }
  }
  const fresh = [...byId.values()].sort((a, b) => mins(a.item.time) - mins(b.item.time));
  // new items go where their time fits among the saved order
  for (const r of fresh) {
    const i = out.findIndex((x) => mins(x.item.time) > mins(r.item.time));
    if (i < 0) out.push(r); else out.splice(i, 0, r);
  }
  return out;
}
export const sortByTime = (rows: DayRow[]) => [...rows].sort((a, b) => mins(a.item.time) - mins(b.item.time));
export const toPlan = (date: string, rows: DayRow[], note: string): DayPlan => ({ date, note, items: rows.map((r) => ({ ...r.item })) });

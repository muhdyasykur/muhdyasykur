import type { Lesson } from './lesson/model';
import type { PbdRecord, TeachSession, Reflection, MentorNote } from './db/schema';
import type { ClockState } from './teach/session';

/** Facts for the reflection prompts, from what really happened (blueprint F21). Nothing is invented. */
export function reflectionFacts(l: Lesson, s: TeachSession | null, recs: PbdRecord[], classSize: number): string[] {
  const out: string[] = [];
  if (s?.endedAt) {
    const present = classSize ? classSize - s.absent.length : null;
    if (present != null) out.push(`${present} of ${classSize} pupils were present.`);
    const log = (s.clock as ClockState | null)?.log ?? [];
    for (const x of log) {
      const d = Math.round(x.actualSec / 60) - x.plannedMin;
      if (Math.abs(d) >= 2) out.push(`${x.title} ran ${Math.abs(d)} min ${d > 0 ? 'over' : 'under'} (planned ${x.plannedMin}, took ${Math.round(x.actualSec / 60)}).`);
    }
    if (log.length && !out.some((x) => x.includes(' ran '))) out.push('Every stage stayed within 2 minutes of the plan.');
  } else out.push('This lesson was not taught in Teach mode, so there is no timing or attendance record.');
  const mine = recs.filter((r) => r.lessonId === l.id);
  for (const ls of [...l.standards.main.ls, ...l.standards.comp.ls].map((x) => x.code)) {
    const r = mine.filter((x) => x.ls === ls);
    if (!r.length) continue;
    const ok = r.filter((x) => x.tp >= 3).length;
    out.push(`${Math.round((ok / r.length) * 100)}% of assessed pupils (${ok} of ${r.length}) reached TP3 or above for LS ${ls}.`);
  }
  if (!mine.length && s?.endedAt) out.push('No TP levels were recorded for this lesson yet.');
  return out;
}
/** "Next time" notes from earlier reflections on the same class or the same Learning Standards (newest first). */
export function tipsFor(l: Lesson, lessons: Lesson[], refls: Reflection[]): { from: Lesson; text: string }[] {
  const codes = new Set([...l.standards.main.ls, ...l.standards.comp.ls].map((x) => x.code));
  return refls.filter((r) => r.lessonId !== l.id && r.next.trim())
    .map((r) => ({ r, from: lessons.find((x) => x.id === r.lessonId) }))
    .filter((x): x is { r: Reflection; from: Lesson } => !!x.from && ((!!l.classId && x.from.classId === l.classId) || [...x.from.standards.main.ls, ...x.from.standards.comp.ls].some((s) => codes.has(s.code))))
    .sort((a, b) => b.r.createdAt - a.r.createdAt).slice(0, 3).map((x) => ({ from: x.from, text: x.r.next.trim() }));
}
export const MENTOR_TAGS = ['Objectives', 'Time management', 'Classroom management', 'Materials', 'Differentiation', 'Questioning', 'Language use', 'Pupil engagement', 'Assessment', 'Instructions'] as const;
/** How often each tag appears across observations, most frequent first (blueprint F22). */
export function patterns(notes: MentorNote[]): { tag: string; count: number; observations: number }[] {
  const obs = new Set(notes.map((n) => n.date + n.who)).size;
  const c = new Map<string, number>();
  for (const n of notes) for (const t of n.tags) c.set(t, (c.get(t) ?? 0) + 1);
  return [...c.entries()].map(([tag, count]) => ({ tag, count, observations: obs })).sort((a, b) => b.count - a.count);
}
export const GUIDE_FOR_TAG: Record<string, string> = { Objectives: 'abcd', 'Time management': 'mistakes', Differentiation: 'differentiation', Materials: 'choose', Questioning: 'ppp', 'Classroom management': 'shell' };

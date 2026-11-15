import type { Lesson, Objective } from './model';
import { compose, successCriterion, checkSmart, skillOfLs } from './objectives';

/** "M1", "M2", "C1" … in the order the objectives appear. */
export function objectiveLabels(l: Lesson): Map<string, string> {
  const n = { main: 0, comp: 0 };
  return new Map(l.objectives.map((o) => [o.id, `${o.role === 'main' ? 'M' : 'C'}${++n[o.role]}`]));
}
export function criteria(l: Lesson): { objective: Objective; text: string; edited: boolean }[] {
  return l.objectives.map((o) => {
    const sc = l.successCriteria.find((s) => s.objectiveId === o.id);
    return { objective: o, text: sc?.edited ? sc.text : successCriterion(o), edited: !!sc?.edited };
  });
}
export const objectiveText = compose;
export function smartFor(l: Lesson, o: Objective) {
  return checkSmart(o, skillOfLs(l.standards[o.role].ls), l.curriculum.year);
}

export interface AlignmentRow { role: 'main' | 'comp'; ls: string; objectives: string[]; stages: string[]; minutes: number; assessed: boolean; ok: boolean; problem: string }
/** The LS → objective → activity → assessment chain (blueprint section 8). A fuller checker arrives in M3. */
export function alignment(l: Lesson): AlignmentRow[] {
  const labels = objectiveLabels(l);
  const rows: AlignmentRow[] = [];
  for (const role of ['main', 'comp'] as const) {
    for (const ls of l.standards[role].ls) {
      const objs = l.objectives.filter((o) => o.role === role && compose(o));
      const ids = new Set(objs.map((o) => o.id));
      const stages = l.stages.filter((s) => s.activities.some((a) => a.objectiveIds.some((id) => ids.has(id))));
      const minutes = stages.reduce((a, s) => a + s.minutes, 0);
      const assessed = !!(l.assessment.evidence || l.assessment.method);
      const problem = !objs.length ? 'No objective for this standard' : !stages.length ? 'No activity linked to its objective' : !assessed ? 'No assessment planned' : '';
      rows.push({ role, ls: ls.code, objectives: objs.map((o) => labels.get(o.id)!), stages: stages.map((s) => s.title), minutes, assessed, ok: !problem, problem });
    }
  }
  return rows;
}
export function weekday(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { weekday: 'long' });
}
export function longDate(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return isNaN(d.getTime()) ? date : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

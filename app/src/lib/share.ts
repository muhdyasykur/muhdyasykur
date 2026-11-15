import type { Lesson } from './lesson/model';
import { uid } from './lesson/model';
import { FRAMEWORKS } from './lesson/frameworks';

/**
 * Share a lesson as a .consilia file (blueprint F16). Class links and pupil data are never included.
 * Imports are checked field by field before anything touches the database.
 */
export const FORMAT = 'consilia-lesson';
export interface Envelope { format: typeof FORMAT; version: 1; exportedAt: string; app: string; lesson: Lesson }

export function exportLesson(l: Lesson, appVersion: string): string {
  const lesson: Lesson = { ...structuredClone(l), classId: null, status: 'draft' };
  lesson.header = { ...lesson.header, pupils: null };
  return JSON.stringify({ format: FORMAT, version: 1, exportedAt: new Date().toISOString(), app: appVersion, lesson } satisfies Envelope);
}
const isStr = (x: unknown) => typeof x === 'string';
const isArr = Array.isArray;
export function importLesson(text: string): { ok: true; lesson: Lesson } | { ok: false; error: string } {
  let data: Partial<Envelope>;
  try { data = JSON.parse(text); } catch { return { ok: false, error: 'This file is not a Consilia lesson (it is not valid JSON).' }; }
  if (data?.format !== FORMAT) return { ok: false, error: 'This file is not a Consilia lesson.' };
  if (data.version !== 1) return { ok: false, error: 'This lesson was made by a newer Consilia. Update the app to open it.' };
  const l = data.lesson as Lesson | undefined;
  const bad = (what: string) => ({ ok: false as const, error: `The lesson file is damaged (${what}).` });
  if (!l || typeof l !== 'object') return bad('no lesson');
  if (!l.header || !isStr(l.header.date) || !isStr(l.header.start) || typeof l.header.durationMin !== 'number') return bad('header');
  if (!l.curriculum || typeof l.curriculum.year !== 'number' || !['SK', 'SJK'].includes(l.curriculum.school)) return bad('curriculum');
  if (!(l.framework in FRAMEWORKS)) return bad('framework');
  if (!isArr(l.stages) || !l.stages.every((s) => isStr(s.key) && isStr(s.title) && typeof s.minutes === 'number' && isArr(s.activities))) return bad('stages');
  if (!isArr(l.objectives) || !l.objectives.every((o) => ['main', 'comp'].includes(o.role))) return bad('objectives');
  if (!l.standards?.main || !l.standards?.comp) return bad('standards');
  for (const k of ['topic', 'theme', 'mainSkill', 'focus', 'cce', 'aids'] as const) if (l[k] !== undefined && !isStr(l[k])) return bad(k);
  const now = Date.now();
  const lesson: Lesson = { ...l, id: uid(), classId: null, status: 'draft', createdAt: now, updatedAt: now,
    links: (l.links ?? []).filter((x) => isStr(x.url) && /^https?:\/\//.test(x.url)), successCriteria: l.successCriteria ?? [], planB: l.planB ?? { early: '', late: '', offline: '', noisy: '', absent: '' },
    assessment: l.assessment ?? { evidence: '', method: '' }, sowNotes: l.sowNotes ?? { differentiation: '', materials: '', note: '' } };
  return { ok: true, lesson };
}
export function shareName(l: Lesson) { return `${(l.topic || 'lesson').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-')}-Y${l.curriculum.year}.consilia`; }

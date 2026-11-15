import type { School, SowLesson, Standards } from '../curriculum/types';
import { FRAMEWORKS, defaultMinutes, recommend } from './frameworks';
import { newActivity, newObjective, uid, type Lesson, type Mode, type Stage, type StdRole } from './model';
import { skillOfLs } from './objectives';

export interface CreateOptions {
  mode: Mode; year: number; school: School;
  sow?: SowLesson | null; phonics?: boolean;
  classId?: string | null; className?: string; levelLabel?: string; pupils?: number | null;
  date: string; start: string; durationMin: number;
  pack?: string;
}

function refs(codes: string[], list: { code: string; text: string }[]) {
  return codes.map((code) => ({ code, text: list.find((x) => x.code === code)?.text ?? '' }));
}

/** Split `items` into `n` ordered chunks as evenly as possible. */
export function spread<T>(items: T[], n: number): T[][] {
  const out: T[][] = Array.from({ length: n }, () => []);
  items.forEach((it, i) => out[Math.min(n - 1, Math.floor((i * n) / items.length))].push(it));
  return out;
}

export function buildStages(framework: Lesson['framework'], durationMin: number): Stage[] {
  const mins = defaultMinutes(framework, durationMin);
  return FRAMEWORKS[framework].stages.map((s, i) => ({ id: uid(), key: s.key, title: s.title, minutes: mins[i], activities: [] }));
}

/** Build a new RPH for one of the three modes (blueprint F04/F05). Pure: no storage. */
export function buildLesson(o: CreateOptions, std: Standards): Lesson {
  const now = Date.now();
  const sow = o.mode === 'scratch' ? null : o.sow ?? null;
  const empty: StdRole = { cs: [], ls: [] };
  const standards = sow
    ? { main: { cs: refs(sow.std.main.cs, std.cs), ls: refs(sow.std.main.ls, std.ls) }, comp: { cs: refs(sow.std.comp.cs, std.cs), ls: refs(sow.std.comp.ls, std.ls) } }
    : { main: { ...empty }, comp: { ...empty } };
  const mainSkill = sow?.mainSkill || skillOfLs(standards.main.ls);
  const rec = recommend(mainSkill || 'Language Awareness', o.year, sow?.focus ?? '');
  const stages = buildStages(rec.id, o.durationMin);

  if (o.mode === 'follow-sow' && sow) {
    let step = 0;
    const act = (text: string) => newActivity({ teacher: text, source: `SoW step ${++step}` });
    const pre = sow.outline.pre.map(act);
    const mid = sow.outline.delivery.map(act);
    const post = sow.outline.post.map(act);
    stages[0].activities = pre;
    const middle = stages.slice(1, -1);
    spread(mid, middle.length).forEach((chunk, i) => (middle[i].activities = chunk));
    stages[stages.length - 1].activities = post;
  }
  for (const s of stages) if (!s.activities.length) s.activities = [newActivity()];

  const objectives = [newObjective('main', o.year)];
  if (standards.comp.ls.length || o.mode === 'scratch') objectives.push(newObjective('comp', o.year));
  // every activity in the lesson delivery serves the main objective until the teacher says otherwise
  for (const s of stages.slice(1, -1)) for (const a of s.activities) a.objectiveIds = [objectives[0].id];

  return {
    id: uid(), status: 'draft', createdAt: now, updatedAt: now, mode: o.mode, classId: o.classId ?? null,
    header: { subject: 'English', date: o.date, start: o.start, durationMin: o.durationMin, className: o.className ?? '', levelLabel: o.levelLabel ?? '', pupils: o.pupils ?? null },
    curriculum: { pack: o.pack ?? 'kssr2017', year: o.year, school: o.school, sowLesson: sow?.no ?? null, phonics: !!o.phonics },
    theme: sow?.theme ?? '', topic: sow?.topic ?? '', mainSkill, compSkill: skillOfLs(standards.comp.ls),
    focus: sow?.focus ?? '', cce: sow?.cce ?? '', skills21: '', values: '', pedagogy: '', priorKnowledge: '',
    standards, framework: rec.id, frameworkReason: '',
    objectives, successCriteria: [], stages,
    aids: o.mode === 'follow-sow' ? sow?.materials ?? '' : '', vocabulary: '',
    assessment: { evidence: '', method: '' }, links: [], appendices: '',
    planB: { early: '', late: '', offline: '', noisy: '', absent: '' },
    sowNotes: { differentiation: sow?.differentiation ?? '', materials: sow?.materials ?? '', note: [sow?.outline.note, sow?.std.note].filter(Boolean).join('\n\n') }
  };
}

/** Change framework, keeping activities: each old stage's activities go to the new stage at the same relative position. */
export function changeFramework(l: Lesson, id: Lesson['framework']): void {
  const next = buildStages(id, l.header.durationMin);
  const oldMid = l.stages.slice(1, -1), newMid = next.slice(1, -1);
  next[0].activities = l.stages[0]?.activities ?? [];
  next[next.length - 1].activities = l.stages[l.stages.length - 1]?.activities ?? [];
  oldMid.forEach((s, i) => {
    const j = oldMid.length <= 1 ? 0 : Math.round((i * (newMid.length - 1)) / (oldMid.length - 1));
    newMid[j].activities.push(...s.activities.filter((a) => a.teacher || a.pupils || a.tiers.low || a.tiers.mod || a.tiers.high));
  });
  for (const s of next) if (!s.activities.length) s.activities = [newActivity({ objectiveIds: l.objectives[0] ? [l.objectives[0].id] : [] })];
  l.framework = id;
  l.stages = next;
}

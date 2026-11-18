import type { LearningStandard, School, Standards } from '../curriculum/types';
import { buildLesson, buildStages } from '../lesson/create';
import { newActivity, type Lesson } from '../lesson/model';
import { today } from '../dates';
import type { PlanParts, StageKey } from './parse';

/**
 * A lesson plan from the Studio becomes a real Consilia lesson plan (From scratch, PPP), so it can be checked, printed
 * in the school template, turned into slides and taught. Learning standard codes are only kept when they exist in the
 * KSSR standards for that year, so an AI's guess never reaches the printed plan; the teacher confirms the rest.
 */
export function lessonFromPlan(p: PlanParts, o: { year: number; school: School; minutes: number; skill: string; topic: string; words: string; sentence: string }, std: Standards): Lesson {
  const l = buildLesson({ mode: 'scratch', year: o.year, school: o.school, date: today(), start: '08:00', durationMin: o.minutes }, std);
  l.topic = (p.title || o.topic).replace(/[.:]$/, '').slice(0, 120);
  l.mainSkill = o.skill;
  l.framework = 'ppp';
  l.frameworkReason = '';
  // standards that really exist for this year
  const ls = p.codes.map((c) => std.ls.find((x) => x.code === c)).filter((x): x is LearningStandard => !!x);
  const role = (x?: LearningStandard) => {
    if (!x) return { cs: [], ls: [] };
    const cs = std.cs.find((c) => c.code === x.cs) ?? std.cs.find((c) => x.code.startsWith(c.code + '.'));
    return { cs: cs ? [{ code: cs.code, text: cs.text }] : [], ls: [{ code: x.code, text: x.text }] };
  };
  l.standards = { main: role(ls[0]), comp: role(ls[1]) };
  // objectives (typed whole) and success criteria
  const [main, comp] = l.objectives;
  if (p.objectives[0]) main.free = p.objectives[0];
  if (comp) { if (p.objectives[1]) comp.free = p.objectives[1]; else l.objectives = [main]; }
  l.successCriteria = p.criteria.slice(0, 4).map((text) => ({ objectiveId: main.id, text, edited: true }));
  // stages: the plan's minutes when they add up, otherwise PPP's defaults
  const stages = buildStages('ppp', o.minutes);
  const keys: StageKey[] = ['pre', 'presentation', 'practice', 'production', 'post'];
  const mins = keys.map((k) => p.stages[k]?.minutes ?? null);
  const fits = mins.every((m) => !!m && m > 0) && mins.reduce<number>((sum, m) => sum + (m ?? 0), 0) === o.minutes;
  stages.forEach((s, i) => {
    const ps = p.stages[keys[i]];
    if (fits) s.minutes = mins[i]!;
    const delivery = i > 0 && i < stages.length - 1;
    s.activities = [newActivity({
      teacher: ps?.teacher.join('\n') ?? '', pupils: ps?.pupils.join('\n') ?? '', aids: ps?.aids.join(', ') ?? '',
      objectiveIds: delivery ? [main.id] : [], source: 'Studio: Lesson plan writer'
    })];
  });
  const target = stages.find((s) => s.key === 'production') ?? stages[stages.length - 2];
  target.activities[0].tiers = { ...p.tiers };
  l.stages = stages;
  l.vocabulary = (p.words.length ? p.words.join(', ') : o.words).slice(0, 400);
  l.sentence = p.sentence || o.sentence;
  l.aids = p.aids.join(', ');
  l.assessment = { evidence: '', method: p.assessment };
  l.cce = p.cce; l.skills21 = p.skills21;
  return l;
}

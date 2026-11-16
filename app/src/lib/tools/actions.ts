import { getLesson, saveLesson } from '../db/repo';
import { newActivity, type Lesson, type Pattern } from '../lesson/model';
import type { Recipe } from '../recommend/activities';
import { bbmById } from '../recommend/bbm';
import type { ObjParts } from '../recommend/engine';

/** "Add to my lesson": small, safe edits to an RPH from the tools. Each returns the lesson's name for the message. */
const asPattern = (p: string): Pattern | '' => (['T-P', 'P-P', 'pairs', 'groups', 'individual', 'whole-class'].includes(p) ? (p as Pattern) : '');
async function edit(id: string, f: (l: Lesson) => void): Promise<Lesson | null> {
  const l = await getLesson(id); if (!l) return null;
  f(l); l.updatedAt = Date.now(); await saveLesson(JSON.parse(JSON.stringify(l))); return l;
}
export async function addActivityTo(id: string, stageKey: string, r: Recipe, text: { teacher: string; pupils: string; tiers: { low: string; mod: string; high: string } }) {
  return edit(id, (l) => {
    const i = l.stages.findIndex((s) => s.key === stageKey); if (i < 0) return;
    const delivery = i > 0 && i < l.stages.length - 1;
    const act = newActivity({ teacher: text.teacher, pupils: text.pupils, tiers: text.tiers, pattern: asPattern(r.pattern), aids: r.bbm.map((b) => bbmById(b)?.name ?? '').filter(Boolean).join(', '), source: `Tools: ${r.title}`, objectiveIds: delivery && l.objectives[0] ? [l.objectives[0].id] : [] });
    const s = l.stages[i];
    // replace an empty placeholder activity rather than leaving it
    s.activities = s.activities.filter((a) => a.teacher.trim() || a.pupils.trim());
    s.activities.push(act);
  });
}
export async function setObjective(id: string, role: 'main' | 'comp', p: ObjParts) {
  return edit(id, (l) => {
    const o = l.objectives.find((x) => x.role === role);
    if (o) Object.assign(o, { verb: p.verb, content: p.content, condition: p.condition, degree: p.degree, free: '' });
    l.successCriteria = l.successCriteria.filter((s) => s.objectiveId !== o?.id);
  });
}
export async function appendAppendix(id: string, title: string, lines: string[]) {
  return edit(id, (l) => { l.appendices = [l.appendices.trim(), `${title}\n${lines.join('\n')}`].filter(Boolean).join('\n\n'); });
}
export async function setVocabulary(id: string, words: string) { return edit(id, (l) => { if (!l.vocabulary.trim()) l.vocabulary = words; }); }

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildLesson } from '../lesson/create';
import { runChecks } from '../lesson/checker';
import { smartFor } from '../lesson/derive';
import type { SowFile, Standards } from '../curriculum/types';
import { planLesson, applyPlan, briefFrom, type ClassProfile } from './engine';
import { RECIPES } from './activities';
import { BBM, BBM_PICS } from './bbm';
import { DIGITAL } from './digital';

const dir = new URL('../../../public/curriculum/kssr2017/', import.meta.url);
const load = (y: number) => ({
  sow: JSON.parse(readFileSync(new URL(`sow-y${y}-sk.json`, dir), 'utf8')) as SowFile,
  std: JSON.parse(readFileSync(new URL(`standards-y${y}.json`, dir), 'utf8')) as Standards
});
const profile: ClassProfile = { level: 'mixed', traits: [], projector: true, speakers: true, internet: false, devices: 'teacher' };

function make(y: number, no: number, p = profile, extra = {}) {
  const { sow, std } = load(y);
  const s = sow.lessons.find((l) => l.no === no)!;
  const base = buildLesson({ mode: 'recommend', year: y, school: 'SK', sow: s, date: '2026-11-16', start: '09:10', durationMin: 60, pupils: 30 }, std);
  const b = briefFrom(base, { words: ['apple', 'banana', 'mango', 'durian'], sentence: 'I like … because …', ...extra });
  const plan = planLesson(p, b, { seed: 3 });
  return { plan, lesson: applyPlan(base, plan, b), b };
}

describe('catalogues', () => {
  it('every recipe links only to real teaching aids and digital tools, and every aid has a picture', () => {
    const bb = new Set(BBM.map((x) => x.id)), dd = new Set(DIGITAL.map((x) => x.id));
    for (const r of RECIPES) { for (const x of r.bbm) expect(bb.has(x), `${r.id} → ${x}`).toBe(true); for (const x of r.digital) expect(dd.has(x), `${r.id} → ${x}`).toBe(true); }
    for (const x of BBM) { expect(BBM_PICS[x.id], x.id).toBeTruthy(); expect(x.steps.length).toBeGreaterThanOrEqual(2); }
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
  });
});

describe('Consilia Recommends', () => {
  it('plans every SoW lesson of every year into an RPH that passes the checker', () => {
    const scores: number[] = []; const low: string[] = [];
    for (const y of [1, 2, 3, 4, 5, 6]) {
      const { sow } = load(y);
      for (const s of sow.lessons.filter((l) => l.std.main.ls.length)) {
        const { lesson } = make(y, s.no);
        const r = runChecks(lesson);
        scores.push(r.score);
        if (r.score < 90) low.push(`Y${y} L${s.no} ${s.mainSkill} ${r.score}: ${r.failing.map((f) => f.rule.id).join(',')}`);
        for (const o of lesson.objectives) {
          const bad = smartFor(lesson, o).filter((x) => !x.ok);
          expect(bad.map((x) => x.letter + ': ' + x.message), `Y${y} L${s.no} ${o.role}`).toEqual([]);
        }
      }
    }
    expect(low.slice(0, 15)).toEqual([]);
    expect(scores.length).toBeGreaterThan(900);
  });
  it('every stage has an activity with steps, and timings add up', () => {
    const { plan } = make(4, 2);
    expect(plan.stages.every((s) => s.picks.length >= 1)).toBe(true);
    expect(plan.stages.reduce((a, s) => a + s.minutes, 0)).toBe(60);
    for (const s of plan.stages) { expect(s.picks.reduce((a, x) => a + x.minutes, 0)).toBe(s.minutes); for (const x of s.picks) expect(x.steps.length).toBeGreaterThanOrEqual(4); }
    expect(plan.log.length).toBeGreaterThanOrEqual(8);
  });
  it('never suggests online tools or device activities to a class without internet', () => {
    const { plan } = make(5, 3, { ...profile, internet: false, devices: 'none' });
    const all = plan.stages.flatMap((s) => s.picks);
    expect(all.every((x) => x.recipe.needs.every((n) => n === 'projector' || n === 'speakers'))).toBe(true);
    expect(all.flatMap((x) => x.digital).every((d) => !d.needs.includes('internet'))).toBe(true);
  });
  it('follows the class and the goals', () => {
    const calm = make(4, 2, { ...profile, traits: [] }, { goals: ['calm'] }).plan.stages.flatMap((s) => s.picks);
    const fun = make(4, 2, { ...profile, traits: ['energetic'] }, { goals: ['fun', 'observation'] }).plan.stages.flatMap((s) => s.picks);
    const active = (xs: typeof calm) => xs.filter((x) => x.recipe.energy === 'active').length;
    expect(active(fun)).toBeGreaterThan(active(calm));
    expect(fun.some((x) => x.recipe.wow)).toBe(true);
  });
  it('"Another idea" changes only the stage it is pressed on', () => {
    const { sow, std } = load(4); const s = sow.lessons.find((l) => l.no === 2)!;
    const base = buildLesson({ mode: 'recommend', year: 4, school: 'SK', sow: s, date: '2026-11-16', start: '09:10', durationMin: 60 }, std);
    const b = briefFrom(base);
    const a = planLesson(profile, b, { seed: 3 });
    const key = a.stages[2].key;
    const lock = Object.fromEntries(a.stages.filter((s) => s.key !== key).map((s) => [s.key, s.picks.map((x) => x.recipe.id)]));
    const c = planLesson(profile, b, { seed: 3, avoid: { [key]: [a.stages[2].picks[0].recipe.id] }, lock });
    expect(c.stages[2].picks[0].recipe.id).not.toBe(a.stages[2].picks[0].recipe.id);
    for (const i of [0, 1, 3, 4]) expect(c.stages[i].picks.map((x) => x.recipe.id)).toEqual(a.stages[i].picks.map((x) => x.recipe.id));
  });
  it('fills placeholders with the teacher\'s words and keeps 30-minute lessons whole', () => {
    const { plan, lesson } = make(2, 5, profile, {});
    const text = JSON.stringify(plan.stages);
    expect(text).not.toMatch(/\{(topic|words|first|sentence|text)\}/);
    const short = (() => { const { sow, std } = load(2); const s = sow.lessons.find((l) => l.no === 5)!; const base = buildLesson({ mode: 'recommend', year: 2, school: 'SK', sow: s, date: '2026-11-16', start: '09:10', durationMin: 30 }, std); const b = briefFrom(base); return applyPlan(base, planLesson(profile, b), b); })();
    expect(short.stages.reduce((a, s) => a + s.minutes, 0)).toBe(30);
    expect(lesson.links.every((x) => x.url.startsWith('https://'))).toBe(true);
  });
});

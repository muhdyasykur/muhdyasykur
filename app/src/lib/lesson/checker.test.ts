import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { RULES, runChecks } from './checker';
import { buildLesson } from './create';
import type { Lesson } from './model';
import type { SowFile, Standards } from '../curriculum/types';

const dir = new URL('../../../public/curriculum/kssr2017/', import.meta.url);
const std: Standards = JSON.parse(readFileSync(new URL('standards-y4.json', dir), 'utf8'));
const sow: SowFile = JSON.parse(readFileSync(new URL('sow-y4-sjk.json', dir), 'utf8'));

/** The "What's the Matter" lesson as the end-to-end test builds it. */
function sample(): Lesson {
  const l = buildLesson({ mode: 'scratch', year: 4, school: 'SJK', date: '2025-11-03', start: '09:10', durationMin: 60 }, std);
  const ref = (c: string) => ({ code: c, text: std.ls.find((x) => x.code === c)!.text });
  l.standards.main = { cs: [{ code: '4.2', text: '' }], ls: [ref('4.2.3')] };
  l.standards.comp = { cs: [{ code: '4.2', text: '' }], ls: [ref('4.2.5')] };
  l.mainSkill = 'Writing'; l.compSkill = 'Writing'; l.topic = "What's the Matter"; l.cce = 'Language'; l.skills21 = 'Collaboration';
  const [m, c] = l.objectives;
  Object.assign(m, { verb: 'write', content: "5 sentences using should and shouldn't to describe healthy routines", condition: 'based on a picture worksheet', degree: 'with at least 4 correct' });
  Object.assign(c, { verb: 'connect', content: 'their sentences into a paragraph using and, but, because', degree: 'with at least 2 correctly used conjunctions' });
  l.framework = 'ppp'; l.frameworkReason = 'One sentence pattern.';
  l.stages = [
    { id: '1', key: 'pre-lesson', title: 'Pre-lesson', minutes: 5, activities: [] },
    { id: '2', key: 'presentation', title: 'Presentation', minutes: 15, activities: [] },
    { id: '3', key: 'practice', title: 'Practice', minutes: 15, activities: [] },
    { id: '4', key: 'production', title: 'Production', minutes: 20, activities: [] },
    { id: '5', key: 'post-lesson', title: 'Post-lesson', minutes: 5, activities: [] }
  ];
  const act = (teacher: string, pupils: string, objs: string[], tiers = { low: '', mod: '', high: '' }) => ({ id: teacher.slice(0, 8), teacher, pupils, pattern: '' as const, objectiveIds: objs, aids: '', values: '', tiers });
  l.stages[0].activities = [act('Shows pictures and asks good or bad?', 'Vote with thumbs.', [])];
  l.stages[1].activities = [act('Models a paragraph with should and because.', 'Find examples.', [m.id, c.id])];
  l.stages[2].activities = [act('Monitors the worksheet.', 'Write one sentence for each picture.', [m.id])];
  l.stages[3].activities = [act('Conferences with the Low group.', 'Plan and write their own paragraph about staying healthy.', [m.id, c.id], { low: 'Sentence frame', mod: 'Starter', high: 'No starter' })];
  l.stages[4].activities = [act('Asks three pupils to read aloud.', 'Self-assess against the I can statements.', [])];
  l.assessment = { evidence: 'Paragraph', method: 'Checklist' };
  l.planB = { early: 'Advice letter', late: 'Homework', offline: 'Board version', noisy: '', absent: '' };
  return l;
}

describe('alignment checker', () => {
  it('has 29 rules with unique ids', () => {
    expect(RULES).toHaveLength(29);
    expect(new Set(RULES.map((r) => r.id)).size).toBe(29);
  });
  it('scores the finished sample lesson 100 and skips rules for other frameworks', () => {
    const r = runChecks(sample());
    expect(r.failing.map((f) => f.rule.id)).toEqual([]);
    expect(r.score).toBe(100);
    expect(r.results.filter((x) => x.status === 'skip').map((x) => x.rule.id).sort()).toEqual(['la-creative', 'process-stages', 'pwp-post', 'pwp-pre', 'pwp-text', 'tblt-report']);
  });
  it('a brand-new scratch lesson scores low and lists what to fix', () => {
    const l = buildLesson({ mode: 'scratch', year: 4, school: 'SK', date: '2026-01-05', start: '08:00', durationMin: 60 }, std);
    const r = runChecks(l);
    expect(r.score).toBeLessThan(30);
    expect(r.failing[0].rule.weight).toBe(3);
  });
  it('catches an orphan complementary objective', () => {
    const l = sample();
    for (const s of l.stages) for (const a of s.activities) a.objectiveIds = a.objectiveIds.filter((id) => id !== l.objectives[1].id);
    const ids = runChecks(l).failing.map((f) => f.rule.id);
    expect(ids).toContain('comp-practised');
    expect(ids).toContain('obj-activity');
  });
  it('catches a controlled production stage', () => {
    const l = sample();
    l.stages[3].activities[0].pupils = 'Repeat the sentences chorally and fill in the blanks.';
    expect(runChecks(l).failing.map((f) => f.rule.id)).toContain('ppp-production');
  });
  it('catches a teacher-only post-lesson', () => {
    const l = sample();
    l.stages[4].activities = [{ ...l.stages[4].activities[0], teacher: 'Teacher summarises the lesson.', pupils: '' }];
    expect(runChecks(l).failing.map((f) => f.rule.id)).toContain('post-lesson');
  });
  it('accepts a rule the teacher marks as fine, with a reason', () => {
    const l = sample();
    l.planB = { early: '', late: '', offline: '', noisy: '', absent: '' };
    expect(runChecks(l).score).toBeLessThan(100);
    l.checkNotes = { 'plan-b': 'Observation lesson, mentor present.' };
    const r = runChecks(l);
    expect(r.score).toBe(100);
    expect(r.results.find((x) => x.rule.id === 'plan-b')!.status).toBe('accepted');
  });
  it('checks PWP specifics on a follow-SoW reading lesson', () => {
    const l = buildLesson({ mode: 'follow-sow', year: 4, school: 'SJK', sow: sow.lessons.find((x) => x.mainSkill === 'Reading')!, date: '2026-01-05', start: '08:00', durationMin: 60 }, std);
    const ids = runChecks(l).results.filter((x) => x.status !== 'skip').map((x) => x.rule.id);
    expect(ids).toContain('pwp-text');
    expect(ids).not.toContain('ppp-production');
  });
});

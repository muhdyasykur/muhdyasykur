import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildLesson, changeFramework, spread } from './create';
import type { SowFile, Standards } from '../curriculum/types';

const dir = new URL('../../../public/curriculum/kssr2017/', import.meta.url);
const sow: SowFile = JSON.parse(readFileSync(new URL('sow-y4-sk.json', dir), 'utf8'));
const std: Standards = JSON.parse(readFileSync(new URL('standards-y4.json', dir), 'utf8'));
const l1 = sow.lessons[0];
const base = { year: 4, school: 'SK' as const, date: '2026-11-16', start: '09:10', durationMin: 60 };

describe('buildLesson', () => {
  it('follow-SoW copies the header, standards and every outline step', () => {
    const l = buildLesson({ ...base, mode: 'follow-sow', sow: l1 }, std);
    expect(l.topic).toBe('Where are you from?');
    expect(l.standards.main.ls[0].code).toBe('1.2.2');
    expect(l.standards.main.ls[0].text).toContain('Understand with support specific information');
    expect(l.mainSkill).toBe('Listening');
    expect(l.framework).toBe('pwp');
    const steps = l.stages.flatMap((s) => s.activities).filter((a) => a.source).length;
    expect(steps).toBe(l1.outline.pre.length + l1.outline.delivery.length + l1.outline.post.length);
    expect(l.stages[0].activities[0].teacher).toBe(l1.outline.pre[0]);
    expect(l.stages.reduce((a, s) => a + s.minutes, 0)).toBe(60);
  });
  it('SoW-standards mode keeps standards but leaves activities empty', () => {
    const l = buildLesson({ ...base, mode: 'sow-standards', sow: l1 }, std);
    expect(l.standards.comp.ls[0].code).toBe('1.1.1');
    expect(l.stages.every((s) => s.activities.length === 1 && !s.activities[0].teacher)).toBe(true);
  });
  it('scratch mode starts empty with a main and a complementary objective', () => {
    const l = buildLesson({ ...base, mode: 'scratch', sow: l1 }, std);
    expect(l.topic).toBe('');
    expect(l.standards.main.ls).toEqual([]);
    expect(l.objectives.map((o) => o.role)).toEqual(['main', 'comp']);
    expect(l.curriculum.sowLesson).toBeNull();
  });
  it('30-minute lessons get 30 minutes of stages', () => {
    const l = buildLesson({ ...base, durationMin: 30, mode: 'follow-sow', sow: l1 }, std);
    expect(l.stages.reduce((a, s) => a + s.minutes, 0)).toBe(30);
  });
  it('changing framework keeps every written activity', () => {
    const l = buildLesson({ ...base, mode: 'follow-sow', sow: l1 }, std);
    const before = l.stages.flatMap((s) => s.activities).filter((a) => a.teacher).map((a) => a.teacher);
    changeFramework(l, 'ppp');
    expect(l.stages.map((s) => s.key)).toEqual(['pre-lesson', 'presentation', 'practice', 'production', 'post-lesson']);
    expect(l.stages.flatMap((s) => s.activities).filter((a) => a.teacher).map((a) => a.teacher)).toEqual(before);
  });
  it('spread keeps order and uses every chunk when it can', () => {
    expect(spread([1, 2, 3, 4], 3)).toEqual([[1, 2], [3], [4]]);
    expect(spread([1], 3)).toEqual([[1], [], []]);
  });
});

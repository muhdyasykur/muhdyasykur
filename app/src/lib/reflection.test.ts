import { describe, it, expect } from 'vitest';
import { reflectionFacts, tipsFor, patterns } from './reflection';
import type { Lesson } from './lesson/model';
import type { PbdRecord, TeachSession } from './db/schema';

const lesson = (id: string, classId: string | null, ls: string) => ({ id, classId, standards: { main: { cs: [], ls: [{ code: ls, text: '' }] }, comp: { cs: [], ls: [] } } }) as unknown as Lesson;
const sess: TeachSession = { id: 's', lessonId: 'l1', classId: 'c', startedAt: 1, endedAt: 2, absent: ['p1', 'p2'], clock: { log: [
  { key: 'pre-lesson', title: 'Pre-lesson', plannedMin: 5, actualSec: 480 }, { key: 'production', title: 'Production', plannedMin: 20, actualSec: 1200 }
] } };
const rec = (pupilId: string, tp: 1 | 2 | 3 | 4 | 5 | 6): PbdRecord => ({ id: pupilId, pupilId, classId: 'c', lessonId: 'l1', ls: '4.2.3', tp, date: 'd' });

describe('reflection', () => {
  it('states attendance, timing and TP results from real records', () => {
    const f = reflectionFacts(lesson('l1', 'c', '4.2.3'), sess, [rec('a', 2), rec('b', 3), rec('c', 4), rec('d', 5)], 44);
    expect(f).toEqual(['42 of 44 pupils were present.', 'Pre-lesson ran 3 min over (planned 5, took 8).', '75% of assessed pupils (3 of 4) reached TP3 or above for LS 4.2.3.']);
  });
  it('says plainly when the lesson was not taught in Teach mode', () => {
    expect(reflectionFacts(lesson('l1', null, '4.2.3'), null, [], 0)[0]).toContain('not taught in Teach mode');
  });
  it('offers next-time notes from the same class or standard', () => {
    const a = lesson('a', 'c1', '1.2.2'), b = lesson('b', 'c2', '4.2.3'), now = lesson('n', 'c1', '4.2.3');
    const tips = tipsFor(now, [a, b], [{ id: 'a', lessonId: 'a', worked: '', didnt: '', next: 'Shorter pre-lesson', createdAt: 1 }, { id: 'b', lessonId: 'b', worked: '', didnt: '', next: 'Model the paragraph first', createdAt: 2 }]);
    expect(tips.map((t) => t.text)).toEqual(['Model the paragraph first', 'Shorter pre-lesson']);
  });
  it('counts mentor feedback patterns', () => {
    const p = patterns([{ id: '1', lessonId: null, who: 'Mentor', date: '2026-01-05', text: '', tags: ['Time management', 'Objectives'] }, { id: '2', lessonId: null, who: 'Lecturer', date: '2026-01-12', text: '', tags: ['Time management'] }]);
    expect(p[0]).toEqual({ tag: 'Time management', count: 2, observations: 2 });
  });
});

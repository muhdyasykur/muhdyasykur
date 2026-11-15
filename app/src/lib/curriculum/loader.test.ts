import { describe, it, expect } from 'vitest';
import { searchLessons } from './loader';
import type { SowLesson } from './types';

const mk = (no: number, topic: string, skill: string, ls: string): SowLesson => ({
  no, label: `${skill} 1`, kind: 'textbook', unit: 'Unit 1', mainSkill: skill, theme: 'World of Knowledge', topic, focus: '', cce: '',
  std: { main: { cs: [ls.slice(0, 3)], ls: [ls] }, comp: { cs: [], ls: [] } }, outline: { pre: [], delivery: [], post: [] }, materials: '', differentiation: '', docPage: 1
});
const lessons = [mk(1, 'Where are you from?', 'Listening', '1.2.2'), mk(2, 'My week', 'Writing', '4.2.3'), mk(3, 'In the past', 'Reading', '3.2.2')];

describe('searchLessons', () => {
  it('returns everything for an empty query', () => expect(searchLessons(lessons, '  ')).toHaveLength(3));
  it('matches topic words in any case', () => expect(searchLessons(lessons, 'WEEK').map((l) => l.no)).toEqual([2]));
  it('matches a Learning Standard code', () => expect(searchLessons(lessons, '3.2.2').map((l) => l.no)).toEqual([3]));
  it('requires every term', () => expect(searchLessons(lessons, 'writing past')).toHaveLength(0));
});

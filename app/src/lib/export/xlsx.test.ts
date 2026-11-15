import { describe, it, expect } from 'vitest';
import { pbdSheets } from './xlsx';
import type { PbdRecord, Pupil, SchoolClass } from '../db/schema';

const cls: SchoolClass = { id: 'c', year: 4, name: '4 Zhong', schoolType: 'SJK', curriculumPack: 'kssr2017', createdAt: 1 };
const pupils: Pupil[] = [{ id: 'a', classId: 'c', name: 'Aina', order: 1 }, { id: 'b', classId: 'c', name: 'Bala', order: 2, tierOverride: 'high' }];
const rec = (pupilId: string, ls: string, tp: 1 | 2 | 3 | 4 | 5 | 6, date: string): PbdRecord => ({ id: pupilId + ls + date, pupilId, classId: 'c', lessonId: 'l1', ls, tp, date });

describe('PBD Excel sheets', () => {
  it('builds a class sheet with latest TPs and an all-records sheet', () => {
    const s = pbdSheets([{ cls, pupils, records: [rec('a', '4.2.3', 2, '2026-01-05'), rec('a', '4.2.3', 3, '2026-01-12'), rec('b', '4.2.5', 5, '2026-01-12')] }], () => "What's the Matter");
    expect(s.map((x) => x.name)).toEqual(['4 Zhong', 'All records']);
    const head = s[0].rows[1].map((c) => c.value);
    expect(head).toEqual(['No', 'Pupil', 'Suggested level', 'LS 4.2.3', 'LS 4.2.5']);
    expect(s[0].rows[2].map((c) => c.value)).toEqual([1, 'Aina', 'Moderate (provisional)', 3, null]);
    expect(s[0].rows[3].map((c) => c.value)).toEqual([2, 'Bala', 'High (set by teacher)', null, 5]);
    expect(s[1].rows).toHaveLength(4);
    expect(s[1].rows[1][5].value).toBe("What's the Matter");
  });
});

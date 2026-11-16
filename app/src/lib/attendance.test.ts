import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { summarise, dayCounts, registerSheet, fromTeach, getRegister, saveRegister, listRegisters } from './attendance';
import type { Pupil, Register, SchoolClass } from './db/schema';

const pupils = ['Aina', 'Bala', 'Chong'].map((name, i) => ({ id: `p${i}`, classId: 'c1', name, order: i })) as Pupil[];
const reg = (date: string, marks: Record<string, 'P' | 'L' | 'A' | 'E'>): Register => ({ id: `c1:${date}`, classId: 'c1', date, marks, reasons: {}, takenAt: 0 });

describe('attendance', () => {
  it('counts present and late as attended, and leaves excused days out of the rate', () => {
    const s = summarise(pupils, [reg('2026-11-02', { p0: 'P', p1: 'A', p2: 'E' }), reg('2026-11-03', { p0: 'L', p1: 'P', p2: 'P' })]);
    expect(s.get('p0')).toMatchObject({ P: 1, L: 1, rate: 100 });
    expect(s.get('p1')).toMatchObject({ A: 1, P: 1, rate: 50 });
    expect(s.get('p2')).toMatchObject({ E: 1, P: 1, rate: 100 });
  });
  it('counts a day, including pupils not yet marked', () => {
    expect(dayCounts(reg('2026-11-02', { p0: 'P', p1: 'A' }), pupils)).toEqual({ P: 1, L: 0, A: 1, E: 0, unmarked: 1 });
  });
  it('makes a month sheet with one column per day and totals', () => {
    const sh = registerSheet({ id: 'c1', name: '4 Bestari', year: 4, schoolType: 'SK', curriculumPack: 'kssr2017', createdAt: 0 } as SchoolClass, pupils, [reg('2026-11-02', { p0: 'P' })], '2026-11');
    expect(sh.rows[1].map((c) => c.value)).toEqual(['No', 'Pupil', '02/11', 'Present', 'Late', 'Absent', 'Excused', 'Attendance %']);
    expect(sh.rows[2][1].value).toBe('Aina');
  });
  it('Teach mode fills the register without overwriting the teacher\'s marks', async () => {
    await saveRegister(reg('2026-11-04', { p0: 'L' }));
    await fromTeach('c1', '2026-11-04', ['p0', 'p1', 'p2'], ['p0', 'p2']);
    expect((await getRegister('c1', '2026-11-04'))!.marks).toEqual({ p0: 'L', p1: 'P', p2: 'A' });
    expect((await listRegisters('c1', '2026-11-01', '2026-11-30')).map((r) => r.date)).toContain('2026-11-04');
  });
});

import { describe, it, expect } from 'vitest';
import { autoTier, latestGrid } from './pbd';
import type { PbdRecord } from './db/schema';

const r = (pupilId: string, ls: string, tp: 1 | 2 | 3 | 4 | 5 | 6, date: string): PbdRecord => ({ id: pupilId + ls + date, pupilId, classId: 'c', lessonId: null, ls, tp, date });

describe('PBD', () => {
  it('suggests a level from the last three records', () => {
    expect(autoTier([r('a', '4.2.3', 1, '2026-01-01'), r('a', '4.2.3', 2, '2026-01-08'), r('a', '4.2.5', 2, '2026-01-15')])).toEqual({ tier: 'low', provisional: false, basis: 3 });
    expect(autoTier([r('a', '4.2.3', 6, '2025-01-01'), r('a', '4.2.3', 3, '2026-01-01'), r('a', '4.2.3', 4, '2026-01-08'), r('a', '4.2.3', 4, '2026-01-15')]).tier).toBe('mod');
    expect(autoTier([r('a', '3.2.2', 5, '2026-01-01')])).toEqual({ tier: 'high', provisional: true, basis: 1 });
    expect(autoTier([])).toEqual({ tier: 'mod', provisional: true, basis: 0 });
  });
  it('can look at one skill only', () => {
    const recs = [r('a', '4.2.3', 1, '2026-01-01'), r('a', '1.2.2', 6, '2026-01-02')];
    expect(autoTier(recs, '4.').tier).toBe('low');
    expect(autoTier(recs, '1.').tier).toBe('high');
  });
  it('keeps the latest TP per pupil and LS', () => {
    const g = latestGrid([r('a', '4.2.3', 2, '2026-01-01'), r('a', '4.2.3', 4, '2026-02-01'), r('b', '4.2.3', 3, '2026-01-01')]);
    expect(g.get('a')!.get('4.2.3')!.tp).toBe(4);
    expect(g.get('b')!.get('4.2.3')!.tp).toBe(3);
  });
});

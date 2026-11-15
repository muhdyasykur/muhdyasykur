import { describe, it, expect } from 'vitest';
import { BANK, bankFor } from './bank';
import { FRAMEWORKS } from '../lesson/frameworks';

describe('activity bank', () => {
  it('has 70 complete activities with unique ids', () => {
    expect(BANK).toHaveLength(70);
    expect(new Set(BANK.map((b) => b.id)).size).toBe(70);
    for (const b of BANK) {
      for (const f of [b.title, b.teacher, b.pupils, b.tiers.low, b.tiers.mod, b.tiers.high, b.offline]) expect(f.length, b.id).toBeGreaterThan(2);
      expect(b.years[0]).toBeLessThanOrEqual(b.years[1]);
    }
  });
  it('offers something for every stage of every framework in Years 1 and 6', () => {
    const keys = new Set(Object.values(FRAMEWORKS).flatMap((f) => f.stages.map((s) => s.key)));
    for (const k of keys) for (const y of [1, 6]) {
      if (['model', 'planning', 'drafting', 'revising', 'task-cycle', 'pre-task', 'focus'].includes(k) && y === 1) continue;
      expect(bankFor(k, y).length, `${k} Y${y}`).toBeGreaterThan(0);
    }
  });
  it('puts the lesson skill first', () => expect(bankFor('while', 4, 'Reading')[0].skill).toBe('Reading'));
});

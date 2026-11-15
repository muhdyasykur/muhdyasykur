import { describe, it, expect } from 'vitest';
import { startClock, go, remainingSec, pause, resume, drift, advice, fmt } from './session';

const plan = [
  { key: 'pre-lesson', title: 'Pre-lesson', minutes: 5 },
  { key: 'presentation', title: 'Presentation', minutes: 15 },
  { key: 'practice', title: 'Practice', minutes: 15 },
  { key: 'production', title: 'Production', minutes: 20 },
  { key: 'post-lesson', title: 'Post-lesson', minutes: 5 }
];
const MIN = 60_000;

describe('teach clock', () => {
  it('counts down from timestamps and survives a long gap (phone locked)', () => {
    const c = startClock(0);
    expect(remainingSec(c, plan, 2 * MIN)).toBe(180);
    expect(remainingSec(c, plan, 7 * MIN)).toBe(-120); // overran: shown as +2:00
    expect(fmt(-120)).toBe('+2:00');
  });
  it('pausing stops the clock', () => {
    let c = startClock(0);
    c = pause(c, 1 * MIN);
    expect(remainingSec(c, plan, 10 * MIN)).toBe(240);
    c = resume(c, 10 * MIN);
    expect(remainingSec(c, plan, 11 * MIN)).toBe(180);
  });
  it('logs actual time per stage and finishes', () => {
    let c = startClock(0);
    for (const at of [6, 22, 36, 56, 61]) c = go(c, plan, at * MIN);
    expect(c.log.map((x) => Math.round(x.actualSec / 60))).toEqual([6, 16, 14, 20, 5]);
    expect(c.finishedAt).toBe(61 * MIN);
  });
  it('coaches when 3 minutes behind or ahead', () => {
    let c = startClock(0);
    c = go(c, plan, 8 * MIN); // pre-lesson took 8 of 5
    expect(drift(c, plan, 8 * MIN)).toBe(3);
    expect(advice(c, plan, 8 * MIN)).toEqual({ kind: 'behind', minutes: 3 });
    let d = startClock(0);
    d = go(d, plan, 5 * MIN);
    d = go(d, plan, 16 * MIN); // presentation 11 of 15
    expect(advice(d, plan, 16 * MIN)).toEqual({ kind: 'ahead', minutes: 4 });
    expect(advice(startClock(0), plan, 1 * MIN)).toBeNull();
  });
});

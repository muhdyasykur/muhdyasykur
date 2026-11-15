import { describe, it, expect } from 'vitest';
import { checkSmart, compose, successCriterion } from './objectives';
import { newObjective } from './model';

const ok = (r: ReturnType<typeof checkSmart>) => Object.fromEntries(r.map((x) => [x.letter, x.ok]));

describe('ABCD objectives', () => {
  const good = { ...newObjective('main', 4), verb: 'write', content: "5 sentences using should and shouldn't to describe healthy and unhealthy routines", condition: 'based on a picture worksheet', degree: 'with at least 4 correct' };
  it('composes the four parts into one sentence', () => {
    expect(compose(good)).toBe("By the end of the lesson, Year 4 pupils will be able to write 5 sentences using should and shouldn't to describe healthy and unhealthy routines based on a picture worksheet with at least 4 correct.");
  });
  it('passes every SMART letter for a well-formed writing objective', () => {
    expect(ok(checkSmart(good, 'Writing', 4))).toEqual({ S: true, M: true, A: true, R: true, T: true });
  });
  it('flags the template\'s "with minimal support" as unmeasurable', () => {
    const o = { ...good, verb: 'connect', content: 'their sentences using basic coordinating conjunctions in a short paragraph', condition: '', degree: 'with minimal support' };
    const r = checkSmart(o, 'Writing', 4);
    expect(ok(r).M).toBe(false);
    expect(r.find((x) => x.letter === 'M')!.message).toContain('minimal');
  });
  it('rejects vague verbs', () => {
    const o = { ...newObjective('main', 3), free: 'By the end of the lesson, pupils will be able to understand the story with 3 correct answers.' };
    expect(ok(checkSmart(o, 'Reading', 3)).S).toBe(false);
  });
  it('asks to split two behaviours', () => {
    const o = { ...good, verb: 'identify', content: 'the animals and write their names', degree: 'at least 4 out of 5' };
    expect(checkSmart(o, 'Reading', 4).find((x) => x.letter === 'S')!.message).toContain('two behaviours');
  });
  it('catches impossible and over-ambitious degrees', () => {
    expect(ok(checkSmart({ ...good, degree: '6 out of 5 correctly' }, 'Writing', 4)).A).toBe(false);
    expect(ok(checkSmart({ ...good, content: '30 sentences about food' }, 'Writing', 2)).A).toBe(false);
  });
  it('checks the verb matches the skill', () => {
    expect(ok(checkSmart({ ...good, verb: 'sing', content: 'a song about routines' }, 'Writing', 4)).R).toBe(false);
  });
  it('needs a time frame', () => {
    expect(ok(checkSmart({ ...good, audience: 'Pupils will be able to' }, 'Writing', 4)).T).toBe(false);
  });
  it('turns an objective into an "I can" criterion', () => {
    expect(successCriterion(good)).toBe("I can write 5 sentences using should and shouldn't to describe healthy and unhealthy routines.");
    expect(successCriterion({ ...good, verb: 'connect', content: 'their sentences with and, but, because' })).toBe('I can connect my sentences with and, but, because.');
    expect(successCriterion({ ...good, free: 'By the end of the lesson, Year 2 pupils will be able to name 6 colours with at least 5 correct.' })).toBe('I can name 6 colours.');
  });
});

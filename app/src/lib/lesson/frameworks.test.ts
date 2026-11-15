import { describe, it, expect } from 'vitest';
import { FRAMEWORKS, checkTiming, defaultMinutes, recommend, rescale } from './frameworks';
import { endTime } from './model';

describe('frameworks', () => {
  it('every framework sums to 60 and 30 minutes and keeps the SoW shell', () => {
    for (const f of Object.values(FRAMEWORKS)) {
      expect(f.stages.reduce((a, s) => a + s.share60, 0), f.id).toBe(60);
      expect(f.stages.reduce((a, s) => a + s.share30, 0), f.id).toBe(30);
      expect(f.stages[0].key).toBe('pre-lesson');
      expect(f.stages.at(-1)!.key).toBe('post-lesson');
    }
  });
  it('recommends by main skill', () => {
    expect(recommend('Reading', 4).id).toBe('pwp');
    expect(recommend('Listening', 1).id).toBe('pwp');
    expect(recommend('Writing', 4).id).toBe('process');
    expect(recommend('Writing', 2).id).toBe('ppp');
    expect(recommend('Speaking', 5).alternatives.map((a) => a.id)).toContain('tblt');
    expect(recommend('Speaking', 2).alternatives).toHaveLength(0);
    expect(recommend('Language Arts', 3).id).toBe('la');
    expect(recommend('Language Awareness', 4).id).toBe('ppp');
  });
  it('rescales to any length and always sums exactly', () => {
    for (const total of [35, 40, 45, 50, 70, 80, 90]) {
      const m = defaultMinutes('ppp', total);
      expect(m.reduce((a, b) => a + b, 0)).toBe(total);
      expect(Math.min(...m)).toBeGreaterThanOrEqual(1);
    }
    expect(rescale([5, 15, 15, 20, 5], 30).reduce((a, b) => a + b)).toBe(30);
  });
  it('reports timing problems', () => {
    const st = FRAMEWORKS.ppp.stages.map((s) => ({ key: s.key, title: s.title, minutes: s.share60 }));
    expect(checkTiming(st, 60)).toEqual([]);
    expect(checkTiming(st, 30)[0].message).toContain('over by 30');
    expect(checkTiming(st.map((s) => (s.key === 'presentation' ? { ...s, minutes: 40 } : s)), 60).some((i) => i.message.includes('more than half'))).toBe(true);
  });
  it('computes end time', () => {
    expect(endTime('09:10', 60)).toBe('10:10');
    expect(endTime('11:45', 30)).toBe('12:15');
    expect(endTime('bad', 30)).toBe('');
  });
});

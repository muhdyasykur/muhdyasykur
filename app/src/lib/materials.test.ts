import { describe, it, expect } from 'vitest';
import { gapFill, matching, strips, tiered, splitList, splitSentences, toolLinks, canvaPrompt } from './materials';
import type { Lesson } from './lesson/model';

describe('materials studio', () => {
  it('splits word lists and sentences', () => {
    expect(splitList('healthy, junk food;\nbrush teeth')).toEqual(['healthy', 'junk food', 'brush teeth']);
    expect(splitSentences('You should eat fruit. You shouldn\'t sleep late.\nI like it')).toEqual(['You should eat fruit.', "You shouldn't sleep late.", 'I like it']);
  });
  it('blanks the key word in each sentence', () => {
    const g = gapFill(['You should eat vegetables every day.', 'Brush your teeth twice a day.'], ['vegetables', 'teeth']);
    expect(g[0]).toEqual({ text: 'You should eat __________ every day.', answer: 'vegetables' });
    expect(g[1].answer).toBe('teeth');
    expect(gapFill(['Children need enough sleep.'], [])[0].answer).toBe('Children');
  });
  it('shuffles matching and strips reproducibly, never leaving strips in order', () => {
    const w = ['apple', 'banana', 'carrot', 'durian'];
    expect(matching(w, 3)).toEqual(matching(w, 3));
    expect(matching(w, 3).right.sort()).toEqual([...w].sort());
    const s = ['First.', 'Second.', 'Third.'];
    for (let i = 0; i < 20; i++) expect(strips(s, i)).not.toEqual(s);
  });
  it('makes three levels of one worksheet', () => {
    const t = tiered(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 'I should ___ because ___.');
    expect(t.low.items).toHaveLength(4); expect(t.low.bank).toBe(true);
    expect(t.mod.items).toHaveLength(6); expect(t.high.frame).toBe('');
  });
  it('builds tool links and a Canva AI prompt from the lesson', () => {
    const l = { topic: "What's the Matter?", vocabulary: 'healthy, junk food', focus: 'should', mainSkill: 'Writing', curriculum: { year: 4 } } as unknown as Lesson;
    const links = toolLinks(l);
    expect(links.find((x) => x.name === 'YouTube')!.url).toContain('search_query=What');
    expect(links.every((x) => x.url.startsWith('https://'))).toBe(true);
    const p = canvaPrompt(l, 'worksheet', 'low');
    expect(p).toContain('Year 4'); expect(p).toContain('healthy, junk food'); expect(p).toContain('word bank');
  });
});

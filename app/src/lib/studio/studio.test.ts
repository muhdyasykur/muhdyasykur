import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { TOOLS, CATS } from './catalogue';
import { DEFS, buildPrompt, refinePrompt, startValues, missingFields, chipsFor } from './tools';
import { quizItems, wordsFrom, parsePlan } from './parse';
import { lessonFromPlan } from './lessonplan';
import { parseMarkdown } from './markdown';
import { ICON_NAMES } from '../ui/icons';
import type { Standards } from '../curriculum/types';

const CTX = { year: 4, topic: 'Where are you from?', words: 'Malaysia, Japan', sentence: 'He is from …', skill: 'Speaking', objectives: '' };

describe('Studio catalogue', () => {
  it('has unique tools with real icons and categories, and a definition for every AI tool', () => {
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length);
    for (const t of TOOLS) {
      expect(ICON_NAMES, t.id).toContain(t.icon);
      expect(CATS.map((c) => c.id), t.id).toContain(t.cat);
      expect(!!DEFS.find((d) => d.id === t.id), t.id).toBe(t.ai);
    }
    expect(DEFS.length).toBe(TOOLS.filter((t) => t.ai).length);
    expect(DEFS.length).toBeGreaterThanOrEqual(24);
  });
  it('every example fills the required fields and makes a complete prompt', () => {
    for (const d of DEFS) {
      const v = { ...startValues(d, CTX), ...d.example };
      expect(missingFields(d, v).map((f) => f.id), d.id).toEqual([]);
      const p = buildPrompt(d, v);
      expect(p, d.id).not.toMatch(/undefined|null|\[object/);
      expect(p, d.id).toContain('Malaysian primary school');
      expect(p, d.id).toContain('Markdown');
      if (d.fields.some((f) => f.kind === 'year')) expect(p, d.id).toMatch(/Year [1-6] \(about \d+ years old, CEFR [^)]+\)/);
      expect(p.length, d.id).toBeLessThan(5000);
      expect(chipsFor(d).length, d.id).toBeGreaterThanOrEqual(3);
    }
  });
  it('fills fields from the lesson bar, and asks for the whole new version when changing a result', () => {
    const quiz = DEFS.find((d) => d.id === 'quiz')!;
    expect(startValues(quiz, CTX)).toMatchObject({ year: '4', topic: 'Where are you from?', count: '8', qtype: 'Multiple choice' });
    const r = refinePrompt(quiz, startValues(quiz, CTX), '## Quiz\n1. Q?\nAnswer: A', 'Make it shorter');
    expect(r).toContain('This is the current version:');
    expect(r).toContain('Change it: Make it shorter');
    const ask = DEFS.find((d) => d.id === 'ask')!;
    expect(startValues(ask, CTX, 'ms').lang).toBe('Bahasa Melayu');
    expect(refinePrompt(ask, { question: 'Q', lang: 'English' }, 'A', 'And for Year 1?')).toContain("The teacher's follow-up: And for Year 1?");
  });
  it('only sends what was typed: the prompt carries no other data', () => {
    const fb = DEFS.find((d) => d.id === 'feedback')!;
    const p = buildPrompt(fb, { year: '4', task: '', writing: 'I go to school yesterday.', lang: 'In English', extra: '' });
    expect(p).toContain('I go to school yesterday.');
    expect(p).not.toMatch(/Aina|4 Bestari|class list/);
  });
});

describe('Studio results become games and lesson plans', () => {
  it('reads quiz questions with options and answers, and riddles', () => {
    const md = '## Quiz: Countries\n\n1. Where is Kenji from?\n   A) Japan\n   B) India\n   C) Thailand\n   Answer: A\n\n**2.** Is Priya from India?\nAnswer: Yes, she is.\n\n3. What do you call a sleeping bull?\n**Answer:** A bulldozer!';
    expect(quizItems(md)).toEqual([
      { q: 'Where is Kenji from?  A) Japan   B) India   C) Thailand', a: 'A) Japan' },
      { q: 'Is Priya from India?', a: 'Yes, she is.' },
      { q: 'What do you call a sleeping bull?', a: 'A bulldozer!' }
    ]);
  });
  it('takes spin-wheel words from the first table column, else from short list items', () => {
    expect(wordsFrom(parseMarkdown('| Word | Meaning |\n|---|---|\n| **kitchen** | where we cook |\n| garden | plants grow |'))).toEqual(['kitchen', 'garden']);
    expect(wordsFrom(parseMarkdown('- ship\n- shop\n- this is a long sentence about fish'))).toEqual(['ship', 'shop']);
  });
  it('turns a written lesson plan into a Consilia lesson, keeping only real KSSR standards', () => {
    const std = JSON.parse(fs.readFileSync('public/curriculum/kssr2017/standards-y4.json', 'utf8')) as Standards;
    const md = [
      '## Lesson overview', 'Friends Around the World', 'Pupils ask and answer about countries.',
      '## Learning standards', '- 2.1.5 Describe people and objects using suitable statements', '- 9.9.9 Made up', '- 1.2.5 Understand longer simple texts',
      '## Learning objectives', '- By the end of the lesson, pupils will be able to ask and answer about 4 countries correctly.', '- By the end of the lesson, pupils will be able to listen and match 5 people to their countries.',
      '## Success criteria', '- I can say where someone is from.', '- I can ask "Where is he from?"',
      '## Key vocabulary and target language', 'Malaysia, Japan, India, Thailand', 'Target sentence: Where is she from? She is from …',
      '## Teaching aids', '- World map', '- Flag cards',
      '## Pre-lesson (5 minutes)', '- Teacher: shows mystery flags.', '- Pupils: guess the countries.', '- Teaching aids: flag cards',
      '## Presentation (15 minutes)', '- Teacher: models the question.', '- Pupils: repeat.',
      '## Practice (15 minutes)', '- Teacher: gives role cards.', '- Pupils: ask and answer in pairs.',
      '## Production (20 minutes)', '- Teacher: sets up a "passport" interview.', '- Pupils: interview five friends.',
      '## Post-lesson (5 minutes)', '- Teacher: exit ticket.', '- Pupils: write one sentence.',
      '## Differentiation', '- Low: sentence frames', '- Moderate: role cards', '- High: add a reason',
      '## Assessment', 'Observation checklist during the interviews.',
      '## Cross-curricular elements and 21st-century skills', '- Cross-curricular elements: Global sustainability', '- 21st-century skills: Communication, Collaboration'
    ].join('\n');
    const p = parsePlan(md);
    expect(p.codes).toEqual(['2.1.5', '9.9.9', '1.2.5']);
    expect(p.stages.production?.minutes).toBe(20);
    const l = lessonFromPlan(p, { year: 4, school: 'SK', minutes: 60, skill: 'Speaking', topic: 'Where are you from?', words: '', sentence: '' }, std);
    expect(l.topic).toBe('Friends Around the World');
    expect(l.framework).toBe('ppp');
    expect(l.standards.main.ls[0].code).toBe('2.1.5');
    expect(l.standards.main.cs[0].code).toBe('2.1');
    expect(l.standards.comp.ls[0].code).toBe('1.2.5'); // the invented 9.9.9 is dropped
    expect(l.objectives.map((o) => o.free)).toEqual(['By the end of the lesson, pupils will be able to ask and answer about 4 countries correctly.', 'By the end of the lesson, pupils will be able to listen and match 5 people to their countries.']);
    expect(l.successCriteria).toHaveLength(2);
    expect(l.stages.map((s) => [s.key, s.minutes])).toEqual([['pre-lesson', 5], ['presentation', 15], ['practice', 15], ['production', 20], ['post-lesson', 5]]);
    expect(l.stages[0].activities[0]).toMatchObject({ teacher: 'shows mystery flags.', pupils: 'guess the countries.', aids: 'flag cards' });
    expect(l.stages[3].activities[0].tiers).toEqual({ low: 'sentence frames', mod: 'role cards', high: 'add a reason' });
    expect(l.vocabulary).toBe('Malaysia, Japan, India, Thailand');
    expect(l.sentence).toBe('Where is she from? She is from …');
    expect(l.aids).toBe('World map, Flag cards');
    expect(l.cce).toBe('Global sustainability');
    expect(l.skills21).toBe('Communication, Collaboration');
  });
});

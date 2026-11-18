import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { DEFS, buildPrompt, refinePrompt, startValues, defOf, groundable, LEVEL } from './tools';
import { checkResult, fixAll, MAX_WORDS, type Check } from './quality';
import { sowBrief } from './grounding';
import { lessonFromPlan } from './lessonplan';
import { parsePlan } from './parse';
import type { SowFile, Standards } from '../curriculum/types';

const ANSWERS = JSON.parse(fs.readFileSync('scripts/fixtures/studio-answers.json', 'utf8')) as Record<string, string>;
const CTX = { year: 4, topic: '', words: '', sentence: '', skill: 'Speaking', objectives: '' };
const std = (y: number) => JSON.parse(fs.readFileSync(`public/curriculum/kssr2017/standards-y${y}.json`, 'utf8')) as Standards;
const sow4 = JSON.parse(fs.readFileSync('public/curriculum/kssr2017/sow-y4-sk.json', 'utf8')) as SowFile;
const valuesOf = (id: string, extra: Record<string, string> = {}) => { const d = defOf(id)!; return { ...startValues(d, CTX), ...d.example, ...extra }; };
const fixes = (c: Check[]) => c.filter((x) => x.state === 'fix').map((x) => x.id);
const byId = (c: Check[], id: string) => c.find((x) => x.id === id);
const withYear = (id: string) => ({ yearCodes: std(Number(valuesOf(id).year) || 4).ls.map((x) => x.code) });

describe('Quality checks', () => {
  it('pass a good answer from every tool, with nothing to fix', () => {
    expect(Object.keys(ANSWERS).sort()).toEqual(DEFS.map((d) => d.id).sort());
    for (const d of DEFS) {
      const checks = checkResult(d.id, ANSWERS[d.id], valuesOf(d.id), d.id === 'lesson-plan' ? withYear(d.id) : {});
      expect(fixes(checks), `${d.id}: ${checks.filter((c) => c.state === 'fix').map((c) => c.text).join(' | ')}`).toEqual([]);
      expect(checks.length, d.id).toBeGreaterThanOrEqual(2);
    }
  });
  it('find what is wrong in a lesson plan, with a fix the AI can follow', () => {
    const bad = ANSWERS['lesson-plan']
      .replace('## Production (20 minutes)', '## Production (15 minutes)')
      .replace('will be able to ask and answer at least four questions about where people are from correctly', 'will be able to understand countries')
      .replace('- I can say where a friend is from.', '- Pupils say where a friend is from.')
      .replace(/## Reflection prompts[\s\S]*$/, '')
      .replace('- Pupils: interview five friends and fill in their passports.', '- Interview five friends.')
      .replace('1.2.4', '7.7.7');
    const c = checkResult('lesson-plan', bad, valuesOf('lesson-plan'), withYear('lesson-plan'));
    expect(fixes(c).sort()).toEqual(['criteria', 'minutes', 'objectives', 'roles', 'sections', 'standards']);
    expect(byId(c, 'minutes')!.text).toBe('The stages add up to 55 minutes, not 60');
    expect(byId(c, 'minutes')!.fix).toContain('exactly 60 minutes');
    expect(byId(c, 'objectives')!.text).toContain('understand');
    expect(byId(c, 'sections')!.text).toBe('Missing sections: Reflection prompts');
    expect(byId(c, 'roles')!.text).toContain('Production');
    expect(byId(c, 'standards')!.text).toBe('Not Year 4 learning standards: 7.7.7');
    // one instruction for all of them
    const all = fixAll(c);
    expect(all).toMatch(/^Make all of these changes: \(1\) .+\(6\) /);
  });
  it('compare a plan with the Scheme of Work lesson it is based on', () => {
    const c = checkResult('lesson-plan', ANSWERS['lesson-plan'], valuesOf('lesson-plan'), { sowCodes: ['2.1.5', '1.2.5'] });
    expect(byId(c, 'standards')).toMatchObject({ state: 'fix', text: 'The learning standards do not match the Scheme of Work lesson (missing 1.2.5)' });
    expect(byId(c, 'standards')!.fix).toContain('2.1.5, 1.2.5');
    expect(byId(checkResult('lesson-plan', ANSWERS['lesson-plan'], valuesOf('lesson-plan'), { sowCodes: ['2.1.5', '1.2.4'] }), 'standards')!.state).toBe('ok');
    expect(byId(checkResult('lesson-plan', ANSWERS['lesson-plan'].replace(/\d\.\d\.\d/g, 'TBC'), valuesOf('lesson-plan')), 'standards')!.state).toBe('note');
  });
  it('count quiz questions, answers and options', () => {
    const md = ANSWERS.quiz;
    const seven = md.replace(/\n\n8\.[\s\S]*$/, '');
    expect(byId(checkResult('quiz', seven, valuesOf('quiz')), 'count')!.text).toBe('Questions: 7 instead of 8');
    const noAnswer = md.replace('Answer: B) Kuala Lumpur', '');
    expect(byId(checkResult('quiz', noAnswer, valuesOf('quiz')), 'answers')!.text).toBe('Questions without an "Answer:" line: 1');
    const twoOptions = md.replace('C) Jakarta\n', '').replace('Answer: A) Indonesia', 'Answer: D) Laos');
    expect(byId(checkResult('quiz', twoOptions, valuesOf('quiz')), 'options')!.text).toBe('Questions that need three or four options and a matching answer: 2');
    // options on one line, and answers written as the option itself, still count
    const inline = '## Quiz\n' + Array.from({ length: 8 }, (_, i) => `${i + 1}. Which one is a fruit?\nA) rambutan B) chair C) shoe\nAnswer: rambutan`).join('\n');
    expect(fixes(checkResult('quiz', inline, valuesOf('quiz')))).toEqual([]);
    const tf = '## True or false\n' + Array.from({ length: 8 }, (_, i) => `${i + 1}. Kuala Lumpur is in Malaysia.\nAnswer: ${i === 3 ? 'Maybe' : 'True'}`).join('\n');
    expect(byId(checkResult('quiz', tf, valuesOf('quiz', { qtype: 'True or false' })), 'options')!.text).toBe('Answers that are not True or False: 1');
  });
  it('check that pupils\' texts suit their year', () => {
    const long = '## A Day at the Zoo\n\n' + 'Yesterday my whole family and all of our cousins from Johor went together to the big national zoo near Kuala Lumpur to look at the animals. '.repeat(6) + '\n\n## Word help\n| Word | Meaning |\n|---|---|\n| zoo | a park with animals |\n\n## Questions\n1. Where did they go?\nAnswer: The zoo.';
    const c = checkResult('text', long, valuesOf('text', { year: '2' }));
    expect(byId(c, 'level')).toMatchObject({ state: 'fix' });
    expect(byId(c, 'level')!.text).toMatch(/^Sentences are long for Year 2: 2\d(\.\d)? words on average \(aim for 7 or fewer\)$/);
    expect(byId(c, 'level')!.fix).toContain(LEVEL[2]);
    expect(byId(checkResult('text', ANSWERS.text, valuesOf('text')), 'level')!.state).toBe('ok');
    expect(MAX_WORDS[1]).toBeLessThan(MAX_WORDS[6]);
    // the text's own length against what was asked
    expect(byId(checkResult('text', ANSWERS.text, valuesOf('text', { length: 'Long' })), 'length')!.text).toMatch(/^The text is \d+ words; about 140 were asked$/);
  });
  it('catch American spelling, and remind the teacher to fill in blanks', () => {
    const c = checkResult('connections', ANSWERS.connections.replace('Pupils can save', 'My favorite color is blue. Pupils can save'), valuesOf('connections'));
    expect(byId(c, 'spelling')).toMatchObject({ state: 'fix', text: 'American spelling: favorite → favourite, color → colour' });
    expect(byId(c, 'spelling')!.fix).toBe('Use British English spelling and words: "favourite" instead of "favorite", "colour" instead of "color".');
    expect(byId(checkResult('email', ANSWERS.email, valuesOf('email')), 'blanks')).toMatchObject({ state: 'note', text: 'Fill in before you use it: [Mentor\'s name], [Your name]' });
  });
  it('check tool by tool: phonics words, rubric columns, dialogue speakers, story parts, messages', () => {
    const ph = checkResult('phonics', ANSWERS.phonics.replace('| push |', '| cat |'), valuesOf('phonics'));
    expect(byId(ph, 'pattern')!.text).toBe('Without "sh": cat');
    expect(byId(checkResult('phonics', ANSWERS.phonics, valuesOf('phonics', { sound: 'the short a in cat' })), 'pattern')).toBeUndefined();
    const rb = checkResult('rubric', ANSWERS.rubric.replace(' TP6 |', ' |').replace(/\| Postcard format[^\n]*\n/, ''), valuesOf('rubric'));
    expect(fixes(rb)).toEqual(expect.arrayContaining(['tp', 'rows']));
    const dl = checkResult('dialogue', ANSWERS.dialogue, valuesOf('dialogue', { speakers: '3' }));
    expect(byId(dl, 'speakers')!.text).toBe('Speakers: 2 instead of 3');
    expect(byId(dl, 'target')!.state).toBe('ok');
    const st = checkResult('story', ANSWERS.story.replace(/## Path B\n[^\n]+/, '## Path B\nThey went home.'), valuesOf('story'));
    expect(byId(st, 'lengths')!.text).toBe('Too long or too short: Path B (3)');
    const wa = checkResult('parents', ANSWERS.parents + '\n\n' + 'Please remember to bring the costume on Friday. '.repeat(20), valuesOf('parents'));
    expect(fixes(wa)).toContain('length');
    expect(fixes(checkResult('parents', ANSWERS.parents.replace(/, (English teacher|Guru Bahasa Inggeris)/g, ''), valuesOf('parents')))).toContain('sign');
    expect(byId(checkResult('vocab', ANSWERS.vocab.replace(/\| garden[^\n]*\n?/, ''), valuesOf('vocab')), 'rows')!.text).toBe('Words missing from the list: garden');
    expect(fixes(checkResult('hook', ANSWERS.hook.replace(/## 5\.[\s\S]*$/, ''), valuesOf('hook')))).toEqual(['ideas']);
    expect(fixes(checkResult('reflection', ANSWERS.reflection.replace(/\b(?:I|me)\b/g, 'the teacher').replace(/\bmy\b/g, 'the'), valuesOf('reflection')))).toEqual(['voice']);
    expect(checkResult('ask', 'Sorry, I cannot help.', valuesOf('ask'))).toEqual([expect.objectContaining({ id: 'complete', state: 'fix' })]);
  });
});

describe('Grounding in the KSSR Scheme of Work', () => {
  const l2 = sow4.lessons.find((l) => l.no === 2)!;
  it('gives the AI the real standards, theme, textbook pages and steps', () => {
    const b = sowBrief(l2, std(4), 4, 'SK');
    expect(b).toContain('Year 4 SK, lesson 2');
    expect(b).toContain('Topic: Where are you from?');
    expect(b).toContain('Main learning standard: 2.1.5');
    expect(b).toContain('Complementary learning standard: 1.2.4');
    expect(b).toContain('Student’s Book page 5');
    expect(b).toMatch(/The SoW suggests these steps: \(1\) /);
    expect(b.length).toBeLessThan(2600);
  });
  it('puts the facts and the year\'s level into the prompt, and keeps them when changing a result', () => {
    const d = defOf('lesson-plan')!;
    const g = sowBrief(l2, std(4), 4, 'SK');
    const p = buildPrompt(d, valuesOf('lesson-plan'), g);
    expect(p).toContain(g);
    expect(p).toContain('give exactly the standards in the curriculum facts above');
    expect(refinePrompt(d, valuesOf('lesson-plan'), '## Lesson overview', 'Make it shorter', g)).toContain(g);
    expect(buildPrompt(d, valuesOf('lesson-plan'))).not.toContain('Curriculum facts');
    const text = defOf('text')!;
    expect(buildPrompt(text, valuesOf('text', { year: '2' }))).toContain(LEVEL[2]);
    expect(buildPrompt(d, valuesOf('lesson-plan'))).not.toContain('Pitch it at'); // the teacher's plan is not for pupils
    expect(DEFS.filter(groundable).map((x) => x.id)).not.toContain('feedback');
    expect(DEFS.filter(groundable).length).toBeGreaterThanOrEqual(17);
  });
  it('makes a lesson plan with the Scheme of Work lesson\'s own standards and topic', () => {
    const s = std(4);
    const l = lessonFromPlan(parsePlan(ANSWERS['lesson-plan'].replace('2.1.5', '3.1.1')), { year: 4, school: 'SK', minutes: 60, skill: 'Speaking', topic: '', words: '', sentence: '', sow: l2 }, s);
    expect(l.mode).toBe('sow-standards');
    expect(l.curriculum.sowLesson).toBe(2);
    expect(l.standards.main.ls.map((x) => x.code)).toEqual(['2.1.5']);
    expect(l.standards.comp.ls.map((x) => x.code)).toEqual(['1.2.4']);
    expect(l.topic).toBe('Where are you from?');
    expect(l.theme).toBe(l2.theme);
    expect(l.stages.find((x) => x.key === 'production')!.minutes).toBe(20);
  });
});

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildLesson } from '../lesson/create';
import type { SowFile, Standards } from '../curriculum/types';
import { planLesson, applyPlan, briefFrom } from '../recommend/engine';
import { buildDeck, mergeAi, pupilSteps } from './deck';

const dir = new URL('../../../public/curriculum/kssr2017/', import.meta.url);
function lesson(y = 4, no = 12) {
  const sow = JSON.parse(readFileSync(new URL(`sow-y${y}-sk.json`, dir), 'utf8')) as SowFile;
  const std = JSON.parse(readFileSync(new URL(`standards-y${y}.json`, dir), 'utf8')) as Standards;
  const s = sow.lessons.find((l) => l.no === no)!;
  const base = buildLesson({ mode: 'recommend', year: y, school: 'SK', sow: s, date: '2026-11-16', start: '09:10', durationMin: 60, pupils: 30 }, std);
  const b = briefFrom(base, { words: ['apple', 'banana', 'mango', 'durian', 'papaya'], sentence: 'I like …' });
  return applyPlan(base, planLesson({ level: 'mixed', traits: [], projector: true, speakers: true, internet: false, devices: 'teacher' }, b, { seed: 3 }), b);
}

describe('lesson slides', () => {
  it('turns pupil-facing teacher wording into short steps', () => {
    expect(pupilSteps('Pupils walk around the class. They ask three friends; then they write the answers.')).toEqual(['Walk around the class', 'Ask three friends', 'Then you write the answers']);
  });
  it('builds a full deck in lesson order with notes on every slide', () => {
    const l = lesson();
    const d = buildDeck(l);
    const kinds = d.slides.map((s) => s.kind);
    expect(kinds[0]).toBe('title');
    expect(kinds.at(-1)).toBe('end');
    for (const k of ['goals', 'warmup', 'words', 'pattern', 'activity', 'question', 'criteria', 'exit'] as const) expect(kinds, k).toContain(k);
    expect(d.slides.every((s) => s.notes.length > 0 && s.title)).toBe(true);
    expect(d.slides.find((s) => s.kind === 'pattern')!.lines).toContain('I like apple.');
    expect(d.slides.find((s) => s.kind === 'question')!.answer).toMatch(/^I like (durian|papaya)\.$/);
    expect(d.slides.length).toBeGreaterThanOrEqual(10);
    expect(new Set(d.slides.map((s) => s.id)).size).toBe(d.slides.length);
  });
  it('makes no examples or questions from a sentence without a blank', () => {
    const l = lesson(); l.sentence = 'Good morning, teacher.';
    const d = buildDeck(l);
    expect(d.slides.find((s) => s.kind === 'pattern')!.lines).toEqual(['Good morning, teacher.']);
    expect(d.slides.some((s) => s.kind === 'question')).toBe(false);
  });
  it('keeps the SoW teacher steps in the notes, not on the pupils\' slides', () => {
    const sow = JSON.parse(readFileSync(new URL('sow-y4-sk.json', dir), 'utf8')) as SowFile;
    const std = JSON.parse(readFileSync(new URL('standards-y4.json', dir), 'utf8')) as Standards;
    const l = buildLesson({ mode: 'follow-sow', year: 4, school: 'SK', sow: sow.lessons.find((x) => x.no === 12)!, date: '2026-11-16', start: '09:10', durationMin: 60, pupils: 30 }, std);
    const d = buildDeck(l);
    const all = d.slides.flatMap((s) => s.lines).join(' ');
    expect(all).not.toMatch(/Teacher.s Book/);
    expect(d.slides.filter((s) => s.kind === 'activity').map((s) => s.title)).toEqual(['Presentation', 'Practice', 'Production']);
    expect(d.slides.find((s) => s.title === 'Presentation')!.notes).toMatch(/Teacher.s Book/);
  });
  it('works for every SoW lesson of a year without errors', () => {
    for (const no of [1, 5, 20, 40, 60]) expect(buildDeck(lesson(3, no)).slides.length).toBeGreaterThan(5);
  });
  it('merges AI content in the right places, and replaces it on a second merge', () => {
    const d = buildDeck(lesson());
    const ai = { text: { title: 'At the market', body: 'Ali goes to the market.\nHe buys a mango.' }, dialogue: ['A: What do you like?', 'B: I like mangoes.'], questions: [{ q: 'What does Ali buy?', a: 'A mango.' }], vocabulary: [{ word: 'mango', meaning: 'a sweet yellow fruit' }] };
    const m = mergeAi(d, ai);
    const k = m.slides.map((s) => s.kind);
    expect(k.indexOf('text')).toBeGreaterThan(k.indexOf('pattern'));
    expect(k.indexOf('dialogue')).toBe(k.indexOf('text') + 1);
    expect(m.slides.filter((s) => s.ai).length).toBe(4);
    expect(mergeAi(m, ai).slides.length).toBe(m.slides.length);
    expect(m.aiAt).toBeTruthy();
  });
});

describe('PowerPoint export', () => {
  it('writes one slide per deck slide, with the teacher notes', async () => {
    const { buildPptx, slideFileName } = await import('./pptx');
    const JSZip = (await import('jszip')).default;
    const d = buildDeck(lesson());
    const buf = await (await buildPptx(d, { title: 'Where are you from?' })).write({ outputType: 'nodebuffer' });
    const zip = await JSZip.loadAsync(buf as Buffer);
    const slides = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f));
    expect(slides.length).toBe(d.slides.length + d.slides.filter((x) => x.answer).length); // + answer reveal slides
    const s1 = await zip.file('ppt/slides/slide1.xml')!.async('string');
    expect(s1).toContain('Where are you from?');
    const notes = await Promise.all(Object.keys(zip.files).filter((f) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(f)).map((f) => zip.file(f)!.async('string')));
    expect(notes.join(' ')).toContain('Say each word; pupils repeat.');
    expect(slideFileName('Where are you from?', '2026-11-16')).toBe('Slides-Where-are-you-from-2026-11-16.pptx');
  });
});

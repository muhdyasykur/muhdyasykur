import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { findRefs, lessonRefs, unitIndex } from './refs';
import { recognise, guessSlot, slotsForYear } from './books';
import type { SowFile } from '../curriculum/types';

const dir = new URL('../../../public/curriculum/kssr2017/', import.meta.url);
const sow = (f: string): SowFile => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));

describe('textbook page references', () => {
  it('reads the common SoW wordings', () => {
    expect(findRefs("Get Smart Plus 4 Activity 1 Student’s Book and Teacher’s Book (page 18)").map((r) => r.label)).toEqual(["Teacher's Book p. 18"]);
    expect(findRefs('English Plus 1 Student’s Book Activities 1, 2 and 3 p.56 Teacher’s Book p.70').map((r) => r.label)).toEqual(["Student's Book p. 56", "Teacher's Book p. 70"]);
    expect(findRefs('Superminds 1 p.58').map((r) => r.label)).toEqual(["Student's Book p. 58"]);
    expect(findRefs('Workbook pages 12-13').map((r) => r.label)).toEqual(['Workbook p. 12–13']);
  });
  it('finds references in most Year 3–6 textbook lessons', () => {
    for (const f of ['sow-y3-sk.json', 'sow-y4-sk.json', 'sow-y5-sk.json', 'sow-y6-sk.json']) {
      const tb = sow(f).lessons.filter((l) => l.kind === 'textbook');
      const withRefs = tb.filter((l) => lessonRefs(l).length).length;
      expect(withRefs / tb.length, f).toBeGreaterThan(0.75);
    }
  });
  it('indexes where each unit starts', () => {
    const idx = unitIndex(sow('sow-y4-sk.json').lessons);
    const u1 = idx.find((u) => u.unit === 'Unit 1')!;
    expect(u1.topic).toBe('Where are you from?');
    expect(u1.sb).toBe(5);
    expect(idx.find((u) => u.unit === 'Unit 10')!.sb).toBe(103);
  });
});
describe('book catalogue', () => {
  it('recognises the editions checked by hand', () => {
    expect(recognise(177, 48681330)?.slot).toBe('getsmartplus4-sb');
    expect(recognise(177, 1)).toBeNull();
  });
  it('guesses the slot from common file names', () => {
    expect(guessSlot('Y4- GET SMART PLUS4.pdf')).toBe('getsmartplus4-sb');
    expect(guessSlot('Year 3 Get Smart Plus 3 Teacher\'s book.pdf')).toBe('getsmartplus3-tb');
    expect(guessSlot('BUKU TEKS ENGLISH YEAR 1 & 2 (SUPERMINDS).pdf')).toBe('superminds1-sb');
    expect(guessSlot('ENGLISH Y6-Academy Stars.pdf')).toBe('academystarsyear6-sb');
    expect(guessSlot('notes.pdf')).toBeNull();
  });
  it('every year has a Student\'s Book slot', () => {
    for (let y = 1; y <= 6; y++) expect(slotsForYear(y).some((s) => s.kind === 'SB')).toBe(true);
  });
});

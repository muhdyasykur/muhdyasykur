import { describe, it, expect } from 'vitest';
import { suggestedPages, lessonPages, textbookLine, singlePages, validPage, pageRange } from './lesson';

const base = (materials: string, extra: object = {}) => ({
  sowNotes: { materials, differentiation: '', note: '' }, aids: '', curriculum: { year: 4 } as never,
  stages: [{ activities: [{ teacher: 'Pupils do Workbook p. 40.' }] }] as never, ...extra
});

describe('textbook in the lesson plan', () => {
  it('takes the pages from the Scheme of Work and the activities', () => {
    expect(suggestedPages(base("Student's Book pages 56-57; Teacher's Book p. 18"))).toEqual([
      { kind: 'SB', page: 56, to: 57 }, { kind: 'TB', page: 18 }, { kind: 'WB', page: 40 }]);
  });
  it('prints one line per book with the book title for the year', () => {
    expect(textbookLine(base("Student's Book pages 56-57; Student's Book p. 60"))).toBe(
      "Get Smart Plus 4 · Student's Book p. 56–57, p. 60; Get Smart Plus 4 · Workbook p. 40");
  });
  it("uses the teacher's own pages once they change them, even none", () => {
    const l = base("Student's Book p. 56", { textbook: { pages: [{ kind: 'SB', page: 70 }], pictures: true } });
    expect(lessonPages(l)).toEqual([{ kind: 'SB', page: 70 }]);
    expect(textbookLine(base('x', { textbook: { pages: [], pictures: false } }))).toBe('');
  });
  it('opens ranges into single pages for pictures, without repeats, up to a limit', () => {
    expect(singlePages([{ kind: 'SB', page: 56, to: 58 }, { kind: 'SB', page: 57 }, { kind: 'WB', page: 40 }])).toEqual([
      { kind: 'SB', page: 56 }, { kind: 'SB', page: 57 }, { kind: 'SB', page: 58 }, { kind: 'WB', page: 40 }]);
    expect(singlePages([{ kind: 'SB', page: 1, to: 20 }], 8)).toHaveLength(8);
  });
  it('checks page entries from shared files', () => {
    expect(validPage({ kind: 'SB', page: 5 })).toBe(true);
    expect(validPage({ kind: 'SB', page: 5, to: 4 })).toBe(false);
    expect(validPage({ kind: 'XX', page: 5 })).toBe(false);
    expect(validPage({ kind: 'WB', page: 0 })).toBe(false);
    expect(pageRange({ kind: 'SB', page: 5, to: 5 })).toBe('p. 5');
  });
});

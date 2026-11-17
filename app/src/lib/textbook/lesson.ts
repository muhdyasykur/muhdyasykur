import type { Lesson } from '../lesson/model';
import { findRefs } from './refs';
import { slotFor, KIND_NAME, type BookKind } from './books';

/**
 * The textbook pages a lesson uses, kept with the lesson plan and printed on it ("Textbook: Get Smart Plus 4 ·
 * Student's Book p. 56–57"). Until the teacher changes them they come from the page references in the Scheme of
 * Work notes and the activities, so lessons made before this existed show their pages too.
 */
export interface TextbookPage { kind: BookKind; page: number; to?: number }
export interface LessonTextbook { pages: TextbookPage[]; pictures: boolean }
type L = Pick<Lesson, 'sowNotes' | 'aids' | 'stages' | 'curriculum' | 'textbook'>;

export function suggestedPages(l: L): TextbookPage[] {
  const text = [l.sowNotes.materials, l.aids, ...l.stages.flatMap((s) => s.activities.map((a) => a.teacher))].join('\n');
  return findRefs(text).map(({ kind, page, to }) => (to ? { kind, page, to } : { kind, page }));
}
export const lessonPages = (l: L): TextbookPage[] => l.textbook?.pages ?? suggestedPages(l);
export const lessonTextbook = (l: L): LessonTextbook => l.textbook ?? { pages: suggestedPages(l), pictures: false };

export const pageRange = (p: TextbookPage) => `p. ${p.page}${p.to && p.to !== p.page ? `–${p.to}` : ''}`;
export const bookTitle = (year: number, kind: BookKind) => slotFor(year, kind)?.title ?? KIND_NAME[kind];
/** "Student's Book p. 56–57" (the book kind only, for short buttons). */
export const shortLabel = (p: TextbookPage) => `${KIND_NAME[p.kind]} ${pageRange(p)}`;

/** One line for the printed plan, grouped by book: "Get Smart Plus 4 · Student's Book p. 56–57, p. 60; … Workbook p. 40". */
export function textbookLine(l: L): string {
  const by = new Map<BookKind, string[]>();
  for (const p of lessonPages(l)) by.set(p.kind, [...(by.get(p.kind) ?? []), pageRange(p)]);
  return [...by].map(([k, ps]) => `${bookTitle(l.curriculum.year, k)} ${ps.join(', ')}`).join('; ');
}

/** Every single page to print as a picture, ranges opened up, in order, without repeats; at most `max`. */
export function singlePages(pages: TextbookPage[], max = 8): { kind: BookKind; page: number }[] {
  const out: { kind: BookKind; page: number }[] = [];
  for (const p of pages) for (let n = p.page; n <= (p.to ?? p.page); n++) {
    if (!out.some((x) => x.kind === p.kind && x.page === n)) out.push({ kind: p.kind, page: n });
  }
  return out.slice(0, max);
}

/** Checks a page entry from a shared file or a form. */
export function validPage(p: unknown): p is TextbookPage {
  const x = p as TextbookPage;
  return !!x && ['SB', 'TB', 'WB', 'EXTRA'].includes(x.kind) && Number.isInteger(x.page) && x.page > 0 && x.page < 1000
    && (x.to === undefined || (Number.isInteger(x.to) && x.to >= x.page && x.to - x.page <= 20));
}

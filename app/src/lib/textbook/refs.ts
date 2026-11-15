import type { SowLesson } from '../curriculum/types';
import type { BookKind } from './books';

/** A textbook page named in a lesson, e.g. "Student's Book p.56" or "Teacher's Book (page 18)". */
export interface PageRef { kind: BookKind; page: number; to?: number; label: string }
const BOOK = String.raw`(Student[’']?s Book|Pupil[’']?s Book|Teacher[’']?s Book|Work ?book|Activity Book|Super ?Minds ?1?|Get Smart Plus ?\d?|English Plus ?1?|Academy Stars(?: Year 6)?|\bSB\b|\bTB\b|\bWB\b)`;
const PAGE = String.raw`(?:pages?|pp?\.)\s*(\d{1,3})(?:\s*(?:[-–]|and|&)\s*(\d{1,3}))?`;
// the page belongs to the nearest book named before it
const BOOK_NC = BOOK.replace(/^\(/, '(?:');
const RX = new RegExp(`${BOOK}(?:(?!${BOOK_NC})[^.;\\n]){0,45}?${PAGE}`, 'gi');
const KIND_OF = (b: string): BookKind => (/teacher|^tb$/i.test(b) ? 'TB' : /work|activity|^wb$/i.test(b) ? 'WB' : 'SB');

/** Find page references in any text; duplicates removed, order kept. */
export function findRefs(text: string): PageRef[] {
  const out: PageRef[] = [];
  for (const m of text.matchAll(RX)) {
    const kind = KIND_OF(m[1].trim());
    const page = Number(m[2]); const to = m[3] ? Number(m[3]) : undefined;
    if (!page || page > 400) continue;
    if (to !== undefined && (to < page || to - page > 12)) continue;
    const label = `${kind === 'SB' ? "Student's Book" : kind === 'TB' ? "Teacher's Book" : 'Workbook'} p. ${page}${to ? `–${to}` : ''}`;
    if (!out.some((r) => r.kind === kind && r.page === page && r.to === to)) out.push({ kind, page, to, label });
  }
  return out;
}
export function lessonRefs(l: Pick<SowLesson, 'materials' | 'outline'>): PageRef[] {
  return findRefs([l.materials, ...l.outline.pre, ...l.outline.delivery, ...l.outline.post].join('\n'));
}
export interface UnitIndex { unit: string; topic: string; sb: number | null; tb: number | null; lessons: number[] }
/**
 * Where each unit starts in the books, taken from the SoW's own page references: the first page cited by the
 * unit's first textbook lessons. Review pages cited much later in a unit are ignored.
 */
export function unitIndex(lessons: SowLesson[]): UnitIndex[] {
  const units = new Map<string, UnitIndex & { sbs: number[]; tbs: number[] }>();
  for (const l of lessons) {
    if (!l.unit) continue;
    const u = units.get(l.unit) ?? { unit: l.unit, topic: l.topic, sb: null, tb: null, lessons: [], sbs: [], tbs: [] };
    u.lessons.push(l.no);
    if (u.lessons.length <= 4) for (const r of lessonRefs(l)) (r.kind === 'SB' ? u.sbs : r.kind === 'TB' ? u.tbs : []).push(r.page);
    units.set(l.unit, u);
  }
  return [...units.values()].map(({ sbs, tbs, ...u }) => ({ ...u, sb: sbs.length ? Math.min(...sbs) : null, tb: tbs.length ? Math.min(...tbs) : null }));
}

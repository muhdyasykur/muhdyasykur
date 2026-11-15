/**
 * Textbook Shelf catalogue (blueprint F32). The app ships only this map: titles, page offsets and file
 * fingerprints. No textbook content is included; each teacher adds their own PDFs, which stay on the device.
 */
export type BookKind = 'SB' | 'TB' | 'WB' | 'EXTRA';
export interface Slot { id: string; years: number[]; kind: BookKind; title: string; series: string }
export interface Fingerprint { slot: string; pages: number; bytes: number; offset: number; note: string }

export const KIND_NAME: Record<BookKind, string> = { SB: "Student's Book", TB: "Teacher's Book", WB: 'Workbook', EXTRA: 'Extra resource' };
const series = (years: number[], name: string, sb = "Student's Book"): Slot[] => [
  { id: `${name.toLowerCase().replace(/\W+/g, '')}-sb`, years, kind: 'SB', title: `${name} · ${sb}`, series: name },
  { id: `${name.toLowerCase().replace(/\W+/g, '')}-tb`, years, kind: 'TB', title: `${name} · Teacher's Book`, series: name },
  { id: `${name.toLowerCase().replace(/\W+/g, '')}-wb`, years, kind: 'WB', title: `${name} · Workbook`, series: name }
];
/** Books named in the KSSR Scheme of Work, Years 1–6. */
export const SLOTS: Slot[] = [
  ...series([1, 2], 'Super Minds 1'),
  ...series([3], 'Get Smart Plus 3'),
  ...series([4], 'Get Smart Plus 4'),
  ...series([5], 'English Plus 1'),
  ...series([6], 'Academy Stars Year 6', "Pupil's Book"),
  { id: 'smartgrammar4-tb', years: [4], kind: 'EXTRA', title: "Smart Grammar 4 · Teacher's Book", series: 'Smart Grammar 4' }
];
/** Editions checked by hand: PDF page = printed page + offset. Unknown files are calibrated once by the teacher. */
export const KNOWN: Fingerprint[] = [
  { slot: 'superminds1-sb', pages: 135, bytes: 83882733, offset: 2, note: 'Cambridge, Student\'s Book 1 (scan)' },
  { slot: 'getsmartplus3-sb', pages: 136, bytes: 44423038, offset: 0, note: 'Get Smart Plus 3 (scan)' },
  { slot: 'getsmartplus3-tb', pages: 202, bytes: 88417280, offset: 1, note: 'Get Smart Plus 3 Teacher\'s Book (scan)' },
  { slot: 'getsmartplus4-sb', pages: 177, bytes: 48681330, offset: 0, note: 'Get Smart Plus 4 (scan)' },
  { slot: 'englishplus1-sb', pages: 122, bytes: 98951539, offset: 1, note: 'English Plus 1, 2nd ed., Year 5 (scan)' },
  { slot: 'academystarsyear6-sb', pages: 133, bytes: 66440498, offset: 0, note: 'Academy Stars Pupil\'s Book (scan)' },
  { slot: 'smartgrammar4-tb', pages: 106, bytes: 18129284, offset: 1, note: 'Smart Grammar 4 Teacher\'s Book' }
];
export function recognise(pages: number, bytes: number): Fingerprint | null {
  return KNOWN.find((k) => k.pages === pages && k.bytes === bytes) ?? null;
}
/** Guess the slot from a file name such as "Y4- GET SMART PLUS4.pdf" (used to preselect, never to decide). */
export function guessSlot(fileName: string): string | null {
  const n = fileName.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const tb = /teacher/.test(n), wb = /workbook|activitybook/.test(n);
  const k = tb ? 'tb' : wb ? 'wb' : 'sb';
  if (n.includes('grammar')) return 'smartgrammar4-tb';
  if (n.includes('superminds')) return `superminds1-${k}`;
  if (n.includes('getsmartplus3') || (n.includes('getsmartplus') && n.includes('y3'))) return `getsmartplus3-${k}`;
  if (n.includes('getsmartplus4') || (n.includes('getsmartplus') && n.includes('y4'))) return `getsmartplus4-${k}`;
  if (n.includes('englishplus')) return `englishplus1-${k}`;
  if (n.includes('academystars')) return `academystarsyear6-${k}`;
  return null;
}
export const slotsForYear = (y: number) => SLOTS.filter((s) => s.years.includes(y));
export const slotById = (id: string) => SLOTS.find((s) => s.id === id);
export function seriesForYear(y: number): string { return SLOTS.find((s) => s.years.includes(y) && s.kind === 'SB')!.series; }
/** The slot for a year and book kind, e.g. (4, 'TB') → "getsmartplus4-tb". */
export function slotFor(year: number, kind: BookKind): Slot | undefined {
  return SLOTS.find((s) => s.years.includes(year) && s.kind === kind);
}

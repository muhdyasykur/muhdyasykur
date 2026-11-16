/**
 * Yearly plans (RPT): extract the weeks from the school's own file, or build them from the Scheme of Work.
 * Works on rows of cells, whatever file they came from (Word, Excel, PDF, CSV). Milestone 9.
 */
import type { PlanWeek, YearPlan } from './db/schema';
export type { PlanWeek, YearPlan };

const MONTHS: Record<string, number> = {
  jan: 1, januari: 1, january: 1, feb: 2, februari: 2, february: 2, mac: 3, mar: 3, march: 3, apr: 4, april: 4, mei: 5, may: 5,
  jun: 6, june: 6, jul: 7, julai: 7, july: 7, ogos: 8, ogo: 8, aug: 8, august: 8, sep: 9, sept: 9, september: 9, okt: 10, oct: 10, oktober: 10, october: 10,
  nov: 11, november: 11, dis: 12, dec: 12, disember: 12, december: 12
};
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (y: number, m: number, d: number) => (m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${pad(m)}-${pad(d)}` : '');
const fixYear = (y: string | undefined, fallback: number) => (!y ? fallback : y.length === 2 ? 2000 + Number(y) : Number(y));
export function addDaysIso(date: string, n: number) { const [y, m, d] = date.split('-').map(Number); const t = new Date(y, m - 1, d + n); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; }

/** "2.1.2026 - 6.1.2026", "12/1 – 16/1", "12-16 Jan", "12 Januari - 16 Januari 2026", "29 Dis 2025 – 2 Jan 2026" → [start, end]. */
export function parseDateRange(text: string, calendarYear: number): [string, string] {
  const t = text.replace(/\s+/g, ' ').trim();
  let m = /(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\s*(?:-|–|—|to|hingga|sehingga|until)\s*(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/i.exec(t);
  if (m) {
    const y2 = fixYear(m[6], calendarYear), y1 = fixYear(m[3], Number(m[2]) > Number(m[5]) ? y2 - 1 : y2);
    return [isoOf(y1, Number(m[2]), Number(m[1])), isoOf(y2, Number(m[5]), Number(m[4]))];
  }
  const mon = '([a-z]{3,9})';
  m = new RegExp(`(\\d{1,2})\\s*${mon}?\\s*(\\d{4})?\\s*(?:-|–|—|to|hingga|sehingga)\\s*(\\d{1,2})\\s*${mon}\\s*(\\d{4})?`, 'i').exec(t);
  if (m && MONTHS[m[5].toLowerCase()]) {
    const m2 = MONTHS[m[5].toLowerCase()], m1 = m[2] && MONTHS[m[2].toLowerCase()] ? MONTHS[m[2].toLowerCase()] : m2;
    const y2 = fixYear(m[6], calendarYear), y1 = fixYear(m[3], m1 > m2 ? y2 - 1 : y2);
    return [isoOf(y1, m1, Number(m[1])), isoOf(y2, m2, Number(m[4]))];
  }
  m = /(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/.exec(t);
  if (m) { const s = isoOf(fixYear(m[3], calendarYear), Number(m[2]), Number(m[1])); return [s, s ? addDaysIso(s, 4) : '']; }
  return ['', ''];
}

const HEAD: [keyof Cols, RegExp][] = [
  ['week', /^(minggu|week|wk|mg)\b|^m\s*$/i], ['date', /(tarikh|date|bulan|month)/i], ['theme', /^(tema|theme)/i],
  ['topic', /(topik|topic|unit|tajuk|title|modul|module)/i], ['cs', /(standard kandungan|content standard|\bsk\b|\bcs\b)/i],
  ['ls', /(standard pembelajaran|learning standard|\bsp\b|\bls\b)/i], ['lesson', /(lesson|pelajaran|sow|rph|^bil)/i], ['notes', /(catatan|notes?|remarks?|cadangan|aktiviti|activit)/i]
];
interface Cols { week: number; date: number; theme: number; topic: number; cs: number; ls: number; lesson: number; notes: number }
const HOLIDAY = /\b(cuti|holiday|break|peperiksaan|exam(ination)?s?|ujian akhir|pentaksiran akhir|hari raya|deepavali|tahun baru|chinese new year|cny|krismas|christmas)\b/i;
const LS = /\b[1-5]\.\d{1,2}\.\d{1,2}\b/g;

export function expandNumbers(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/(\d{1,3})\s*(?:-|–|—|to|hingga)\s*(\d{1,3})|(\d{1,3})/g)) {
    if (m[1]) { const a = Number(m[1]), b = Number(m[2]); if (b >= a && b - a < 30) for (let i = a; i <= b; i++) out.push(i); }
    else out.push(Number(m[3]));
  }
  return out;
}

export interface Extracted { weeks: PlanWeek[]; header: string[]; found: { dates: number; holidays: number; ls: number; lessons: number }; problem: string }

/** Turn the rows of a yearly plan table into weeks. Several rows of the same week are combined. */
export function rowsToWeeks(rows: string[][], calendarYear: number): Extracted {
  const clean = rows.map((r) => r.map((c) => (c ?? '').replace(/\s+/g, ' ').trim())).filter((r) => r.some(Boolean));
  let hi = -1; let cols: Cols = { week: -1, date: -1, theme: -1, topic: -1, cs: -1, ls: -1, lesson: -1, notes: -1 };
  for (let i = 0; i < Math.min(clean.length, 25) && hi < 0; i++) {
    const c: Cols = { week: -1, date: -1, theme: -1, topic: -1, cs: -1, ls: -1, lesson: -1, notes: -1 };
    clean[i].forEach((cell, j) => { for (const [k, re] of HEAD) if (c[k] < 0 && re.test(cell)) { c[k] = j; break; } });
    if (c.week >= 0 && (c.date >= 0 || c.topic >= 0 || c.ls >= 0 || c.theme >= 0)) { hi = i; cols = c; }
  }
  if (hi < 0) return { weeks: [], header: [], found: { dates: 0, holidays: 0, ls: 0, lessons: 0 }, problem: 'No header row with a "Week" (Minggu) column was found. Check that the yearly plan is a table, or build the plan from the Scheme of Work instead.' };
  const byWeek = new Map<number, PlanWeek>();
  let last = 0; let pendingHoliday = '';
  const cell = (r: string[], k: keyof Cols) => (cols[k] >= 0 ? r[cols[k]] ?? '' : '');
  for (const r of clean.slice(hi + 1)) {
    const all = r.join(' ');
    const wtxt = cell(r, 'week');
    const wn = /(\d{1,2})/.exec(wtxt);
    const lsCodes = [...new Set([...(cell(r, 'ls') || all).matchAll(LS)].map((m) => m[0]))];
    if (!wn) {
      if (HOLIDAY.test(all) && !lsCodes.length) pendingHoliday = all.replace(/\s+/g, ' ').slice(0, 80);
      else if (last && byWeek.has(last)) { const w = byWeek.get(last)!; w.ls = [...new Set([...w.ls, ...lsCodes])]; const more = cell(r, 'topic'); if (more && !w.topic.includes(more)) w.topic = [w.topic, more].filter(Boolean).join('; ').slice(0, 200); const lt2 = cell(r, 'lesson'); if (lt2) w.lessons = [...new Set([...w.lessons, ...expandNumbers(lt2.replace(LS, ''))])].filter((n) => n > 0 && n < 200).sort((a, b) => a - b); }
      continue;
    }
    const week = Number(wn[1]);
    if (week < 1 || week > 53) continue;
    const [start, end] = parseDateRange(cell(r, 'date') || all, calendarYear);
    const holidayHere = HOLIDAY.test(all) && !lsCodes.length ? all.slice(0, 80) : '';
    const w = byWeek.get(week) ?? { week, start: '', end: '', holiday: '', theme: '', topic: '', ls: [], lessons: [], notes: '' };
    if (!w.start && start) { w.start = start; w.end = end; }
    if (!w.holiday && (holidayHere || pendingHoliday)) w.holiday = (holidayHere || pendingHoliday).replace(/^\d+\s*/, '').trim();
    pendingHoliday = '';
    const theme = cell(r, 'theme'), topic = cell(r, 'topic'), notes = cell(r, 'notes');
    if (theme && !w.theme.includes(theme)) w.theme = [w.theme, theme].filter(Boolean).join('; ').slice(0, 120);
    if (topic && !w.topic.includes(topic)) w.topic = [w.topic, topic].filter(Boolean).join('; ').slice(0, 200);
    if (notes && !w.notes.includes(notes)) w.notes = [w.notes, notes].filter(Boolean).join('; ').slice(0, 200);
    w.ls = [...new Set([...w.ls, ...lsCodes])];
    const lt = cell(r, 'lesson');
    if (lt) w.lessons = [...new Set([...w.lessons, ...expandNumbers(lt.replace(/\b[1-5]\.\d{1,2}\.\d{1,2}\b/g, ''))])].filter((n) => n > 0 && n < 200).sort((a, b) => a - b);
    byWeek.set(week, w); last = week;
  }
  const weeks = [...byWeek.values()].sort((a, b) => a.week - b.week);
  return { weeks, header: clean[hi], found: { dates: weeks.filter((w) => w.start).length, holidays: weeks.filter((w) => w.holiday).length, ls: new Set(weeks.flatMap((w) => w.ls)).size, lessons: weeks.reduce((a, w) => a + w.lessons.length, 0) }, problem: weeks.length ? '' : 'The header was found, but no week rows under it.' };
}

/** Give every week without dates its Monday–Friday, counting on from week 1's Monday. */
export function fillDates(weeks: PlanWeek[], week1Monday: string): PlanWeek[] {
  return weeks.map((w) => (w.start ? w : { ...w, start: addDaysIso(week1Monday, (w.week - 1) * 7), end: addDaysIso(week1Monday, (w.week - 1) * 7 + 4) }));
}

export interface BuildOptions { week1Monday: string; weeks: number; perWeek: number; holidays: number[]; lessonNos: number[]; topics: Map<number, string>; ls: Map<number, string[]> }
/** A yearly plan from the Scheme of Work: SoW lessons in order, `perWeek` a week, skipping holiday weeks. */
export function buildFromSow(o: BuildOptions): PlanWeek[] {
  const out: PlanWeek[] = []; let k = 0;
  for (let w = 1; w <= o.weeks; w++) {
    const start = addDaysIso(o.week1Monday, (w - 1) * 7);
    const holiday = o.holidays.includes(w) ? 'Holiday or exam week' : '';
    const lessons = holiday ? [] : o.lessonNos.slice(k, k + o.perWeek);
    if (!holiday) k += o.perWeek;
    out.push({ week: w, start, end: addDaysIso(start, 4), holiday, theme: '', topic: [...new Set(lessons.map((n) => o.topics.get(n) ?? ''))].filter(Boolean).join('; '), ls: [...new Set(lessons.flatMap((n) => o.ls.get(n) ?? []))], lessons, notes: '' });
  }
  return out;
}

/** The plan week that contains `date`, if any. */
export function weekOf(p: Pick<YearPlan, 'weeks'>, date: string): PlanWeek | undefined {
  return p.weeks.find((w) => w.start && w.start <= date && date <= (w.end || addDaysIso(w.start, 6)));
}
/** Weeks that touch a month (yyyy-mm). */
export function weeksInMonth(p: Pick<YearPlan, 'weeks'>, month: string): PlanWeek[] {
  return p.weeks.filter((w) => w.start && (w.start.slice(0, 7) === month || (w.end || w.start).slice(0, 7) === month));
}

// ---------------------------------------------------------------- file readers (all on the device)
const decode = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, '&');
/** Rows of every table in a Word document (word/document.xml). */
export function docxTables(xml: string): string[][] {
  const rows: string[][] = [];
  for (const tr of xml.match(/<w:tr[\s>][\s\S]*?<\/w:tr>/g) ?? []) {
    const cells = (tr.match(/<w:tc[\s>][\s\S]*?<\/w:tc>/g) ?? []).map((tc) => decode(tc.split(/<\/w:p>/).map((p) => (p.match(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, '')).join('')).join(' ').trim()));
    rows.push(cells);
  }
  return rows;
}
/** Rows of the first worksheet of an Excel file. */
export function xlsxRows(sheetXml: string, shared: string[]): string[][] {
  const rows: string[][] = [];
  const col = (ref: string) => { const l = ref.replace(/\d+/g, ''); let n = 0; for (const ch of l) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  for (const row of sheetXml.match(/<row[\s>][\s\S]*?<\/row>/g) ?? []) {
    const r: string[] = [];
    for (const c of row.match(/<c\s[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) ?? []) {
      const ref = /\sr="([A-Z]+\d+)"/.exec(c)?.[1] ?? ''; const type = /\st="(\w+)"/.exec(c)?.[1] ?? '';
      const v = /<v>([\s\S]*?)<\/v>/.exec(c)?.[1] ?? (c.match(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, '')).join('');
      const text = type === 's' ? shared[Number(v)] ?? '' : decode(v);
      r[ref ? col(ref) : r.length] = text;
    }
    rows.push(Array.from(r, (x) => x ?? ''));
  }
  return rows;
}
export function sharedStrings(xml: string): string[] {
  return (xml.match(/<si>[\s\S]*?<\/si>/g) ?? []).map((si) => decode((si.match(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, '')).join('')));
}
export function csvRows(text: string): string[][] {
  const sep = (text.split('\n')[0].match(/;/g)?.length ?? 0) > (text.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : text.includes('\t') ? '\t' : ',';
  const rows: string[][] = []; let row: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === sep) { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (ch !== '\r') cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
/** Lines of positioned PDF text → rows of cells (a wide gap starts a new cell). */
export function pdfLinesToRows(items: { str: string; x: number; y: number; w: number }[]): string[][] {
  const lines = new Map<number, typeof items>();
  for (const it of items) { if (!it.str.trim()) continue; const key = [...lines.keys()].find((k) => Math.abs(k - it.y) < 3) ?? it.y; lines.set(key, [...(lines.get(key) ?? []), it]); }
  return [...lines.entries()].sort((a, b) => b[0] - a[0]).map(([, its]) => {
    const s = its.sort((a, b) => a.x - b.x); const cells: string[] = []; let cur = ''; let end = -1e9;
    for (const it of s) { if (cur && it.x - end > 14) { cells.push(cur.trim()); cur = ''; } cur += (cur && it.x - end > 1.5 ? ' ' : '') + it.str; end = it.x + it.w; }
    if (cur) cells.push(cur.trim());
    return cells;
  });
}

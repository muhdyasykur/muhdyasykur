import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { Document, Packer, Table, TableRow, TableCell, Paragraph } from 'docx';
import { parseDateRange, rowsToWeeks, expandNumbers, buildFromSow, weekOf, weeksInMonth, fillDates, docxTables, csvRows, pdfLinesToRows } from './yearplan';

const RPT: string[][] = [
  ['RANCANGAN PENGAJARAN TAHUNAN BAHASA INGGERIS TAHUN 4 2026'],
  ['MINGGU', 'TARIKH', 'TEMA', 'UNIT / TOPIK', 'STANDARD KANDUNGAN', 'STANDARD PEMBELAJARAN', 'PELAJARAN', 'CATATAN'],
  ['1', '12.1.2026 - 16.1.2026', 'World of Self, Family and Friends', 'Unit 1: Where are you from?', '1.2', '1.2.2 2.1.5', '1-2', ''],
  ['', '', '', '', '3.2', '3.2.2', '3', ''],
  ['2', '19/1 – 23/1', 'World of Self, Family and Friends', 'Unit 1: Where are you from?', '4.2', '4.2.4', '4-5', 'Bring a world map'],
  ['CUTI TAHUN BARU CINA', '', '', '', '', '', '', ''],
  ['3', '2 Feb - 6 Feb', 'World of Knowledge', 'Unit 2: Days', '', '1.2.4', 'Lesson 6 - 8', ''],
  ['4', '9 Februari - 13 Februari 2026', 'World of Knowledge', 'Unit 2: Days', '', '5.3.1', '9, 10', ''],
  ['5', '', 'CUTI PERTENGAHAN PENGGAL', '', '', '', '', '']
];

describe('yearly plan extraction', () => {
  it('reads Malay and English date ranges', () => {
    expect(parseDateRange('12.1.2026 - 16.1.2026', 2026)).toEqual(['2026-01-12', '2026-01-16']);
    expect(parseDateRange('19/1 – 23/1', 2026)).toEqual(['2026-01-19', '2026-01-23']);
    expect(parseDateRange('2 Feb - 6 Feb', 2026)).toEqual(['2026-02-02', '2026-02-06']);
    expect(parseDateRange('9 Februari - 13 Februari 2026', 2026)).toEqual(['2026-02-09', '2026-02-13']);
    expect(parseDateRange('29 Dis – 2 Jan', 2026)).toEqual(['2025-12-29', '2026-01-02']);
    expect(parseDateRange('12-16 Januari', 2026)).toEqual(['2026-01-12', '2026-01-16']);
    expect(parseDateRange('no date', 2026)).toEqual(['', '']);
  });
  it('expands lesson numbers', () => { expect(expandNumbers('Lesson 6 - 8, 10')).toEqual([6, 7, 8, 10]); });
  it('finds the header, combines rows of one week, and marks holidays', () => {
    const x = rowsToWeeks(RPT, 2026);
    expect(x.problem).toBe('');
    expect(x.weeks.map((w) => w.week)).toEqual([1, 2, 3, 4, 5]);
    expect(x.weeks[0]).toMatchObject({ start: '2026-01-12', end: '2026-01-16', topic: 'Unit 1: Where are you from?', lessons: [1, 2, 3] });
    expect(x.weeks[0].ls).toEqual(['1.2.2', '2.1.5', '3.2.2']);
    expect(x.weeks[2].holiday).toMatch(/TAHUN BARU CINA/);
    expect(x.weeks[2].lessons).toEqual([6, 7, 8]);
    expect(x.weeks[4].holiday).toMatch(/PERTENGAHAN PENGGAL/);
    expect(x.found).toMatchObject({ dates: 4, holidays: 2 });
  });
  it('explains when there is no week column', () => { expect(rowsToWeeks([['Name', 'Class']], 2026).problem).toMatch(/Week/); });
  it('fills missing dates from week 1, and finds the week and month of a date', () => {
    const w = fillDates(rowsToWeeks(RPT, 2026).weeks, '2026-01-12');
    expect(w[4]).toMatchObject({ start: '2026-02-09', end: '2026-02-13' });
    expect(weekOf({ weeks: w }, '2026-01-21')?.week).toBe(2);
    expect(weeksInMonth({ weeks: w }, '2026-02').map((x) => x.week)).toEqual([3, 4, 5]);
  });
  it('builds a plan from the SoW, skipping holiday weeks', () => {
    const weeks = buildFromSow({ week1Monday: '2026-01-12', weeks: 4, perWeek: 2, holidays: [2], lessonNos: [1, 2, 3, 4, 5, 6], topics: new Map([[1, 'Unit 1']]), ls: new Map([[1, ['1.2.2']]]) });
    expect(weeks.map((w) => w.lessons)).toEqual([[1, 2], [], [3, 4], [5, 6]]);
    expect(weeks[1].holiday).not.toBe('');
    expect(weeks[0].topic).toBe('Unit 1');
  });
  it('reads a real Word table', async () => {
    const t = new Table({ rows: RPT.slice(1, 5).map((r) => new TableRow({ children: r.map((c) => new TableCell({ children: [new Paragraph(c)] })) })) });
    const buf = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph('RPT'), t] }] }));
    const xml = await (await JSZip.loadAsync(buf)).file('word/document.xml')!.async('string');
    const x = rowsToWeeks(docxTables(xml), 2026);
    expect(x.weeks.map((w) => w.week)).toEqual([1, 2]);
    expect(x.weeks[1].notes).toBe('Bring a world map');
  });
  it('reads CSV with semicolons and quotes, and PDF text lines', () => {
    expect(csvRows('Week;Topic\n1;"Unit 1; part A"\n')).toEqual([['Week', 'Topic'], ['1', 'Unit 1; part A']]);
    const rows = pdfLinesToRows([{ str: 'Week', x: 10, y: 700, w: 30 }, { str: 'Topic', x: 100, y: 700, w: 30 }, { str: '1', x: 10, y: 680, w: 5 }, { str: 'Unit', x: 100, y: 680, w: 20 }, { str: '1', x: 122, y: 680, w: 5 }]);
    expect(rows).toEqual([['Week', 'Topic'], ['1', 'Unit 1']]);
  });
});

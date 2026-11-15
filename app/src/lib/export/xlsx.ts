import type { PbdRecord, Pupil, SchoolClass } from '../db/schema';
import { autoTier, latestGrid } from '../pbd';

/** Plain cell description; converted to write-excel-file cells when the file is made. */
export interface XCell { value: string | number | null; bold?: boolean; fill?: string }
export type XSheet = { name: string; rows: XCell[][] };
const TP_FILL = ['', '#F8D7D3', '#FBE3C8', '#FFF1C2', '#E3F1C9', '#C9E8D2', '#A8DCC0'];
const tierName = { low: 'Low', mod: 'Moderate', high: 'High' } as const;

/** One sheet per class (latest TP per Learning Standard) plus one sheet listing every record (blueprint F20). */
export function pbdSheets(classes: { cls: SchoolClass; pupils: Pupil[]; records: PbdRecord[] }[], topicOf: (lessonId: string | null) => string): XSheet[] {
  const sheets: XSheet[] = [];
  const all: XCell[][] = [['Date', 'Class', 'Pupil', 'LS', 'TP', 'Lesson', 'Note'].map((v) => ({ value: v, bold: true, fill: '#E3E8F1' }))];
  for (const { cls, pupils, records } of classes) {
    const codes = [...new Set(records.map((r) => r.ls))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const grid = latestGrid(records);
    const rows: XCell[][] = [
      [{ value: `${cls.name} · Year ${cls.year} ${cls.schoolType}`, bold: true }],
      ['No', 'Pupil', 'Suggested level', ...codes.map((c) => `LS ${c}`)].map((v) => ({ value: v, bold: true, fill: '#E3E8F1' }))
    ];
    pupils.forEach((p, i) => {
      const mine = records.filter((r) => r.pupilId === p.id);
      const t = autoTier(mine);
      const level = p.tierOverride ? `${tierName[p.tierOverride]} (set by teacher)` : `${tierName[t.tier]}${t.provisional ? ' (provisional)' : ''}`;
      rows.push([{ value: i + 1 }, { value: p.name }, { value: level }, ...codes.map((c) => { const r = grid.get(p.id)?.get(c); return { value: r ? r.tp : null, fill: r ? TP_FILL[r.tp] : undefined }; })]);
      for (const r of mine.sort((a, b) => a.date.localeCompare(b.date))) all.push([r.date, cls.name, p.name, r.ls, r.tp, topicOf(r.lessonId), r.note ?? ''].map((v) => ({ value: v })));
    });
    sheets.push({ name: cls.name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Class', rows });
  }
  sheets.push({ name: 'All records', rows: all });
  // sheet names must be unique
  const seen = new Map<string, number>();
  for (const s of sheets) { const n = seen.get(s.name) ?? 0; seen.set(s.name, n + 1); if (n) s.name = `${s.name.slice(0, 28)} ${n + 1}`; }
  return sheets;
}

export async function sheetsToBlob(sheets: XSheet[]): Promise<Blob> {
  const { default: write } = await import('write-excel-file');
  const data = sheets.map((s) => s.rows.map((r) => r.map((c) => (c.value === null ? null : { value: c.value, fontWeight: c.bold ? ('bold' as const) : undefined, backgroundColor: c.fill }))));
  const widths = sheets.map((s) => (s.rows[1] ?? s.rows[0] ?? []).map((_, i) => ({ width: i === 1 ? 28 : i === 2 ? 22 : 11 })));
  return (await (write as unknown as (d: unknown, o: unknown) => Promise<Blob>)(data, { sheets: sheets.map((s) => s.name), columns: widths })) as Blob;
}

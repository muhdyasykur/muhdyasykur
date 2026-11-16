import { db, type Mark, type Register, type Pupil, type SchoolClass } from './db/schema';
import type { XSheet, XCell } from './export/xlsx';

/** Class register: take attendance for any class on any day (milestone 9). */
export const MARKS: { id: Mark; label: string; short: string }[] = [
  { id: 'P', label: 'Present', short: 'P' }, { id: 'L', label: 'Late', short: 'L' }, { id: 'A', label: 'Absent', short: 'A' }, { id: 'E', label: 'Excused (MC, duty)', short: 'E' }
];
export const regId = (classId: string, date: string) => `${classId}:${date}`;
export const getRegister = (classId: string, date: string) => db.register.get(regId(classId, date));
export async function saveRegister(r: Register) { await db.register.put(JSON.parse(JSON.stringify({ ...r, takenAt: Date.now() }))); }
export async function listRegisters(classId: string, from: string, to: string): Promise<Register[]> {
  return (await db.register.where('[classId+date]').between([classId, from], [classId, to], true, true).toArray()).sort((a, b) => a.date.localeCompare(b.date));
}
/** Absent pupils from Teach mode go into the register for that day, without overwriting marks the teacher set. */
export async function fromTeach(classId: string, date: string, pupilIds: string[], absent: string[]) {
  const r = (await getRegister(classId, date)) ?? { id: regId(classId, date), classId, date, marks: {}, reasons: {}, takenAt: 0 };
  for (const id of pupilIds) if (!r.marks[id]) r.marks[id] = absent.includes(id) ? 'A' : 'P';
  await saveRegister(r);
}
export interface PupilSummary { P: number; L: number; A: number; E: number; days: number; rate: number }
/** Per-pupil counts; the rate counts present and late as attended, and leaves excused days out. */
export function summarise(pupils: Pupil[], regs: Register[]): Map<string, PupilSummary> {
  const m = new Map<string, PupilSummary>();
  for (const p of pupils) {
    const c = { P: 0, L: 0, A: 0, E: 0, days: 0, rate: 0 };
    for (const r of regs) { const k = r.marks[p.id]; if (k) { c[k]++; c.days++; } }
    const counted = c.P + c.L + c.A;
    c.rate = counted ? Math.round(((c.P + c.L) / counted) * 100) : 0;
    m.set(p.id, c);
  }
  return m;
}
export function dayCounts(r: Register | undefined, pupils: Pupil[]) {
  const c = { P: 0, L: 0, A: 0, E: 0, unmarked: 0 };
  for (const p of pupils) { const k = r?.marks[p.id]; if (k) c[k]++; else c.unmarked++; }
  return c;
}
/** Excel sheet for a month: pupils × dates, then totals and rate. */
export function registerSheet(cls: SchoolClass, pupils: Pupil[], regs: Register[], month: string): XSheet {
  const dates = regs.map((r) => r.date);
  const FILL: Record<Mark, string> = { P: '#E3F1C9', L: '#FFF1C2', A: '#F8D7D3', E: '#DCEBFA' };
  const head: XCell[] = ['No', 'Pupil', ...dates.map((d) => d.slice(8) + '/' + d.slice(5, 7)), 'Present', 'Late', 'Absent', 'Excused', 'Attendance %'].map((v) => ({ value: v, bold: true, fill: '#E3E8F1' }));
  const sum = summarise(pupils, regs);
  const rows: XCell[][] = [[{ value: `${cls.name} · attendance · ${month}`, bold: true }], head];
  pupils.forEach((p, i) => {
    const s = sum.get(p.id)!;
    rows.push([{ value: i + 1 }, { value: p.name }, ...regs.map((r) => { const k = r.marks[p.id]; return { value: k ?? '', fill: k ? FILL[k] : undefined }; }), { value: s.P }, { value: s.L }, { value: s.A }, { value: s.E }, { value: s.days ? s.rate : '' }]);
  });
  rows.push([], [{ value: 'P present · L late · A absent · E excused (MC, school duty). Attendance % = (present + late) ÷ (present + late + absent).' }]);
  return { name: `Attendance ${month}`.slice(0, 31), rows };
}

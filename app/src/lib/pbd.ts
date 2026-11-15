import type { PbdRecord } from './db/schema';

export type Tier = 'low' | 'mod' | 'high';
export const tierOfTp = (tp: number): Tier => (tp <= 2 ? 'low' : tp <= 4 ? 'mod' : 'high');

/**
 * Suggested level for each pupil from their last three TP records (blueprint F20): TP1–2 Low, TP3–4 Moderate,
 * TP5–6 High, using the rounded average. Fewer than three records → "provisional". No records → Moderate.
 * A teacher's own setting (tierOverride) always wins.
 */
export function autoTier(records: PbdRecord[], skill?: string): { tier: Tier; provisional: boolean; basis: number } {
  const rel = records.filter((r) => !skill || r.ls.startsWith(skill)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  if (!rel.length) return { tier: 'mod', provisional: true, basis: 0 };
  const avg = Math.round(rel.reduce((a, r) => a + r.tp, 0) / rel.length);
  return { tier: tierOfTp(avg), provisional: rel.length < 3, basis: rel.length };
}
/** Latest TP per pupil per LS, for the heatmap. */
export function latestGrid(records: PbdRecord[]): Map<string, Map<string, PbdRecord>> {
  const out = new Map<string, Map<string, PbdRecord>>();
  for (const r of [...records].sort((a, b) => a.date.localeCompare(b.date))) {
    if (!out.has(r.pupilId)) out.set(r.pupilId, new Map());
    out.get(r.pupilId)!.set(r.ls, r);
  }
  return out;
}
export const SKILL_PREFIX: Record<string, string> = { Listening: '1.', Speaking: '2.', Reading: '3.', Writing: '4.', 'Language Arts': '5.' };

/**
 * Teach-mode clock (blueprint F17). Time is computed from timestamps, never from interval ticks, so the
 * timer stays right when a phone locks, a tab sleeps or the page is reloaded.
 */
export interface StagePlan { key: string; title: string; minutes: number }
export interface ClockState {
  stageIndex: number;
  startedAt: number;          // lesson start
  stageStartedAt: number;     // when the current stage started
  pausedAt: number | null;
  pausedMs: number;           // paused time inside the current stage
  log: { key: string; title: string; plannedMin: number; actualSec: number }[];
  finishedAt: number | null;
}
export function startClock(now: number): ClockState {
  return { stageIndex: 0, startedAt: now, stageStartedAt: now, pausedAt: null, pausedMs: 0, log: [], finishedAt: null };
}
export function stageElapsedMs(c: ClockState, now: number): number {
  const end = c.pausedAt ?? c.finishedAt ?? now;
  return Math.max(0, end - c.stageStartedAt - c.pausedMs);
}
export function remainingSec(c: ClockState, plan: StagePlan[], now: number): number {
  return Math.round((plan[c.stageIndex].minutes * 60_000 - stageElapsedMs(c, now)) / 1000);
}
export function pause(c: ClockState, now: number): ClockState { return c.pausedAt ? c : { ...c, pausedAt: now }; }
export function resume(c: ClockState, now: number): ClockState { return c.pausedAt ? { ...c, pausedMs: c.pausedMs + (now - c.pausedAt), pausedAt: null } : c; }
/** Move to the next (or previous) stage, logging the time actually spent. */
export function go(c: ClockState, plan: StagePlan[], now: number, dir: 1 | -1 = 1): ClockState {
  const cur = resume(c, now);
  const s = plan[cur.stageIndex];
  const spent = Math.round(stageElapsedMs(cur, now) / 1000);
  const log = cur.log.filter((x) => x.key !== s.key);
  const prev = c.log.find((x) => x.key === s.key)?.actualSec ?? 0;
  log.push({ key: s.key, title: s.title, plannedMin: s.minutes, actualSec: prev + spent });
  const next = cur.stageIndex + dir;
  if (next >= plan.length) return { ...cur, log, finishedAt: now, stageStartedAt: now, pausedMs: 0 };
  if (next < 0) return cur;
  return { ...cur, log, stageIndex: next, stageStartedAt: now, pausedMs: 0 };
}
/**
 * Minutes behind (+) or ahead (−) of plan: time used so far against the planned minutes of stages
 * already finished, plus the current stage once it overruns.
 */
export function drift(c: ClockState, plan: StagePlan[], now: number): number {
  const done = c.log.filter((x) => plan.findIndex((p) => p.key === x.key) < c.stageIndex);
  const usedDone = done.reduce((a, x) => a + x.actualSec, 0);
  const planDone = done.reduce((a, x) => a + x.plannedMin * 60, 0);
  const over = Math.max(0, -remainingSec(c, plan, now));
  return Math.round((usedDone - planDone + over) / 60);
}
export type Advice = { kind: 'behind' | 'ahead'; minutes: number } | null;
/** Pacing coach: speak up at 3 minutes or more either way (never during the first stage). */
export function advice(c: ClockState, plan: StagePlan[], now: number): Advice {
  if (c.finishedAt) return null;
  const d = drift(c, plan, now);
  if (d >= 3) return { kind: 'behind', minutes: d };
  if (d <= -3 && c.stageIndex > 0) return { kind: 'ahead', minutes: -d };
  return null;
}
export function fmt(sec: number): string {
  const s = Math.abs(sec);
  return `${sec < 0 ? '+' : ''}${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

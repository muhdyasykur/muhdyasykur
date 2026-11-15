/** Short classroom sounds made with Web Audio: no files, works offline. Gentle by design (no harsh alarms). */
let ctx: AudioContext | null = null;
const KEY = 'consilia.sound';
export const soundOn = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } };
export const setSound = (on: boolean) => { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* ignore */ } };
function ac(): AudioContext | null {
  if (!soundOn()) return null;
  try { ctx ??= new AudioContext(); if (ctx.state === 'suspended') void ctx.resume(); return ctx; } catch { return null; }
}
function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.18) {
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start); o.stop(a.currentTime + start + dur + 0.05);
}
/** Soft two-note chime: stage over, timer done. */
export function chime() { tone(784, 0, 0.9); tone(1047, 0.18, 1.1); }
/** Attention signal: three rising notes. */
export function signal() { tone(523, 0, 0.35, 'triangle'); tone(659, 0.2, 0.35, 'triangle'); tone(784, 0.4, 0.7, 'triangle'); }
/** Name-picker tick. */
export function tick() { tone(1400, 0, 0.05, 'square', 0.05); }
/** Small reward sound for class points. */
export function ding() { tone(1319, 0, 0.4, 'sine', 0.12); }

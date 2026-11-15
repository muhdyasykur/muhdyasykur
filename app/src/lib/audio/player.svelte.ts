import { Music } from './music';
import { TRACKS } from './tracks';

/** Background music: off by default, starts only from a tap, pauses in Teach mode and when the app is hidden. */
const KEY = 'consilia.music';
let engine: Music | null = null;
const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as { track?: number; volume?: number }; } catch { return {}; } })();
export const music = $state({ playing: false, track: saved.track ?? 0, volume: saved.volume ?? 0.5 });
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify({ track: music.track, volume: music.volume })); } catch { /* ignore */ } };

export async function play(track = music.track) {
  try {
    engine ??= new Music();
    engine.volume = music.volume;
    await engine.play(TRACKS[track]);
    music.track = track; music.playing = true; persist();
  } catch { music.playing = false; }
}
export function pause() { engine?.stop(); music.playing = false; }
export function toggle() { return music.playing ? pause() : play(); }
export function next() { const n = (music.track + 1) % TRACKS.length; music.track = n; persist(); if (music.playing) play(n); }
export function setVolume(v: number) { music.volume = v; engine?.setVolume(v); persist(); }

export function startMusicGuards() {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && music.playing) pause(); });
}
export { TRACKS };

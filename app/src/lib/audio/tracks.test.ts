import { describe, it, expect } from 'vitest';
import { TRACKS, barEvents, barLength } from './tracks';

describe('music', () => {
  it('three original tracks, each a four-bar loop with five-note chords', () => {
    expect(TRACKS.map((t) => t.title)).toEqual(['Late Night Planning', 'Sunset Staffroom', 'Gold Star']);
    for (const t of TRACKS) {
      expect(t.chords).toHaveLength(4);
      for (const c of t.chords) { expect(c.notes).toHaveLength(5); expect(c.bass).toBeLessThan(Math.min(...c.notes)); }
      expect(t.bpm).toBeGreaterThanOrEqual(60); expect(t.bpm).toBeLessThanOrEqual(80);
    }
  });
  it('every note of a bar falls inside that bar, with swing on the off-beats', () => {
    for (const t of TRACKS) for (let bar = 0; bar < 8; bar++) {
      const ev = barEvents(t, bar);
      expect(ev.every((e) => e.time >= 0 && e.time < barLength(t))).toBe(true);
    }
    const t = TRACKS[0];
    const hats = barEvents(t, 0).filter((e) => e.voice === 'hat').map((e) => e.time);
    expect(hats.length).toBe(8);
  });
  it('the melody comes in on the second time round', () => {
    const t = TRACKS[0];
    expect(barEvents(t, 0).some((e) => e.voice === 'lead')).toBe(false);
    expect(barEvents(t, 4).some((e) => e.voice === 'lead')).toBe(true);
  });
});

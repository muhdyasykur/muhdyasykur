/**
 * Three original R&B instrumentals composed for Consilia (blueprint F26). They are written here as notes,
 * not recordings, and played by a small Web Audio synthesiser: no files, no licence, works offline.
 * MIDI note numbers: 60 = middle C. One bar = 16 steps (sixteenth notes).
 */
export interface Chord { name: string; notes: number[]; bass: number }
export interface Track {
  id: string; title: string; mood: string; bpm: number; swing: number;
  chords: Chord[];              // one chord per bar, looped
  bass: [number, number, number][];   // [step, semitones above chord bass, length in steps]
  kick: number[]; snap: number[]; hat: number[]; hatOpen: number[];
  comp: [number, number][];     // electric-piano hits: [step, length in steps]
  melody: [number, number, number, number][]; // [bar, step, midi, length]
}

export const TRACKS: Track[] = [
  {
    id: 'late-night', title: 'Late Night Planning', mood: 'warm and slow', bpm: 70, swing: 0.18,
    chords: [
      { name: 'E♭maj9', notes: [55, 62, 63, 65, 70], bass: 39 },
      { name: 'Cm9', notes: [55, 58, 62, 63, 67], bass: 36 },
      { name: 'Fm9', notes: [56, 60, 63, 67, 68], bass: 41 },
      { name: 'B♭13', notes: [56, 62, 67, 68, 72], bass: 34 }
    ],
    bass: [[0, 0, 5], [6, 0, 2], [10, 7, 3], [14, 12, 2]],
    kick: [0, 7, 10], snap: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [15],
    comp: [[0, 6], [10, 5]],
    melody: [[0, 8, 75, 2], [0, 10, 77, 2], [0, 12, 79, 6], [1, 6, 75, 2], [1, 8, 72, 6], [2, 4, 77, 2], [2, 6, 75, 2], [2, 8, 72, 8], [3, 10, 70, 2], [3, 12, 72, 4]]
  },
  {
    id: 'staffroom', title: 'Sunset Staffroom', mood: 'gentle, a little nostalgic', bpm: 66, swing: 0.15,
    chords: [
      { name: 'Fmaj9', notes: [57, 60, 64, 67, 69], bass: 41 },
      { name: 'Em7', notes: [55, 59, 62, 64, 67], bass: 40 },
      { name: 'Dm9', notes: [53, 57, 60, 64, 65], bass: 38 },
      { name: 'Cmaj9', notes: [52, 55, 59, 62, 64], bass: 36 }
    ],
    bass: [[0, 0, 4], [5, 7, 2], [8, 12, 3], [12, 7, 2], [14, 5, 2]],
    kick: [0, 8, 11], snap: [4, 12], hat: [2, 6, 10, 14], hatOpen: [7],
    comp: [[0, 3], [6, 2], [8, 4]],
    melody: [[0, 0, 72, 4], [0, 6, 76, 2], [0, 8, 74, 6], [1, 4, 71, 4], [1, 10, 72, 4], [2, 2, 69, 2], [2, 4, 72, 4], [2, 10, 74, 2], [3, 0, 71, 8]]
  },
  {
    id: 'gold-star', title: 'Gold Star', mood: 'bright and hopeful', bpm: 76, swing: 0.2,
    chords: [
      { name: 'A♭maj9', notes: [60, 63, 67, 68, 70], bass: 44 },
      { name: 'Fm9', notes: [56, 60, 63, 67, 68], bass: 41 },
      { name: 'D♭maj9', notes: [56, 60, 61, 63, 65], bass: 37 },
      { name: 'E♭11', notes: [58, 61, 63, 65, 68], bass: 39 }
    ],
    bass: [[0, 0, 3], [3, 0, 1], [6, 7, 2], [8, 0, 3], [11, 12, 1], [12, 10, 2], [14, 7, 2]],
    kick: [0, 3, 8, 10], snap: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], hatOpen: [6, 14],
    comp: [[2, 2], [6, 2], [10, 2], [14, 2]],
    melody: [[0, 4, 75, 2], [0, 6, 77, 2], [0, 8, 80, 4], [0, 14, 79, 2], [1, 0, 77, 6], [2, 4, 77, 2], [2, 6, 75, 2], [2, 8, 72, 4], [3, 2, 75, 2], [3, 4, 77, 8]]
  }
];

export type Voice = 'ep' | 'bass' | 'kick' | 'snap' | 'hat' | 'hatOpen' | 'lead';
export interface NoteEvent { voice: Voice; time: number; midi?: number; dur: number; vel: number }
const humanise = (bar: number, step: number) => (((bar * 31 + step * 17) % 7) - 3) * 0.003; // tiny, repeatable timing drift

/** Every note in one bar, with times in seconds from the start of that bar (swing applied to off-beat sixteenths). */
export function barEvents(t: Track, bar: number): NoteEvent[] {
  const step = 60 / t.bpm / 4;
  const at = (s: number) => s * step + (s % 2 === 1 ? t.swing * step : 0) + humanise(bar, s);
  const chord = t.chords[bar % t.chords.length];
  const loop = bar % t.chords.length;
  const ev: NoteEvent[] = [];
  for (const [s, len] of t.comp) for (const [i, m] of chord.notes.entries()) ev.push({ voice: 'ep', time: Math.max(0, at(s) + i * 0.008), midi: m, dur: len * step, vel: 0.5 - i * 0.04 });
  for (const [s, semis, len] of t.bass) ev.push({ voice: 'bass', time: Math.max(0, at(s)), midi: chord.bass + semis, dur: len * step, vel: 0.8 });
  for (const s of t.kick) ev.push({ voice: 'kick', time: Math.max(0, at(s)), dur: 0.4, vel: s === 0 ? 1 : 0.8 });
  for (const s of t.snap) ev.push({ voice: 'snap', time: Math.max(0, at(s)), dur: 0.15, vel: 0.7 });
  for (const s of t.hat) ev.push({ voice: 'hat', time: Math.max(0, at(s)), dur: 0.05, vel: s % 4 === 0 ? 0.35 : 0.22 });
  for (const s of t.hatOpen) ev.push({ voice: 'hatOpen', time: Math.max(0, at(s)), dur: 0.25, vel: 0.2 });
  // the melody plays every other time round, so the groove has room to breathe
  if (Math.floor(bar / t.chords.length) % 2 === 1) for (const [b, s, m, len] of t.melody) if (b === loop) ev.push({ voice: 'lead', time: Math.max(0, at(s)), midi: m, dur: len * step, vel: 0.45 });
  return ev.sort((a, b) => a.time - b.time);
}
export const barLength = (t: Track) => (60 / t.bpm) * 4;
export const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

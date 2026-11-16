/** Chants made from the teacher's words: original patterns in the jazz-chant tradition, with suggested actions. */
export interface Chant { id: string; title: string; how: string; lines: string[] }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "He is from …" + "Japan" → "He is from Japan". Without a frame, the word itself. */
export function frameWith(frame: string, w: string) {
  const f = frame.trim().replace(/[.!?]+$/, '');
  if (!f) return w;
  return /…|\.\.\.|_{2,}/.test(f) ? f.replace(/…|\.\.\.|_{2,}/, w) : `${f} ${w}`;
}
export function makeChants(words: string[], frame: string): Chant[] {
  const w = words.length ? words : ['apple', 'banana', 'mango', 'durian'];
  const f = (x: string) => cap(frameWith(frame, x));
  const at = (i: number) => w[i % w.length];
  return [
    { id: 'echo', title: 'Echo chant', how: 'You say a line; the class echoes it. Clap on the beat. Get louder each verse.',
      lines: w.slice(0, 6).flatMap((x) => [`${f(x)}! (clap, clap)`, `${cap(x)}, ${x}, ${x}! (clap, clap)`]) },
    { id: 'question', title: 'Question and answer', how: 'Split the class in two. Side A asks, side B answers, then swap. Point to a picture card on each answer.',
      lines: w.slice(0, 5).flatMap((x) => [`A: What do you say? What do you say?`, `B: ${f(x)}! ${f(x)}!`]) },
    { id: 'frere', title: 'To the tune of "Frère Jacques"', how: 'Sing it to the familiar tune; each line is sung twice. Add one action per word.',
      lines: [`${cap(at(0))}, ${at(0)}!`, `${cap(at(1))}, ${at(1)}!`, `${f(at(2))}.`, `${f(at(2))}.`, `${cap(at(3))}, ${at(3)}, ${at(3)}!`, `${cap(at(3))}, ${at(3)}, ${at(3)}!`, `Clap, clap, clap!`, `Clap, clap, clap!`] },
    { id: 'countdown', title: 'Stamp and count', how: 'Stamp on each number, whisper the first round and shout the last.',
      lines: [`One, two, three, four,`, ...w.slice(0, 4).map((x) => `${f(x)}, stamp the floor!`), `Five, six, seven, eight,`, `English lessons are great!`] }
  ];
}

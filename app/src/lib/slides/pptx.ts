/**
 * PowerPoint export of a lesson deck (16:9, teacher notes in the speaker notes). The file opens in PowerPoint,
 * Google Slides (File → Import slides) and Canva (Create a design → Import file). The library is loaded only when
 * the teacher downloads, so it adds nothing to the app's first load. Works offline.
 */
import type { Deck, Slide } from './deck';
import { THEMES, PATTERN_LABEL } from './deck';

const hex = (c: string) => c.replace('#', '').toUpperCase();
const FONT = 'Arial'; // safe in PowerPoint, Google Slides and Canva

export function slideFileName(topic: string, date: string) {
  const t = (topic || 'Lesson').replace(/[^\w\s-]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'Lesson';
  return `Slides-${t}-${date}.pptx`;
}
/** Largest size (pt) at which n lines fit the text box (about 250 pt tall, 200 with an answer). */
export const fitLines = (n: number, short = false) => Math.max(14, Math.floor((short ? 200 : 255) / (Math.max(1, n) * 1.45)));
/** Text sizes that keep long slides inside the box. */
export function fitSize(lines: string[], base: number) {
  const chars = lines.join(' ').length + lines.length * 20;
  return Math.min(base, chars > 520 ? 16 : chars > 380 ? 18 : chars > 260 ? 22 : chars > 160 ? 26 : base);
}

export async function deckToPptx(d: Deck, meta: { title: string; author?: string }): Promise<Blob> {
  return (await (await buildPptx(d, meta)).write({ outputType: 'blob' })) as Blob;
}
export async function buildPptx(d: Deck, meta: { title: string; author?: string }) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const p = new PptxGenJS();
  p.layout = 'LAYOUT_16x9'; // 10 × 5.625 in
  p.title = meta.title; p.subject = 'English lesson'; p.company = 'Consilia'; if (meta.author) p.author = meta.author;
  const th = THEMES[d.theme] ?? THEMES.consilia;
  const total = d.slides.length;
  // a question becomes two slides: the question, then the same slide with the answer (click to reveal)
  const seq: { sl: Slide; reveal: boolean; n: number }[] = [];
  d.slides.forEach((sl, n) => { seq.push({ sl, reveal: false, n }); if (sl.answer) seq.push({ sl, reveal: true, n }); });
  seq.forEach(({ sl, reveal, n: i }) => {
    const s = p.addSlide();
    s.background = { color: hex(th.bg) };
    const big = sl.kind === 'title' || sl.kind === 'end';
    if (big) {
      s.addShape(p.ShapeType.rect, { x: 0, y: 4.9, w: 10, h: 0.725, fill: { color: hex(th.accent) }, line: { color: hex(th.accent) } });
      s.addText(sl.title, { x: 0.6, y: 1.2, w: 8.8, h: 1.6, fontFace: FONT, fontSize: 44, bold: true, color: hex(th.title), valign: 'bottom', fit: 'shrink' });
      s.addText(sl.lines.join('\n'), { x: 0.6, y: 2.9, w: 8.8, h: 1.6, fontFace: FONT, fontSize: 22, color: hex(th.ink), valign: 'top' });
    } else {
      s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: hex(th.accent) }, line: { color: hex(th.accent) } });
      s.addText(sl.title, { x: 0.5, y: 0.3, w: 7.2, h: 0.8, fontFace: FONT, fontSize: 32, bold: true, color: hex(th.title), fit: 'shrink' });
      const tag = [sl.pattern && PATTERN_LABEL[sl.pattern], sl.minutes && sl.kind !== 'question' ? `⏱ ${sl.minutes} min` : ''].filter(Boolean).join('   ');
      if (tag) s.addText(tag, { x: 7.0, y: 0.38, w: 2.7, h: 0.6, fontFace: FONT, fontSize: 14, color: hex(th.ink), align: 'right' });
      const asList = sl.kind === 'activity' || sl.kind === 'warmup' || sl.kind === 'exit' || sl.kind === 'goals' || sl.kind === 'criteria';
      const words = sl.kind === 'words' && sl.lines.every((x) => x.length < 22);
      const size = Math.min(words ? 34 : fitSize(sl.lines, sl.kind === 'question' || sl.kind === 'pattern' ? 36 : 30), fitLines(sl.lines.length, reveal));
      const runs = sl.lines.map((t, j) => ({ text: t, options: { bullet: asList ? (sl.kind === 'activity' || sl.kind === 'warmup' ? { type: 'number' as const } : true) : false, breakLine: j < sl.lines.length - 1, bold: sl.kind === 'pattern' && j === 0, paraSpaceAfter: 8 } }));
      s.addShape(p.ShapeType.roundRect, { x: 0.5, y: 1.25, w: 9.0, h: reveal ? 3.0 : 3.85, fill: { color: hex(th.card) }, line: { color: hex(th.card) }, rectRadius: 0.12 });
      s.addText(runs, { x: 0.75, y: 1.35, w: 8.5, h: reveal ? 2.8 : 3.65, fontFace: FONT, fontSize: size, color: hex(th.ink), valign: 'middle', align: words || sl.kind === 'question' ? 'center' : 'left' });
      if (reveal) s.addText(`Answer: ${sl.answer}`, { x: 0.5, y: 4.4, w: 9.0, h: 0.7, fontFace: FONT, fontSize: 20, bold: true, color: hex(th.accent), align: 'center' });
      s.addText(`${i + 1} / ${total}`, { x: 8.4, y: 5.15, w: 1.4, h: 0.35, fontFace: FONT, fontSize: 11, color: hex(th.ink), align: 'right' });
    }
    const notes = [sl.answer && !reveal ? `Answer: ${sl.answer} (shown on the next slide)` : '', sl.stage && `${sl.stage}${sl.minutes ? ` (${sl.minutes} min)` : ''}`, sl.notes].filter(Boolean).join('\n');
    if (notes) s.addNotes(notes);
  });
  return p;
}

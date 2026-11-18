import { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import type { Block, Inline, List } from './markdown';

/** A Studio result as an editable Word file, made on the device (opens in Word, Google Docs and WPS). */
const FONT = 'Arial';
const border = { style: BorderStyle.SINGLE, size: 4, color: '888888' };
function runs(xs: Inline[], o: { b?: boolean; i?: boolean } = {}): TextRun[] {
  return xs.flatMap((x) => {
    if (x.t === 'b' || x.t === 'i') return runs(x.c, x.t === 'b' ? { ...o, b: true } : { ...o, i: true });
    const leaf = x as { t: 'text' | 'code'; v: string };
    return leaf.v.split('\n').map((line, k) => new TextRun({ text: line, bold: o.b, italics: o.i, font: leaf.t === 'code' ? 'Consolas' : FONT, size: 22, break: k ? 1 : undefined }));
  });
}
function list(l: List, level = 0): Paragraph[] {
  return l.items.flatMap((it, k) => [
    new Paragraph({ spacing: { after: 60 }, indent: { left: 360 * (level + 1), hanging: 280 }, children: [new TextRun({ text: l.t === 'ol' ? `${l.start + k}.\t` : '•\t', font: FONT, size: 22 }), ...runs(it.c)] }),
    ...(it.sub ? list(it.sub, level + 1) : [])
  ]);
}
function table(head: Inline[][], rows: Inline[][][]): Table {
  const cols = Math.max(head.length, ...rows.map((r) => r.length));
  const cell = (c: Inline[] | undefined, header = false) => new TableCell({
    borders: { top: border, bottom: border, left: border, right: border },
    shading: header ? { fill: 'EEF1F6' } : undefined,
    children: [new Paragraph({ children: runs(c ?? [], { b: header }) })]
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ tableHeader: true, children: Array.from({ length: cols }, (_, i) => cell(head[i], true)) }),
      ...rows.map((r) => new TableRow({ children: Array.from({ length: cols }, (_, i) => cell(r[i])) }))]
  });
}
export function studioDoc(title: string, sub: string, blocks: Block[]): Document {
  const body = blocks.flatMap((b): (Paragraph | Table)[] => {
    if (b.t === 'h') return [new Paragraph({ heading: b.level <= 1 ? HeadingLevel.HEADING_1 : b.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 }, children: runs(b.c, { b: true }) })];
    if (b.t === 'p') return [new Paragraph({ spacing: { after: 120 }, children: runs(b.c) })];
    if (b.t === 'quote') return [new Paragraph({ indent: { left: 400 }, spacing: { after: 120 }, children: runs(b.c, { i: true }) })];
    if (b.t === 'hr') return [new Paragraph({ border: { bottom: border }, children: [] })];
    if (b.t === 'table') return [table(b.head, b.rows), new Paragraph({ children: [] })];
    return list(b);
  });
  return new Document({
    creator: 'Consilia', title,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } }, children: [
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, bold: true, font: FONT, size: 30 })] }),
      new Paragraph({ spacing: { after: 240 }, alignment: AlignmentType.LEFT, children: [new TextRun({ text: sub, font: FONT, size: 18, color: '666666' })] }),
      ...body
    ] }]
  });
}
export const studioBlob = (title: string, sub: string, blocks: Block[]) => Packer.toBlob(studioDoc(title, sub, blocks));

import {
  AlignmentType, BorderStyle, Document, HeadingLevel, ImageRun, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, VerticalMergeType, WidthType
} from 'docx';
import type { Lesson, Activity, Stage } from '../lesson/model';
import type { Profile } from '../db/schema';
import { endTime } from '../lesson/model';
import { FRAMEWORKS } from '../lesson/frameworks';
import { alignment, criteria, longDate, objectiveLabels, objectiveText, weekday } from '../lesson/derive';
import { runChecks } from '../lesson/checker';

/**
 * Word (.docx) versions of both RPH layouts, built on the device. Uses plain tables and cell shading only,
 * so the file opens the same in Microsoft Word, Google Docs and WPS (blueprint risk 7).
 */
const W = 10466; // A4 width minus 2 × 0.5" margins, in twentieths of a point
const FONT = 'Arial';
const SOFT = 'F2F4F8', M = 'F6C9A8', C = 'CFE3F5', NAVY = '13294B';
const border = { style: BorderStyle.SINGLE, size: 4, color: '444444' };
const borders = { top: border, bottom: border, left: border, right: border };

type Run = string | { t: string; b?: boolean; i?: boolean };
function p(runs: Run | Run[], o: { align?: 'center'; size?: number; bold?: boolean; color?: string; after?: number } = {}) {
  const arr = Array.isArray(runs) ? runs : [runs];
  return new Paragraph({
    alignment: o.align === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { after: o.after ?? 40 },
    children: arr.flatMap((r) => {
      const x = typeof r === 'string' ? { t: r } : r;
      return x.t.split('\n').map((line, i) => new TextRun({ text: line, bold: x.b ?? o.bold, italics: x.i, font: FONT, size: o.size ?? 20, color: o.color, break: i ? 1 : undefined }));
    })
  });
}
function cell(content: Paragraph[] | string, o: { w?: number; fill?: string; span?: number; merge?: 'restart' | 'continue'; center?: boolean; bold?: boolean } = {}) {
  const children = typeof content === 'string' ? [p(content, { align: o.center ? 'center' : undefined, bold: o.bold })] : content.length ? content : [p('')];
  return new TableCell({
    children, columnSpan: o.span, borders,
    width: o.w ? { size: o.w, type: WidthType.DXA } : undefined,
    shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
    verticalMerge: o.merge === 'restart' ? VerticalMergeType.RESTART : o.merge === 'continue' ? VerticalMergeType.CONTINUE : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 }
  });
}
const table = (widths: number[], rows: TableRow[]) => new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, rows });
const band = (text: string, cols: number) => new TableRow({ children: [cell([p(text.toUpperCase(), { align: 'center', bold: true })], { span: cols, fill: SOFT })] });
const spacer = () => p('', { after: 120 });

function logo(profile: Profile | null): Paragraph[] {
  if (!profile?.logo?.startsWith('data:image/png;base64,')) return [];
  const bin = atob(profile.logo.split(',')[1]);
  const data = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data, transformation: { width: 72, height: 72 } })] })];
}
const steps = (a: Activity) => [a.teacher, a.pupils].map((x) => x.trim()).filter(Boolean);
const tierLine = (a: Activity) => [['Low', a.tiers.low], ['Moderate', a.tiers.mod], ['High', a.tiers.high]].filter(([, t]) => t.trim());
function activities(s: Stage, heading?: string): Paragraph[] {
  const out: Paragraph[] = heading ? [p(heading, { bold: true })] : [];
  let n = 0;
  for (const a of s.activities) {
    for (const t of steps(a)) out.push(p(`${++n}. ${t}`));
    const tl = tierLine(a);
    if (tl.length) out.push(p([{ t: 'Differentiation: ', b: true }, ...tl.flatMap(([k, t], i) => [{ t: (i ? '; ' : '') + k + ': ', i: true }, t.trim().replace(/[.;]+$/, '')]), '.'], { size: 18 }));
  }
  return out;
}
function notes(s: Stage): Paragraph[] {
  const uniq = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))];
  const aids = uniq(s.activities.map((a) => a.aids)), vals = uniq(s.activities.map((a) => a.values));
  return [p('Teaching Aids:', { bold: true }), ...(aids.length ? aids.map((x) => p('• ' + x)) : [p('None Applied (N/A)')]),
    p('Moral Values:', { bold: true }), ...(vals.length ? vals.map((x) => p('• ' + x)) : [p('None Applied (N/A)')])];
}
const duration = (m: number) => (m >= 60 && m % 60 === 0 ? `${m / 60} hour${m > 60 ? 's' : ''}` : `${m} minutes`);
function classLine(l: Lesson) {
  const extra = [l.header.levelLabel && `${l.header.levelLabel} Level`, l.header.pupils && `${l.header.pupils} Students`].filter(Boolean).join(', ');
  return [l.header.className, extra && `(${extra})`].filter(Boolean).join(' ') || '–';
}

/** The school's daily lesson plan template (SK(C) Anglo Chinese Kota Kinabalu layout). */
export function schoolDoc(l: Lesson, profile: Profile | null): Document {
  const q = W / 4, mcW = 500, half = (W - 2 * mcW) / 2;
  const mid = l.stages.slice(1, -1), first = l.stages[0], last = l.stages[l.stages.length - 1];
  const head = table([q, q, q, q], [
    new TableRow({ children: [cell([p([{ t: 'Subject: ', b: true }, l.header.subject])]), cell([p([{ t: 'Class: ', b: true }, classLine(l)])]), cell([p([{ t: 'Time: ', b: true }, `${l.header.start} – ${endTime(l.header.start, l.header.durationMin)}`])]), cell([p([{ t: 'Duration: ', b: true }, duration(l.header.durationMin)])])] }),
    new TableRow({ children: [cell([p([{ t: 'Theme: ', b: true }, l.theme || '–'])]), cell([p([{ t: 'Focus skill: ', b: true }, l.mainSkill || '–'])]), cell([p([{ t: 'CCE: ', b: true }, l.cce || '–'])]), cell([p([{ t: 'Date: ', b: true }, `${longDate(l.header.date)} (${weekday(l.header.date)})`])])] }),
    new TableRow({ children: [cell([p([{ t: 'Teaching Aids and Materials: ', b: true }, l.aids || '–'])], { span: 2 }), cell([p([{ t: '21st Century Skills/Strategy/Activity: ', b: true }, l.skills21 || '–'])], { span: 2 })] }),
    band('Topic', 4), new TableRow({ children: [cell((l.topic || '–').toUpperCase(), { span: 4, center: true, bold: true })] }),
    band('Current Pedagogical Practice', 4), new TableRow({ children: [cell((l.pedagogy || '–').toUpperCase(), { span: 4, center: true })] })
  ]);
  const mcRow = (mText: string[], cText: string[]) => new TableRow({ children: [cell('M', { w: mcW, fill: M, center: true, bold: true }), cell(mText.map((t) => p(t)), { w: half }), cell('C', { w: mcW, fill: C, center: true, bold: true }), cell(cText.map((t) => p(t)), { w: half })] });
  const std = table([mcW, half, mcW, half], [
    band('Content Standard', 4),
    mcRow(l.standards.main.cs.map((c) => `${c.code} ${c.text}`), l.standards.comp.cs.map((c) => `${c.code} ${c.text}`)),
    band('Learning Standards', 4),
    mcRow(l.standards.main.ls.map((c) => `${c.code} ${c.text}`), l.standards.comp.ls.map((c) => `${c.code} ${c.text}`)),
    band('Learning Objectives', 4),
    ...l.objectives.map((o) => new TableRow({ children: [cell(o.role === 'main' ? 'M' : 'C', { w: mcW, fill: o.role === 'main' ? M : C, center: true, bold: true }), cell(objectiveText(o) || '–', { span: 3 })] }))
  ]);
  const c1 = Math.round(W * 0.21), c2 = Math.round(W * 0.53), c3 = W - c1 - c2;
  const flow = table([c1, c2, c3], [
    new TableRow({ tableHeader: true, children: ['Lesson Stage', 'Teaching and Learning Activities', 'Notes'].map((t) => cell(t, { bold: true, fill: SOFT })) }),
    new TableRow({ children: [cell([p('I. PRE-LESSON', { bold: true }), p('(Induction)'), p(`${first.minutes} mins`)]), cell(activities(first)), cell(notes(first))] }),
    ...mid.map((s, i) => new TableRow({ children: [
      i === 0 ? cell([p('II. LESSON DEVELOPMENT', { bold: true }), p(`${mid.reduce((a, x) => a + x.minutes, 0)} mins`)], { merge: 'restart' }) : cell('', { merge: 'continue' }),
      cell(activities(s, `Activity ${i + 1} (${s.title}) (${s.minutes} minutes):`)), cell(notes(s))] })),
    new TableRow({ children: [cell([p('III. CLOSURE', { bold: true }), p(`${last.minutes} mins`)]), cell(activities(last)), cell(notes(last))] })
  ]);
  const app = table([W], [band('Appendices', 1), new TableRow({ children: [cell([p(l.appendices || ' '), ...(l.links.length ? [p('Links:', { bold: true }), ...l.links.map((x) => p(`${x.label}: ${x.url}`))] : [])])] })]);
  return new Document({
    creator: profile?.name || 'Consilia', title: `RPH ${l.topic}`, description: 'Daily lesson plan made with Consilia',
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children: [
      ...logo(profile),
      p((profile?.school || 'School name').toUpperCase(), { align: 'center', bold: true, size: 23 }),
      p('DAILY LESSON PLAN', { align: 'center', bold: true, size: 22, after: 120 }),
      head, std, spacer(), flow,
      ...(l.frameworkReason ? [p([{ t: 'Framework note: ', b: true }, l.frameworkReason], { size: 18 })] : []),
      spacer(), app
    ] }]
  });
}

/** The Consilia Lesson Blueprint layout as an editable document. */
export function blueprintDoc(l: Lesson, profile: Profile | null): Document {
  const labels = objectiveLabels(l);
  const report = runChecks(l);
  const h = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, keepLines: true, spacing: { before: 160, after: 60 }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: NAVY }, children: [new TextRun({ text: ' ' + t.toUpperCase(), bold: true, color: 'FFFFFF', font: FONT, size: 18 })] });
  const grid = (head: string[], rows: string[][], widths: number[]) => table(widths, [
    new TableRow({ tableHeader: true, children: head.map((t) => cell(t, { bold: true, fill: SOFT })) }),
    ...rows.map((r) => new TableRow({ children: r.map((t) => cell(t || '–')) }))
  ]);
  const per = (ws: number[]) => ws.map((x) => Math.round((W * x) / 100));
  const flowRows = l.stages.flatMap((s) => s.activities.map((a, i) => [i ? '' : `${s.title} · ${s.minutes} min`, a.teacher, a.pupils, [a.pattern, a.objectiveIds.map((id) => labels.get(id)).filter(Boolean).join(', ')].filter(Boolean).join(' · '), [a.aids, a.values].filter(Boolean).join(' · ')]));
  const tiered = l.stages.flatMap((s) => s.activities.filter((a) => a.tiers.low || a.tiers.mod || a.tiers.high).map((a) => [s.title, a.tiers.low, a.tiers.mod, a.tiers.high]));
  const pb: [string, string][] = [['Finished early', l.planB.early], ['Running late', l.planB.late], ['No internet / power', l.planB.offline], ['Class too noisy', l.planB.noisy], ['Many absent', l.planB.absent]];
  return new Document({
    creator: profile?.name || 'Consilia', title: `Lesson Blueprint ${l.topic}`,
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children: [
      p(`CONSILIA LESSON BLUEPRINT · KSSR SEMAKAN 2017${l.curriculum.sowLesson ? ` · SoW Y${l.curriculum.year} ${l.curriculum.school} LESSON ${l.curriculum.sowLesson}` : ''}`, { size: 16, bold: true, color: '9A7612' }),
      p(l.topic || 'Untitled lesson', { size: 32, bold: true }),
      p(`${l.header.subject} · ${l.header.className || `Year ${l.curriculum.year}`}${l.header.pupils ? ` (${l.header.pupils} pupils)` : ''} · ${weekday(l.header.date)} ${longDate(l.header.date)} · ${l.header.start}–${endTime(l.header.start, l.header.durationMin)} · ${l.header.durationMin} min`, { size: 18 }),
      p(`Theme: ${l.theme || '–'} · Focus: ${l.mainSkill || '–'} · Framework: ${FRAMEWORKS[l.framework].short}${l.frameworkReason ? ` (${l.frameworkReason})` : ''} · Alignment score: ${report.score}/100`, { size: 18, after: 120 }),
      h('1 · Standards'),
      grid(['', 'Content Standard', 'Learning Standard'], (['main', 'comp'] as const).map((r) => [r === 'main' ? 'M' : 'C', l.standards[r].cs.map((c) => `${c.code} ${c.text}`).join('\n'), l.standards[r].ls.map((c) => `${c.code} ${c.text}`).join('\n')]), per([8, 42, 50])),
      h('2 · Learner snapshot'),
      p([{ t: 'Class: ', b: true }, classLine(l)]), p([{ t: 'Prior learning: ', b: true }, l.priorKnowledge || '–']), p([{ t: 'Language focus: ', b: true }, l.focus || '–']),
      p([{ t: 'CCE: ', b: true }, l.cce || '–', { t: '  Values: ', b: true }, l.values || '–', { t: '  21st-century skills: ', b: true }, l.skills21 || '–']),
      h('3 · Objectives (ABCD) and success criteria'),
      grid(['', 'Objective', 'Success criterion'], criteria(l).map((c) => [labels.get(c.objective.id)!, objectiveText(c.objective), c.text]), per([8, 62, 30])),
      h(`4 · Lesson flow (planned ${l.stages.reduce((a, s) => a + s.minutes, 0)} min)`),
      grid(['Stage · min', 'Teacher does', 'Pupils do', 'Interaction · Obj', 'Aids, values'], flowRows, per([16, 31, 25, 12, 16])),
      ...(tiered.length ? [h('5 · Differentiation'), grid(['Activity', 'Low (support)', 'Moderate (core)', 'High (challenge)'], tiered, per([19, 27, 27, 27]))] : []),
      h('6 · Assessment (PBD)'), p([{ t: 'Evidence: ', b: true }, l.assessment.evidence || '–']), p([{ t: 'Method: ', b: true }, l.assessment.method || '–']),
      h('7 · Plan B'), ...pb.map(([k, v]) => p([{ t: k + ': ', b: true }, v || '–'])),
      h('8 · Alignment map'),
      grid(['LS', 'Objective', 'Activities in', 'Time', 'Status'], alignment(l).map((r) => [`${r.ls} ${r.role === 'main' ? 'M' : 'C'}`, r.objectives.join(', '), r.stages.join(', '), `${r.minutes} min`, r.ok ? '✔ Aligned' : '⚠ ' + r.problem]), per([12, 14, 38, 12, 24])),
      h('9 · Reflection'), p(''), p('…………………………………………………………………………………………………………………'), p('…………………………………………………………………………………………………………………'), p('…………………………………………………………………………………………………………………'),
      h('10 · Appendices and links'), p(l.appendices || '–'), ...l.links.map((x) => p(`${x.label}: ${x.url}`)),
      p(`Prepared by ${profile?.name || '________________'}${profile?.programme ? `, ${profile.programme}` : ''}${profile?.campus ? `, ${profile.campus}` : ''} · Made with Consilia`, { size: 16, color: '555555' })
    ] }]
  });
}

export function fileName(l: Lesson, layout: 'school' | 'blueprint') {
  const safe = (s: string) => s.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-');
  return `RPH-${l.header.date}-${safe(l.header.className || 'Y' + l.curriculum.year)}-${safe(l.topic || 'lesson')}${layout === 'blueprint' ? '-Blueprint' : ''}.docx`;
}
export async function toBlob(l: Lesson, profile: Profile | null, layout: 'school' | 'blueprint'): Promise<Blob> {
  return Packer.toBlob(layout === 'school' ? schoolDoc(l, profile) : blueprintDoc(l, profile));
}
export { Packer };

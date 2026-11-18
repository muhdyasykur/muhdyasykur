import type { School, SowLesson, Standards } from '../curriculum/types';

/**
 * Curriculum facts from the KSSR Scheme of Work, added to a Studio prompt when the teacher bases a tool on an actual
 * SoW lesson: the theme and topic, the content and learning standards with their codes and wording, the materials
 * and textbook pages, the SoW's own steps and differentiation. The AI builds on these instead of guessing.
 */
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
export function sowBrief(l: SowLesson, std: Standards, year: number, school: School): string {
  const ls = (codes: string[]) => codes.map((c) => `${c} ${std.ls.find((x) => x.code === c)?.text ?? ''}`.trim()).join('; ');
  const cs = (codes: string[]) => codes.map((c) => `${c} ${std.cs.find((x) => x.code === c)?.text ?? ''}`.trim()).join('; ');
  const steps = [...l.outline.pre, ...l.outline.delivery, ...l.outline.post].map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  return [
    `Curriculum facts from the KSSR Scheme of Work (Year ${year} ${school}, lesson ${l.no}${l.unit ? `, ${l.unit}` : ''}). Use them, and keep the standard codes exactly as given:`,
    `Theme: ${l.theme}. Topic: ${l.topic}. Main skill: ${l.mainSkill}.${l.focus ? ` Language focus: ${l.focus}.` : ''}`,
    l.std.main.ls.length && `Main content standard: ${cs(l.std.main.cs) || '–'}. Main learning standard: ${ls(l.std.main.ls)}.`,
    l.std.comp.ls.length && `Complementary content standard: ${cs(l.std.comp.cs) || '–'}. Complementary learning standard: ${ls(l.std.comp.ls)}.`,
    l.std.note && `Standards note: ${clip(l.std.note, 200)}`,
    l.materials && `Materials and textbook pages: ${clip(l.materials.replace(/\s+/g, ' '), 300)}`,
    steps.length && `The SoW suggests these steps: ${clip(steps.map((x, i) => `(${i + 1}) ${x}`).join(' '), 900)}`,
    l.differentiation && `Differentiation in the SoW: ${clip(l.differentiation.replace(/\s+/g, ' '), 300)}`,
    l.cce && `Cross-curricular element: ${l.cce}.`
  ].filter((x): x is string => !!x).join('\n');
}

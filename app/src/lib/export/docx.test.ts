import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { Packer } from 'docx';
import { schoolDoc, blueprintDoc, fileName } from './docx';
import { buildLesson } from '../lesson/create';
import type { SowFile, Standards } from '../curriculum/types';

const dir = new URL('../../../public/curriculum/kssr2017/', import.meta.url);
const std: Standards = JSON.parse(readFileSync(new URL('standards-y4.json', dir), 'utf8'));
const sow: SowFile = JSON.parse(readFileSync(new URL('sow-y4-sk.json', dir), 'utf8'));
const l = buildLesson({ mode: 'follow-sow', sow: sow.lessons[0], year: 4, school: 'SK', date: '2025-11-03', start: '09:10', durationMin: 60, className: '4 Zhong', pupils: 44, levelLabel: 'Average' }, std);
const profile = { id: 'me' as const, name: 'Muhammad Yasykur', school: 'SK(C) Anglo Chinese Kota Kinabalu', schoolType: 'SJK' as const, createdAt: 1 };

async function xml(doc: ReturnType<typeof schoolDoc>) {
  const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
  return (await zip.file('word/document.xml')!.async('string')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}
describe('Word export', () => {
  it('school template contains header, standards, objectives and every SoW step', async () => {
    const t = await xml(schoolDoc(l, profile));
    for (const s of ['SK(C) ANGLO CHINESE KOTA KINABALU', 'DAILY LESSON PLAN', '4 Zhong (Average Level, 44 Students)', '09:10 – 10:10', 'Monday', '1.2.2 Understand with support', 'LESSON DEVELOPMENT', 'III. CLOSURE'])
      expect(t, s).toContain(s);
    expect(t).toContain(l.stages[0].activities[0].teacher.slice(0, 40));
  });
  it('blueprint contains the score, alignment map and plan B headings', async () => {
    const t = await xml(blueprintDoc(l, profile));
    for (const s of ['CONSILIA LESSON BLUEPRINT', 'Alignment score:', '8 · ALIGNMENT MAP', '7 · PLAN B', 'Where are you from?']) expect(t, s).toContain(s);
  });
  it('names files by date, class and topic', () => {
    expect(fileName(l, 'school')).toBe('RPH-2025-11-03-4-Zhong-Where-are-you-from.docx');
    expect(fileName(l, 'blueprint')).toMatch(/-Blueprint\.docx$/);
  });
});
